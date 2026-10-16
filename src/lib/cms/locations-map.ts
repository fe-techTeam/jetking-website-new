import type { centres as centresTable, cities as citiesTable, CentreRow, CityRow } from '@/lib/db/schema';
import type { Centre, City, Seo } from '@/lib/content/types';
import type { PublishStatus } from '@/lib/cms/types';

/**
 * Pure row <-> record mappers for the `centres` / `cities` tables. No `server-only` and no DB client,
 * so the seed script (a plain tsx process) can share them with the app.
 */

export type CentreRecord = Centre & { status: PublishStatus };
export type CityRecord = City & { status: PublishStatus };

/** Centre fields that are real columns. Everything else is folded into the `details` jsonb. */
const CENTRE_COLUMN_KEYS = new Set([
  'slug',
  'citySlug',
  'name',
  'addressLine',
  'locality',
  'state',
  'pincode',
  'phone',
  'email',
  'helpline',
  'geo',
  'coursesOffered',
  'seo',
  'status',
  'updatedAt',
]);

export function asStatus(value: string): PublishStatus {
  return value === 'draft' ? 'draft' : 'published';
}

export function centreFromRow(row: CentreRow): CentreRecord {
  const centre = {
    ...(row.details as object),
    slug: row.slug,
    citySlug: row.citySlug,
    name: row.name,
    addressLine: row.addressLine,
    locality: row.locality,
    state: row.state,
    pincode: row.pincode,
    coursesOffered: row.coursesOffered,
    seo: row.seo as unknown as Seo,
    updatedAt: row.updatedAt.toISOString(),
    status: asStatus(row.status),
  } as CentreRecord;
  if (row.phone) centre.phone = row.phone;
  if (row.email) centre.email = row.email;
  if (row.helpline) centre.helpline = row.helpline;
  if (row.lat !== null && row.lng !== null) centre.geo = { lat: row.lat, lng: row.lng };
  return centre;
}

export function centreToRow(record: Record<string, unknown>): typeof centresTable.$inferInsert {
  const details: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!CENTRE_COLUMN_KEYS.has(key) && value !== undefined) details[key] = value;
  }
  const geo = record.geo as { lat: number; lng: number } | undefined;
  return {
    slug: String(record.slug),
    citySlug: String(record.citySlug),
    name: String(record.name),
    addressLine: String(record.addressLine),
    locality: String(record.locality),
    state: String(record.state),
    pincode: String(record.pincode),
    phone: (record.phone as string | undefined) ?? null,
    email: (record.email as string | undefined) ?? null,
    helpline: (record.helpline as string | undefined) ?? null,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    coursesOffered: (record.coursesOffered as string[] | undefined) ?? [],
    seo: (record.seo as Record<string, unknown>) ?? {},
    details,
    status: asStatus(String(record.status ?? 'published')),
    updatedAt: new Date(),
  };
}

export function cityFromRow(row: CityRow): CityRecord {
  return {
    slug: row.slug,
    name: row.name,
    state: row.state,
    intro: row.intro,
    seo: row.seo as unknown as Seo,
    updatedAt: row.updatedAt.toISOString(),
    status: asStatus(row.status),
  };
}

export function cityToRow(record: Record<string, unknown>): typeof citiesTable.$inferInsert {
  return {
    slug: String(record.slug),
    name: String(record.name),
    state: String(record.state),
    intro: String(record.intro),
    seo: (record.seo as Record<string, unknown>) ?? {},
    status: asStatus(String(record.status ?? 'published')),
    updatedAt: new Date(),
  };
}

