import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { centres as centresTable, cities as citiesTable } from '@/lib/db/schema';
import { centreFromRow, centreToRow, cityFromRow, cityToRow } from '@/lib/cms/locations-map';

/**
 * Postgres-backed storage for the `cities` and `centres` CMS collections.
 *
 * The CMS store (`store.ts`) routes these two collections here whenever `DATABASE_URL` is set,
 * so the Admin panel and the public /centres pages share one source of truth. Records keep the
 * exact shape the rest of the app already uses (`Centre`, `City` + `status`); this module only
 * maps between that shape and the table columns.
 */

export type LocationCollection = 'centres' | 'cities';

export function isLocationCollection(collection: string): collection is LocationCollection {
  return collection === 'centres' || collection === 'cities';
}

/**
 * After a failed read, skip the database for a short while: a down database can take seconds to refuse a
 * connection, and a page reads several collections, so retrying on every call would make the site crawl.
 */
const RETRY_AFTER_MS = 30_000;
let dbDownUntil = 0;

/**
 * Every row of the collection, or `null` when the database is unavailable or the table is still
 * empty (not yet seeded) — the caller then serves the file store / fixtures, so a fresh database
 * never blanks the directory. Pass `status` to push the published filter into SQL.
 */
export async function listLocationRows(
  collection: LocationCollection,
  opts?: { publishedOnly?: boolean },
): Promise<Record<string, unknown>[] | null> {
  const db = getDb();
  if (!db || Date.now() < dbDownUntil) return null;
  try {
    if (collection === 'centres') {
      const rows = await db.select().from(centresTable);
      if (rows.length === 0) return null;
      const records = rows.map(centreFromRow) as unknown as Record<string, unknown>[];
      return opts?.publishedOnly ? records.filter((r) => r.status === 'published') : records;
    }
    const rows = await db.select().from(citiesTable);
    if (rows.length === 0) return null;
    const records = rows.map(cityFromRow) as unknown as Record<string, unknown>[];
    return opts?.publishedOnly ? records.filter((r) => r.status === 'published') : records;
  } catch (error) {
    dbDownUntil = Date.now() + RETRY_AFTER_MS;
    console.error(`[cms:locations] reading "${collection}" from Postgres failed — falling back to the file store.`, error);
    return null;
  }
}

/** Insert or update one record; when `previousId` differs from the record's slug it is a rename. */
export async function upsertLocationRow(
  collection: LocationCollection,
  record: Record<string, unknown>,
  previousId?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const slug = String(record.slug);
  const table = collection === 'centres' ? centresTable : citiesTable;
  await db.transaction(async (tx) => {
    if (previousId && previousId !== slug) {
      await tx.delete(table).where(eq(table.slug, previousId));
    }
    if (collection === 'centres') {
      const row = centreToRow(record);
      await tx.insert(centresTable).values(row).onConflictDoUpdate({ target: centresTable.slug, set: row });
    } else {
      const row = cityToRow(record);
      await tx.insert(citiesTable).values(row).onConflictDoUpdate({ target: citiesTable.slug, set: row });
    }
  });
}

export async function deleteLocationRow(collection: LocationCollection, slug: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const table = collection === 'centres' ? centresTable : citiesTable;
  await db.delete(table).where(eq(table.slug, slug));
}
