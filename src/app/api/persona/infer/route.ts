import { NextResponse } from 'next/server';
import { z } from 'zod';
import { inferPersonaWithModel } from '@/persona/infer';
import { PERSONA_IDS } from '@/persona/types';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { ADAPTIVE_PERSONALISATION } from '@/persona/mode';

const BodySchema = z.object({
  signals: z
    .array(
      z.object({
        id: z.string(),
        persona: z.enum(PERSONA_IDS),
        weight: z.number(),
        detail: z.string(),
      }),
    )
    .max(40),
  behaviour: z.object({
    courseViews: z.array(z.string()).max(40),
    levelViews: z.array(z.string()).max(40),
    feeDepthViews: z.number(),
    centreViews: z.number(),
    franchiseViews: z.number(),
    categoryViews: z.array(z.string()).max(40),
    visitCount: z.number(),
    interests: z.array(z.string()).max(40),
  }),
  acquisitionChannel: z
    .enum(['organic_search', 'paid_search', 'social', 'campaign', 'referral', 'direct'])
    .optional(),
  path: z.string().max(200).optional(),
});

/** Calls OpenAI when configured — unbounded requests translate directly into unbounded billing. */
const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/**
 * Silent persona inference — no PII. Called from the client after browsing signals accumulate.
 */
export async function POST(req: Request) {
  // Inference is off unless adaptive mode is enabled — answer neutrally without reading the body or calling a model.
  if (!ADAPTIVE_PERSONALISATION) {
    return NextResponse.json({ persona: 'unknown', confidence: 0, reason: 'Adaptive personalisation is off.' });
  }
  const limit = await limiter.check(clientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 60) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const result = await inferPersonaWithModel(parsed.data);
  return NextResponse.json(result);
}
