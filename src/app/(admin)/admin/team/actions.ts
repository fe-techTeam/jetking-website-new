'use server';

import { requireRole } from '../actions';
import {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserByEmail,
  getUserById,
  ROLES,
  ROLE_LABEL,
  type Role,
} from '@/lib/auth/users';
import {
  countRoleMembers,
  createCustomRole,
  deleteCustomRole,
  getCustomRole,
  getCustomRoleByName,
  updateCustomRole,
  type CustomRoleView,
} from '@/lib/auth/custom-roles';
import { normalizeAccess, normalizeLeadScope, SECTIONS, type Access, type LeadScope } from '@/lib/auth/roles';
import { listCentreOptions } from '@/lib/leads/centre-scope';
import type { AdminUser } from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { staffPasswordResetEmail, staffWelcomeEmail } from '@/lib/mail/templates';
import { absoluteUrl } from '@/lib/site';

/** What happened to the notification email: `off` = email is not configured, so nothing was attempted. */
export type EmailStatus = 'sent' | 'failed' | 'off';

async function deliver(content: { subject: string; text: string; html: string }, to: string): Promise<EmailStatus> {
  if (!isMailConfigured()) return 'off';
  return (await sendMail({ to, ...content })).ok ? 'sent' : 'failed';
}

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** A role is chosen as one string: a built-in (`admin`, `editor`, `centre_staff`) or `custom:<role id>`. */
const CUSTOM_PREFIX = 'custom:';

type ResolvedRole =
  | { kind: 'builtin'; role: Role; label: string; needsCentre: boolean }
  | { kind: 'custom'; role: CustomRoleView; label: string; needsCentre: boolean };

async function resolveRole(key: string): Promise<ResolvedRole | null> {
  if (isRole(key)) return { kind: 'builtin', role: key, label: ROLE_LABEL[key], needsCentre: key === 'centre_staff' };
  if (key.startsWith(CUSTOM_PREFIX)) {
    const id = key.slice(CUSTOM_PREFIX.length);
    if (!UUID_RE.test(id)) return null;
    const role = await getCustomRole(id);
    if (!role) return null;
    return { kind: 'custom', role, label: role.name, needsCentre: role.leadScope === 'centre' && role.access.leads !== 'none' };
  }
  return null;
}

/** A role that limits leads to one centre is only ever scoped to a centre that actually
 *  exists in the CMS — free-text here previously let an admin assign a
 *  typo'd or since-deleted centre, silently scoping that person to nothing. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** These actions are callable directly with any string; a non-uuid id would make Postgres throw. */
const NOT_FOUND = { ok: false, error: 'User not found.' } as const;
const LAST_ADMIN = {
  ok: false,
  error: 'Keep at least one active admin — invite another admin before changing this one.',
} as const;

async function assertRealCentre(centreSlug: string): Promise<string | null> {
  const centres = await listCentreOptions();
  if (!centres.some((c) => c.slug === centreSlug)) {
    return 'That centre doesn\'t exist — pick one from the list.';
  }
  return null;
}

/** True when demoting / disabling / removing this user would leave zero active admins. */
async function wouldRemoveLastActiveAdmin(target: {
  id: string;
  role: string;
  status: string;
}): Promise<boolean> {
  if (target.role !== 'admin' || target.status !== 'active') return false;
  const users = await listUsers();
  const otherActiveAdmins = users.filter(
    (u) => u.id !== target.id && u.role === 'admin' && u.status === 'active',
  );
  return otherActiveAdmins.length === 0;
}

function roleFields(resolved: ResolvedRole, centreSlug: string) {
  return {
    role: resolved.kind === 'builtin' ? resolved.role : ('custom' as const),
    customRoleId: resolved.kind === 'custom' ? resolved.role.id : null,
    centreSlug: resolved.needsCentre ? centreSlug : null,
  };
}

export async function inviteUser(
  formData: FormData,
): Promise<{ ok: true; user: AdminUser; email: EmailStatus } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const roleRaw = String(formData.get('role') ?? '');
  const centreSlug = String(formData.get('centreSlug') ?? '').trim();

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email.' };
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  const resolved = await resolveRole(roleRaw);
  if (!resolved) return { ok: false, error: 'Invalid role.' };
  if (resolved.needsCentre) {
    if (!centreSlug) return { ok: false, error: resolved.kind === 'builtin' ? 'Centre staff need a centre.' : 'This role needs a centre.' };
    const centreError = await assertRealCentre(centreSlug);
    if (centreError) return { ok: false, error: centreError };
  }

  if (await getUserByEmail(email)) {
    return { ok: false, error: 'A user with that email already exists.' };
  }

  try {
    const fields = roleFields(resolved, centreSlug);
    const user = await createUser({
      name,
      email,
      password,
      role: fields.role,
      centreSlug: fields.centreSlug ?? undefined,
      customRoleId: fields.customRoleId ?? undefined,
    });
    void recordAudit(me, 'team.invite', 'user', user.id, `Invited ${user.name} (${resolved.label})`);
    // Best effort: the account exists either way; the admin is told whether the email went out.
    const emailStatus = await deliver(
      staffWelcomeEmail({ name: user.name, email: user.email, password, loginUrl: absoluteUrl('/admin/login'), roleLabel: resolved.label }),
      user.email,
    );
    return { ok: true, user, email: emailStatus };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create user.' };
  }
}

export async function changeUserRole(
  id: string,
  roleKey: string,
  centreSlug: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (!UUID_RE.test(id)) return NOT_FOUND;
  const resolved = await resolveRole(typeof roleKey === 'string' ? roleKey : '');
  if (!resolved) return { ok: false, error: 'Invalid role.' };
  const slug = typeof centreSlug === 'string' ? centreSlug.trim() : '';
  if (resolved.needsCentre) {
    if (!slug) return { ok: false, error: resolved.kind === 'builtin' ? 'Centre staff need a centre.' : 'This role needs a centre.' };
    const centreError = await assertRealCentre(slug);
    if (centreError) return { ok: false, error: centreError };
  }
  const isAdminRole = resolved.kind === 'builtin' && resolved.role === 'admin';
  if (id === me.id && !isAdminRole) {
    return { ok: false, error: "You can't demote your own account." };
  }

  const target = await getUserById(id);
  if (!target) return NOT_FOUND;
  if (!isAdminRole && (await wouldRemoveLastActiveAdmin(target))) {
    return LAST_ADMIN;
  }

  const user = await updateUser(id, roleFields(resolved, slug));
  if (!user) return { ok: false, error: 'User not found.' };
  void recordAudit(me, 'team.role_change', 'user', user.id, `Changed ${user.name}'s role to ${resolved.label}`);
  return { ok: true, user };
}

export async function toggleUserStatus(id: string): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (id === me.id) return { ok: false, error: "You can't disable your own account." };
  if (!UUID_RE.test(id)) return NOT_FOUND;

  const target = await getUserById(id);
  if (!target) return { ok: false, error: 'User not found.' };
  if (target.status === 'active' && (await wouldRemoveLastActiveAdmin(target))) {
    return LAST_ADMIN;
  }

  const user = await updateUser(id, { status: target.status === 'active' ? 'disabled' : 'active' });
  if (!user) return { ok: false, error: 'User not found.' };
  void recordAudit(me, 'team.status_toggle', 'user', user.id, `Set ${user.name} to ${user.status}`);
  return { ok: true, user };
}

export async function adminResetPassword(
  id: string,
  newPassword: string,
): Promise<{ ok: true; email: EmailStatus } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!UUID_RE.test(id)) return NOT_FOUND;
  const target = await getUserById(id);
  if (!target) return NOT_FOUND;
  await resetUserPassword(id, newPassword);
  void recordAudit(me, 'team.password_reset', 'user', id, `Reset password for ${target.name}`);
  const emailStatus = await deliver(
    staffPasswordResetEmail({ name: target.name, email: target.email, password: newPassword, loginUrl: absoluteUrl('/admin/login') }),
    target.email,
  );
  return { ok: true, email: emailStatus };
}

export async function removeUser(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (id === me.id) return { ok: false, error: "You can't remove your own account." };
  if (!UUID_RE.test(id)) return NOT_FOUND;
  const target = await getUserById(id);
  if (!target) return NOT_FOUND;
  if (await wouldRemoveLastActiveAdmin(target)) {
    return LAST_ADMIN;
  }
  await deleteUser(id);
  void recordAudit(me, 'team.remove', 'user', id, `Removed ${target.name}`);
  return { ok: true };
}

/* ── Custom roles ─────────────────────────────────────────────────────── */

export interface RoleInput {
  name: string;
  description: string;
  access: Record<string, string>;
  leadScope: string;
}

/** Names that would be confused with a built-in role in the people table. */
const RESERVED_NAMES = new Set(['admin', 'administrator', 'editor', 'centre staff', 'center staff', 'custom', 'no role']);

function cleanRoleInput(
  input: RoleInput,
): { ok: true; name: string; description: string; access: Access; leadScope: LeadScope } | { ok: false; error: string } {
  const name = String(input?.name ?? '').trim().replace(/\s+/g, ' ');
  const description = String(input?.description ?? '').trim();
  if (name.length < 2 || name.length > 40) return { ok: false, error: 'Give the role a name of 2–40 characters.' };
  if (RESERVED_NAMES.has(name.toLowerCase())) return { ok: false, error: 'That name is used by a built-in role — pick another.' };
  if (description.length > 200) return { ok: false, error: 'Keep the description under 200 characters.' };
  const access = normalizeAccess(input?.access);
  if (SECTIONS.every((s) => access[s] === 'none')) {
    return { ok: false, error: 'Give this role access to at least one section.' };
  }
  return { ok: true, name, description, access, leadScope: normalizeLeadScope(input?.leadScope) };
}

export async function createRole(
  input: RoleInput,
): Promise<{ ok: true; role: CustomRoleView } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  const clean = cleanRoleInput(input);
  if (!clean.ok) return clean;
  if (await getCustomRoleByName(clean.name)) return { ok: false, error: 'A role with that name already exists.' };
  try {
    const role = await createCustomRole(clean);
    void recordAudit(me, 'team.role_create', 'role', role.id, `Created role "${role.name}"`);
    return { ok: true, role };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create the role.' };
  }
}

export async function updateRole(
  id: string,
  input: RoleInput,
): Promise<{ ok: true; role: CustomRoleView } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (!UUID_RE.test(id)) return { ok: false, error: 'Role not found.' };
  const clean = cleanRoleInput(input);
  if (!clean.ok) return clean;
  const existing = await getCustomRole(id);
  if (!existing) return { ok: false, error: 'Role not found.' };
  const sameName = await getCustomRoleByName(clean.name);
  if (sameName && sameName.id !== id) return { ok: false, error: 'A role with that name already exists.' };

  const role = await updateCustomRole(id, clean);
  if (!role) return { ok: false, error: 'Role not found.' };
  // Permissions are read fresh on every request, so members get the new access immediately.
  void recordAudit(me, 'team.role_update', 'role', id, `Updated role "${role.name}"`);
  return { ok: true, role: { ...role, memberCount: existing.memberCount } };
}

export async function deleteRole(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (!UUID_RE.test(id)) return { ok: false, error: 'Role not found.' };
  const existing = await getCustomRole(id);
  if (!existing) return { ok: false, error: 'Role not found.' };
  const members = await countRoleMembers(id);
  if (members > 0) {
    return {
      ok: false,
      error: `${members} ${members === 1 ? 'person has' : 'people have'} this role — move them to another role first.`,
    };
  }
  await deleteCustomRole(id);
  void recordAudit(me, 'team.role_delete', 'role', id, `Deleted role "${existing.name}"`);
  return { ok: true };
}
