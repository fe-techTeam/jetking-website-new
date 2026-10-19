import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { isCrossSite } from '@/lib/request-guard';
import { sendOtp } from '@/lib/otp/service';
import { maskMobile } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send a one-time code to a mobile number (step 1 of verifying it on a form).
 *
 * Throttled three ways: per connection here, per number inside `createChallenge` (one code per 30 s, five an
 * hour) — so neither a script nor one visitor can run up SMS cost or text a stranger repeatedly.
 */
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 8 });

const Body = z.object({ phone: z.string().min(10).max(20) });

export async function POST(request: Request) {
  if (isCrossSite(request)) return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again shortly.' },
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
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });

  const result = await sendOtp(parsed.data.phone);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, retryAfter: result.retryAfter },
      { status: result.status, headers: result.retryAfter ? { 'retry-after': String(result.retryAfter) } : undefined },
    );
  }
  return NextResponse.json({
    ok: true,
    maskedPhone: maskMobile(result.phone),
    resendIn: result.resendIn,
    // Only ever present in local development with OTP_DEV_ECHO=true and no SMS gateway.
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
