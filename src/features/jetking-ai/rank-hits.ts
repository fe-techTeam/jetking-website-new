import type { WantFlags } from './intent';

/**
 * Extracted out of app/api/chat/route.ts so scripts/eval-conversations.mts
 * can reproduce the exact deterministic KB-fallback text route.ts itself
 * would show (passagesAnswer()) without duplicating the weighting logic.
 * Behaviour unchanged from before the extraction.
 */

export interface SearchHit {
  type: string;
  text: string;
  score: number;
}

export interface RankedHit {
  type: string;
  text: string;
}

/**
 * Re-ranks retrieved chunks by relevance to the detected want* facet, and
 * demotes centre SEO pages so they never lead a non-location answer.
 */
export function rankHits(searchHits: SearchHit[], wants: WantFlags, question = ''): RankedHit[] {
  const wantsFranchise = /franchis|partner|invest|dealership|own centre|open a centre/i.test(question);
  const wantsContact = /contact|phone|call|email|address|reach|whatsapp|corporate|alliance/i.test(question);
  const nonCentre = searchHits.filter((h) => h.type !== 'centre');
  const pool = nonCentre.length === 0 ? searchHits : nonCentre;
  const weight = (t: string, text: string) => {
    // Franchise sales pages share course words ("Best Cloud Computing Courses…") and
    // otherwise outrank the real course page for a learner's question.
    if (!wantsFranchise && /^\s*franchise\b/i.test(text)) return -0.35;
    // Site-chrome sections (footer contact block, corporate/alliance menu) whose page title
    // is a course name — never the answer to a learner's course question.
    if (!wantsContact && /^\s*(contact us|jetking connect|institutional alliance|careers?|login|sign ?in|privacy|terms)\b/i.test(text)) return -0.35;
    // Scraped page chrome: "HELP — Course | … Contact Us Student FAQs Privacy Policy"
    // used to win fees queries at ~70% similarity and get echoed as the answer.
    if (/\bHELP\s*[—–-]/i.test(text) || /\bContact Us\b[\s\S]{0,80}\b(Student FAQs|Privacy Policy|Terms)\b/i.test(text)) {
      return -0.45;
    }
    // Competitor / third-party SEO pages that leaked into the crawl.
    if (
      /\b(craw security|niit|aptech|edureka|simplilearn|coursera|udemy|byju'?s|upgrad|great learning|scaler)\b/i.test(
        text,
      )
    ) {
      return -0.5;
    }
    // Marketing slogans are not verified placement policy.
    if (wants.wantPlacement && /\b100\s*%\s*(job|placement)\b/i.test(text) && t === 'blog') {
      return -0.4;
    }
    // Enrolment T&Cs blobs are not a course catalogue answer.
    if (/^\s*Enrollment Terms and Conditions/i.test(text) && !wants.wantFees) return -0.35;
    if (t === 'centre') return 0;
    if (t === 'home') return -0.1;
    let w = 0;
    if (wants.wantFees) {
      w += t === 'fees' ? 0.18 : t === 'faq' ? 0.14 : t === 'overview' || t === 'course' ? 0.04 : 0;
      // Prefer passages that actually state fee / EMI policy over course SEO pages.
      if (/\b(course fee|fees vary|emi|instal+ment|counsellor.*(fee|confirm)|confirmed by a counsellor)\b/i.test(text)) {
        w += 0.12;
      }
    }
    if (wants.wantEligibility) w += t === 'eligibility' ? 0.14 : 0;
    if (wants.wantCurriculum) w += t === 'curriculum' ? 0.13 : t === 'course' ? 0.05 : 0;
    // A structured placement record beats a keyword-stuffed blog title on
    // authority alone (0.95 vs 0.6) but that gap alone wasn't enough to
    // overcome a short, "100% Placement"-in-the-title blog chunk's raw
    // lexical score — confirmed live. Widened the boost gap rather than
    // relying on authority alone to separate them.
    if (wants.wantPlacement) w += t === 'placement' ? 0.16 : t === 'info' || t === 'blog' ? 0.02 : 0;
    if (wants.wantDuration) w += t === 'duration' ? 0.14 : 0;
    if (wants.wantCourse) w += t === 'course' || t === 'overview' || t === 'curriculum' ? 0.05 : 0;
    if (wants.wantAbout) w += t === 'about' ? 0.14 : 0;
    return w;
  };
  return pool
    .map((h) => ({ h, adj: h.score + weight(h.type, h.text) }))
    .sort((a, b) => b.adj - a.adj)
    .map(({ h }) => ({ type: h.type, text: h.text }));
}

/**
 * formatPassagesAnswer's `max` param: a precise facet (fees/eligibility/
 * duration/curriculum/about) leads with one focused hit; a broader ask
 * composes two.
 */
export function passagesMax(wants: WantFlags): number {
  return wants.wantFees ||
    wants.wantEligibility ||
    wants.wantDuration ||
    wants.wantCurriculum ||
    wants.wantAbout
    ? 1
    : 2;
}
