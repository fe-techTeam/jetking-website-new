import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  me: null as null | { id: string; name: string; role: string },
  users: new Map<string, Record<string, unknown>>(),
  audit: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  resetUserPassword: vi.fn(),
  centres: [{ slug: 'pune', name: 'Pune' }],
}));

vi.mock('@/app/(admin)/admin/actions', () => ({
  requireRole: async (allowed: string[]) => {
    if (!h.me) throw new Error('REDIRECT:/admin/login');
    if (!allowed.includes(h.me.role)) throw new Error('REDIRECT:/admin');
    return h.me;
  },
}));
vi.mock('@/lib/auth/users', () => ({
  ROLES: ['admin', 'editor', 'centre_staff'],
  ROLE_LABEL: { admin: 'Admin', editor: 'Editor', centre_staff: 'Centre staff' },
  listUsers: async () => [...h.users.values()],
  getUserById: async (id: string) => h.users.get(id),
  getUserByEmail: async (e: string) => [...h.users.values()].find((u) => u.email === e),
  createUser: (i: Record<string, unknown>) => h.createUser(i),
  updateUser: async (id: string, patch: Record<string, unknown>) => {
    const u = h.users.get(id);
    if (!u) return undefined;
    const next = { ...u, ...patch };
    h.users.set(id, next);
    return next;
  },
  resetUserPassword: (...a: unknown[]) => h.resetUserPassword(...a),
  deleteUser: (...a: unknown[]) => h.deleteUser(...a),
}));
vi.mock('@/lib/leads/centre-scope', () => ({ listCentreOptions: async () => h.centres }));
vi.mock('@/lib/audit/log', () => ({ recordAudit: (...a: unknown[]) => h.audit(...a) }));

import { adminResetPassword, changeUserRole, inviteUser, removeUser, toggleUserStatus } from '@/app/(admin)/admin/team/actions';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const valid = { name: 'Asha', email: 'Asha@X.com', password: 'longenough', role: 'editor' };

beforeEach(() => {
  vi.clearAllMocks();
  h.me = { id: ME, name: 'Boss', role: 'admin' };
  h.users.clear();
  h.users.set(ME, { id: ME, name: 'Boss', email: 'boss@x.com', role: 'admin', status: 'active' });
  h.users.set(OTHER, { id: OTHER, name: 'Other', email: 'o@x.com', role: 'editor', status: 'active' });
  h.createUser.mockImplementation(async (i) => ({ id: 'new', ...i }));
});

describe('role matrix: every team action is admin-only', () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['inviteUser', () => inviteUser(form(valid))],
    ['changeUserRole', () => changeUserRole(OTHER, 'admin', '')],
    ['toggleUserStatus', () => toggleUserStatus(OTHER)],
    ['adminResetPassword', () => adminResetPassword(OTHER, 'newpassword1')],
    ['removeUser', () => removeUser(OTHER)],
  ];
  for (const role of ['editor', 'centre_staff']) {
    for (const [name, fn] of calls) {
      it(`${role} cannot call ${name}`, async () => {
        h.me = { id: 'x', name: 'x', role };
        await expect(fn()).rejects.toThrow('REDIRECT:/admin');
        expect(h.createUser).not.toHaveBeenCalled();
        expect(h.deleteUser).not.toHaveBeenCalled();
        expect(h.resetUserPassword).not.toHaveBeenCalled();
        expect(h.users.get(OTHER)?.role).toBe('editor');
        expect(h.users.get(OTHER)?.status).toBe('active');
      });
    }
  }
  it('signed-out callers are bounced', async () => {
    h.me = null;
    await expect(removeUser(OTHER)).rejects.toThrow('REDIRECT:/admin/login');
  });
});

describe('inviteUser', () => {
  it('creates a user, lowercases email and audits', async () => {
    const r = await inviteUser(form(valid));
    expect(r.ok).toBe(true);
    expect(h.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'asha@x.com', role: 'editor', centreSlug: undefined }));
    expect(h.audit).toHaveBeenCalledWith(h.me, 'team.invite', 'user', 'new', expect.any(String));
  });
  it.each([
    [{ name: '' }, /Name/],
    [{ email: 'nope' }, /email/],
    [{ password: 'short' }, /10 characters/],
    [{ role: 'root' }, /Invalid role/],
    [{ role: 'centre_staff', centreSlug: '' }, /need a centre/],
    [{ role: 'centre_staff', centreSlug: 'atlantis' }, /exist/],
    [{ email: 'o@x.com' }, /already exists/],
  ])('rejects invalid input %j', async (patch, msg) => {
    const r = await inviteUser(form({ ...valid, ...patch }));
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toMatch(msg);
    expect(h.createUser).not.toHaveBeenCalled();
  });
  it('scopes centre_staff to a real centre and drops centre for other roles', async () => {
    await inviteUser(form({ ...valid, role: 'centre_staff', centreSlug: 'pune' }));
    expect(h.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ centreSlug: 'pune' }));
    await inviteUser(form({ ...valid, email: 'b@x.com', centreSlug: 'pune' }));
    expect(h.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ centreSlug: undefined }));
  });
});

describe('changeUserRole', () => {
  it('promotes another user and audits', async () => {
    const r = await changeUserRole(OTHER, 'admin', '');
    expect(r.ok).toBe(true);
    expect(h.audit).toHaveBeenCalledWith(h.me, 'team.role_change', 'user', OTHER, expect.any(String));
  });
  it('blocks self-demotion', async () => {
    const r = await changeUserRole(ME, 'editor', '');
    expect(r).toMatchObject({ ok: false });
    expect(h.users.get(ME)?.role).toBe('admin');
  });
  it('rejects invalid roles, missing/unknown centre and non-uuid ids', async () => {
    expect(await changeUserRole(OTHER, 'god', '')).toMatchObject({ ok: false });
    expect(await changeUserRole(OTHER, 'centre_staff', '')).toMatchObject({ ok: false });
    expect(await changeUserRole(OTHER, 'centre_staff', 'nowhere')).toMatchObject({ ok: false });
    expect(await changeUserRole('x-or-1=1', 'admin', '')).toMatchObject({ ok: false, error: 'User not found.' });
    expect(h.users.get(OTHER)?.role).toBe('editor');
  });
  it('clears centre when moving off centre_staff', async () => {
    await changeUserRole(OTHER, 'centre_staff', 'pune');
    expect(h.users.get(OTHER)?.centreSlug).toBe('pune');
    await changeUserRole(OTHER, 'editor', 'pune');
    expect(h.users.get(OTHER)?.centreSlug).toBeNull();
  });
});

describe('toggleUserStatus / removeUser (last-admin protection)', () => {
  it('cannot disable or remove yourself, so the last admin survives', async () => {
    expect(await toggleUserStatus(ME)).toMatchObject({ ok: false });
    expect(await removeUser(ME)).toMatchObject({ ok: false });
    expect(h.users.get(ME)?.status).toBe('active');
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
  it('blocks demoting, disabling or removing the sole remaining active admin', async () => {
    h.users.set(OTHER, { id: OTHER, name: 'Other', email: 'o@x.com', role: 'admin', status: 'active' });
    h.users.set(ME, { id: ME, name: 'Boss', email: 'boss@x.com', role: 'editor', status: 'active' });
    // Session still claims admin (stale / race) while DB has only OTHER as active admin.
    h.me = { id: ME, name: 'Boss', role: 'admin' };
    expect(await changeUserRole(OTHER, 'editor', '')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/at least one active admin/i),
    });
    expect(await toggleUserStatus(OTHER)).toMatchObject({ ok: false });
    expect(await removeUser(OTHER)).toMatchObject({ ok: false });
    expect(h.users.get(OTHER)?.role).toBe('admin');
    expect(h.users.get(OTHER)?.status).toBe('active');
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
  it('allows demoting another admin when a second active admin remains', async () => {
    h.users.set(OTHER, { id: OTHER, name: 'Other', email: 'o@x.com', role: 'admin', status: 'active' });
    expect(await changeUserRole(OTHER, 'editor', '')).toMatchObject({ ok: true });
    expect(h.users.get(OTHER)?.role).toBe('editor');
  });
  it('toggles another user both ways', async () => {
    expect(await toggleUserStatus(OTHER)).toMatchObject({ ok: true });
    expect(h.users.get(OTHER)?.status).toBe('disabled');
    await toggleUserStatus(OTHER);
    expect(h.users.get(OTHER)?.status).toBe('active');
  });
  it('unknown / malformed ids return not found without side effects', async () => {
    const ghost = '33333333-3333-4333-8333-333333333333';
    for (const id of [ghost, 'not-a-uuid']) {
      expect(await toggleUserStatus(id)).toMatchObject({ ok: false });
      expect(await removeUser(id)).toMatchObject({ ok: false });
      expect(await adminResetPassword(id, 'newpassword1')).toMatchObject({ ok: false });
    }
    expect(h.deleteUser).not.toHaveBeenCalled();
    expect(h.resetUserPassword).not.toHaveBeenCalled();
    expect(h.audit).not.toHaveBeenCalled();
  });
  it('removes another user and audits', async () => {
    expect(await removeUser(OTHER)).toEqual({ ok: true });
    expect(h.deleteUser).toHaveBeenCalledWith(OTHER);
    expect(h.audit).toHaveBeenCalledWith(h.me, 'team.remove', 'user', OTHER, expect.stringContaining('Other'));
  });
});

describe('adminResetPassword', () => {
  it('enforces min length and audits without leaking the password', async () => {
    expect(await adminResetPassword(OTHER, 'short')).toMatchObject({ ok: false });
    expect(h.resetUserPassword).not.toHaveBeenCalled();
    expect(await adminResetPassword(OTHER, 'newpassword1')).toEqual({ ok: true, email: 'off' });
    expect(h.resetUserPassword).toHaveBeenCalledWith(OTHER, 'newpassword1');
    expect(JSON.stringify(h.audit.mock.calls)).not.toContain('newpassword1');
  });
});
