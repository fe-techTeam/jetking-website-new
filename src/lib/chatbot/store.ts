import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { chatConversations, chatUsers } from '@/lib/db/schema';
import type { ConversationRecord, ConversationSummary, SaveConversationInput } from './types';

/**
 * Accounts + saved chats for /chatbot.
 *
 * Postgres when `DATABASE_URL` is set, otherwise a JSON file under `data/chatbot/` —
 * the same "works locally with zero setup, real database in production" split the
 * CMS uses. Both back one interface, so the routes never know which they got.
 * Every conversation read/write takes the `userId`: ownership is enforced here, not
 * left to callers.
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

interface ChatStore {
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
  listConversations(userId: string): Promise<ConversationSummary[]>;
  getConversation(userId: string, id: string): Promise<ConversationRecord | null>;
  /** Insert or update; `false` when `id` already belongs to a different user. */
  saveConversation(userId: string, input: SaveConversationInput): Promise<boolean>;
  deleteConversation(userId: string, id: string): Promise<boolean>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Postgres                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function pgStore(): ChatStore {
  const db = () => {
    const client = getDb();
    if (!client) throw new Error('DATABASE_URL is not set.');
    return client;
  };

  return {
    async createUser(input) {
      try {
        const [row] = await db().insert(chatUsers).values(input).returning();
        if (!row) throw new Error('Insert did not return a row.');
        return row;
      } catch (error) {
        if (isUniqueViolation(error)) throw new DuplicateEmailError();
        throw error;
      }
    },

    async getUserByEmail(email) {
      const [row] = await db().select().from(chatUsers).where(eq(chatUsers.email, email)).limit(1);
      return row ?? null;
    },

    async getUserById(id) {
      const [row] = await db().select().from(chatUsers).where(eq(chatUsers.id, id)).limit(1);
      return row ?? null;
    },

    async listConversations(userId) {
      const rows = await db()
        .select({
          id: chatConversations.id,
          title: chatConversations.title,
          updatedAt: chatConversations.updatedAt,
        })
        .from(chatConversations)
        .where(eq(chatConversations.userId, userId))
        .orderBy(desc(chatConversations.updatedAt))
        .limit(100);
      return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString() }));
    },

    async getConversation(userId, id) {
      const [row] = await db()
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)))
        .limit(1);
      if (!row) return null;
      return {
        id: row.id,
        title: row.title,
        updatedAt: row.updatedAt.toISOString(),
        messages: row.messages,
        session: row.session ?? undefined,
      };
    },

    async saveConversation(userId, input) {
      const now = new Date();
      const rows = await db()
        .insert(chatConversations)
        .values({
          id: input.id,
          userId,
          title: input.title,
          messages: input.messages,
          session: input.session ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: chatConversations.id,
          set: { title: input.title, messages: input.messages, session: input.session ?? null, updatedAt: now },
          // Only ever overwrite the caller's own row — a colliding id owned by someone else updates nothing.
          setWhere: eq(chatConversations.userId, userId),
        })
        .returning({ id: chatConversations.id });
      return rows.length > 0;
    },

    async deleteConversation(userId, id) {
      const rows = await db()
        .delete(chatConversations)
        .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)))
        .returning({ id: chatConversations.id });
      return rows.length > 0;
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* File fallback (local development, no DATABASE_URL)                         */
/* ────────────────────────────────────────────────────────────────────────── */

interface FileConversation extends ConversationRecord {
  userId: string;
  createdAt: string;
}

interface FileData {
  users: StoredUser[];
  conversations: FileConversation[];
}

const FILE_PATH = path.join(process.cwd(), 'data', 'chatbot', 'store.json');

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/**
 * Writes are serialised through one promise chain: two overlapping autosaves would
 * otherwise both read the old file and the later write would drop the earlier one.
 * (Single process only — fine for the local fallback; production uses Postgres.)
 */
let queue: Promise<unknown> = Promise.resolve();

function withFile<T>(fn: (data: FileData) => Promise<{ data?: FileData; result: T }> | { data?: FileData; result: T }): Promise<T> {
  const run = queue.then(async () => {
    let data: FileData = { users: [], conversations: [] };
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

function fileStore(): ChatStore {
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

    listConversations: (userId) =>
      withFile((data) => ({
        result: data.conversations
          .filter((c) => c.userId === userId)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 100)
          .map(({ id, title, updatedAt }) => ({ id, title, updatedAt })),
      })),

    getConversation: (userId, id) =>
      withFile((data) => {
        const found = data.conversations.find((c) => c.id === id && c.userId === userId);
        if (!found) return { result: null };
        const { id: cid, title, updatedAt, messages, session } = found;
        return { result: { id: cid, title, updatedAt, messages, session } };
      }),

    saveConversation: (userId, input) =>
      withFile((data) => {
        const now = new Date().toISOString();
        const existing = data.conversations.find((c) => c.id === input.id);
        if (existing && existing.userId !== userId) return { result: false };
        const record: FileConversation = {
          id: input.id,
          userId,
          title: input.title,
          messages: input.messages,
          session: input.session,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        const others = data.conversations.filter((c) => c.id !== input.id);
        return { data: { ...data, conversations: [...others, record] }, result: true };
      }),

    deleteConversation: (userId, id) =>
      withFile((data) => {
        const remaining = data.conversations.filter((c) => !(c.id === id && c.userId === userId));
        if (remaining.length === data.conversations.length) return { result: false };
        return { data: { ...data, conversations: remaining }, result: true };
      }),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

let cached: ChatStore | null = null;

function store(): ChatStore {
  cached ??= isDatabaseConfigured() ? pgStore() : fileStore();
  return cached;
}

export const createUser: ChatStore['createUser'] = (input) => store().createUser(input);
export const getUserByEmail: ChatStore['getUserByEmail'] = (email) => store().getUserByEmail(email);
export const getUserById: ChatStore['getUserById'] = (id) => store().getUserById(id);
export const listConversations: ChatStore['listConversations'] = (userId) => store().listConversations(userId);
export const getConversation: ChatStore['getConversation'] = (userId, id) => store().getConversation(userId, id);
export const saveConversation: ChatStore['saveConversation'] = (userId, input) =>
  store().saveConversation(userId, input);
export const deleteConversation: ChatStore['deleteConversation'] = (userId, id) =>
  store().deleteConversation(userId, id);
