import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { leadForLog, safeError } from '@/lib/pii';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Soft lead capture — after recommendations, before counselling.
 * Phone only (name optional). Links anonymous visitor ID for CRM merge later.
 */

const SaveSchema = z.object({
  phone: z
    .string()
    .min(10)
    .max(20)
    .regex(/^[\d\s+()-]+$/, 'Phone may contain digits and + ( ) - only'),
  name: z.string().min(2).max(120).optional().or(z.literal('')),
  visitorId: z
    .string()
    .regex(/^JK_[A-Za-z0-9]{6,16}$/)
    .optional(),
  persona: z.enum(['student', 'professional', 'parent', 'franchise', 'unknown']).default('student'),
  intent: z.string().max(120).optional(),
  education: z.string().max(40).optional(),
  recommendedSlugs: z.array(z.string().max(120)).max(8).optional(),
  selectedCourseSlug: z.string().max(120).optional(),
  source: z.string().max(200).default('student-journey-soft-save'),
});

const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 8 });

export async function POST(request: Request) {
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
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Please check the form and try again.',
        fields: parsed.error.issues.map((i) => i.path.join('.')),
      },
      { status: 400 },
    );
  }

  const payload = {
    ...parsed.data,
    journeyStage: 'explore',
    receivedAt: new Date().toISOString(),
  };

  const endpoint = process.env.CRM_ENDPOINT;

  if (!endpoint) {
    console.warn('[journey:soft-save:unrouted]', leadForLog(payload));
    return NextResponse.json({ ok: true, routed: false });
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CRM_API_KEY ? { authorization: `Bearer ${process.env.CRM_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`CRM returned ${response.status}`);
    return NextResponse.json({ ok: true, routed: true });
  } catch (error) {
    console.error('[journey:soft-save:crm-failed]', leadForLog(payload), safeError(error));
    return NextResponse.json({ ok: true, routed: false });
  }
}
