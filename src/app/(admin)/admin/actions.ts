'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import {
  DuplicateIdError,
  deleteRecord,
  listCollection,
  resetCmsStoreFromFixtures,
  upsertRecord,
  type CmsCollection,
} from '@/lib/cms/store';
import { publishContent } from '@/lib/cms/publish';
import { createRateLimiter } from '@/lib/rate-limit';
import { clientIpFromHeaders } from '@/lib/client-ip';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  hmacSign,
  setUserSessionCookie,
  timingSafeEqual,
  verifyMultiUserSession,
} from '@/lib/auth/session';
import { CMS_COLLECTIONS, CMS_ID_PATTERN, findUnsafeContent, validateCmsRecord } from '@/lib/cms/schemas';
import { CMS_ID_KEYS } from '@/lib/cms/id-keys';
import {
  isDatabaseConfigured,
  getUserByEmail,
  getUserById,
  revokeUserSessions,
  touchLastActive,
  type Role,
} from '@/lib/auth/users';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { recordAudit } from '@/lib/audit/log';
import { htmlToBlocks, sanitizeRichHtml } from '@/lib/rich/html';
import { isRichHtml } from '@/lib/rich/text';
import { getRevision, listDeleted, listRevisions } from '@/lib/cms/revisions';
import { collectionByKey } from './registry';

/** `CmsCollection` is compile-time only — a raw call to this action (bypassing the
 *  generated client stub) could otherwise pass any string through to the store. */
function assertKnownCollection(collection: CmsCollection): void {
  if (!CMS_COLLECTIONS.includes(collection)) {
    throw new Error(`Unknown collection "${collection}".`);
  }
}

/** Who may touch a collection — the legal pages are admin-only, everything else admin + editor. Enforced
 *  here, not just by hiding the sidebar link, because these server actions can be called directly. */
function rolesFor(collection: CmsCollection): Role[] {
  assertKnownCollection(collection);
  return collectionByKey(collection).roles ?? ['admin', 'editor'];
}

/** The id field is a property of the collection, never of the caller: a raw action call passing e.g.
 *  `idKey: 'status'` would otherwise make delete/rename match (and wipe) every row sharing a value. */
function assertIdKey(collection: CmsCollection, idKey: string): void {
  if (CMS_ID_KEYS[collection] !== idKey) throw new Error(`Invalid id field "${idKey}" for ${collection}.`);
}

/** Upper bound on one saved record (JSON text) — the biggest real article is far below this. */
const MAX_RECORD_JSON_CHARS = 2_000_000;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  centreSlug: string | null;
}

/** The pre-multi-user single shared password, used only when `DATABASE_URL`
 *  is unset — see `@/lib/auth/session` for the multi-user cookie. */
function adminPassword(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PASSWORD must be set in production.');
    }
    return 'changeme';
  }
  return value;
}

async function signLegacySession(issuedAt: number): Promise<string> {
  return `${issuedAt}.${await hmacSign(adminPassword(), String(issuedAt))}`;
}

/** Client identity for the login rate limiter (no Request object in a server action): proxy-controlled headers only. */
async function loginKey(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

let dummyHashPromise: Promise<string> | undefined;
/** A throwaway hash verified against when the email is unknown (timing-equalisation). */
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('not-a-real-password');
  return dummyHashPromise;
}

/** Deliberately tight — a real admin fails a password rarely; this is a brute-force brake. */
const loginLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 8 });

/**
 * Resolves the signed-in staff member, or `null`. Two modes, chosen once per
 * deployment by whether `DATABASE_URL` is set — never mixed:
 *
 *  - **Multi-user** (DB configured): the cookie carries a user id; role,
 *    name, and status (active/disabled) are read fresh from `admin_users` on
 *    every call, so disabling someone or changing their role takes effect
 *    immediately, not at next login.
 *  - **Legacy single-password** (no DB): every authenticated visitor is
 *    treated as a synthetic full-admin — the shape the rest of the app
 *    expected before multi-user existed, and still the simplest thing for a
 *    local/staging environment with nobody's DATABASE_URL wired up yet.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const session = jar.get(ADMIN_COOKIE)?.value;
  if (!session) return null;

  if (isDatabaseConfigured()) {
    const verified = await verifyMultiUserSession(session);
    if (!verified) return null;

    const user = await getUserById(verified.userId);
    if (!user || user.status !== 'active') return null;
    // A cookie issued before the last sign-out / password change carries an older version: revoked.
    if (user.sessionVersion !== verified.version) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      centreSlug: user.centreSlug,
    };
  }

  // Legacy path — unchanged shape from before multi-user existed.
  const separator = session.indexOf('.');
  if (separator <= 0) return null;
  const issuedAt = Number(session.slice(0, separator));
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  let expected: string;
  try {
    expected = await signLegacySession(issuedAt);
  } catch {
    return null;
  }
  if (!timingSafeEqual(session, expected)) return null;

  return { id: 'local-admin', name: 'Admin', email: '', role: 'admin', centreSlug: null };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

/** Redirects to login if signed out, or to the dashboard if signed in but
 *  not one of `allowed` — pages call this at the top; actions call it and use
 *  the returned user (it never resolves without one). */
export async function requireRole(allowed: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login' as Route);
  if (!allowed.includes(user.role)) redirect('/admin' as Route);
  return user;
}

export interface LoginState {
  error: string | null;
}

/** `useActionState`'s required shape: `(previousState, formData) => nextState`.
 *  Returning an error here (rather than the old `redirect('/admin/login?error=…')`)
 *  is what lets the login form show it without a full page reload — see
 *  `LoginForm.tsx`. A successful sign-in still `redirect()`s; that's a normal,
 *  supported thing to do inside an action invoked through `useActionState`. */
export async function adminLogin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const limit = await loginLimiter.check(`admin-login:${await loginKey()}`);
  if (!limit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' };
  }

  const password = String(formData.get('password') ?? '');

  if (isDatabaseConfigured()) {
    const email = String(formData.get('email') ?? '').trim();
    const user = email ? await getUserByEmail(email) : undefined;
    // Always run one PBKDF2 verification, even for an unknown email, so response time doesn't reveal
    // which emails have accounts.
    const validPassword = await verifyPassword(password, user ? user.passwordHash : await dummyHash());
    if (!user || user.status !== 'active' || !validPassword) {
      // The audit trail (admin-only) records why; the visitor always sees the same message.
      const why = !user ? 'unknown email' : user.status !== 'active' ? 'account disabled' : 'wrong password';
      void recordAudit(
        { id: user?.id ?? 'anonymous', name: user?.name ?? (email.slice(0, 120) || 'unknown') },
        'auth.login_failed',
        'session',
        user?.id ?? null,
        `Failed sign-in for ${email.slice(0, 120) || 'no email'} (${why})`,
      );
      return { error: 'Incorrect email or password.' };
    }

    await setUserSessionCookie(user.id, user.sessionVersion);
    void touchLastActive(user.id).catch(() => {});
    void recordAudit(user, 'auth.login', 'session', user.id, `${user.name} signed in`);
    redirect('/admin' as Route);
  }

  if (!timingSafeEqual(password, adminPassword())) {
    return { error: 'Incorrect password.' };
  }

  const issuedAt = Date.now();
  const session = await signLegacySession(issuedAt);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, session, { ...SESSION_COOKIE_OPTIONS, secure: process.env.NODE_ENV === 'production' });
  redirect('/admin' as Route);
}

export async function adminLogout(): Promise<void> {
  // Signing out revokes every session cookie the user holds (not just this browser's), so a copied cookie dies too.
  const me = await getCurrentUser();
  if (me && isDatabaseConfigured()) {
    await revokeUserSessions(me.id).catch((e) => console.error('Failed to revoke sessions on logout:', e));
    void recordAudit(me, 'auth.logout', 'session', me.id, `${me.name} signed out`);
  }
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect('/admin/login' as Route);
}

export async function saveCollectionItem(
  collection: CmsCollection,
  idKey: string,
  json: string,
  /** The id this record was loaded under — pass when editing an existing row so
   *  changing the id field renames it instead of forking a duplicate. Omit for
   *  a genuinely new record. */
  previousId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(rolesFor(collection));
  try {
    assertIdKey(collection, idKey);
    if (typeof json !== 'string' || json.length > MAX_RECORD_JSON_CHARS) return { ok: false, error: 'This record is too large to save.' };
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, error: 'The record must be a JSON object.' };
    const record = parsed as Record<string, unknown>;
    if (!record[idKey]) return { ok: false, error: `Missing ${idKey}` };
    if (typeof record[idKey] !== 'string' || !CMS_ID_PATTERN.test(record[idKey] as string)) {
      return { ok: false, error: `${idKey}: use letters, numbers, "-", "_" or "." only (no spaces or slashes).` };
    }
    if (previousId !== undefined && (typeof previousId !== 'string' || !CMS_ID_PATTERN.test(previousId))) {
      return { ok: false, error: 'Invalid previous id.' };
    }
    if (!record.status) record.status = 'published';

    // An optional image the editor left empty ({ url: '', alt: '' }) means "no image", not an invalid one.
    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const v = value as Record<string, unknown>;
        if (v.url === '' && 'alt' in v && Object.keys(v).every((k) => k === 'url' || k === 'alt') && !String(v.alt ?? '').trim()) delete record[key];
      }
    }

    // FAQ answers written in the rich editor: sanitised here, so the public pages can render them as-is.
    const cleanAnswer = (v: unknown) => (typeof v === 'string' && isRichHtml(v) ? sanitizeRichHtml(v) : v);
    if (collection === 'faqs') record.answer = cleanAnswer(record.answer);
    if ((collection === 'courses' || collection === 'centres') && Array.isArray(record.faqs)) {
      record.faqs = (record.faqs as Array<Record<string, unknown>>).map((f) => ({ ...f, answer: cleanAnswer(f.answer) }));
    }

    // Rich article: clean the HTML, and derive the plain structured body from it so search, the chatbot index
    // and anything that reads `body` stay in step with what the article shows.
    if (collection === 'posts') {
      const html = typeof record.bodyHtml === 'string' ? sanitizeRichHtml(record.bodyHtml) : '';
      if (html) {
        record.bodyHtml = html;
        record.body = htmlToBlocks(html);
      } else {
        delete record.bodyHtml;
      }
    }

    // Validated for pass/fail only — the schema isn't a perfectly exhaustive
    // mirror of every field content/types.ts allows, and zod's default `strip`
    // mode would silently drop anything it doesn't recognize. The *original*
    // record is what gets saved.
    const validated = validateCmsRecord(collection, record);
    if (!validated.ok) return { ok: false, error: validated.error };
    const unsafe = findUnsafeContent(record);
    if (unsafe) return { ok: false, error: unsafe };

    await upsertRecord(collection, record, idKey, previousId, user.name);
    await publishContent();
    const recordId = String(record[idKey]);
    void recordAudit(
      user,
      'cms.save',
      collection,
      recordId,
      `${previousId ? 'Updated' : 'Created'} ${collection} "${recordId}"`,
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof DuplicateIdError) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : 'Save failed' };
  }
}

export async function removeCollectionItem(
  collection: CmsCollection,
  idKey: string,
  id: string,
): Promise<void> {
  const user = await requireRole(rolesFor(collection));
  assertIdKey(collection, idKey);
  await deleteRecord(collection, idKey, id, user.name);
  await publishContent();
  void recordAudit(user, 'cms.delete', collection, id, `Deleted ${collection} "${id}"`);
}

export async function seedCmsFromFixtures(): Promise<void> {
  // Admin only: it wipes every collection (including the admin-only legal pages), so an editor must not be able to.
  const user = await requireRole(['admin']);
  await resetCmsStoreFromFixtures();
  await publishContent();
  void recordAudit(user, 'cms.reset_fixtures', 'cms', null, 'Reset all CMS content from fixtures');
}

export async function getAdminCollection(collection: CmsCollection) {
  await requireRole(rolesFor(collection));
  return listCollection(collection);
}

export interface HistoryEntry {
  id: string;
  action: 'save' | 'delete' | 'restore';
  actorName: string;
  createdAt: string;
  /** The record id the entry belongs to — differs from the open record only in the trash list. */
  recordId: string;
}

/** Version history of one record, newest first. Empty without a database (history needs somewhere durable to live). */
export async function getRecordHistory(collection: CmsCollection, recordId: string): Promise<HistoryEntry[]> {
  await requireRole(rolesFor(collection));
  const rows = await listRevisions(collection, recordId);
  return rows.map((r) => ({
    id: r.id,
    action: r.action as HistoryEntry['action'],
    actorName: r.actorName,
    createdAt: r.createdAt.toISOString(),
    recordId: r.recordId,
  }));
}

/** Records deleted from this collection and not currently present — what can be brought back. */
export async function getDeletedRecords(collection: CmsCollection, idKey: string): Promise<HistoryEntry[]> {
  await requireRole(rolesFor(collection));
  assertIdKey(collection, idKey);
  const [deleted, live] = await Promise.all([listDeleted(collection), listCollection(collection)]);
  const liveIds = new Set((live as unknown as Record<string, unknown>[]).map((r) => String(r[idKey])));
  const seen = new Set<string>();
  const out: HistoryEntry[] = [];
  for (const r of deleted) {
    if (liveIds.has(r.recordId) || seen.has(r.recordId)) continue;
    seen.add(r.recordId);
    out.push({
      id: r.id,
      action: 'delete',
      actorName: r.actorName,
      createdAt: r.createdAt.toISOString(),
      recordId: r.recordId,
    });
  }
  return out;
}

/** The record as it was at a revision — loaded into the editor as an unsaved draft, never applied directly. */
export async function getRevisionRecord(
  collection: CmsCollection,
  revisionId: string,
): Promise<{ ok: true; record: Record<string, unknown> } | { ok: false; error: string }> {
  await requireRole(rolesFor(collection));
  const revision = await getRevision(revisionId);
  if (!revision || revision.collection !== collection) return { ok: false, error: 'That version no longer exists.' };
  return { ok: true, record: revision.data };
}

/** Flip one record between Published and Draft without opening it. */
export async function setRecordStatus(
  collection: CmsCollection,
  idKey: string,
  id: string,
  status: 'published' | 'draft',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(rolesFor(collection));
  try {
    assertIdKey(collection, idKey);
    if (status !== 'published' && status !== 'draft') return { ok: false, error: 'Invalid status.' };
    const rows = (await listCollection(collection)) as unknown as Record<string, unknown>[];
    const current = rows.find((r) => r[idKey] === id);
    if (!current) return { ok: false, error: 'Record not found.' };
    await upsertRecord(collection, { ...current, status }, idKey, id, user.name);
    await publishContent();
    void recordAudit(user, 'cms.status', collection, id, `${status === 'published' ? 'Published' : 'Unpublished'} ${collection} "${id}"`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Update failed' };
  }
}
