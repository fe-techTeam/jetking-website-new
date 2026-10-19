import { beforeEach, describe, expect, it, vi } from 'vitest';

// Route-level check that /api/enquiry only accepts a number the visitor verified (when OTP is switched on).
const saveEnquiry = vi.hoisted(() => vi.fn());
vi.mock('@/lib/leads/intake', () => ({ saveEnquiry, setCrmStatus: vi.fn() }));
vi.mock('@/lib/chatbot/session', () => ({ getSessionUser: async () => null }));
vi.mock('@/lib/db/client', () => ({ getDb: () => null }));

const PHONE = '9800000001';
const good = { name: 'Asha Rao', phone: `+91 ${PHONE.slice(0, 5)} ${PHONE.slice(5)}`, ft: 5000 };
let ip = 0;
let route: typeof import('@/app/api/enquiry/route');
let otp: typeof import('@/lib/otp/service');

const post = (body: unknown) =>
  route.POST(
    new Request('http://localhost/api/enquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'localhost', 'x-forwarded-for': `10.1.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('OTP_SECRET', 'test-secret');
  vi.stubEnv('OTP_DEV_ECHO', 'true');
  delete process.env.CRM_ENDPOINT;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  saveEnquiry.mockReset().mockResolvedValue({ id: 'x', duplicate: false });
  route = await import('@/app/api/enquiry/route');
  otp = await import('@/lib/otp/service');
});

async function verifiedToken(phone = PHONE): Promise<string> {
  const sent = await otp.sendOtp(phone);
  if (!sent.ok || !sent.devCode) throw new Error('send failed');
  const checked = await otp.verifyOtp(phone, sent.devCode);
  if (!checked.ok) throw new Error('verify failed');
  return checked.token;
}

describe('/api/enquiry with OTP switched off (default)', () => {
  it('behaves as before: no token needed', async () => {
    expect((await post(good)).status).toBe(200);
    expect(saveEnquiry).toHaveBeenCalledOnce();
  });
});

describe('/api/enquiry with OTP_ENABLED=true', () => {
  beforeEach(() => vi.stubEnv('OTP_ENABLED', 'true'));

  it('refuses a lead with no token, and stores nothing', async () => {
    const res = await post(good);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, code: 'otp_required' });
    expect(saveEnquiry).not.toHaveBeenCalled();
  });

  it('refuses a forged, expired-looking or wrong-number token', async () => {
    expect((await post({ ...good, otpToken: '9999999999999.AAAA' })).status).toBe(400);
    const tokenForOtherNumber = await verifiedToken('9800000002');
    expect((await post({ ...good, otpToken: tokenForOtherNumber })).status).toBe(400);
    expect(saveEnquiry).not.toHaveBeenCalled();
  });

  it('accepts a lead whose number was verified, whatever the phone formatting', async () => {
    const token = await verifiedToken();
    const res = await post({ ...good, otpToken: token });
    expect(res.status).toBe(200);
    expect(saveEnquiry).toHaveBeenCalledOnce();
  });

  it('never passes the token on to storage', async () => {
    const token = await verifiedToken();
    await post({ ...good, otpToken: token });
    expect(JSON.stringify(saveEnquiry.mock.calls)).not.toContain(token);
    expect(saveEnquiry.mock.calls[0]![0]).not.toHaveProperty('otpToken');
  });

  it('a verified token is not a way around the bot trap', async () => {
    const token = await verifiedToken();
    const res = await post({ ...good, otpToken: token, hp: 'i am a bot' });
    expect(saveEnquiry).not.toHaveBeenCalled();
    expect(await res.json()).toMatchObject({ ok: true, routed: false }); // dropped quietly, as before
  });
});
