import 'server-only';
import { and, desc, gte, ilike, lt, sql, type SQL } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { adminAuditLog, type AdminAuditLogEntry } from '@/lib/db/schema';

/**
 * Records who did what — every mutating admin action (CMS save/delete, lead
 * status change, team invite/role change/removal) calls this after the
 * action succeeds. Best-effort by design: a failed audit write must never
 * fail the action it's describing, so this only logs to the server console
 * on error rather than throwing. No-ops entirely when `DATABASE_URL` isn't
 * set — same degrade-gracefully rule as leads and team accounts, since there
 * is nowhere to durably keep history without a database.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordAudit(
  actor: { id: string; name: string },
  action: string,
  targetType: string,
  targetId: string | null,
  summary: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(adminAuditLog).values({
      // Only real accounts have a uuid; the legacy admin and failed sign-ins by unknown people are recorded by name.
      actorId: UUID.test(actor.id) ? actor.id : null,
      actorName: actor.name,
      action,
      targetType,
      targetId,
      summary,
    });
  } catch (e) {
    console.error('Failed to record audit log entry:', e);
  }
}

export const AUDIT_GROUPS = ['content', 'leads', 'team', 'media', 'auth'] as const;
export type AuditGroup = (typeof AUDIT_GROUPS)[number];

/** Action codes are namespaced (`cms.*`, `lead.*`, `team.*`, `media.*`, `auth.*`); the filter groups map to those prefixes. */
const GROUP_PREFIX: Record<AuditGroup, string> = {
  content: 'cms.',
  leads: 'lead.',
  team: 'team.',
  media: 'media.',
  auth: 'auth.',
};

export interface AuditFilter {
  group?: AuditGroup;
  actor?: string;
  q?: string;
  /** Inclusive start day, `YYYY-MM-DD`. */
  from?: string;
  /** Inclusive end day, `YYYY-MM-DD`. */
  to?: string;
  limit?: number;
  offset?: number;
}

const escapeLike = (v: string) => v.replace(/[\\%_]/g, (m) => `\\${m}`);

function parseDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function listAuditLog(
  filter: AuditFilter = {},
): Promise<{ entries: AdminAuditLogEntry[]; total: number }> {
  const db = getDb();
  if (!db) return { entries: [], total: 0 };
  const { group, actor, q, from, to, limit = 50, offset = 0 } = filter;

  const conds: (SQL | undefined)[] = [];
  if (group && GROUP_PREFIX[group]) conds.push(ilike(adminAuditLog.action, `${GROUP_PREFIX[group]}%`));
  if (actor?.trim()) conds.push(ilike(adminAuditLog.actorName, `%${escapeLike(actor.trim())}%`));
  if (q?.trim()) conds.push(ilike(adminAuditLog.summary, `%${escapeLike(q.trim())}%`));
  const fromDay = parseDay(from);
  if (fromDay) conds.push(gte(adminAuditLog.createdAt, fromDay));
  const toDay = parseDay(to);
  if (toDay) conds.push(lt(adminAuditLog.createdAt, new Date(toDay.getTime() + 24 * 60 * 60 * 1000)));
  const where = conds.length ? and(...conds) : undefined;

  const [entries, [count]] = await Promise.all([
    db.select().from(adminAuditLog).where(where).orderBy(desc(adminAuditLog.createdAt)).limit(limit).offset(offset),
    db.select({ n: sql<number>`count(*)::int` }).from(adminAuditLog).where(where),
  ]);
  return { entries, total: count?.n ?? 0 };
}

export { isDatabaseConfigured };
