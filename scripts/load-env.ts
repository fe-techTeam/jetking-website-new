import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Loads the project's env files for standalone scripts (db:migrate, seed:locations, create:admin).
 *
 * `next build` / `next start` read `.env*` themselves, but a plain `tsx scripts/…` process does not — so on a server
 * the script said "DATABASE_URL is not set" even though `.env` had it. Same files and order Next.js uses for a
 * production run, most specific first; a variable already set in the shell is never overridden.
 *
 * Import this FIRST in a script:  import './load-env';
 */
const FILES = ['.env.production.local', '.env.production', '.env.local', '.env'];

function parse(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      // Unquoted: a trailing ` # comment` is not part of the value.
      value = value.replace(/\s+#.*$/, '');
    }
    out[key] = value;
  }
  return out;
}

for (const file of FILES) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const [key, value] of Object.entries(parse(readFileSync(path, 'utf8')))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
