import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getUserById } from './store';
import type { SiteUser } from './types';

/**
 * Signed session cookie for the website's own accounts. The cookie carries only a
 * user id and an issue time; the signature stops it being forged, and every request
 * re-reads the user row, so deleting an account ends its sessions immediately.
 * Separate cookie name and secret from both the admin panel's and /chatbot's, so
 * none of the three can be replayed against another.
 */

const COOKIE = 'jk_user_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const value = process.env.USER_SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('USER_SESSION_SECRET must be set in production.');
    }
    return 'dev-only-insecure-user-session-secret';
  }
  return value;
}

function sign(message: string): string {
  return createHmac('sha256', secret()).update(message).digest('base64url');
}

function createToken(userId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = `${userId}.${issuedAt}`;
  return `${body}.${sign(body)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, issuedAtRaw, signature] = parts as [string, string, string];

  const expected = Buffer.from(sign(`${userId}.${issuedAtRaw}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return null;
  if (Math.floor(Date.now() / 1000) - issuedAt > MAX_AGE_SECONDS) return null;
  return userId;
}

/**
 * A second, script-readable cookie that only says "a session probably exists". It
 * carries no identity and grants nothing — its one job is to let the client skip the
 * "who am I" request entirely for anonymous visitors. The real cookie above stays
 * httpOnly and is the only thing the server trusts. Name is mirrored in
 * `use-site-account.ts`.
 */
const HINT_COOKIE = 'jk_user_hint';

export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  store.set(COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  store.set(HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(HINT_COOKIE);
}

/** Drops a stale hint (session expired, or the account was deleted) so the client stops asking. */
export async function clearSessionHint(): Promise<void> {
  const store = await cookies();
  if (store.has(HINT_COOKIE)) store.delete(HINT_COOKIE);
}

/** The signed-in website user, or `null` for a guest (or a stale/forged cookie). */
export async function getSessionUser(): Promise<SiteUser | null> {
  const store = await cookies();
  const userId = readToken(store.get(COOKIE)?.value);
  if (!userId) return null;
  const user = await getUserById(userId);
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        state: user.state ?? null,
        city: user.city ?? null,
        centre: user.centre ?? null,
      }
    : null;
}
