import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export { isDatabaseConfigured };

/**
 * Accounts for the main website's own register/login — kept independent of
 * /chatbot's accounts (`src/lib/chatbot/store.ts`), which is a deliberate,
 * temporary split (see the `users` table's doc comment in `src/lib/db/schema.ts`).
 *
 * Postgres when `DATABASE_URL` is set, otherwise a JSON file under `data/users/` —
 * mirrors the chatbot store's "works locally with zero setup, real database in
 * production" split.
 */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  state?: string | null;
  city?: string | null;
  centre?: string | null;
  passwordHash: string;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists.');
  }
}

/** Postgres' unique_violation code, wherever the driver put it — drizzle-orm wraps
 *  the real `pg` error in `.cause` rather than exposing `.code` at the top level. */
function isUniqueViolation(error: unknown): boolean {
  for (const candidate of [error, (error as { cause?: unknown } | null)?.cause]) {
    if (typeof candidate === 'object' && candidate !== null && 'code' in candidate && candidate.code === '23505') {
      return true;
    }
  }
  return false;
}

interface UserStore {
  createUser(input: {
    name: string;
    email: string;
    phone: string;
    state: string;
    city: string;
    centre?: string;
    passwordHash: string;
  }): Promise<StoredUser>;
  getUserByEmail(email: string): Promise<StoredUser | null>;
  getUserById(id: string): Promise<StoredUser | null>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Postgres                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function pgStore(): UserStore {
  const db = () => {
    const client = getDb();
    if (!client) throw new Error('DATABASE_URL is not set.');
    return client;
  };

  return {
    async createUser(input) {
      try {
        const [row] = await db().insert(users).values(input).returning();
        if (!row) throw new Error('Insert did not return a row.');
        return row;
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateEmailError();
        throw error;
      }
    },

    async getUserByEmail(email) {
      const [row] = await db().select().from(users).where(eq(users.email, email)).limit(1);
      return row ?? null;
    },

    async getUserById(id) {
      const [row] = await db().select().from(users).where(eq(users.id, id)).limit(1);
      return row ?? null;
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* File fallback (local development, no DATABASE_URL)                         */
/* ────────────────────────────────────────────────────────────────────────── */

interface FileData {
  users: StoredUser[];
}

const FILE_PATH = path.join(process.cwd(), 'data', 'users', 'store.json');

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/**
 * Writes are serialised through one promise chain: two overlapping signups would
 * otherwise both read the old file and the later write would drop the earlier one.
 * (Single process only — fine for the local fallback; production uses Postgres.)
 */
let queue: Promise<unknown> = Promise.resolve();

function withFile<T>(fn: (data: FileData) => Promise<{ data?: FileData; result: T }> | { data?: FileData; result: T }): Promise<T> {
  const run = queue.then(async () => {
    let data: FileData = { users: [] };
    try {
      data = JSON.parse(await fs.readFile(FILE_PATH, 'utf8')) as FileData;
    } catch (error) {
      // Only a missing file is a first run; a corrupt one must not be silently reset.
      if (!isEnoent(error)) throw error;
    }
    const { data: next, result } = await fn(data);
    if (next) {
      await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
      const tmp = `${FILE_PATH}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
      await fs.rename(tmp, FILE_PATH);
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function fileStore(): UserStore {
  return {
    createUser: (input) =>
      withFile((data) => {
        if (data.users.some((u) => u.email === input.email)) throw new DuplicateEmailError();
        const user: StoredUser = { id: randomUUID(), ...input };
        return { data: { ...data, users: [...data.users, user] }, result: user };
      }),

    getUserByEmail: (email) =>
      withFile((data) => ({ result: data.users.find((u) => u.email === email) ?? null })),

    getUserById: (id) => withFile((data) => ({ result: data.users.find((u) => u.id === id) ?? null })),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

let cached: UserStore | null = null;

function store(): UserStore {
  cached ??= isDatabaseConfigured() ? pgStore() : fileStore();
  return cached;
}

export const createUser: UserStore['createUser'] = (input) => store().createUser(input);
export const getUserByEmail: UserStore['getUserByEmail'] = (email) => store().getUserByEmail(email);
export const getUserById: UserStore['getUserById'] = (id) => store().getUserById(id);
