/**
 * Adds courses that exist in data/cms/store.json but not yet in the database, so a server whose database was
 * seeded earlier shows newly shipped courses in /admin/courses without anyone re-typing them.
 *
 * Existing rows are never touched — edits made in the Admin panel survive. New rows are appended after the
 * current ones and published as in the file. A database that has never been read yet (no seed marker) is
 * skipped: it will seed itself from the file, new courses included, the first time the site reads it.
 *
 * Run with: npm run sync:courses            (add --dry-run to only list what would be added)
 */
import './load-env';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, sql } from 'drizzle-orm';
import { cmsRecords, cmsSeeded } from '../src/lib/db/schema';

const COLLECTION = 'courses';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — nothing to sync. See .env.example.');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');

  const store = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'cms', 'store.json'), 'utf8')) as {
    courses?: Array<Record<string, unknown>>;
  };
  const courses = store.courses ?? [];

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);
  try {
    const [seeded] = await db.select().from(cmsSeeded).where(eq(cmsSeeded.collection, COLLECTION)).limit(1);
    if (!seeded) {
      console.log('The database has not been seeded with courses yet; it will load all of them from the file on first use. Nothing to do.');
      return;
    }

    const existing = new Set(
      (await db.select({ id: cmsRecords.recordId }).from(cmsRecords).where(eq(cmsRecords.collection, COLLECTION))).map((r) => r.id),
    );
    const missing = courses.filter((c) => typeof c.slug === 'string' && !existing.has(c.slug));
    if (missing.length === 0) {
      console.log(`Already up to date: all ${courses.length} courses are in the database.`);
      return;
    }

    console.log(`${dryRun ? 'Would add' : 'Adding'} ${missing.length} course(s): ${missing.map((c) => c.slug).join(', ')}`);
    if (dryRun) return;

    const [max] = await db
      .select({ value: sql<number>`coalesce(max(${cmsRecords.position}), -1)` })
      .from(cmsRecords)
      .where(and(eq(cmsRecords.collection, COLLECTION)));
    let position = (max?.value ?? -1) + 1;
    for (const course of missing) {
      await db
        .insert(cmsRecords)
        .values({
          collection: COLLECTION,
          recordId: String(course.slug),
          data: course,
          status: course.status === 'draft' ? 'draft' : 'published',
          position: position++,
          updatedBy: 'sync:courses',
        })
        .onConflictDoNothing();
    }
    console.log('Done. They appear in /admin/courses and on the site within a few seconds (no restart needed).');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
