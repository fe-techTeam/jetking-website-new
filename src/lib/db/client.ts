/**
 * Direct Postgres access via Drizzle + node-postgres — no @supabase/supabase-js
 * anywhere in this path, even when `DATABASE_URL` happens to point at a
 * Supabase-hosted database. Mirrors the fallback shape of `src/lib/supabase.ts`:
 * callers check `isDatabaseConfigured()` and degrade gracefully when it's unset,
 * rather than crash a page that needs the database.
 */

import 'server-only';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let pool: Pool | null = null;
let cached: NodePgDatabase<typeof schema> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Shared "database is unreachable" breaker for READS that can fall back to the file store / fixtures.
 * After a failed read, every reader skips the database for a while instead of each waiting out its own
 * connection timeout: a page reads many collections, and a static build renders many pages at once, so
 * without a shared breaker a down database turns every page into a multi-second (then timed-out) render.
 * Writes never consult it — a failed write must fail loudly, not silently fall back.
 */
const RETRY_AFTER_MS = 30_000;
let downUntil = 0;

export function isDbDown(): boolean {
  return Date.now() < downUntil;
}

export function markDbDown(): void {
  downUntil = Date.now() + RETRY_AFTER_MS;
}

/** Test hook. */
export function resetDbBreaker(): void {
  downUntil = 0;
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  if (!isDatabaseConfigured()) return null;
  if (cached) return cached;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Most managed Postgres (including Supabase's connection string) requires
    // TLS but presents a certificate chain not worth validating for this use —
    // the connection string itself is the secret that gates access.
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 5000,
  });
  cached = drizzle(pool, { schema });
  return cached;
}
