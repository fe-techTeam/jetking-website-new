'use server';

import { desc, eq } from 'drizzle-orm';
import { requireAccess } from '../actions';
import { getDb } from '@/lib/db/client';
import { redirects, type RedirectRow } from '@/lib/db/schema';
import { clearRedirectCache, normalizeSource } from '@/lib/redirects/lookup';
import { MAX_IMPORT_LINES, findRedirectLoop, validateRedirect } from '@/lib/redirects/validate';
import { recordAudit } from '@/lib/audit/log';

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

export async function listRedirects(): Promise<RedirectItem[]> {
  await requireAccess('redirects', 'view');
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
  const user = await requireAccess('redirects', 'edit');
  const db = getDb();
  if (!db) return { ok: false, error: 'Redirects need the database (DATABASE_URL).' };
  if (input.id !== undefined && !/^[0-9a-f-]{36}$/i.test(String(input.id))) return { ok: false, error: 'Redirect not found.' };
  const v = validateRedirect(input.source, input.destination);
  if (!v.ok) return v;

  // A rule whose target is itself redirected makes a chain; a rule pointing back at its own source makes a loop.
  const all = await db.select().from(redirects);
  const back = findRedirectLoop(all.filter((r) => r.id !== input.id), v.source, v.destination);
  if (back) return { ok: false, error: `This would loop with the existing rule ${back.source} → ${back.destination}.` };

  try {
    const values = { source: v.source, destination: v.destination, permanent: Boolean(input.permanent), note: String(input.note ?? '').slice(0, 300) };
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
  const user = await requireAccess('redirects', 'edit');
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(String(id))) return;
  const [row] = await db.delete(redirects).where(eq(redirects.id, id)).returning();
  clearRedirectCache();
  if (row) void recordAudit(user, 'redirect.delete', 'redirect', id, `Deleted redirect ${row.source} → ${row.destination}`);
}

/** One rule per line: `/old , /new` (comma, tab or `->` between). Adds new sources, skips ones that already exist or are invalid. */
export async function importRedirects(text: string): Promise<{ added: number; skipped: string[] }> {
  const user = await requireAccess('redirects', 'edit');
  const db = getDb();
  if (!db) return { added: 0, skipped: ['Redirects need the database (DATABASE_URL).'] };
  const existing = new Set((await db.select({ s: redirects.source }).from(redirects)).map((r) => normalizeSource(r.s)));
  const known = await db.select({ source: redirects.source, destination: redirects.destination }).from(redirects);
  let added = 0;
  const skipped: string[] = [];
  for (const line of String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, MAX_IMPORT_LINES)) {
    const [source = '', destination = ''] = line.split(/\s*(?:,|\t|->)\s*/);
    const v = validateRedirect(source, destination);
    if (!v.ok) {
      skipped.push(`${line} — ${v.error}`);
      continue;
    }
    if (existing.has(normalizeSource(v.source))) {
      skipped.push(`${line} — already exists`);
      continue;
    }
    const loop = findRedirectLoop(known, v.source, v.destination);
    if (loop) {
      skipped.push(`${line} — would loop with ${loop.source} → ${loop.destination}`);
      continue;
    }
    known.push({ source: v.source, destination: v.destination });
    await db.insert(redirects).values({ source: v.source, destination: v.destination, permanent: true, createdBy: user.name });
    existing.add(normalizeSource(v.source));
    added++;
  }
  clearRedirectCache();
  if (added > 0) void recordAudit(user, 'redirect.import', 'redirect', null, `Imported ${added} redirects`);
  return { added, skipped };
}
