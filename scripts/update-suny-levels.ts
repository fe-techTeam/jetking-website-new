/**
 * Sets level: "suny" on the three SUNY partnership courses in the CMS database
 * (and patches data/cms/store.json so local/file fallback matches).
 *
 * Existing Admin edits to other fields are kept — only `data.level` is changed.
 *
 *   npx tsx scripts/update-suny-levels.ts
 *   npx tsx scripts/update-suny-levels.ts --dry-run
 */
import './load-env';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, inArray } from 'drizzle-orm';
import { cmsRecords } from '../src/lib/db/schema';

const COLLECTION = 'courses';
const SLUGS = ['suny-cyber-security', 'suny-ethical-hacking', 'suny-artificial-intelligence'] as const;

async function patchStoreFile(dryRun: boolean) {
  const file = path.join(process.cwd(), 'data', 'cms', 'store.json');
  const store = JSON.parse(readFileSync(file, 'utf8')) as {
    courses?: Array<Record<string, unknown>>;
  };
  let changed = 0;
  for (const course of store.courses ?? []) {
    if (typeof course.slug === 'string' && (SLUGS as readonly string[]).includes(course.slug) && course.level !== 'suny') {
      console.log(`store.json: ${course.slug}  ${String(course.level)} → suny`);
      course.level = 'suny';
      changed += 1;
    }
  }
  if (!dryRun && changed) writeFileSync(file, `${JSON.stringify(store, null, 2)}\n`);
  return changed;
}

async function patchDatabase(dryRun: boolean) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('DATABASE_URL is not set — skipping database.');
    return 0;
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);
  try {
    const rows = await db
      .select()
      .from(cmsRecords)
      .where(and(eq(cmsRecords.collection, COLLECTION), inArray(cmsRecords.recordId, [...SLUGS])));

    if (rows.length === 0) {
      console.log('No SUNY course rows found in cms_records.');
      return 0;
    }

    let changed = 0;
    for (const row of rows) {
      const data = { ...(row.data as Record<string, unknown>) };
      const before = data.level;
      if (before === 'suny') {
        console.log(`db: ${row.recordId} already suny`);
        continue;
      }
      console.log(`db: ${row.recordId}  ${String(before)} → suny`);
      data.level = 'suny';
      if (!dryRun) {
        await db
          .update(cmsRecords)
          .set({ data, updatedBy: 'update-suny-levels', updatedAt: new Date() })
          .where(and(eq(cmsRecords.collection, COLLECTION), eq(cmsRecords.recordId, row.recordId)));
      }
      changed += 1;
    }
    return changed;
  } finally {
    await pool.end();
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('Dry run — no writes.\n');

  const fileCount = await patchStoreFile(dryRun);
  const dbCount = await patchDatabase(dryRun);

  console.log(
    `\n${dryRun ? 'Would update' : 'Updated'}: store.json ${fileCount}, database ${dbCount}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
