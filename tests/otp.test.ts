import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// No database in these tests: the OTP store falls back to its in-memory implementation.
vi.mock('@/lib/db/client', () => ({ getDb: () => null }));

import { maskMobile, normalizeMobile } from '@/lib/phone';
import { OTP_MAX_ATTEMPTS, OTP_MAX_SENDS_PER_HOUR, OTP_RESEND_SECONDS, OTP_TOKEN_TTL_MS, OTP_TTL_MS } from '@/lib/otp/config';
import { codeMatches, generateCode, hashCode, issueVerifiedToken, verifyVerifiedToken } from '@/lib/otp/crypto';
import { isSmsConfigured, otpMessage, sendOtpSms } from '@/lib/otp/sms';
import { checkChallenge, createChallenge, resetMemoryStore } from '@/lib/otp/store';
import { isVerifiedFor, otpEnforced, sendOtp, verifyOtp } from '@/lib/otp/service';

const PHONE = '9876543210';

beforeEach(() => {
  resetMemoryStore();
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('OTP_SECRET', 'test-secret');
});
afterEach(() => vi.unstubAllEnvs());

describe('phone helpers', () => {
  it('normalises Indian mobiles and rejects the rest', () => {
    expect(normalizeMobile('+91 98765 43210')).toBe(PHONE);
    expect(normalizeMobile('098765 43210')).toBe(PHONE);
    expect(normalizeMobile('12345')).toBeNull();
    expect(normalizeMobile('5876543210')).toBeNull(); // must start 6-9
  });
  it('masks all but the last five digits', () => {
    expect(maskMobile(PHONE)).toBe('+91 ••••• 43210');
  });
});

describe('codes and tokens', () => {
  it('generates six-digit numeric codes', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it('stores a keyed hash that is bound to the phone', () => {
    const h = hashCode(PHONE, '123456');
    expect(h).not.toContain('123456');
    expect(codeMatches(PHONE, '123456', h)).toBe(true);
    expect(codeMatches(PHONE, '123457', h)).toBe(false);
    expect(codeMatches('9876543211', '123456', h)).toBe(false); // same code, other number
  });

  it('a different secret cannot verify a hash or token', () => {
    const h = hashCode(PHONE, '123456');
    const token = issueVerifiedToken(PHONE);
    vi.stubEnv('OTP_SECRET', 'another-secret');
    expect(codeMatches(PHONE, '123456', h)).toBe(false);
    expect(verifyVerifiedToken(token, PHONE)).toBe(false);
  });

  it('a verified token is valid for that number only, until it expires', () => {
    const now = 1_000_000;
    const token = issueVerifiedToken(PHONE, now);
    expect(verifyVerifiedToken(token, PHONE, now + 1000)).toBe(true);
    expect(verifyVerifiedToken(token, '9876543211', now + 1000)).toBe(false);
    expect(verifyVerifiedToken(token, PHONE, now + OTP_TOKEN_TTL_MS + 1)).toBe(false);
  });

  it('rejects tampered, malformed and non-string tokens', () => {
    const token = issueVerifiedToken(PHONE);
    const [exp, sig] = token.split('.');
    expect(verifyVerifiedToken(`${Number(exp) + 60_000}.${sig}`, PHONE)).toBe(false); // extended expiry
    expect(verifyVerifiedToken('garbage', PHONE)).toBe(false);
    expect(verifyVerifiedToken('', PHONE)).toBe(false);
    expect(verifyVerifiedToken(undefined, PHONE)).toBe(false);
    expect(verifyVerifiedToken(12345, PHONE)).toBe(false);
  });

  it('refuses to run in production without OTP_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OTP_SECRET', '');
    expect(() => hashCode(PHONE, '123456')).toThrow(/OTP_SECRET/);
  });
});

describe('challenge store (in memory)', () => {
  it('accepts the right code once and never again', async () => {
    expect((await createChallenge(PHONE, '123456')).ok).toBe(true);
    expect(await checkChallenge(PHONE, '123456')).toBe('ok');
    expect(await checkChallenge(PHONE, '123456')).toBe('none'); // consumed: no replay
  });

  it('throttles a resend inside the cooldown, allows it after', async () => {
    const t0 = 5_000_000;
    expect((await createChallenge(PHONE, '111111', t0)).ok).toBe(true);
    const soon = await createChallenge(PHONE, '222222', t0 + 5_000);
    expect(soon).toMatchObject({ ok: false, reason: 'resend' });
    expect((await createChallenge(PHONE, '222222', t0 + OTP_RESEND_SECONDS * 1000 + 1)).ok).toBe(true);
  });

  it('caps codes per number per hour', async () => {
    let t = 10_000_000;
    for (let i = 0; i < OTP_MAX_SENDS_PER_HOUR; i++) {
      expect((await createChallenge(PHONE, String(100000 + i), t)).ok).toBe(true);
      t += (OTP_RESEND_SECONDS + 1) * 1000;
    }
    expect(await createChallenge(PHONE, '999999', t)).toMatchObject({ ok: false, reason: 'limit' });
    // A different number is unaffected.
    expect((await createChallenge('9876543299', '999999', t)).ok).toBe(true);
  });

  it('locks the code after too many wrong guesses, even for the right code', async () => {
    await createChallenge(PHONE, '123456');
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) expect(await checkChallenge(PHONE, '000000')).toBe('invalid');
    expect(await checkChallenge(PHONE, '000000')).toBe('locked');
    expect(await checkChallenge(PHONE, '123456')).toBe('locked');
  });

  it('expires a code', async () => {
    const t0 = 20_000_000;
    await createChallenge(PHONE, '123456', t0);
    expect(await checkChallenge(PHONE, '123456', t0 + OTP_TTL_MS + 1)).toBe('expired');
  });

  it('only the newest code for a number counts', async () => {
    const t0 = 30_000_000;
    await createChallenge(PHONE, '111111', t0);
    await createChallenge(PHONE, '222222', t0 + (OTP_RESEND_SECONDS + 1) * 1000);
    expect(await checkChallenge(PHONE, '111111', t0 + 40_000)).toBe('invalid');
    expect(await checkChallenge(PHONE, '222222', t0 + 40_000)).toBe('ok');
  });

  it('does not let one number\'s code verify another number', async () => {
    await createChallenge(PHONE, '123456');
    expect(await checkChallenge('9876543299', '123456')).toBe('none');
  });
});

describe('SMS gateway client', () => {
  const configure = () => {
    vi.stubEnv('SMS_AUTH_KEY', 'SECRETKEY123');
    vi.stubEnv('SMS_OTP_TEMPLATE_ID', '1107171350535143860');
  };

  it('uses the DLT template text exactly', () => {
    expect(otpMessage('482913')).toBe('Your OTP code is 482913 - Jetking Infotrain Ltd');
  });

  it('is not configured without a key and template id', async () => {
    expect(isSmsConfigured()).toBe(false);
    expect(await sendOtpSms(PHONE, '123456', vi.fn() as never)).toEqual({ ok: false, reason: 'sms not configured' });
  });

  it('sends the documented request: 91-prefixed number, sender, route, template', async () => {
    configure();
    const f = vi.fn(async () => new Response('Message submitted successfully', { status: 200 }));
    expect(await sendOtpSms(PHONE, '123456', f as never)).toEqual({ ok: true });
    const url = new URL(String((f.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://msg.clickconnectmedia.in/http-tokenkeyapi.php');
    expect(url.searchParams.get('number')).toBe(`91${PHONE}`);
    expect(url.searchParams.get('senderid')).toBe('JTKING');
    expect(url.searchParams.get('route')).toBe('1');
    expect(url.searchParams.get('templateid')).toBe('1107171350535143860');
    expect(url.searchParams.get('message')).toBe('Your OTP code is 123456 - Jetking Infotrain Ltd');
    expect(url.searchParams.get('authentic-key')).toBe('SECRETKEY123');
  });

  it('reads the gateway status: Success is ok, any other Status is a failure even on HTTP 200', async () => {
    configure();
    const ok = vi.fn(async () => new Response('{"Status":"Success","Code":"000","Message-Id":"abc"}', { status: 200 }));
    expect(await sendOtpSms(PHONE, '123456', ok as never)).toEqual({ ok: true });
    const bad = vi.fn(async () => new Response('{"Status":"Failed","Code":"005","Description":"Invalid template"}', { status: 200 }));
    expect(await sendOtpSms(PHONE, '123456', bad as never)).toEqual({ ok: false, reason: 'gateway status "Failed"' });
  });

  it('never leaks the key or the code in a failure reason', async () => {
    configure();
    const cases: Array<(...a: never[]) => Promise<Response>> = [
      async () => new Response('Invalid authentic-key SECRETKEY123 for 919876543210', { status: 200 }),
      async () => new Response('oops', { status: 500 }),
      async () => {
        throw new TypeError('fetch failed for https://x/?authentic-key=SECRETKEY123');
      },
    ];
    for (const c of cases) {
      const r = await sendOtpSms(PHONE, '123456', c as never);
      expect(r.ok).toBe(false);
      const text = JSON.stringify(r);
      expect(text).not.toContain('SECRETKEY123');
      expect(text).not.toContain('123456');
      expect(text).not.toContain('9876543210');
    }
  });
});

describe('service', () => {
  it('is enforced only when OTP_ENABLED=true', () => {
    expect(otpEnforced()).toBe(false);
    vi.stubEnv('OTP_ENABLED', 'true');
    expect(otpEnforced()).toBe(true);
  });

  it('refuses to send when no gateway is configured (unless dev echo is on)', async () => {
    expect(await sendOtp(PHONE)).toMatchObject({ ok: false, status: 503 });
  });

  it('rejects invalid numbers before doing anything', async () => {
    vi.stubEnv('OTP_DEV_ECHO', 'true');
    expect(await sendOtp('12345')).toMatchObject({ ok: false, status: 400 });
    expect(await sendOtp(undefined)).toMatchObject({ ok: false, status: 400 });
  });

  it('dev echo returns the code to the page only outside production', async () => {
    vi.stubEnv('OTP_DEV_ECHO', 'true');
    const sent = await sendOtp(PHONE);
    expect(sent).toMatchObject({ ok: true, phone: PHONE });
    expect(sent.ok && sent.devCode).toMatch(/^\d{6}$/);

    resetMemoryStore();
    vi.stubEnv('NODE_ENV', 'production');
    expect(await sendOtp(PHONE)).toMatchObject({ ok: false, status: 503 }); // no echo, no gateway, no database
  });

  it('refuses to run on the memory store in production, even with a gateway', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SMS_AUTH_KEY', 'k');
    vi.stubEnv('SMS_OTP_TEMPLATE_ID', 't');
    expect(await sendOtp(PHONE)).toMatchObject({ ok: false, status: 503 });
  });

  it('full flow: send, wrong code, right code -> a token that proves that number only', async () => {
    vi.stubEnv('OTP_DEV_ECHO', 'true');
    const sent = await sendOtp(PHONE);
    if (!sent.ok || !sent.devCode) throw new Error('send failed');

    expect(await verifyOtp(PHONE, '000000')).toMatchObject({ ok: false, status: 400 });
    expect(await verifyOtp(PHONE, 'abc')).toMatchObject({ ok: false, status: 400 });
    const good = await verifyOtp(PHONE, sent.devCode);
    expect(good.ok).toBe(true);
    if (!good.ok) return;

    expect(isVerifiedFor(PHONE, good.token)).toBe(true);
    expect(isVerifiedFor('+91 98765 43210', good.token)).toBe(true); // same number, other formatting
    expect(isVerifiedFor('9876543299', good.token)).toBe(false);
    expect(isVerifiedFor('not a phone', good.token)).toBe(false);
    expect(isVerifiedFor(PHONE, undefined)).toBe(false);
  });

  it('a locked code reports 410 and asks for a new one', async () => {
    vi.stubEnv('OTP_DEV_ECHO', 'true');
    await sendOtp(PHONE);
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) await verifyOtp(PHONE, '000000');
    expect(await verifyOtp(PHONE, '000000')).toMatchObject({ ok: false, status: 410, error: expect.stringMatching(/new code/i) });
  });
});
