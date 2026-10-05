import { UTM_COOKIE, UTM_MAX_AGE, encodeUtm, utmFromParams } from '@/lib/utm';
import { NextResponse, type NextRequest } from 'next/server';
import { classify } from '@/persona/classify';
import {
  COOKIE_MAX_AGE,
  PERSONA_COOKIE,
  decodePersonaCookie,
  encodePersonaCookie,
  payloadToSignals,
} from '@/persona/cookie';
import { VISITOR_COOKIE, VISITOR_MAX_AGE, resolveVisitorId } from '@/persona/visitor';
import { ADAPTIVE_PERSONALISATION } from '@/persona/mode';
import { RULES_VERSION, type FirstTouchInput } from '@/persona/types';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PERSONA CLASSIFICATION AT THE EDGE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * What this proxy DOES:
 *   • mints / refreshes the anonymous jk_visitor_id cookie (same-browser resume)
 *   • reads first-touch signals from the request
 *   • classifies, and writes the signed jk_persona cookie
 *
 * What this proxy MUST NEVER DO — the SEO safety contract (PLAN §2.1):
 *   • rewrite, redirect, or vary the HTML of an indexable route
 *   • serve different content to different visitors server-side
 *
 * Every indexable page renders one canonical, persona-neutral document. Adaptation
 * happens after hydration, client-side, additively. That is what keeps this an
 * adaptive site rather than a cloaking incident.
 *
 * Crawlers are skipped entirely: no cookie, no classification, no Set-Cookie header
 * on the cached document.
 */

const CRAWLER_UA =
  /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|ia_archiver|lighthouse|chrome-lighthouse|gtmetrix|pingdom/i;

function isCrawler(userAgent: string | null): boolean {
  return Boolean(userAgent && CRAWLER_UA.test(userAgent));
}

function hostOf(referrer: string | null, selfHost: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).host;
    return host === selfHost ? undefined : host; // internal navigation is not a referrer signal
  } catch {
    return undefined;
  }
}

/** IST hour without pulling in a date library. */
function istHour(now: Date): number {
  const IST_OFFSET_MINUTES = 5 * 60 + 30;
  return new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000).getUTCHours();
}

/**
 * Geo comes from whatever the host platform provides. Read defensively from the
 * common header names so the hosting decision stays open — absence is fine,
 * geo is a weak supporting signal only.
 */
function readGeo(req: NextRequest): { city?: string; region?: string } {
  const h = req.headers;
  const city = h.get('x-vercel-ip-city') ?? h.get('cf-ipcity') ?? h.get('x-geo-city') ?? undefined;
  const region =
    h.get('x-vercel-ip-country-region') ?? h.get('cf-region') ?? h.get('x-geo-region') ?? undefined;
  return {
    city: city ? decodeURIComponent(city) : undefined,
    region: region ?? undefined,
  };
}

function setVisitorCookie(response: NextResponse, req: NextRequest): void {
  const { id } = resolveVisitorId(req.cookies.get(VISITOR_COOKIE)?.value);
  response.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: false, // client resume UI + enquiry linking read this
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VISITOR_MAX_AGE,
  });
}

export async function proxy(req: NextRequest) {
  const response = NextResponse.next();

  if (isCrawler(req.headers.get('user-agent'))) return response;

  // Always refresh the anonymous visitor ID — independent of persona reclassification.
  setVisitorCookie(response, req);

  const url = req.nextUrl;
  const params = url.searchParams;
  const geo = readGeo(req);
  const now = new Date();

  // Campaign attribution: remember utm_source / medium / campaign / content for the lead forms
  // and analytics (see src/lib/utm.ts). Only overwritten when new UTM parameters arrive.
  const utm = utmFromParams(params, url.pathname);
  if (utm) {
    response.cookies.set(UTM_COOKIE, encodeUtm(utm), {
      httpOnly: false, // read back by track() in the browser
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: UTM_MAX_AGE,
    });
  }

  // Explicit personalisation (the default): no first-touch classification and no persona cookie. A cookie
  // left by an earlier adaptive deploy is removed so it can't keep steering anyone.
  if (!ADAPTIVE_PERSONALISATION) {
    if (req.cookies.get(PERSONA_COOKIE)) {
      response.cookies.set(PERSONA_COOKIE, '', { path: '/', maxAge: 0 });
    }
    return response;
  }

  const firstTouch: FirstTouchInput = {
    path: url.pathname,
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    gclid: params.get('gclid') ?? undefined,
    referrerHost: hostOf(req.headers.get('referer'), url.host),
    geoCity: geo.city,
    geoRegion: geo.region,
    isMobile: /mobile|android|iphone|ipad/i.test(req.headers.get('user-agent') ?? ''),
    hourIst: istHour(now),
  };

  const decoded = await decodePersonaCookie(req.cookies.get(PERSONA_COOKIE)?.value);
  // A rules deploy bumps RULES_VERSION; a cookie signed under an older version
  // carries signal weights/logic that no longer match `rules.ts` and must not be
  // reused as-is, or a returning visitor keeps stale classification for up to 30
  // days regardless of how the rules changed.
  const existing = decoded && decoded.v === RULES_VERSION ? decoded : null;
  const priorSignals = existing ? payloadToSignals(existing) : [];

  // Re-classify when there is new attribution (UTM, gclid, or external referrer).
  const hasNewAttribution = Boolean(
    firstTouch.utmCampaign ??
      firstTouch.utmSource ??
      firstTouch.utmMedium ??
      firstTouch.gclid ??
      firstTouch.referrerHost,
  );
  if (existing && !hasNewAttribution) return response;

  const classification = classify({
    firstTouch,
    priorSignals,
    priorChannel: existing?.ch,
    now,
  });

  response.cookies.set(PERSONA_COOKIE, await encodePersonaCookie(classification), {
    httpOnly: false, // the client engine reads this to seed its context
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, image optimisation, and API routes.
     * API routes are excluded because they never need classification at the edge —
     * they read the cookie directly when they need it.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?)$).*)',
  ],
};
