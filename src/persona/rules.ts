import type { BehaviourInput, FirstTouchInput, KnownPersonaId, SignalHit } from './types';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * THE RULEBOOK
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This file is the entire adaptive intelligence of the site. It is deliberately
 * plain, readable, and reviewable by a non-engineer — the proposal promises the
 * client a system that is "fully editable by your team, transparent, no lock-in",
 * and that promise has to be literally true at the level of this file.
 *
 * Rules of engagement:
 *   • Every rule is additive. Nothing subtracts, so no rule can silently suppress
 *     another. Debugging is reading the signal trail top to bottom.
 *   • Weights are on a 0–1 scale, roughly "how much does this one fact tell us".
 *   • First-touch signals are cheap and available at the edge on request #1.
 *   • Behavioural signals are stronger but only exist after the visitor acts.
 *   • Changing anything here requires bumping RULES_VERSION in types.ts.
 *
 * Weight guidance:
 *   0.9–1.0  near-certain (visitor is literally on the franchise enquiry page)
 *   0.6–0.8  strong (campaign explicitly targeted at this persona)
 *   0.3–0.5  moderate (referrer platform skew)
 *   0.1–0.2  weak, supporting only (device, time of day)
 */

type FirstTouchRule = {
  id: string;
  persona: KnownPersonaId;
  weight: number;
  detail: string;
  match: (input: FirstTouchInput) => boolean;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Campaign → persona map                                                     */
/* Marketing owns this table. Adding a campaign is a one-line change.         */
/* ────────────────────────────────────────────────────────────────────────── */

const CAMPAIGN_PERSONA_MAP: Record<string, KnownPersonaId> = {
  'after-12th': 'student',
  'bca-degree': 'student',
  'career-start': 'student',
  upskill: 'professional',
  'career-switch': 'professional',
  'working-pro': 'professional',
  'parent-trust': 'parent',
  placements: 'parent',
  franchise: 'franchise',
  'business-opportunity': 'franchise',
};

/** Referrer hosts with a reliable audience skew. */
const REFERRER_PERSONA_MAP: Array<{ match: RegExp; persona: KnownPersonaId; weight: number; label: string }> = [
  { match: /linkedin\./i, persona: 'professional', weight: 0.5, label: 'LinkedIn' },
  { match: /naukri\.|indeed\.|shine\./i, persona: 'professional', weight: 0.55, label: 'a job portal' },
  { match: /instagram\.|snapchat\./i, persona: 'student', weight: 0.4, label: 'Instagram or Snapchat' },
  { match: /youtube\./i, persona: 'student', weight: 0.25, label: 'YouTube' },
  { match: /facebook\./i, persona: 'parent', weight: 0.25, label: 'Facebook' },
  { match: /franchise|business/i, persona: 'franchise', weight: 0.5, label: 'a franchise or business site' },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* First-touch rules                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const FIRST_TOUCH_RULES: FirstTouchRule[] = [
  // ── Landing path: the strongest first-touch signal available ──────────────
  {
    id: 'path:franchise',
    persona: 'franchise',
    weight: 0.95,
    detail: 'Landed directly on the franchise section',
    match: (i) => i.path.startsWith('/franchise'),
  },
  {
    id: 'path:degree',
    persona: 'student',
    weight: 0.7,
    detail: 'Landed on a degree programme page',
    match: (i) => /\/courses\/(bca|degree)/.test(i.path),
  },
  {
    id: 'path:parent',
    persona: 'parent',
    weight: 0.85,
    detail: 'Landed on the parent path page',
    match: (i) => i.path.startsWith('/parent'),
  },
  {
    id: 'path:placements',
    persona: 'parent',
    weight: 0.5,
    detail: 'Landed on placement or outcomes content',
    match: (i) => i.path.startsWith('/placements'),
  },
  {
    id: 'path:centre',
    persona: 'parent',
    weight: 0.3,
    detail: 'Landed on a centre page — typically a location-led, in-person decision',
    match: (i) => i.path.startsWith('/centres'),
  },

  // ── Campaign attribution ─────────────────────────────────────────────────
  {
    id: 'campaign:mapped',
    persona: 'student', // overridden at evaluation time by the map lookup
    weight: 0.75,
    detail: 'Arrived from a campaign mapped to this persona',
    match: (i) => Boolean(i.utmCampaign && lookupCampaign(i.utmCampaign)),
  },

  // ── Referrer ─────────────────────────────────────────────────────────────
  {
    id: 'referrer:mapped',
    persona: 'professional',
    weight: 0.5,
    detail: 'Arrived from a platform with a known audience skew',
    match: (i) => Boolean(i.referrerHost && lookupReferrer(i.referrerHost)),
  },
  // Organic search (google/bing/… without gclid/cpc) is detected in channel.ts
  // and stored on Classification.acquisitionChannel — it does not force a persona
  // on its own. CMS rules can match field `channel` = organic_search.

  // ── Weak supporting signals ──────────────────────────────────────────────
  {
    id: 'time:working-hours',
    persona: 'professional',
    weight: 0.12,
    detail: 'Visiting during working hours on a weekday',
    match: (i) => i.hourIst !== undefined && i.hourIst >= 10 && i.hourIst <= 18,
  },
  {
    id: 'time:late-evening',
    persona: 'student',
    weight: 0.1,
    detail: 'Visiting late evening',
    match: (i) => i.hourIst !== undefined && (i.hourIst >= 22 || i.hourIst <= 1),
  },
  {
    id: 'device:desktop',
    persona: 'professional',
    weight: 0.1,
    detail: 'Browsing on desktop',
    match: (i) => !i.isMobile,
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Lookups                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function lookupCampaign(campaign: string): KnownPersonaId | null {
  const key = campaign.toLowerCase().trim();
  const direct = CAMPAIGN_PERSONA_MAP[key];
  if (direct) return direct;
  // Substring fallback so `summer-after-12th-2026` still matches `after-12th`.
  for (const [needle, persona] of Object.entries(CAMPAIGN_PERSONA_MAP)) {
    if (key.includes(needle)) return persona;
  }
  return null;
}

function lookupReferrer(host: string): { persona: KnownPersonaId; weight: number; label: string } | null {
  for (const entry of REFERRER_PERSONA_MAP) {
    if (entry.match.test(host)) {
      return { persona: entry.persona, weight: entry.weight, label: entry.label };
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* First-touch evaluation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export function evaluateFirstTouch(input: FirstTouchInput): SignalHit[] {
  const hits: SignalHit[] = [];

  for (const rule of FIRST_TOUCH_RULES) {
    if (!rule.match(input)) continue;

    // Two rules resolve their persona dynamically rather than statically.
    if (rule.id === 'campaign:mapped') {
      const persona = input.utmCampaign ? lookupCampaign(input.utmCampaign) : null;
      if (!persona) continue;
      hits.push({
        id: `campaign:${input.utmCampaign}`,
        persona,
        weight: rule.weight,
        detail: `Arrived from the "${input.utmCampaign}" campaign`,
        source: 'first-touch',
      });
      continue;
    }

    if (rule.id === 'referrer:mapped') {
      const ref = input.referrerHost ? lookupReferrer(input.referrerHost) : null;
      if (!ref) continue;
      hits.push({
        id: `referrer:${input.referrerHost}`,
        persona: ref.persona,
        weight: ref.weight,
        detail: `Arrived from ${ref.label}`,
        source: 'first-touch',
      });
      continue;
    }

    hits.push({
      id: rule.id,
      persona: rule.persona,
      weight: rule.weight,
      detail: rule.detail,
      source: 'first-touch',
    });
  }

  return hits;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Behavioural evaluation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Behaviour is scored with diminishing returns: the second view of a fee page is
 * informative, the ninth is not. `saturate` keeps a single obsessive visitor from
 * pinning confidence at 1.0 on one weak signal.
 */
function saturate(count: number, perUnit: number, cap: number): number {
  return Math.min(count * perUnit, cap);
}

export function evaluateBehaviour(b: BehaviourInput): SignalHit[] {
  const hits: SignalHit[] = [];

  // ── Degree-level browsing → school-leaver ────────────────────────────────
  const degreeViews = b.levelViews.filter((l) => l === 'degree').length;
  if (degreeViews > 0) {
    hits.push({
      id: 'behaviour:degree-views',
      persona: 'student',
      weight: saturate(degreeViews, 0.3, 0.7),
      detail: `Viewed ${degreeViews} degree programme${degreeViews > 1 ? 's' : ''}`,
      source: 'behaviour',
    });
  }

  // ── Short/certification browsing → upskiller ─────────────────────────────
  const shortViews = b.levelViews.filter((l) => l === 'certification' || l === 'short').length;
  if (shortViews > 0) {
    hits.push({
      id: 'behaviour:short-course-views',
      persona: 'professional',
      weight: saturate(shortViews, 0.25, 0.6),
      detail: `Viewed ${shortViews} short or certification programme${shortViews > 1 ? 's' : ''}`,
      source: 'behaviour',
    });
  }

  // ── Fee/EMI depth → the person paying ────────────────────────────────────
  if (b.feeDepthViews > 0) {
    hits.push({
      id: 'behaviour:fee-depth',
      persona: 'parent',
      weight: saturate(b.feeDepthViews, 0.28, 0.65),
      detail: `Read fee or EMI content in depth ${b.feeDepthViews} time${b.feeDepthViews > 1 ? 's' : ''}`,
      source: 'behaviour',
    });
  }

  // ── Centre-locator use → local, in-person decision ───────────────────────
  if (b.centreViews > 0) {
    hits.push({
      id: 'behaviour:centre-interest',
      persona: 'parent',
      weight: saturate(b.centreViews, 0.15, 0.35),
      detail: `Looked at ${b.centreViews} centre page${b.centreViews > 1 ? 's' : ''}`,
      source: 'behaviour',
    });
  }

  // ── Franchise engagement → near-certain ──────────────────────────────────
  if (b.franchiseViews > 0) {
    hits.push({
      id: 'behaviour:franchise-interest',
      persona: 'franchise',
      weight: saturate(b.franchiseViews, 0.5, 0.9),
      detail: `Engaged with franchise content ${b.franchiseViews} time${b.franchiseViews > 1 ? 's' : ''}`,
      source: 'behaviour',
    });
  }

  // ── Editorial category affinity ──────────────────────────────────────────
  const categoryPersona: Record<string, KnownPersonaId> = {
    'For Parents': 'parent',
    Careers: 'student',
    Industry: 'professional',
    Franchise: 'franchise',
    'Course Guidance': 'student',
  };
  const categoryCounts = new Map<KnownPersonaId, number>();
  for (const cat of b.categoryViews) {
    const persona = categoryPersona[cat];
    if (persona) categoryCounts.set(persona, (categoryCounts.get(persona) ?? 0) + 1);
  }
  for (const [persona, count] of categoryCounts) {
    hits.push({
      id: `behaviour:category-${persona}`,
      persona,
      weight: saturate(count, 0.18, 0.45),
      detail: `Read ${count} article${count > 1 ? 's' : ''} in categories this persona favours`,
      source: 'behaviour',
    });
  }

  // Returning visitor is used by CMS rules (returning=true) and return-visit UI.
  // It is deliberately not a directional persona signal on its own.

  return hits;
}
