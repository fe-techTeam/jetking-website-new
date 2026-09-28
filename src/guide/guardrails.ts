import type { Course } from '@/lib/content/types';
import type { GuideOutcome, HandoffReason, RetrievedChunk } from './types';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * GUARDRAILS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * The proposal's central commercial promise is that this assistant cannot quote a
 * wrong fee or invent a course. Prompting alone does not deliver that — a system
 * prompt is a request, not a constraint. So the enforcement is code, on both sides
 * of the model call:
 *
 *   PRE   scope gate, fee interception, unsafe-topic gate
 *   POST  numeric verification, entity verification, banned-claim scan
 *
 * A refusal that hands off to a counsellor is a SUCCESS path. It is measured as a
 * conversion, not an error (DEVELOPMENT-PLAN §5.2).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Pre-generation                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const FEE_PATTERNS = [
  /\bfee[s]?\b/i,
  /\bcost[s]?\b/i,
  /\bprice\b/i,
  /\bcharges?\b/i,
  /\bemi\b/i,
  /\binstal?ment/i,
  /\bhow much\b/i,
  /\bafford/i,
  /\bscholarship/i,
  /\bdiscount/i,
  /₹|\brupees?\b|\binr\b/i,
];

/**
 * Claims we will not make in any form, because they are legally and ethically
 * fraught and because Jetking cannot guarantee them for an individual learner.
 */
const GUARANTEE_PATTERNS = [
  /\bguarantee/i,
  /\b100%\s*(placement|job)/i,
  /\bassured\s*(placement|job|salary)/i,
  /\bwill i get a job\b/i,
  /\bpromise/i,
];

const SALARY_PATTERNS = [/\bsalary\b/i, /\bpackage\b/i, /\blpa\b/i, /\bctc\b/i, /\bhow much will i earn\b/i];

/** Prompt-injection and jailbreak markers. */
const INJECTION_PATTERNS = [
  /ignore (all |your |the )?(previous|prior|above) instructions/i,
  /disregard (all |your |the )?(previous|prior|above)/i,
  /you are now\b/i,
  /\bsystem prompt\b/i,
  /\bdeveloper mode\b/i,
  /\bpretend (you are|to be)\b/i,
  /\bact as (?!a counsellor)/i,
  /\bjailbreak\b/i,
  // Any attempt to extract the prompt, however politely phrased. Kept broad on
  // purpose: a false positive costs one counsellor handoff, a false negative leaks
  // the guardrail design to someone actively probing it.
  /\b(reveal|show|tell|give|print|repeat|output|display|list)\b[^.?!]{0,30}\byour\b[^.?!]{0,30}\b(instructions?|prompt|rules?|guidelines?|directives?)\b/i,
  /\bwhat (are|were) your (instructions?|rules?|guidelines?)\b/i,
];

/** Topics unrelated to Jetking that the Guide should not wander into. */
const OFF_TOPIC_PATTERNS = [
  /\b(politic|election|religio|cricket score|stock tip|medical advice|legal advice)/i,
  /\bwrite (me )?(a|an) (essay|poem|story|code)\b/i,
  /\b(competitor|niit|aptech|simplilearn|upgrad)\b.*\b(better|worse|compare|vs)\b/i,
];

export interface PreCheckResult {
  allowed: boolean;
  reason?: HandoffReason;
  /** True when the question is about money and must take the deterministic path. */
  feeIntent: boolean;
}

export function preCheck(question: string): PreCheckResult {
  const q = question.trim();

  if (q.length === 0 || q.length > 1000) {
    return { allowed: false, reason: 'out-of-scope', feeIntent: false };
  }

  if (INJECTION_PATTERNS.some((p) => p.test(q))) {
    return { allowed: false, reason: 'unsafe', feeIntent: false };
  }

  if (GUARANTEE_PATTERNS.some((p) => p.test(q)) || SALARY_PATTERNS.some((p) => p.test(q))) {
    return { allowed: false, reason: 'placement-guarantee', feeIntent: false };
  }

  if (OFF_TOPIC_PATTERNS.some((p) => p.test(q))) {
    return { allowed: false, reason: 'out-of-scope', feeIntent: false };
  }

  // Fee questions are allowed through, but flagged: they never reach the model as a
  // free-text generation task.
  return { allowed: true, feeIntent: FEE_PATTERNS.some((p) => p.test(q)) };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The deterministic fee path — risk R4                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Fees are NEVER generated. This function returns a fixed, structured response
 * assembled from `Course.fees`, or a counsellor handoff when the figure is not
 * authoritatively known. There is no code path where a model writes a fee.
 */
export function answerFeeQuestion(courses: Course[], matchedSlug?: string): GuideOutcome {
  const course = matchedSlug ? courses.find((c) => c.slug === matchedSlug) : undefined;

  if (course?.fees.disclosed && typeof course.fees.totalInr === 'number') {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(course.fees.totalInr);

    return {
      kind: 'structured',
      component: 'fees',
      text: `${course.title} — ${formatted}${course.fees.basis ? ` ${course.fees.basis}` : ''}.`,
      payload: {
        courseSlug: course.slug,
        courseTitle: course.title,
        amount: formatted,
        basis: course.fees.basis,
        emiAvailable: course.fees.emiAvailable,
        note: course.fees.note,
      },
    };
  }

  return {
    kind: 'handoff',
    reason: 'fee-specific',
    text:
      'Fees depend on the course, the centre and the current intake, so I do not quote a figure — I would rather connect you with a counsellor who can give you the exact number for your case, including EMI options.',
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Post-generation                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const BANNED_OUTPUT_PATTERNS = [
  /\bguarantee[ds]?\b/i,
  /\bassured\b/i,
  /\b100%\s*(placement|job|success)/i,
  /\bdefinitely will\b/i,
  /\byou will (definitely |certainly )?(get|land|receive) a job\b/i,
];

export interface PostCheckResult {
  ok: boolean;
  reason?: HandoffReason;
  /** Which check failed — logged so the weekly guardrail report is actionable. */
  violation?: 'banned-claim' | 'ungrounded-number' | 'unknown-entity' | 'no-citation';
}

/**
 * Every number in the answer must appear in the retrieved context.
 *
 * This is the check that actually prevents a fabricated fee or duration from
 * reaching a visitor. Years (1900–2099) and small ordinals are exempted because
 * "the first year" and "2026" are ordinary prose, not factual claims about Jetking.
 */
function verifyNumbers(answer: string, context: string): boolean {
  const numbers = answer.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  const normalisedContext = context.replace(/,/g, '');

  for (const raw of numbers) {
    const value = raw.replace(/,/g, '');
    const asNumber = Number(value);

    if (Number.isFinite(asNumber)) {
      if (asNumber >= 1900 && asNumber <= 2099) continue; // years
      if (asNumber <= 12) continue; // small ordinals, months, counts in prose
    }

    if (!normalisedContext.includes(value)) return false;
  }

  return true;
}

/** Course names mentioned in the answer must exist in the real course list. */
function verifyEntities(answer: string, knownTitles: string[]): boolean {
  const normalisedTitles = knownTitles.map((t) => t.toLowerCase().replace(/\s+/g, ' ').trim());

  const patterned =
    answer.match(/\b(?:BCA|Diploma|Certificate|Programme|Program|Course) in [A-Z][\w &,-]{3,60}/g) ??
    [];

  for (const mention of patterned) {
    const needle = mention.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalisedTitles.some((t) => t.includes(needle) || needle.includes(t))) return false;
  }

  // "Foo Bar Programme/Course" claims — must match a known title
  const programmeClaims =
    answer.match(/\b[A-Z][\w]*(?:\s+[A-Z&][\w&-]*){1,6}\s+(?:Programme|Program|Course)\b/g) ?? [];

  for (const claim of programmeClaims) {
    const needle = claim.toLowerCase().replace(/\s+/g, ' ').trim();
    if (
      !normalisedTitles.some((t) => t === needle || t.includes(needle) || needle.includes(t))
    ) {
      return false;
    }
  }

  return true;
}

export function postCheck(
  answer: string,
  retrieved: RetrievedChunk[],
  knownCourseTitles: string[],
): PostCheckResult {
  if (BANNED_OUTPUT_PATTERNS.some((p) => p.test(answer))) {
    return { ok: false, reason: 'placement-guarantee', violation: 'banned-claim' };
  }

  const context = retrieved.map((c) => `${c.title} ${c.text}`).join(' ');

  if (!verifyNumbers(answer, context)) {
    return { ok: false, reason: 'no-grounding', violation: 'ungrounded-number' };
  }

  if (!verifyEntities(answer, knownCourseTitles)) {
    return { ok: false, reason: 'no-grounding', violation: 'unknown-entity' };
  }

  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Handoff copy                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export const HANDOFF_COPY: Record<HandoffReason, string> = {
  'out-of-scope':
    'That is outside what I can help with — I only cover Jetking courses, centres and admissions. Ask me about a course, or I can put you in touch with a counsellor.',
  'no-grounding':
    'I do not have a reliable answer to that in Jetking’s published material, and I would rather not guess. A counsellor can answer it properly.',
  'fee-specific':
    'Fees depend on the course, the centre and the current intake, so I do not quote a figure. A counsellor can give you the exact number, including EMI options.',
  'placement-guarantee':
    'I cannot make claims about guaranteed placement or salary — outcomes depend on the course, the centre and the individual. I can tell you what placement support includes, or connect you with a counsellor.',
  unsafe:
    'I can only help with questions about Jetking courses, centres and admissions. What would you like to know?',
  unavailable:
    'The assistant is unavailable right now. You can browse courses directly, or leave an enquiry and a counsellor will get back to you.',
};
