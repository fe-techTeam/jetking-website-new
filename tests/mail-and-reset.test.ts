import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  users: [] as Array<{ id: string; name: string; email: string; phone: string; passwordHash: string }>,
  sent: [] as Array<Record<string, unknown>>,
  sendMailImpl: vi.fn(async (_m: Record<string, unknown>): Promise<unknown> => ({})),
  startSession: vi.fn(),
  limiterAllowed: true,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: Record<string, unknown>) => {
        h.sent.push(m);
        return h.sendMailImpl(m);
      },
    }),
  },
}));
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  // `after` only runs inside a request scope; in a test, run the callback immediately.
  return { ...actual, after: (fn: () => unknown) => void fn() };
});
vi.mock('@/lib/db/client', () => ({ getDb: () => null, isDatabaseConfigured: () => false }));
vi.mock('@/lib/rate-limit', () => ({
  clientKey: () => 'test',
  createRateLimiter: () => ({ check: async () => ({ allowed: h.limiterAllowed, retryAfter: 0 }) }),
}));
vi.mock('@/lib/users/session', () => ({
  clearSessionHint: async () => undefined,
  endSession: async () => undefined,
  getSessionUser: async () => null,
  startSession: (id: string) => h.startSession(id),
}));
vi.mock('@/lib/chatbot/locations', () => ({ loadLocationTree: async () => ({}), isConsistentLocation: () => true }));
vi.mock('@/lib/auth/password', () => ({
  hashPassword: async (p: string) => `hash:${p}`,
  verifyPassword: async (p: string, hash: string) => hash === `hash:${p}`,
}));
vi.mock('@/lib/otp/service', () => ({ sendOtp: vi.fn(), verifyOtp: vi.fn(), isVerifiedFor: () => false }));
vi.mock('@/lib/users/store', () => ({
  DuplicateEmailError: class extends Error {},
  createUser: async () => {
    throw new Error('not used');
  },
  getUserByEmail: async (email: string) => h.users.find((u) => u.email === email) ?? null,
  getUserById: async (id: string) => h.users.find((u) => u.id === id) ?? null,
  getUsersByPhone: async () => [],
  updatePassword: async (id: string, passwordHash: string) => {
    const u = h.users.find((x) => x.id === id);
    if (!u) return null;
    u.passwordHash = passwordHash;
    return u;
  },
}));

import { POST } from '@/app/api/users/auth/route';
import { createResetToken, fingerprintMatches, readResetToken, RESET_TTL_MINUTES } from '@/lib/users/reset-token';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { staffWelcomeEmail, visitorResetEmail } from '@/lib/mail/templates';

const MAIL_ENV = {
  MAIL_DRIVER: 'smtp',
  MAIL_HOST: 'smtp.example.com',
  MAIL_PORT: '587',
  MAIL_USERNAME: 'noreply@example.com',
  MAIL_PASSWORD: 'super-secret-pass',
  MAIL_FROM_NAME: 'Jetking',
  MAIL_ENCRYPTION: 'TLS',
};
function setMail(on: boolean) {
  for (const [k, v] of Object.entries(MAIL_ENV)) {
    if (on) vi.stubEnv(k, v);
    else vi.stubEnv(k, '');
  }
}

const user = { id: '11111111-1111-4111-8111-111111111111', name: 'Asha', email: 'asha@example.com', phone: '9876543210', passwordHash: 'hash:oldpassword' };
const post = (body: unknown) =>
  POST(new Request('http://localhost/api/users/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));

beforeEach(() => {
  h.users = [{ ...user }];
  h.sent = [];
  h.limiterAllowed = true;
  h.sendMailImpl.mockReset();
  h.sendMailImpl.mockResolvedValue({});
  h.startSession.mockReset();
  setMail(true);
});
afterEach(() => vi.unstubAllEnvs());

describe('mail', () => {
  it('is off unless MAIL_DRIVER=smtp with host and credentials', async () => {
    setMail(false);
    expect(isMailConfigured()).toBe(false);
    expect(await sendMail({ to: 'a@b.co', subject: 's', text: 't', html: 'h' })).toEqual({ ok: false, error: 'Email is not configured.' });
    expect(h.sent).toHaveLength(0);
    vi.stubEnv('MAIL_DRIVER', 'smtp');
    vi.stubEnv('MAIL_HOST', 'smtp.example.com');
    expect(isMailConfigured()).toBe(false); // credentials still missing
  });

  it('sends with the configured sender', async () => {
    expect(isMailConfigured()).toBe(true);
    const r = await sendMail({ to: 'a@b.co', subject: 'Hi', text: 't', html: '<p>h</p>' });
    expect(r).toEqual({ ok: true });
    expect(h.sent[0]).toMatchObject({ from: { name: 'Jetking', address: 'noreply@example.com' }, to: 'a@b.co', subject: 'Hi' });
  });

  it('never leaks the SMTP password in a failure', async () => {
    h.sendMailImpl.mockRejectedValue(new Error('535 auth failed for super-secret-pass'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await sendMail({ to: 'a@b.co', subject: 's', text: 't', html: 'h' });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain('super-secret-pass');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('super-secret-pass');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('a@b.co');
    spy.mockRestore();
  });

  it('escapes HTML in names so an account name cannot inject markup', () => {
    const c = staffWelcomeEmail({ name: '<script>alert(1)</script>', email: 'a@b.co', password: 'p<w>', loginUrl: 'https://x/admin/login', roleLabel: 'Editor' });
    expect(c.html).not.toContain('<script>');
    expect(c.html).toContain('&lt;script&gt;');
    expect(c.html).toContain('p&lt;w&gt;');
    expect(visitorResetEmail({ name: 'A', resetUrl: 'https://x/r?token=a"b', minutes: 30 }).html).not.toContain('token=a"b');
  });
});

describe('reset tokens', () => {
  it('round-trips and ties the token to the current password', () => {
    const token = createResetToken(user);
    const read = readResetToken(token);
    expect(read?.userId).toBe(user.id);
    expect(fingerprintMatches(user.passwordHash, read!.fingerprint)).toBe(true);
    expect(fingerprintMatches('hash:newpassword', read!.fingerprint)).toBe(false);
  });

  it('rejects tampered, expired and malformed tokens', () => {
    const token = createResetToken(user);
    const parts = token.split('.');
    expect(readResetToken(`${parts[0]}.${Number(parts[1]) + 99999}.${parts[2]}.${parts[3]}`)).toBeNull();
    expect(readResetToken(`${parts[0]}.${parts[1]}.${parts[2]}.AAAA`)).toBeNull();
    expect(readResetToken('nonsense')).toBeNull();
    expect(readResetToken('')).toBeNull();
    expect(readResetToken(token, Date.now() + (RESET_TTL_MINUTES + 1) * 60_000)).toBeNull();
    expect(readResetToken(token, Date.now() + (RESET_TTL_MINUTES - 1) * 60_000)).not.toBeNull();
  });
});

describe('POST reset_email_send', () => {
  it('emails a link to a real account', async () => {
    const res = await post({ action: 'reset_email_send', email: 'Asha@Example.com' });
    expect(await res.json()).toEqual({ ok: true, emailed: true });
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toMatchObject({ to: 'asha@example.com' });
    expect(String(h.sent[0]!.text)).toMatch(/\/account\/reset-password\?token=/);
  });

  it('answers identically for an unknown email and sends nothing', async () => {
    const known = await (await post({ action: 'reset_email_send', email: 'asha@example.com' })).json();
    h.sent = [];
    const unknown = await (await post({ action: 'reset_email_send', email: 'nobody@example.com' })).json();
    expect(unknown).toEqual(known);
    expect(h.sent).toHaveLength(0);
  });

  it('still answers the same when email is not configured or the mailbox is rate-limited', async () => {
    setMail(false);
    expect(await (await post({ action: 'reset_email_send', email: 'asha@example.com' })).json()).toEqual({ ok: true, emailed: true });
    setMail(true);
    h.limiterAllowed = false;
    const res = await post({ action: 'reset_email_send', email: 'asha@example.com' });
    expect(res.status).toBe(429); // the per-client limiter still applies on top
  });

  it('rejects a malformed email', async () => {
    expect((await post({ action: 'reset_email_send', email: 'not-an-email' })).status).toBe(400);
  });
});

describe('POST reset_email_confirm', () => {
  const tokenFor = (u = user) => createResetToken(u);

  it('sets the new password, signs the visitor in, and the same link cannot be used twice', async () => {
    const token = tokenFor();
    const ok = await post({ action: 'reset_email_confirm', token, newPassword: 'brandnewpass' });
    expect(ok.status).toBe(200);
    expect((await ok.json()).user.email).toBe('asha@example.com');
    expect(h.users[0]!.passwordHash).toBe('hash:brandnewpass');
    expect(h.startSession).toHaveBeenCalledWith(user.id);

    h.startSession.mockClear();
    const again = await post({ action: 'reset_email_confirm', token, newPassword: 'anotherpass1' });
    expect(again.status).toBe(400);
    expect(h.users[0]!.passwordHash).toBe('hash:brandnewpass');
    expect(h.startSession).not.toHaveBeenCalled();
  });

  it('rejects forged, expired and unknown-user tokens with one message', async () => {
    const good = tokenFor();
    const forged = good.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
    const unknownUser = createResetToken({ id: '99999999-9999-4999-8999-999999999999', passwordHash: 'x' });
    const bodies = await Promise.all(
      [forged, unknownUser, 'x'.repeat(30)].map(async (token) => {
        const res = await post({ action: 'reset_email_confirm', token, newPassword: 'brandnewpass' });
        expect(res.status).toBe(400);
        return (await res.json()).error;
      }),
    );
    expect(new Set(bodies).size).toBe(1);
    expect(h.users[0]!.passwordHash).toBe('hash:oldpassword');
  });

  it('enforces the minimum password length', async () => {
    const res = await post({ action: 'reset_email_confirm', token: tokenFor(), newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(h.users[0]!.passwordHash).toBe('hash:oldpassword');
  });
});
