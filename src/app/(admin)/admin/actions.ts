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
import { CMS_COLLECTIONS, validateCmsRecord } from '@/lib/cms/schemas';
import { isDatabaseConfigured, getUserByEmail, getUserById, touchLastActive, type Role } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';
import { recordAudit } from '@/lib/audit/log';

/** `CmsCollection` is compile-time only — a raw call to this action (bypassing the
 *  generated client stub) could otherwise pass any string through to the store. */
function assertKnownCollection(collection: CmsCollection): void {
  if (!CMS_COLLECTIONS.includes(collection)) {
    throw new Error(`Unknown collection "${collection}".`);
  }
}

const ADMIN_COOKIE = 'jk_admin_session';
/** Matches the cookie's own maxAge below — both must agree or a still-fresh cookie
 *  could be rejected early, or a stale one accepted late. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  centreSlug: string | null;
}

/** The pre-multi-user single shared password, used only when `DATABASE_URL`
 *  is unset — see the module doc below `signMultiUserSession`. */
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

/** Signs multi-user session cookies — independent of any user's password, so
 *  resetting one person's password doesn't invalidate everyone else's session,
 *  and rotating it revokes every session at once (same property the legacy
 *  scheme got for free from `ADMIN_PASSWORD` doubling as its signing key). */
function sessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET must be set in production.');
    }
    return 'dev-only-insecure-session-secret';
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

/** Constant-time comparison — a fast-exit compare here leaks signature/password bytes. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signLegacySession(issuedAt: number): Promise<string> {
  return `${issuedAt}.${await hmacSign(adminPassword(), String(issuedAt))}`;
}

async function signMultiUserSession(userId: string, issuedAt: number): Promise<string> {
  return `${userId}.${issuedAt}.${await hmacSign(sessionSecret(), `${userId}.${issuedAt}`)}`;
}

/** Best-effort client identity for the login rate limiter (no Request object in a server action). */
async function loginKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return (
    forwarded?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? 'anonymous'
  );
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
    const parts = session.split('.');
    if (parts.length !== 3) return null;
    const [userId, issuedAtRaw, signature] = parts;
    const issuedAt = Number(issuedAtRaw);
    if (!userId || !signature || !Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

    let expected: string;
    try {
      expected = await hmacSign(sessionSecret(), `${userId}.${issuedAt}`);
    } catch {
      return null;
    }
    if (!timingSafeEqual(signature, expected)) return null;

    const user = await getUserById(userId);
    if (!user || user.status !== 'active') return null;
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
    const validPassword = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || user.status !== 'active' || !validPassword) {
      return { error: 'Incorrect email or password.' };
    }

    const issuedAt = Date.now();
    const session = await signMultiUserSession(user.id, issuedAt);
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    void touchLastActive(user.id);
    redirect('/admin' as Route);
  }

  if (!timingSafeEqual(password, adminPassword())) {
    return { error: 'Incorrect password.' };
  }

  const issuedAt = Date.now();
  const session = await signLegacySession(issuedAt);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect('/admin' as Route);
}

export async function adminLogout(): Promise<void> {
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
  const user = await requireRole(['admin', 'editor']);
  assertKnownCollection(collection);
  try {
    const record = JSON.parse(json) as Record<string, unknown>;
    if (!record[idKey]) return { ok: false, error: `Missing ${idKey}` };
    if (!record.status) record.status = 'published';

    // Validated for pass/fail only — the schema isn't a perfectly exhaustive
    // mirror of every field content/types.ts allows, and zod's default `strip`
    // mode would silently drop anything it doesn't recognize. The *original*
    // record is what gets saved.
    const validated = validateCmsRecord(collection, record);
    if (!validated.ok) return { ok: false, error: validated.error };

    await upsertRecord(collection, record, idKey, previousId);
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
  const user = await requireRole(['admin', 'editor']);
  assertKnownCollection(collection);
  await deleteRecord(collection, idKey, id);
  await publishContent();
  void recordAudit(user, 'cms.delete', collection, id, `Deleted ${collection} "${id}"`);
}

export async function seedCmsFromFixtures(): Promise<void> {
  const user = await requireRole(['admin', 'editor']);
  await resetCmsStoreFromFixtures();
  await publishContent();
  void recordAudit(user, 'cms.reset_fixtures', 'cms', null, 'Reset all CMS content from fixtures');
}

export async function getAdminCollection(collection: CmsCollection) {
  await requireRole(['admin', 'editor']);
  assertKnownCollection(collection);
  return listCollection(collection);
}
