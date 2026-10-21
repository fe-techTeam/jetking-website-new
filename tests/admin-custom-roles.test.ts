import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasAccess, normalizeAccess, normalizeLeadScope, presetAccess, SECTIONS } from '@/lib/auth/roles';

describe('access model', () => {
  it('built-in presets match what the panel enforced before custom roles', () => {
    expect(SECTIONS.every((s) => presetAccess('admin')[s] === 'edit')).toBe(true);
    expect(SECTIONS.every((s) => presetAccess('editor')[s] === 'edit')).toBe(true);
    const centre = presetAccess('centre_staff');
    expect(centre.leads).toBe('edit');
    expect(SECTIONS.filter((s) => s !== 'leads').every((s) => centre[s] === 'none')).toBe(true);
  });

  it('an unrecognised role string grants nothing', () => {
    expect(SECTIONS.every((s) => presetAccess('viewer' as never)[s] === 'none')).toBe(true);
  });

  it('normalizeAccess clamps junk to a complete map and never invents a level', () => {
    expect(normalizeAccess(null)).toEqual({ content: 'none', leads: 'none', media: 'none', seo: 'none', redirects: 'none', chatbot: 'none' });
    const out = normalizeAccess({ content: 'edit', leads: 'view', media: 'admin', seo: 7, team: 'edit', __proto__: { chatbot: 'edit' } });
    expect(out.content).toBe('edit');
    expect(out.leads).toBe('view');
    expect(out.media).toBe('none');
    expect(out.seo).toBe('none');
    expect(out.chatbot).toBe('none');
    expect('team' in out).toBe(false);
  });

  it('view access never satisfies an edit check; edit satisfies both', () => {
    const a = normalizeAccess({ content: 'view', leads: 'edit' });
    expect(hasAccess(a, 'content', 'view')).toBe(true);
    expect(hasAccess(a, 'content', 'edit')).toBe(false);
    expect(hasAccess(a, 'leads', 'view')).toBe(true);
    expect(hasAccess(a, 'leads', 'edit')).toBe(true);
    expect(hasAccess(a, 'media', 'view')).toBe(false);
  });

  it('lead scope defaults to every lead and only accepts "centre" as the restriction', () => {
    expect(normalizeLeadScope(undefined)).toBe('all');
    expect(normalizeLeadScope('centre')).toBe('centre');
    expect(normalizeLeadScope('whatever')).toBe('all');
  });
});

/* Server actions for managing custom roles */

const ROLE_ID = '33333333-3333-4333-8333-333333333333';
const ME = '11111111-1111-4111-8111-111111111111';
const h = vi.hoisted(() => ({
  me: null as null | { id: string; name: string; role: string },
  roles: new Map<string, Record<string, unknown>>(),
  members: 0,
  users: new Map<string, Record<string, unknown>>(),
  audit: vi.fn(),
  createUser: vi.fn(),
  mailOn: true,
  mailOk: true,
  mailSent: [] as Array<Record<string, unknown>>,
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
  getUserByEmail: async () => undefined,
  createUser: (i: Record<string, unknown>) => h.createUser(i),
  updateUser: async (id: string, patch: Record<string, unknown>) => {
    const u = h.users.get(id);
    if (!u) return undefined;
    const next = { ...u, ...patch };
    h.users.set(id, next);
    return next;
  },
  resetUserPassword: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('@/lib/auth/custom-roles', () => ({
  getCustomRole: async (id: string) => h.roles.get(id),
  getCustomRoleByName: async (name: string) => [...h.roles.values()].find((r) => r.name === name),
  countRoleMembers: async () => h.members,
  createCustomRole: async (i: Record<string, unknown>) => {
    const role = { id: ROLE_ID, memberCount: 0, ...i };
    h.roles.set(ROLE_ID, role);
    return role;
  },
  updateCustomRole: async (id: string, i: Record<string, unknown>) => {
    if (!h.roles.has(id)) return undefined;
    const role = { id, memberCount: 0, ...i };
    h.roles.set(id, role);
    return role;
  },
  deleteCustomRole: async (id: string) => {
    h.roles.delete(id);
  },
}));
vi.mock('@/lib/mail', () => ({
  isMailConfigured: () => h.mailOn,
  sendMail: async (m: Record<string, unknown>) => {
    h.mailSent.push(m);
    return h.mailOk ? { ok: true } : { ok: false, error: 'smtp down' };
  },
}));
vi.mock('@/lib/leads/centre-scope', () => ({ listCentreOptions: async () => [{ slug: 'pune', name: 'Pune' }] }));
vi.mock('@/lib/audit/log', () => ({ recordAudit: (...a: unknown[]) => h.audit(...a) }));

const { createRole, updateRole, deleteRole, inviteUser, changeUserRole, adminResetPassword } = await import('@/app/(admin)/admin/team/actions');

const input = { name: 'Content writer', description: 'Writes pages', access: { content: 'edit', media: 'view' }, leadScope: 'all' };
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

beforeEach(() => {
  vi.clearAllMocks();
  h.me = { id: ME, name: 'Boss', role: 'admin' };
  h.roles.clear();
  h.users.clear();
  h.members = 0;
  h.mailOn = true;
  h.mailOk = true;
  h.mailSent = [];
  h.users.set(ME, { id: ME, name: 'Boss', email: 'b@x.com', role: 'admin', status: 'active' });
  h.createUser.mockImplementation(async (i) => ({ id: 'new', name: i.name, ...i }));
});

describe('custom role management is admin-only', () => {
  for (const role of ['editor', 'centre_staff', 'custom']) {
    it(`${role} cannot create, edit or delete roles`, async () => {
      h.me = { id: ME, name: 'X', role };
      await expect(createRole(input)).rejects.toThrow('REDIRECT');
      await expect(updateRole(ROLE_ID, input)).rejects.toThrow('REDIRECT');
      await expect(deleteRole(ROLE_ID)).rejects.toThrow('REDIRECT');
    });
  }
});

describe('createRole / updateRole', () => {
  it('stores a normalised role and audits it', async () => {
    const r = await createRole({ ...input, access: { content: 'edit', media: 'view', team: 'edit', leads: 'superuser' } });
    expect(r.ok).toBe(true);
    expect(h.roles.get(ROLE_ID)?.access).toEqual({ content: 'edit', leads: 'none', media: 'view', seo: 'none', redirects: 'none', chatbot: 'none' });
    expect(h.audit).toHaveBeenCalledWith(expect.anything(), 'team.role_create', 'role', ROLE_ID, expect.stringContaining('Content writer'));
  });

  it('rejects bad names, built-in names, empty permissions and duplicates', async () => {
    expect((await createRole({ ...input, name: 'x' })).ok).toBe(false);
    expect((await createRole({ ...input, name: 'Admin' })).ok).toBe(false);
    expect((await createRole({ ...input, name: 'administrator' })).ok).toBe(false);
    const none = await createRole({ ...input, access: {} });
    expect(none).toEqual({ ok: false, error: 'Give this role access to at least one section.' });
    await createRole(input);
    expect(await createRole(input)).toEqual({ ok: false, error: 'A role with that name already exists.' });
  });

  it('updates an existing role, rejects another role\'s name and unknown ids', async () => {
    await createRole(input);
    expect((await updateRole(ROLE_ID, { ...input, access: { content: 'view' } })).ok).toBe(true);
    expect(await updateRole('not-a-uuid', input)).toEqual({ ok: false, error: 'Role not found.' });
    expect(await updateRole('44444444-4444-4444-8444-444444444444', input)).toEqual({ ok: false, error: 'Role not found.' });
  });
});

describe('deleteRole', () => {
  it('deletes an unused role', async () => {
    await createRole(input);
    expect(await deleteRole(ROLE_ID)).toEqual({ ok: true });
    expect(h.roles.has(ROLE_ID)).toBe(false);
  });

  it('refuses while people still have the role', async () => {
    await createRole(input);
    h.members = 2;
    const r = await deleteRole(ROLE_ID);
    expect(r.ok).toBe(false);
    expect(h.roles.has(ROLE_ID)).toBe(true);
  });
});

describe('assigning a custom role', () => {
  it('invites someone with a custom role', async () => {
    await createRole(input);
    const r = await inviteUser(form({ name: 'Asha', email: 'a@x.com', password: 'longenough', role: `custom:${ROLE_ID}` }));
    expect(r.ok).toBe(true);
    expect(h.createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'custom', customRoleId: ROLE_ID }));
  });

  it('rejects a custom role that does not exist', async () => {
    const r = await inviteUser(form({ name: 'Asha', email: 'a@x.com', password: 'longenough', role: `custom:${ROLE_ID}` }));
    expect(r).toEqual({ ok: false, error: 'Invalid role.' });
    expect(h.createUser).not.toHaveBeenCalled();
  });

  it('a role limited to one centre needs a real centre', async () => {
    await createRole({ ...input, access: { leads: 'edit' }, leadScope: 'centre' });
    const base = { name: 'Asha', email: 'a@x.com', password: 'longenough', role: `custom:${ROLE_ID}` };
    expect((await inviteUser(form(base))).ok).toBe(false);
    expect((await inviteUser(form({ ...base, centreSlug: 'nowhere' }))).ok).toBe(false);
    expect((await inviteUser(form({ ...base, centreSlug: 'pune' }))).ok).toBe(true);
  });

  it('an admin cannot move their own account onto a custom role, nor the last admin', async () => {
    await createRole(input);
    expect(await changeUserRole(ME, `custom:${ROLE_ID}`, '')).toEqual({ ok: false, error: "You can't demote your own account." });
    const OTHER = '22222222-2222-4222-8222-222222222222';
    h.users.set(OTHER, { id: OTHER, name: 'Only', email: 'o@x.com', role: 'admin', status: 'active' });
    h.users.delete(ME);
    h.me = { id: ME, name: 'Boss', role: 'admin' };
    const r = await changeUserRole(OTHER, `custom:${ROLE_ID}`, '');
    expect(r.ok).toBe(false);
  });

  it('moving someone to a custom role clears a stale centre, and back to a built-in clears the role id', async () => {
    await createRole(input);
    const OTHER = '22222222-2222-4222-8222-222222222222';
    h.users.set(OTHER, { id: OTHER, name: 'Other', email: 'o@x.com', role: 'centre_staff', centreSlug: 'pune', status: 'active' });
    await changeUserRole(OTHER, `custom:${ROLE_ID}`, '');
    expect(h.users.get(OTHER)).toMatchObject({ role: 'custom', customRoleId: ROLE_ID, centreSlug: null });
    await changeUserRole(OTHER, 'editor', '');
    expect(h.users.get(OTHER)).toMatchObject({ role: 'editor', customRoleId: null });
  });
});

describe('notification emails to team members', () => {
  const invite = (role = 'editor') => inviteUser(form({ name: 'Asha', email: 'a@x.com', password: 'longenough', role }));

  it('emails the sign-in details when someone is invited', async () => {
    const r = await invite();
    expect(r).toMatchObject({ ok: true, email: 'sent' });
    expect(h.mailSent).toHaveLength(1);
    expect(h.mailSent[0]).toMatchObject({ to: 'a@x.com', subject: 'Your Jetking admin account' });
    expect(String(h.mailSent[0]!.text)).toContain('longenough');
    expect(String(h.mailSent[0]!.text)).toContain('/admin/login');
  });

  it('still creates the account and says so when the email fails or is not set up', async () => {
    h.mailOk = false;
    expect(await invite()).toMatchObject({ ok: true, email: 'failed' });
    h.mailOn = false;
    h.mailSent = [];
    expect(await invite()).toMatchObject({ ok: true, email: 'off' });
    expect(h.mailSent).toHaveLength(0);
    expect(h.createUser).toHaveBeenCalledTimes(2);
  });

  it('does not email anything when the invite is rejected', async () => {
    const r = await inviteUser(form({ name: 'A', email: 'bad', password: 'longenough', role: 'editor' }));
    expect(r.ok).toBe(false);
    expect(h.mailSent).toHaveLength(0);
  });

  it('emails the new password after an admin reset', async () => {
    const OTHER = '22222222-2222-4222-8222-222222222222';
    h.users.set(OTHER, { id: OTHER, name: 'Other', email: 'o@x.com', role: 'editor', status: 'active' });
    const r = await adminResetPassword(OTHER, 'brandnewpass');
    expect(r).toEqual({ ok: true, email: 'sent' });
    expect(h.mailSent[0]).toMatchObject({ to: 'o@x.com' });
    expect(String(h.mailSent[0]!.text)).toContain('brandnewpass');
  });
});
