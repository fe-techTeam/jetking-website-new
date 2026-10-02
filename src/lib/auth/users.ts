import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { adminUsers, type AdminUser } from '@/lib/db/schema';
import { hashPassword } from './password';
import { ROLES, ROLE_LABEL, type Role } from './roles';

export { isDatabaseConfigured, ROLES, ROLE_LABEL, type Role };

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
  role: Role;
  centreSlug?: string;
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
    })
    .returning();
  if (!row) throw new Error('Insert did not return a row.');
  return row;
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: Role; centreSlug?: string | null; status?: 'active' | 'disabled' },
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
  await db.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  const db = requireDb();
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

export async function touchLastActive(id: string): Promise<void> {
  const db = requireDb();
  await db.update(adminUsers).set({ lastActiveAt: new Date() }).where(eq(adminUsers.id, id));
}
