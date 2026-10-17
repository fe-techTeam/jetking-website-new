import 'server-only';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { cmsRevisions, type CmsRevisionRow } from '@/lib/db/schema';

/** Version history for CMS records. Best-effort like the audit log: a failed write never fails the save it describes. */

const KEEP_PER_RECORD = 30;

export type RevisionAction = 'save' | 'delete' | 'restore';

export async function recordRevision(
  collection: string,
  recordId: string,
  action: RevisionAction,
  data: Record<string, unknown>,
  actorName: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(cmsRevisions).values({ collection, recordId, action, data, actorName });
    const old = await db
      .select({ id: cmsRevisions.id })
      .from(cmsRevisions)
      .where(and(eq(cmsRevisions.collection, collection), eq(cmsRevisions.recordId, recordId)))
      .orderBy(desc(cmsRevisions.createdAt))
      .offset(KEEP_PER_RECORD);
    if (old.length > 0) {
      await db.delete(cmsRevisions).where(inArray(cmsRevisions.id, old.map((r) => r.id)));
    }
  } catch (error) {
    console.error('[cms:revisions] failed to record a revision:', error);
  }
}

export async function listRevisions(collection: string, recordId: string, limit = KEEP_PER_RECORD): Promise<CmsRevisionRow[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(cmsRevisions)
    .where(and(eq(cmsRevisions.collection, collection), eq(cmsRevisions.recordId, recordId)))
    .orderBy(desc(cmsRevisions.createdAt))
    .limit(limit);
}

export async function getRevision(id: string): Promise<CmsRevisionRow | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(cmsRevisions).where(eq(cmsRevisions.id, id)).limit(1);
  return row ?? null;
}

/** Records that were deleted and not recreated since — what the "Deleted" trash shows. */
export async function listDeleted(collection: string, limit = 50): Promise<CmsRevisionRow[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(cmsRevisions)
    .where(and(eq(cmsRevisions.collection, collection), eq(cmsRevisions.action, 'delete')))
    .orderBy(desc(cmsRevisions.createdAt))
    .limit(limit);
}
