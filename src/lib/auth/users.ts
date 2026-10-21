import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { adminUsers, type AdminUser } from '@/lib/db/schema';
import { hashPassword } from './password';
import { ROLES, ROLE_LABEL, type Role, type UserRole } from './roles';

export { isDatabaseConfigured, ROLES, ROLE_LABEL, type Role, type UserRole };

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not set — no user store to read.');
  return db;
}

export async function listUsers(): Promise<AdminUser[]> {
  const db = requireDb();
  return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
}

export async function getUserByEmail(email: string): Promise<AdminUser | undefined> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);
  return row;
}

export async function getUserById(id: string): Promise<AdminUser | undefined> {
  const db = requireDb();
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return row;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  centreSlug?: string;
  /** Required when role is 'custom'. */
  customRoleId?: string;
}): Promise<AdminUser> {
  const db = requireDb();
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(adminUsers)
    .values({
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
      centreSlug: input.centreSlug || null,
      customRoleId: input.role === 'custom' ? (input.customRoleId ?? null) : null,
    })
    .returning();
  if (!row) throw new Error('Insert did not return a row.');
  return row;
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    role?: UserRole;
    centreSlug?: string | null;
    customRoleId?: string | null;
    status?: 'active' | 'disabled';
  },
): Promise<AdminUser | undefined> {
  const db = requireDb();
  const [row] = await db
    .update(adminUsers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(adminUsers.id, id))
    .returning();
  return row;
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const db = requireDb();
  const passwordHash = await hashPassword(newPassword);
  // A new password signs the user out of every other session (their old cookies carry the old version).
  await db
    .update(adminUsers)
    .set({ passwordHash, updatedAt: new Date(), sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, id));
}

/** Invalidates every session cookie the user holds; returns the new version (or null if the user is gone). */
export async function revokeUserSessions(id: string): Promise<number | null> {
  const db = requireDb();
  const [row] = await db
    .update(adminUsers)
    .set({ sessionVersion: sql`${adminUsers.sessionVersion} + 1` })
    .where(eq(adminUsers.id, id))
    .returning({ sessionVersion: adminUsers.sessionVersion });
  return row ? row.sessionVersion : null;
}

export async function deleteUser(id: string): Promise<void> {
  const db = requireDb();
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

export async function touchLastActive(id: string): Promise<void> {
  const db = requireDb();
  await db.update(adminUsers).set({ lastActiveAt: new Date() }).where(eq(adminUsers.id, id));
}
