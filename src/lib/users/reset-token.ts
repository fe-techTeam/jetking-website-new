import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless "reset your password" links for website visitors. A token is
 * `userId.expiresAt.fingerprint.signature`:
 *  - signed with the user-session secret (domain-separated, so it can never double as a session cookie);
 *  - expires after `RESET_TTL_MINUTES`;
 *  - carries a fingerprint of the CURRENT password hash, so it stops working the moment the password changes —
 *    i.e. each link is single-use without needing a table to track it.
 */

export const RESET_TTL_MINUTES = 30;

function secret(): string {
  const value = process.env.USER_SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production') throw new Error('USER_SESSION_SECRET must be set in production.');
    return 'dev-only-insecure-user-session-secret';
  }
  return value;
}

const sign = (message: string): string => createHmac('sha256', secret()).update(`pwreset:${message}`).digest('base64url');
const fingerprint = (passwordHash: string): string => createHash('sha256').update(passwordHash).digest('base64url').slice(0, 16);

export function createResetToken(user: { id: string; passwordHash: string }, now = Date.now()): string {
  const expires = Math.floor(now / 1000) + RESET_TTL_MINUTES * 60;
  const body = `${user.id}.${expires}.${fingerprint(user.passwordHash)}`;
  return `${body}.${sign(body)}`;
}

/** Splits and authenticates a token; the caller still checks the fingerprint against the user's current hash. */
export function readResetToken(token: string, now = Date.now()): { userId: string; fingerprint: string } | null {
  if (typeof token !== 'string' || token.length > 400) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [userId, expiresRaw, fp, signature] = parts as [string, string, string, string];

  const expected = Buffer.from(sign(`${userId}.${expiresRaw}.${fp}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Math.floor(now / 1000) > expires) return null;
  return { userId, fingerprint: fp };
}

/** True when the token was issued for this exact password (so it has not been used or superseded). */
export function fingerprintMatches(passwordHash: string, tokenFingerprint: string): boolean {
  const a = Buffer.from(fingerprint(passwordHash));
  const b = Buffer.from(tokenFingerprint);
  return a.length === b.length && timingSafeEqual(a, b);
}
