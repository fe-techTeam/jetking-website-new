'use server';

import { desc, eq } from 'drizzle-orm';
import { requireRole } from '../actions';
import { getDb } from '@/lib/db/client';
import { redirects, type RedirectRow } from '@/lib/db/schema';
import { clearRedirectCache, normalizeSource } from '@/lib/redirects/lookup';
import { recordAudit } from '@/lib/audit/log';

const ROLES = ['admin', 'editor'] as const;
const RESERVED = /^\/(admin|api|_next|media)(\/|$)/i;

export interface RedirectItem {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
  note: string;
  createdBy: string | null;
  createdAt: string;
}

const toItem = (r: RedirectRow): RedirectItem => ({
  id: r.id,
  source: r.source,
  destination: r.destination,
  permanent: r.permanent,
  note: r.note,
  createdBy: r.createdBy,
  createdAt: r.createdAt.toISOString(),
});

function validate(sourceRaw: string, destinationRaw: string): { ok: true; source: string; destination: string } | { ok: false; error: string } {
  const source = sourceRaw.trim();
  const destination = destinationRaw.trim();
  if (!source.startsWith('/') || /[\s?#]/.test(source)) return { ok: false, error: 'The old URL must be a path like /old-page (no spaces, query or #).' };
  if (RESERVED.test(source)) return { ok: false, error: 'Admin, API and media paths cannot be redirected.' };
  if (!(destination.startsWith('/') && !destination.startsWith('//')) && !/^https:\/\/[^\s]+$/i.test(destination)) {
    return { ok: false, error: 'The new URL must be a path like /courses or a full https:// link.' };
  }
  if (normalizeSource(source) === normalizeSource(destination)) return { ok: false, error: 'The old and new URL are the same.' };
  return { ok: true, source, destination };
}

export async function listRedirects(): Promise<RedirectItem[]> {
  await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return [];
  return (await db.select().from(redirects).orderBy(desc(redirects.createdAt))).map(toItem);
}

export async function saveRedirect(input: {
  id?: string;
  source: string;
  destination: string;
  permanent: boolean;
  note: string;
}): Promise<{ ok: true; item: RedirectItem } | { ok: false; error: string }> {
  const user = await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return { ok: false, error: 'Redirects need the database (DATABASE_URL).' };
  const v = validate(input.source, input.destination);
  if (!v.ok) return v;

  // A rule whose target is itself redirected makes a chain; a rule pointing back at its own source makes a loop.
  const all = await db.select().from(redirects);
  const target = normalizeSource(v.destination);
  const back = all.find((r) => normalizeSource(r.source) === target && normalizeSource(r.destination) === normalizeSource(v.source));
  if (back) return { ok: false, error: `This would loop with the existing rule ${back.source} → ${back.destination}.` };

  try {
    const values = { source: v.source, destination: v.destination, permanent: input.permanent, note: input.note.slice(0, 300) };
    const [row] = input.id
      ? await db.update(redirects).set(values).where(eq(redirects.id, input.id)).returning()
      : await db.insert(redirects).values({ ...values, createdBy: user.name }).returning();
    if (!row) return { ok: false, error: 'Redirect not found.' };
    clearRedirectCache();
    void recordAudit(user, 'redirect.save', 'redirect', row.id, `${input.id ? 'Updated' : 'Added'} redirect ${v.source} → ${v.destination}`);
    return { ok: true, item: toItem(row) };
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (/duplicate|unique/i.test(message)) return { ok: false, error: `A redirect for ${v.source} already exists.` };
    return { ok: false, error: 'Could not save the redirect.' };
  }
}

export async function removeRedirect(id: string): Promise<void> {
  const user = await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return;
  const [row] = await db.delete(redirects).where(eq(redirects.id, id)).returning();
  clearRedirectCache();
  if (row) void recordAudit(user, 'redirect.delete', 'redirect', id, `Deleted redirect ${row.source} → ${row.destination}`);
}

/** One rule per line: `/old , /new` (comma, tab or `->` between). Adds new sources, skips ones that already exist or are invalid. */
export async function importRedirects(text: string): Promise<{ added: number; skipped: string[] }> {
  const user = await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return { added: 0, skipped: ['Redirects need the database (DATABASE_URL).'] };
  const existing = new Set((await db.select({ s: redirects.source }).from(redirects)).map((r) => normalizeSource(r.s)));
  let added = 0;
  const skipped: string[] = [];
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const [source = '', destination = ''] = line.split(/\s*(?:,|\t|->)\s*/);
    const v = validate(source, destination);
    if (!v.ok) {
      skipped.push(`${line} — ${v.error}`);
      continue;
    }
    if (existing.has(normalizeSource(v.source))) {
      skipped.push(`${line} — already exists`);
      continue;
    }
    await db.insert(redirects).values({ source: v.source, destination: v.destination, permanent: true, createdBy: user.name });
    existing.add(normalizeSource(v.source));
    added++;
  }
  clearRedirectCache();
  if (added > 0) void recordAudit(user, 'redirect.import', 'redirect', null, `Imported ${added} redirects`);
  return { added, skipped };
}
