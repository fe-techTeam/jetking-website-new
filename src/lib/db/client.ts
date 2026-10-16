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
