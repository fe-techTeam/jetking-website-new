/**
 * Applies pending Drizzle migrations from drizzle/migrations against DATABASE_URL.
 * Run with: npm run db:migrate
 */
import './load-env';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — nothing to migrate against. See .env.example.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  console.log('Applying migrations from drizzle/migrations …');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Done.');

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
