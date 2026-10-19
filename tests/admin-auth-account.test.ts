import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  me: null as null | { id: string; name: string },
  row: null as null | { passwordHash: string },
  db: true,
  reset: vi.fn(),
  audit: vi.fn(),
  cookie: vi.fn(),
}));

vi.mock('@/app/(admin)/admin/actions', () => ({ getCurrentUser: async () => h.me }));
vi.mock('@/lib/auth/users', () => ({
  isDatabaseConfigured: () => h.db,
  getUserById: async () => h.row,
  resetUserPassword: (...a: unknown[]) => h.reset(...a),
}));
vi.mock('@/lib/auth/password', () => ({ verifyPassword: async (p: string, s: string) => s === `hash:${p}` }));
vi.mock('@/lib/audit/log', () => ({ recordAudit: (...a: unknown[]) => h.audit(...a) }));

vi.mock('@/lib/auth/session', () => ({ setUserSessionCookie: (...a: unknown[]) => h.cookie(...a) }));

import { changeOwnPassword } from '@/app/(admin)/admin/account/actions';

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const good = { current: 'oldpassword', next: 'brand-new-pass', confirm: 'brand-new-pass' };
const run = (o: Record<string, string> = {}) => changeOwnPassword({ ok: false, error: null }, form({ ...good, ...o }));

beforeEach(() => {
  vi.clearAllMocks();
  h.me = { id: 'u1', name: 'Asha' };
  h.row = { id: 'u1', passwordHash: 'hash:oldpassword', sessionVersion: 3 } as never;
  h.db = true;
});

describe('changeOwnPassword', () => {
  it('changes the password for the signed-in user only and audits', async () => {
    expect(await run()).toEqual({ ok: true, error: null });
    expect(h.reset).toHaveBeenCalledWith('u1', 'brand-new-pass');
    expect(h.audit).toHaveBeenCalledWith(h.me, 'team.password_change', 'user', 'u1', expect.any(String));
    expect(JSON.stringify(h.audit.mock.calls)).not.toContain('brand-new-pass');
    // This browser is re-issued a cookie at the bumped session version, so only the user's *other* sessions die.
    expect(h.cookie).toHaveBeenCalledWith('u1', 3);
  });
  it('requires a session', async () => {
    h.me = null;
    expect((await run()).ok).toBe(false);
    expect(h.reset).not.toHaveBeenCalled();
  });
  it('is unavailable in legacy (no DB) mode', async () => {
    h.db = false;
    expect((await run()).ok).toBe(false);
    expect(h.reset).not.toHaveBeenCalled();
  });
  it.each([
    [{ current: '' }, /current password/],
    [{ next: 'short', confirm: 'short' }, /10 characters/],
    [{ confirm: 'different-pass' }, /do not match/],
    [{ next: 'oldpassword', confirm: 'oldpassword' }, /different/],
    [{ current: 'wrong-current' }, /incorrect/],
  ])('rejects %j', async (patch, msg) => {
    const r = await run(patch);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(msg);
    expect(h.reset).not.toHaveBeenCalled();
  });
  it('rejects when the user row has vanished', async () => {
    h.row = null;
    expect((await run()).ok).toBe(false);
    expect(h.reset).not.toHaveBeenCalled();
  });
});
