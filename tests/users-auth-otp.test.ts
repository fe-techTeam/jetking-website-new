import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  users: [] as Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    state?: string | null;
    city?: string | null;
    centre?: string | null;
  }>,
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  startSession: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({ getDb: () => null, isDatabaseConfigured: () => false }));
vi.mock('@/lib/rate-limit', () => ({
  clientKey: () => 'test',
  createRateLimiter: () => ({ check: async () => ({ allowed: true, retryAfter: 0 }) }),
}));
vi.mock('@/lib/users/session', () => ({
  clearSessionHint: async () => undefined,
  endSession: async () => undefined,
  getSessionUser: async () => null,
  startSession: (id: string) => h.startSession(id),
}));
vi.mock('@/lib/chatbot/locations', () => ({
  loadLocationTree: async () => ({}),
  isConsistentLocation: () => true,
}));
vi.mock('@/lib/auth/password', () => ({
  hashPassword: async (p: string) => `hash:${p}`,
  verifyPassword: async (p: string, hash: string) => hash === `hash:${p}`,
}));
vi.mock('@/lib/otp/service', () => ({
  sendOtp: (phone: unknown) => h.sendOtp(phone),
  verifyOtp: (phone: unknown, code: unknown) => h.verifyOtp(phone, code),
  isVerifiedFor: (phone: string, token: unknown) => token === `tok:${phone}`,
}));
vi.mock('@/lib/users/store', async () => {
  const { normalizeMobile } = await import('@/lib/phone');
  return {
    DuplicateEmailError: class extends Error {},
    createUser: async () => {
      throw new Error('not used');
    },
    getUserByEmail: async (email: string) => h.users.find((u) => u.email === email) ?? null,
    getUserById: async (id: string) => h.users.find((u) => u.id === id) ?? null,
    getUsersByPhone: async (ten: string) =>
      h.users.filter((u) => {
        const n = normalizeMobile(u.phone);
        return n === ten || u.phone.replace(/\D/g, '').endsWith(ten);
      }),
    updatePassword: async (id: string, passwordHash: string) => {
      const u = h.users.find((x) => x.id === id);
      if (!u) return null;
      u.passwordHash = passwordHash;
      return h.updatePassword(id, passwordHash) ?? u;
    },
  };
});

import { POST } from '@/app/api/users/auth/route';

const PHONE = '9876543210';
const OTHER = '9876543211';

function req(body: unknown) {
  return new Request('http://localhost/api/users/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.users = [
    {
      id: 'u1',
      name: 'Asha',
      email: 'asha@example.com',
      phone: PHONE,
      passwordHash: 'hash:secret12',
    },
  ];
  h.sendOtp.mockResolvedValue({ ok: true, phone: PHONE, resendIn: 30, devCode: '123456' });
  h.verifyOtp.mockResolvedValue({ ok: true, token: 'tok' });
  h.updatePassword.mockImplementation(async (_id: string, _hash: string) => h.users[0]);
  h.startSession.mockResolvedValue(undefined);
});

describe('login_otp_send / login_otp_verify', () => {
  it('sends an OTP when exactly one account owns the phone', async () => {
    const res = await POST(req({ action: 'login_otp_send', phone: `+91 ${PHONE}` }));
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, phone: PHONE, sent: true, devCode: '123456' });
    expect(h.sendOtp).toHaveBeenCalledWith(PHONE);
  });

  it('returns a neutral success without sending when no account matches', async () => {
    const res = await POST(req({ action: 'login_otp_send', phone: OTHER }));
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, phone: OTHER, sent: false });
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it('asks for email when multiple accounts share the phone', async () => {
    h.users.push({
      id: 'u2',
      name: 'Bala',
      email: 'bala@example.com',
      phone: PHONE,
      passwordHash: 'hash:otherpass',
    });
    const res = await POST(req({ action: 'login_otp_send', phone: PHONE }));
    const body = await json(res);
    expect(res.status).toBe(409);
    expect(body).toMatchObject({ ok: false, needsEmail: true });
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it('disambiguates with email and then verifies into a session', async () => {
    h.users.push({
      id: 'u2',
      name: 'Bala',
      email: 'bala@example.com',
      phone: PHONE,
      passwordHash: 'hash:otherpass',
    });
    const send = await POST(req({ action: 'login_otp_send', phone: PHONE, email: 'bala@example.com' }));
    expect(send.status).toBe(200);
    expect(h.sendOtp).toHaveBeenCalled();

    const verify = await POST(
      req({ action: 'login_otp_verify', phone: PHONE, code: '123456', email: 'bala@example.com' }),
    );
    const body = await json(verify);
    expect(verify.status).toBe(200);
    expect(body.ok).toBe(true);
    expect((body.user as { email: string }).email).toBe('bala@example.com');
    expect(h.startSession).toHaveBeenCalledWith('u2');
  });

  it('accepts the existing /api/otp/verify token (enquiry-style proof)', async () => {
    const verify = await POST(
      req({ action: 'login_otp_verify', phone: PHONE, otpToken: `tok:${PHONE}` }),
    );
    const body = await json(verify);
    expect(verify.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(h.verifyOtp).not.toHaveBeenCalled();
    expect(h.startSession).toHaveBeenCalledWith('u1');
  });

  it('surfaces SMS unavailability from sendOtp', async () => {
    h.sendOtp.mockResolvedValueOnce({
      ok: false,
      status: 503,
      error: 'OTP verification is not available right now.',
    });
    const res = await POST(req({ action: 'login_otp_send', phone: PHONE }));
    const body = await json(res);
    expect(res.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
  });
});

describe('reset_send / reset_verify', () => {
  it('sends OTP to the phone on file when reset starts with email', async () => {
    const res = await POST(req({ action: 'reset_send', email: 'asha@example.com' }));
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, phone: PHONE, sent: true });
    expect(h.sendOtp).toHaveBeenCalledWith(PHONE);
  });

  it('does not reveal whether an unknown email exists', async () => {
    const res = await POST(req({ action: 'reset_send', email: 'nobody@example.com' }));
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, phone: null, sent: false });
    expect(h.sendOtp).not.toHaveBeenCalled();
  });

  it('resets the password after a valid OTP and signs the user in', async () => {
    const res = await POST(
      req({ action: 'reset_verify', phone: PHONE, code: '123456', newPassword: 'newsecret1' }),
    );
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(h.verifyOtp).toHaveBeenCalledWith(PHONE, '123456');
    expect(h.users[0]?.passwordHash).toBe('hash:newsecret1');
    expect(h.startSession).toHaveBeenCalledWith('u1');
  });

  it('resets with an existing OTP token instead of re-checking the code', async () => {
    const res = await POST(
      req({ action: 'reset_verify', phone: PHONE, otpToken: `tok:${PHONE}`, newPassword: 'brandnew99' }),
    );
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(h.verifyOtp).not.toHaveBeenCalled();
    expect(h.users[0]?.passwordHash).toBe('hash:brandnew99');
  });

  it('rejects a wrong OTP without changing the password', async () => {
    h.verifyOtp.mockResolvedValueOnce({ ok: false, status: 400, error: 'That code is not correct.' });
    const before = h.users[0]!.passwordHash;
    const res = await POST(
      req({ action: 'reset_verify', phone: PHONE, code: '000000', newPassword: 'newsecret1' }),
    );
    expect(res.status).toBe(400);
    expect(h.users[0]?.passwordHash).toBe(before);
    expect(h.startSession).not.toHaveBeenCalled();
  });
});

describe('email password login still works', () => {
  it('logs in with email + password', async () => {
    const res = await POST(req({ action: 'login', email: 'asha@example.com', password: 'secret12' }));
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(h.startSession).toHaveBeenCalledWith('u1');
  });
});
