import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { redirects } from '@/lib/db/schema';
import { normalizeSource } from './lookup-normalize';

/**
 * Per-request redirect lookup for the proxy. The table is tiny and read on every page view, so the
 * whole thing is held in memory and refreshed at most every 30 seconds (or immediately after an
 * admin edit on this instance). A database that is down never blocks a page: the last good copy
 * (or nothing) is used.
 */

export interface RedirectRule {
  destination: string;
  permanent: boolean;
}

const TTL_MS = 30_000;
let cache: { at: number; map: Map<string, RedirectRule> } | null = null;
let refreshing: Promise<void> | null = null;

export { normalizeSource };

export function clearRedirectCache(): void {
  cache = null;
}

async function refresh(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const rows = await db.select().from(redirects);
    cache = {
      at: Date.now(),
      map: new Map(rows.map((r) => [normalizeSource(r.source), { destination: r.destination, permanent: r.permanent }])),
    };
  } catch (error) {
    console.error('[redirects] could not load the redirect table:', error);
    // Keep serving the previous copy, and wait a full interval before trying again.
    cache = { at: Date.now(), map: cache?.map ?? new Map() };
  }
}

export async function findRedirect(pathname: string): Promise<RedirectRule | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!cache || Date.now() - cache.at > TTL_MS) {
    // First load blocks (so the very first request can redirect); later refreshes happen in the background.
    refreshing ??= refresh().finally(() => {
      refreshing = null;
    });
    if (!cache) await refreshing;
  }
  return cache?.map.get(normalizeSource(pathname)) ?? null;
}

/** Used by the admin to show whether a source already has a rule. */
export async function redirectExists(source: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const [row] = await db.select({ id: redirects.id }).from(redirects).where(eq(redirects.source, source)).limit(1);
  return Boolean(row);
}
