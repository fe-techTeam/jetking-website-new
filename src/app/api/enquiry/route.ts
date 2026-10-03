import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/chatbot/session';
import { QUALIFICATION_VALUES } from '@/lib/enquiry-fields';
import { UTM_COOKIE, cookieValue, decodeUtm, utmToFlat } from '@/lib/utm';

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
 */

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
  /** Highest qualification: `10+2` or `graduate` (graduate and above). */
  qualification: z.enum(QUALIFICATION_VALUES).optional(),
  courseSlug: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  /** Context attached by the client so counsellors see how the lead arrived. */
  persona: z.enum(['student', 'professional', 'parent', 'franchise', 'unknown']).default('unknown'),
  confidence: z.number().min(0).max(1).default(0),
  source: z.string().max(200).default('website'),
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
  /** Bot trap: a hidden field real visitors never fill (see components/BotTrap). */
  hp: z.string().max(500).optional(),
  /** Milliseconds since the visitor's first interaction on the page; 0/absent for scripted posts. */
  ft: z.number().min(0).max(1e10).optional(),
});

/** Faster than a person can read a form and fill it in. */
const MIN_HUMAN_MS = 600;

/**
 * A post that carries no interaction signal at all (a script, or a visitor who typed before the page
 * finished loading) is still accepted — losing a genuine lead is the worst outcome — but from the same
 * connection only twice per window.
 */
const noSignalLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 2 });

/**
 * Loose enough that a genuine visitor may legitimately submit two or
 * three enquiries (different courses, a correction) — but tight enough that this
 * public endpoint cannot be used to flood counsellors with junk leads.
 */
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5 });

export async function POST(request: Request) {
  // A browser tells us when a request comes from another site's page; the form on our own pages is same-origin.
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = origin && origin !== 'null' ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (fetchSite === 'cross-site' || (originHost && host && originHost !== host)) {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  }

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

  // Bot trap. A filled honeypot, or a post with no (or an impossibly short) human interaction before it,
  // is dropped quietly: the response looks like success so a bot learns nothing, and nothing reaches the CRM.
  const { hp, ft, ...lead } = parsed.data;
  const tooFast = ft !== undefined && ft > 0 && ft < MIN_HUMAN_MS;
  if (hp || tooFast) {
    console.warn('[enquiry:bot-dropped]', JSON.stringify({ reason: hp ? 'honeypot' : 'too-fast', ft: ft ?? null }));
    return NextResponse.json({ ok: true, routed: false });
  }
  if (!ft) {
    const strict = await noSignalLimiter.check(clientKey(request));
    if (!strict.allowed) {
      console.warn('[enquiry:bot-dropped]', JSON.stringify({ reason: 'no-signal-limit' }));
      return NextResponse.json({ ok: true, routed: false });
    }
  }

  // Tie the lead to the signed-in account, if any, so a counsellor can see it is a known user.
  // Best-effort: a lookup failure must never cost the visitor their enquiry.
  const account = await getSessionUser().catch(() => null);

  // Campaign attribution stored by the proxy (utm_source / utm_medium / utm_campaign /
  // utm_content + landing page) rides along on every lead, whichever form sent it.
  const attribution = utmToFlat(decodeUtm(cookieValue(request.headers.get('cookie'), UTM_COOKIE)));

  const enquiry = {
    ...lead,
    ...attribution,
    accountId: account?.id,
    receivedAt: new Date().toISOString(),
  };

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
