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
import { listCentreOptions } from '@/lib/leads/centre-scope';
import type { AdminUser } from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** A `centre_staff` account is only ever scoped to a centre that actually
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

export async function inviteUser(
  formData: FormData,
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const roleRaw = String(formData.get('role') ?? '');
  const centreSlug = String(formData.get('centreSlug') ?? '').trim();

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email.' };
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!isRole(roleRaw)) return { ok: false, error: 'Invalid role.' };
  if (roleRaw === 'centre_staff') {
    if (!centreSlug) return { ok: false, error: 'Centre staff need a centre.' };
    const centreError = await assertRealCentre(centreSlug);
    if (centreError) return { ok: false, error: centreError };
  }

  if (await getUserByEmail(email)) {
    return { ok: false, error: 'A user with that email already exists.' };
  }

  try {
    const user = await createUser({
      name,
      email,
      password,
      role: roleRaw,
      centreSlug: roleRaw === 'centre_staff' ? centreSlug : undefined,
    });
    void recordAudit(me, 'team.invite', 'user', user.id, `Invited ${user.name} (${ROLE_LABEL[user.role as Role]})`);
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create user.' };
  }
}

export async function changeUserRole(
  id: string,
  role: string,
  centreSlug: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (!UUID_RE.test(id)) return NOT_FOUND;
  if (!isRole(role)) return { ok: false, error: 'Invalid role.' };
  if (role === 'centre_staff') {
    if (!centreSlug.trim()) return { ok: false, error: 'Centre staff need a centre.' };
    const centreError = await assertRealCentre(centreSlug.trim());
    if (centreError) return { ok: false, error: centreError };
  }
  if (id === me.id && role !== 'admin') {
    return { ok: false, error: "You can't demote your own account." };
  }

  const target = await getUserById(id);
  if (!target) return NOT_FOUND;
  if (role !== 'admin' && (await wouldRemoveLastActiveAdmin(target))) {
    return LAST_ADMIN;
  }

  const user = await updateUser(id, {
    role,
    centreSlug: role === 'centre_staff' ? centreSlug.trim() : null,
  });
  if (!user) return { ok: false, error: 'User not found.' };
  void recordAudit(me, 'team.role_change', 'user', user.id, `Changed ${user.name}'s role to ${ROLE_LABEL[user.role as Role]}`);
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
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireRole(['admin']);
  if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!UUID_RE.test(id)) return NOT_FOUND;
  const target = await getUserById(id);
  if (!target) return NOT_FOUND;
  await resetUserPassword(id, newPassword);
  void recordAudit(me, 'team.password_reset', 'user', id, `Reset password for ${target.name}`);
  return { ok: true };
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
