import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Integration tests run against the Postgres in `.env.local` (DATABASE_URL) and are skipped without one,
 * so `npm run test` stays green on a machine with no database. They only touch rows whose ids start with
 * `__test_` and remove them afterwards.
 */
try {
  for (const line of readFileSync(resolve(__dirname, '../../.env.local'), 'utf8').split('\n')) {
    const m = /^\s*([\w.-]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!;
  }
} catch {
  /* no .env.local */
}

export const HAS_DB = Boolean(process.env.DATABASE_URL);
