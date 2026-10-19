import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { isCrossSite } from '@/lib/request-guard';
import { verifyOtp } from '@/lib/otp/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Check the code the visitor typed (step 2). On success the response carries a short-lived signed token that
 * proves this number was verified; the form sends it with the enquiry. Wrong guesses are also capped per code
 * inside `checkChallenge`, so the per-connection limit here is only a broad backstop.
 */
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 30 });

const Body = z.object({ phone: z.string().min(10).max(20), code: z.string().min(6).max(12) });

export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 600) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Enter the 6-digit code.' }, { status: 400 });

  const result = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, token: result.token });
}
