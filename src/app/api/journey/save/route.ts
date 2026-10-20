import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { leadForLog, safeError } from '@/lib/pii';
import { saveEnquiry } from '@/lib/leads/intake';
import { handoffLeadToCrm } from '@/lib/leads/crm-handoff';
import { UTM_COOKIE, cookieValue, decodeUtm } from '@/lib/utm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Soft lead capture — after recommendations, before counselling.
 * Phone only (name optional). Stored in the admin panel like every other lead,
 * then handed to the CRM when the payload is complete enough for the provider.
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

  const data = parsed.data;
  const name = (data.name && data.name.trim()) || 'Journey visitor';
  const payload = {
    ...data,
    name,
    journeyStage: 'explore' as const,
    receivedAt: new Date().toISOString(),
  };

  let leadId: string | null = null;
  try {
    const saved = await saveEnquiry({
      name,
      phone: data.phone,
      courseSlug: data.selectedCourseSlug,
      persona: data.persona,
      source: data.source,
      visitorId: data.visitorId,
      journeyStage: 'explore',
      intent: data.intent,
      message: data.recommendedSlugs?.length
        ? `Soft save — recommended: ${data.recommendedSlugs.join(', ')}`
        : 'Soft save from student journey',
      utm: decodeUtm(cookieValue(request.headers.get('cookie'), UTM_COOKIE)),
    });
    if (saved?.duplicate) return NextResponse.json({ ok: true, routed: false });
    leadId = saved?.id ?? null;
  } catch (error) {
    console.error('[journey:soft-save:store-failed]', leadForLog(payload), safeError(error));
  }

  const handoff = await handoffLeadToCrm({
    leadId,
    name,
    phone: data.phone,
    raw: payload,
  });

  return NextResponse.json({ ok: true, routed: handoff.routed });
}
