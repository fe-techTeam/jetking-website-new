import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/chatbot/session';
import { createLead, isDatabaseConfigured } from '@/lib/leads/store';
import type { LEAD_PERSONAS, LEAD_SOURCES } from '@/lib/leads/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Enquiry intake.
 *
 * The existing Jetking flow — enquiry → State/Centre routing → counsellor — is
 * PRESERVED, not rebuilt (DEVELOPMENT-PLAN §5.3, risk R6). This handler validates,
 * enriches with persona context, and forwards to the existing CRM endpoint.
 *
 * Until the CRM integration details are supplied, submissions are logged rather than
 * dropped. Losing a lead is the single worst failure this site can have, so the
 * no-CRM path must still succeed from the visitor's perspective and leave a durable
 * server-side record to reconcile.
 *
 * Independently of the CRM forward above, every enquiry is also written to the
 * `leads` table (when `DATABASE_URL` is set) so it shows up in the Admin Panel's
 * Leads board immediately — that board is staff's day-to-day view and must not
 * depend on an external CRM being configured.
 */

/** Every form on the site posts its own free-text label (`'franchise-landing'`,
 *  `'jetking-ai-chat'`, …) so submissions stay distinguishable in logs/CRM. The
 *  leads table only tracks three broad channels — collapse into those for the
 *  `source` column, and keep the original label in the lead's notes. */
function toLeadSource(raw: string): (typeof LEAD_SOURCES)[number] {
  const s = raw.toLowerCase();
  if (s.includes('chat')) return 'chatbot';
  if (s.includes('centre') || s.includes('center')) return 'centre';
  return 'form';
}

function toLeadPersona(persona: string): (typeof LEAD_PERSONAS)[number] | undefined {
  return persona === 'student' || persona === 'parent' || persona === 'professional' || persona === 'franchise'
    ? persona
    : undefined;
}

const EnquirySchema = z.object({
  name: z.string().min(2).max(120),
  phone: z
    .string()
    .min(10)
    .max(20)
    .regex(/^[\d\s+()-]+$/, 'Phone may contain digits and + ( ) - only'),
  email: z.email().max(200).optional().or(z.literal('')),
  city: z.string().max(120).optional(),
  /** State the visitor picked (quick-enquiry modal); the centre below belongs to it. */
  state: z.string().max(120).optional(),
  /** Slug of the centre the visitor picked within their city. */
  centre: z.string().max(120).optional(),
  courseSlug: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  /** Context attached by the client so counsellors see how the lead arrived. */
  persona: z.enum(['student', 'professional', 'parent', 'franchise', 'unknown']).default('unknown'),
  confidence: z.number().min(0).max(1).default(0),
  source: z.string().max(200).default('website'),
  /** Guide conversation summary when the lead came from the AI Guide handoff. */
  guideSummary: z.string().max(4000).optional(),
  guideReason: z.string().max(80).optional(),
  /**
   * Anonymous first-party visitor ID (`JK_…`). CRM should store this so a later
   * mobile/email match can reconnect browsing history to the lead.
   */
  visitorId: z
    .string()
    .regex(/^JK_[A-Za-z0-9]{6,16}$/)
    .optional(),
  /** Journey stage from the adaptive profile (discover → admit). */
  journeyStage: z.enum(['discover', 'explore', 'compare', 'counsel', 'admit']).optional(),
  /** Locked or inferred career/topic intent label. */
  intent: z.string().max(120).optional(),
});

/**
 * Looser than the Guide's limit — a genuine visitor may legitimately submit two or
 * three enquiries (different courses, a correction) — but tight enough that this
 * public endpoint cannot be used to flood counsellors with junk leads.
 */
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5 });

export async function POST(request: Request) {
  const limit = await limiter.check(clientKey(request));

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many enquiries from this connection. Please try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 600) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(body);
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

  // Tie the lead to the signed-in account, if any, so a counsellor can see it is a known user.
  // Best-effort: a lookup failure must never cost the visitor their enquiry.
  const account = await getSessionUser().catch(() => null);

  const enquiry = {
    ...parsed.data,
    accountId: account?.id,
    receivedAt: new Date().toISOString(),
  };

  if (isDatabaseConfigured()) {
    const notesParts = [
      parsed.data.message,
      parsed.data.state ? `State: ${parsed.data.state}` : null,
      parsed.data.centre ? `Centre: ${parsed.data.centre}` : null,
      parsed.data.guideSummary ? `Guide summary: ${parsed.data.guideSummary}` : null,
      `Origin: ${parsed.data.source}`,
    ].filter((part): part is string => Boolean(part));

    try {
      await createLead({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        courseInterest: parsed.data.courseSlug,
        city: parsed.data.city,
        source: toLeadSource(parsed.data.source),
        persona: toLeadPersona(parsed.data.persona),
        notes: notesParts.join('\n') || undefined,
      });
    } catch (error) {
      // Same durability rule as the CRM forward below: a lead already logged via
      // console.warn/console.error must never be lost, and a DB hiccup here must
      // never cost the visitor their enquiry.
      console.error('[enquiry:leads-write-failed]', JSON.stringify(enquiry), error);
    }
  }

  const endpoint = process.env.CRM_ENDPOINT;

  if (!endpoint) {
    // No CRM wired yet. Log with a distinctive marker so these are greppable and
    // reconcilable once the integration lands.
    console.warn('[enquiry:unrouted]', JSON.stringify(enquiry));
    return NextResponse.json({ ok: true, routed: false });
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CRM_API_KEY ? { authorization: `Bearer ${process.env.CRM_API_KEY}` } : {}),
      },
      body: JSON.stringify(enquiry),
      // A hung CRM must still hit the catch below and log — that's the durable
      // record this comment block calls the one thing that must never be lost.
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`CRM returned ${response.status}`);

    return NextResponse.json({ ok: true, routed: true });
  } catch (error) {
    // The visitor must not be told to re-submit — we have their details, and a
    // duplicate submission is worse than a delayed hand-off. Log loudly instead.
    console.error('[enquiry:crm-failed]', JSON.stringify(enquiry), error);
    return NextResponse.json({ ok: true, routed: false });
  }
}
