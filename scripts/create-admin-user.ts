/**
 * Bootstraps the first admin account — there's no other way to get one, since
 * Team & Access itself requires being signed in as an admin to reach.
 *
 * Run with: npm run create:admin -- --name "Aditi Rao" --email aditi@jetking.example --password "..."
 */
import './load-env';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { webcrypto as crypto } from 'node:crypto';
import { adminUsers } from '../src/lib/db/schema';

function arg(name: string): string | undefined {
  const flag = `--${name}`;
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// Mirrors src/lib/auth/password.ts — duplicated rather than imported because
// that module is marked `server-only` (a Next.js guard against accidentally
// bundling server code into the client), which this standalone script isn't.
async function hashPassword(password: string): Promise<string> {
  const ITERATIONS = 210_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const toHex = (bytes: ArrayBuffer | Uint8Array) =>
    Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

async function main() {
  const name = arg('name');
  const email = arg('email')?.trim().toLowerCase();
  const password = arg('password');

  if (!name || !email || !password) {
    console.error('Usage: npm run create:admin -- --name "Full Name" --email you@example.com --password "..."');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Run `npm run db:migrate` first if the table doesn\'t exist yet.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool, { schema: { adminUsers } });

  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing.length > 0) {
    console.error(`A user with email ${email} already exists.`);
    await pool.end();
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(adminUsers).values({ name, email, passwordHash, role: 'admin', status: 'active' });

  console.log(`Created admin ${name} <${email}>. Sign in at /admin/login.`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
