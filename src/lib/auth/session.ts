import 'server-only';
import { cookies } from 'next/headers';

/**
 * Admin session cookies (multi-user mode).
 *
 * Cookie value: `{userId}.{issuedAt}.{version}.{signature}`, HMAC-SHA256 over the first three parts with
 * `ADMIN_SESSION_SECRET`. `version` is the user's `session_version`: it is re-checked against the database on
 * every request, and bumping it (sign-out, password change/reset) invalidates every cookie issued before —
 * the cookie alone is otherwise a bearer token for 12 hours.
 */

export const ADMIN_COOKIE = 'jk_admin_session';
/** Matches the cookie's own maxAge — both must agree or a still-fresh cookie could be rejected early or a stale one accepted late. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/** Signs multi-user session cookies — independent of any user's password, and rotating it revokes every session at once. */
export function sessionSecret(): string {
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

export async function hmacSign(key: string, message: string): Promise<string> {
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
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signMultiUserSession(userId: string, issuedAt: number, version: number): Promise<string> {
  const payload = `${userId}.${issuedAt}.${version}`;
  return `${payload}.${await hmacSign(sessionSecret(), payload)}`;
}

export interface VerifiedSession {
  userId: string;
  version: number;
}

/** Checks shape, expiry and signature; the caller still compares `version` with the database. */
export async function verifyMultiUserSession(cookie: string): Promise<VerifiedSession | null> {
  const parts = cookie.split('.');
  if (parts.length !== 4) return null;
  const [userId, issuedAtRaw, versionRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  const version = Number(versionRaw);
  if (!userId || !signature || !Number.isFinite(issuedAt) || !Number.isInteger(version) || version < 0) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  let expected: string;
  try {
    expected = await hmacSign(sessionSecret(), `${userId}.${issuedAt}.${version}`);
  } catch {
    return null;
  }
  return timingSafeEqual(signature, expected) ? { userId, version } : null;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Sets a fresh session cookie for the user at their current session version. */
export async function setUserSessionCookie(userId: string, version: number): Promise<void> {
  const session = await signMultiUserSession(userId, Date.now(), version);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, session, { ...SESSION_COOKIE_OPTIONS, secure: process.env.NODE_ENV === 'production' });
}
