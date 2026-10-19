import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { OTP_CODE_LENGTH, OTP_TOKEN_TTL_MS } from './config';

/**
 * Keyed hashing for OTP codes and the signed "this number is verified" token.
 *
 * A 6-digit code has only a million values, so a plain hash would be reversible from a leaked row; the
 * HMAC key (`OTP_SECRET`, server-only) is what makes the stored hash useless on its own.
 */
function secret(): string {
  const value = process.env.OTP_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === 'production') throw new Error('OTP_SECRET must be set in production.');
  return 'dev-only-insecure-otp-secret';
}

function hmac(message: string): string {
  return createHmac('sha256', secret()).update(message).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A cryptographically random numeric code, zero-padded. */
export function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_CODE_LENGTH)).padStart(OTP_CODE_LENGTH, '0');
}

/** The value stored in place of the code. Bound to the phone so a row cannot be replayed for another number. */
export function hashCode(phone: string, code: string): string {
  return hmac(`code:${phone}:${code}`);
}

export function codeMatches(phone: string, code: string, storedHash: string): boolean {
  return safeEqual(hashCode(phone, code), storedHash);
}

/** Proof, handed to the form after a successful check, that this browser verified this number. */
export function issueVerifiedToken(phone: string, now = Date.now()): string {
  const exp = now + OTP_TOKEN_TTL_MS;
  return `${exp}.${hmac(`verified:${phone}:${exp}`)}`;
}

export function verifyVerifiedToken(token: unknown, phone: string, now = Date.now()): boolean {
  if (typeof token !== 'string') return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!sig || !Number.isFinite(exp) || exp < now) return false;
  return safeEqual(sig, hmac(`verified:${phone}:${exp}`));
}
