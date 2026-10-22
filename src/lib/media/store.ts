import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { centres, cities, cmsRecords, mediaAssets } from '@/lib/db/schema';

/**
 * The media library: images and PDFs uploaded in the admin, stored in Postgres and served from
 * `/media/{id}.{ext}`. A record field just holds that path, so it works anywhere a repo image path does.
 * SVG is deliberately not accepted — an uploaded SVG can carry script and would be served from the site's origin.
 */

export const MEDIA_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
};
export const MEDIA_MAX_BYTES = 6 * 1024 * 1024;

export interface MediaItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  alt: string;
  url: string;
  uploadedBy: string | null;
  createdAt: string;
}

export const mediaUrl = (id: string, mime: string) => `/media/${id}.${MEDIA_TYPES[mime] ?? 'bin'}`;

/** File signatures — the browser-reported type alone is not trusted. */
function sniff(bytes: Buffer): string | null {
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes.toString('latin1', 1, 4) === 'PNG') return 'image/png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length > 12 && bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (bytes.length > 6 && bytes.toString('latin1', 0, 3) === 'GIF') return 'image/gif';
  if (bytes.length > 12 && bytes.toString('latin1', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('latin1', 8, 12))) return 'image/avif';
  if (bytes.length > 5 && bytes.toString('latin1', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

function toItem(row: Omit<typeof mediaAssets.$inferSelect, 'data'>): MediaItem {
  return {
    id: row.id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    alt: row.alt,
    url: mediaUrl(row.id, row.mime),
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

const columns = {
  id: mediaAssets.id,
  filename: mediaAssets.filename,
  mime: mediaAssets.mime,
  size: mediaAssets.size,
  alt: mediaAssets.alt,
  uploadedBy: mediaAssets.uploadedBy,
  createdAt: mediaAssets.createdAt,
};

export async function listMedia(limit = 500): Promise<MediaItem[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select(columns).from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(limit);
  return rows.map(toItem);
}

export async function saveMedia(
  file: { name: string; bytes: Buffer },
  uploadedBy: string,
): Promise<{ ok: true; item: MediaItem } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: 'The media library needs the database (DATABASE_URL).' };
  if (file.bytes.length === 0) return { ok: false, error: `${file.name} is empty.` };
  if (file.bytes.length > MEDIA_MAX_BYTES) return { ok: false, error: `${file.name} is over 6 MB.` };
  const mime = sniff(file.bytes);
  if (!mime) return { ok: false, error: `${file.name}: only PNG, JPG, WebP, GIF, AVIF and PDF files are accepted.` };
  const [row] = await db
    .insert(mediaAssets)
    .values({
      filename: file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120),
      mime,
      size: file.bytes.length,
      data: file.bytes,
      uploadedBy,
    })
    .returning(columns);
  return { ok: true, item: toItem(row!) };
}

export async function getMediaBytes(id: string): Promise<{ data: Buffer; mime: string; filename: string; updatedAt: Date } | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({ data: mediaAssets.data, mime: mediaAssets.mime, filename: mediaAssets.filename, createdAt: mediaAssets.createdAt })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  return row ? { data: row.data, mime: row.mime, filename: row.filename, updatedAt: row.createdAt } : null;
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(mediaAssets).set({ alt: alt.slice(0, 300) }).where(eq(mediaAssets.id, id));
}

export async function deleteMedia(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
}

export interface MediaUsage {
  collection: string;
  recordId: string;
}

/** Every record whose saved content mentions this file's `/media/{id}` path (CMS records, centres, cities). */
export async function findMediaUsage(id: string): Promise<MediaUsage[]> {
  const db = getDb();
  if (!db) return [];
  const needle = `%/media/${id}%`;
  const [records, centreRows, cityRows] = await Promise.all([
    db
      .select({ collection: cmsRecords.collection, recordId: cmsRecords.recordId })
      .from(cmsRecords)
      .where(sql`${cmsRecords.data}::text like ${needle}`),
    db
      .select({ slug: centres.slug })
      .from(centres)
      .where(sql`(${centres.details}::text || ${centres.seo}::text) like ${needle}`),
    db
      .select({ slug: cities.slug })
      .from(cities)
      .where(sql`(${cities.seo}::text || ${cities.intro}) like ${needle}`),
  ]);
  return [
    ...records,
    ...centreRows.map((r) => ({ collection: 'centres', recordId: r.slug })),
    ...cityRows.map((r) => ({ collection: 'cities', recordId: r.slug })),
  ];
}
