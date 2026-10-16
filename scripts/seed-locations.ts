/**
 * Seeds the `cities` and `centres` tables from the in-repo fixtures
 * (src/lib/content/fixtures/locations.ts).
 *
 * Existing rows are left alone, so edits made in the Admin panel survive a re-run.
 * Pass --overwrite to reset every fixture row to its shipped content.
 *
 * Run with: npm run seed:locations   (after npm run db:migrate)
 */
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { centres, cities } from '../src/lib/db/schema';
import { centres as seedCentres, cities as seedCities } from '../src/lib/content/fixtures/locations';
import { centreToRow, cityToRow } from '../src/lib/cms/locations-map';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — nothing to seed. See .env.example.');
    process.exit(1);
  }
  const overwrite = process.argv.includes('--overwrite');

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  let cityCount = 0;
  for (const city of seedCities) {
    const row = cityToRow({ ...city, status: 'published' });
    const q = db.insert(cities).values({ ...row, updatedAt: new Date(city.updatedAt) });
    const res = await (overwrite
      ? q.onConflictDoUpdate({ target: cities.slug, set: row })
      : q.onConflictDoNothing()
    ).returning({ slug: cities.slug });
    cityCount += res.length;
  }

  let centreCount = 0;
  for (const centre of seedCentres) {
    const row = centreToRow({ ...centre, status: 'published' });
    const q = db.insert(centres).values({ ...row, updatedAt: new Date(centre.updatedAt) });
    const res = await (overwrite
      ? q.onConflictDoUpdate({ target: centres.slug, set: row })
      : q.onConflictDoNothing()
    ).returning({ slug: centres.slug });
    centreCount += res.length;
  }

  console.log(
    `Seeded ${cityCount}/${seedCities.length} cities and ${centreCount}/${seedCentres.length} centres` +
      (overwrite ? ' (overwrite).' : ' (existing rows kept).'),
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
