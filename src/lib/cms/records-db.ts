import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { cmsRecords, cmsSeeded } from '@/lib/db/schema';

/**
 * Postgres storage for every CMS collection except cities/centres (those keep their own tables, see
 * `locations-db.ts`). One row per record in `cms_records`; the record itself is a jsonb document so a
 * new field never needs a migration.
 *
 * Reads degrade to `null` (caller falls back to the file store / fixtures) when the database is
 * unreachable, and back off for a while so a down database cannot make every page wait on a timeout.
 */

const RETRY_AFTER_MS = 30_000;
let dbDownUntil = 0;

/** Short in-process read cache: a page reads several collections and the table is read-mostly. Cleared on every write. */
const CACHE_TTL_MS = 5_000;
const cache = new Map<string, { at: number; rows: Record<string, unknown>[] }>();

export function clearRecordsCache(collection?: string): void {
  if (collection) cache.delete(collection);
  else cache.clear();
}

export function recordsDbAvailable(): boolean {
  return Boolean(getDb()) && Date.now() >= dbDownUntil;
}

/** Marks a collection as seeded and copies its starting records in, exactly once per database. */
async function seedCollection(collection: string, seed: () => Promise<Record<string, unknown>[]>, idKey: string) {
  const db = getDb();
  if (!db) return;
  const [done] = await db.select().from(cmsSeeded).where(eq(cmsSeeded.collection, collection)).limit(1);
  if (done) return;

  const rows = await seed();
  await db.transaction(async (tx) => {
    // `onConflictDoNothing` makes two instances racing on first run harmless.
    const claimed = await tx.insert(cmsSeeded).values({ collection }).onConflictDoNothing().returning();
    if (claimed.length === 0) return;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((data, j) => ({
        collection,
        recordId: String(data[idKey]),
        data,
        status: data.status === 'draft' ? 'draft' : 'published',
        position: i + j,
        updatedBy: 'seed',
      }));
      if (chunk.length > 0) await tx.insert(cmsRecords).values(chunk).onConflictDoNothing();
    }
  });
}

export async function listRecordRows(
  collection: string,
  opts: { publishedOnly?: boolean; idKey: string; seed: () => Promise<Record<string, unknown>[]> },
): Promise<Record<string, unknown>[] | null> {
  const db = getDb();
  if (!db || Date.now() < dbDownUntil) return null;
  try {
    let all = cache.get(collection);
    if (!all || Date.now() - all.at > CACHE_TTL_MS) {
      await seedCollection(collection, opts.seed, opts.idKey);
      const rows = await db
        .select({ data: cmsRecords.data, status: cmsRecords.status })
        .from(cmsRecords)
        .where(eq(cmsRecords.collection, collection))
        .orderBy(asc(cmsRecords.position), asc(cmsRecords.recordId));
      // The column is the source of truth for status so a draft toggled in SQL still hides the record.
      all = { at: Date.now(), rows: rows.map((r) => ({ ...r.data, status: r.status })) };
      cache.set(collection, all);
    }
    return opts.publishedOnly ? all.rows.filter((r) => r.status === 'published') : all.rows;
  } catch (error) {
    dbDownUntil = Date.now() + RETRY_AFTER_MS;
    console.error(`[cms:records] reading "${collection}" from Postgres failed — falling back to the file store.`, error);
    return null;
  }
}

export async function upsertRecordRow(
  collection: string,
  record: Record<string, unknown>,
  idKey: string,
  previousId: string | undefined,
  actor: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const recordId = String(record[idKey]);
  await db.transaction(async (tx) => {
    let position: number | undefined;
    if (previousId && previousId !== recordId) {
      const [old] = await tx
        .select({ position: cmsRecords.position })
        .from(cmsRecords)
        .where(and(eq(cmsRecords.collection, collection), eq(cmsRecords.recordId, previousId)));
      position = old?.position;
      await tx.delete(cmsRecords).where(and(eq(cmsRecords.collection, collection), eq(cmsRecords.recordId, previousId)));
    }
    if (position === undefined) {
      const [existing] = await tx
        .select({ position: cmsRecords.position })
        .from(cmsRecords)
        .where(and(eq(cmsRecords.collection, collection), eq(cmsRecords.recordId, recordId)));
      position = existing?.position;
    }
    if (position === undefined) {
      const [max] = await tx
        .select({ value: sql<number>`coalesce(max(${cmsRecords.position}), -1)` })
        .from(cmsRecords)
        .where(eq(cmsRecords.collection, collection));
      position = (max?.value ?? -1) + 1;
    }
    const values = {
      collection,
      recordId,
      data: record,
      status: record.status === 'draft' ? 'draft' : 'published',
      position,
      updatedBy: actor,
      updatedAt: new Date(),
    };
    await tx
      .insert(cmsRecords)
      .values(values)
      .onConflictDoUpdate({ target: [cmsRecords.collection, cmsRecords.recordId], set: values });
  });
  clearRecordsCache(collection);
}

export async function deleteRecordRow(collection: string, recordId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(cmsRecords).where(and(eq(cmsRecords.collection, collection), eq(cmsRecords.recordId, recordId)));
  clearRecordsCache(collection);
}

/** Wipes the DB-backed content so the next read reseeds from the in-repo defaults. */
export async function resetRecordRows(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.transaction(async (tx) => {
    await tx.delete(cmsRecords);
    await tx.delete(cmsSeeded);
  });
  clearRecordsCache();
}

/** Re-orders a collection's records to the given id order (ids not listed keep their relative order at the end). */
export async function reorderRecordRows(collection: string, orderedIds: string[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(cmsRecords)
        .set({ position: i })
        .where(and(eq(cmsRecords.collection, collection), eq(cmsRecords.recordId, orderedIds[i]!)));
    }
  });
  clearRecordsCache(collection);
}
