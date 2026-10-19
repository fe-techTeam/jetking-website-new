import 'server-only';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { otpChallenges } from '@/lib/db/schema';
import { OTP_MAX_ATTEMPTS, OTP_MAX_SENDS_PER_HOUR, OTP_RESEND_SECONDS, OTP_TTL_MS } from './config';
import { codeMatches, hashCode } from './crypto';

/**
 * OTP challenges, in Postgres when `DATABASE_URL` is set (so every instance sees the same attempts and
 * throttles) and in memory otherwise — enough for local development, not for a multi-instance deployment
 * (`service.ts` refuses to run on the memory store in production).
 */

export type IssueResult = { ok: true } | { ok: false; reason: 'resend' | 'limit'; retryAfter: number };

export type CheckResult = 'ok' | 'invalid' | 'expired' | 'locked' | 'none';

interface MemRow {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  consumed: boolean;
  createdAt: number;
}
const memory: MemRow[] = [];

export function usingDatabase(): boolean {
  return Boolean(getDb());
}

/** Stores a new challenge for `phone` unless the number was sent a code too recently or too often. */
export async function createChallenge(phone: string, code: string, now = Date.now()): Promise<IssueResult> {
  const codeHash = hashCode(phone, code);
  const expiresAt = new Date(now + OTP_TTL_MS);
  const db = getDb();

  if (!db) {
    const mine = memory.filter((r) => r.phone === phone);
    const last = mine.reduce((m, r) => Math.max(m, r.createdAt), 0);
    if (last && now - last < OTP_RESEND_SECONDS * 1000) {
      return { ok: false, reason: 'resend', retryAfter: Math.ceil((OTP_RESEND_SECONDS * 1000 - (now - last)) / 1000) };
    }
    if (mine.filter((r) => now - r.createdAt < 3_600_000).length >= OTP_MAX_SENDS_PER_HOUR) {
      return { ok: false, reason: 'limit', retryAfter: 3600 };
    }
    memory.push({ phone, codeHash, expiresAt: expiresAt.getTime(), attempts: 0, consumed: false, createdAt: now });
    return { ok: true };
  }

  const hourAgo = new Date(now - 3_600_000);
  const recent = await db
    .select({ createdAt: otpChallenges.createdAt })
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), gt(otpChallenges.createdAt, hourAgo)))
    .orderBy(desc(otpChallenges.createdAt));
  const last = recent[0]?.createdAt.getTime();
  if (last && now - last < OTP_RESEND_SECONDS * 1000) {
    return { ok: false, reason: 'resend', retryAfter: Math.ceil((OTP_RESEND_SECONDS * 1000 - (now - last)) / 1000) };
  }
  if (recent.length >= OTP_MAX_SENDS_PER_HOUR) return { ok: false, reason: 'limit', retryAfter: 3600 };

  await db.insert(otpChallenges).values({ phone, codeHash, expiresAt });
  return { ok: true };
}

/**
 * Checks `code` against the newest unused challenge for `phone`. Every wrong guess counts against that
 * challenge; once it reaches the limit the code is locked and the visitor must request a new one. A right
 * guess consumes the challenge so it cannot be redeemed twice.
 */
export async function checkChallenge(phone: string, code: string, now = Date.now()): Promise<CheckResult> {
  const db = getDb();

  if (!db) {
    const row = [...memory].reverse().find((r) => r.phone === phone && !r.consumed);
    if (!row) return 'none';
    if (row.expiresAt < now) return 'expired';
    if (row.attempts >= OTP_MAX_ATTEMPTS) return 'locked';
    row.attempts += 1;
    if (!codeMatches(phone, code, row.codeHash)) return 'invalid';
    row.consumed = true;
    return 'ok';
  }

  const [row] = await db
    .select()
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), isNull(otpChallenges.consumedAt)))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);
  if (!row) return 'none';
  if (row.expiresAt.getTime() < now) return 'expired';

  // Count the guess atomically *before* comparing, so parallel requests cannot all slip under the limit.
  const [counted] = await db
    .update(otpChallenges)
    .set({ attempts: sql`${otpChallenges.attempts} + 1` })
    .where(
      and(
        eq(otpChallenges.id, row.id),
        isNull(otpChallenges.consumedAt),
        sql`${otpChallenges.attempts} < ${OTP_MAX_ATTEMPTS}`,
      ),
    )
    .returning({ id: otpChallenges.id });
  if (!counted) return 'locked';
  if (!codeMatches(phone, code, row.codeHash)) return 'invalid';

  const [consumed] = await db
    .update(otpChallenges)
    .set({ consumedAt: new Date(now) })
    .where(and(eq(otpChallenges.id, row.id), isNull(otpChallenges.consumedAt)))
    .returning({ id: otpChallenges.id });
  return consumed ? 'ok' : 'none';
}

/** Test hook. */
export function resetMemoryStore(): void {
  memory.length = 0;
}
