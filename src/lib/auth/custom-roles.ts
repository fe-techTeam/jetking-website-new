import 'server-only';
import { asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { adminUsers, customRoles, type CustomRole } from '@/lib/db/schema';
import { normalizeAccess, normalizeLeadScope, type Access, type LeadScope } from './roles';

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not set — no role store to read.');
  return db;
}

export interface CustomRoleView {
  id: string;
  name: string;
  description: string;
  access: Access;
  leadScope: LeadScope;
  memberCount: number;
}

function toView(row: CustomRole, memberCount = 0): CustomRoleView {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    access: normalizeAccess(row.permissions),
    leadScope: normalizeLeadScope(row.leadScope),
    memberCount,
  };
}

export async function listCustomRoles(): Promise<CustomRoleView[]> {
  const db = requireDb();
  const [roles, counts] = await Promise.all([
    db.select().from(customRoles).orderBy(asc(customRoles.name)),
    db
      .select({ id: adminUsers.customRoleId, n: count() })
      .from(adminUsers)
      .groupBy(adminUsers.customRoleId),
  ]);
  const byRole = new Map(counts.map((c) => [c.id, Number(c.n)]));
  return roles.map((r) => toView(r, byRole.get(r.id) ?? 0));
}

export async function getCustomRole(id: string): Promise<CustomRoleView | undefined> {
  const db = requireDb();
  const [row] = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
  return row ? toView(row) : undefined;
}

export async function getCustomRoleByName(name: string): Promise<CustomRoleView | undefined> {
  const db = requireDb();
  const [row] = await db.select().from(customRoles).where(eq(customRoles.name, name)).limit(1);
  return row ? toView(row) : undefined;
}

export async function createCustomRole(input: {
  name: string;
  description: string;
  access: Access;
  leadScope: LeadScope;
}): Promise<CustomRoleView> {
  const db = requireDb();
  const [row] = await db
    .insert(customRoles)
    .values({ name: input.name, description: input.description, permissions: input.access, leadScope: input.leadScope })
    .returning();
  if (!row) throw new Error('Insert did not return a row.');
  return toView(row);
}

export async function updateCustomRole(
  id: string,
  input: { name: string; description: string; access: Access; leadScope: LeadScope },
): Promise<CustomRoleView | undefined> {
  const db = requireDb();
  const [row] = await db
    .update(customRoles)
    .set({
      name: input.name,
      description: input.description,
      permissions: input.access,
      leadScope: input.leadScope,
      updatedAt: new Date(),
    })
    .where(eq(customRoles.id, id))
    .returning();
  return row ? toView(row) : undefined;
}

export async function deleteCustomRole(id: string): Promise<void> {
  const db = requireDb();
  await db.delete(customRoles).where(eq(customRoles.id, id));
}

export async function countRoleMembers(id: string): Promise<number> {
  const db = requireDb();
  const [row] = await db.select({ n: count() }).from(adminUsers).where(eq(adminUsers.customRoleId, id));
  return Number(row?.n ?? 0);
}
