import type { BehaviourInput, Classification, PersonaId, KnownPersonaId } from './types';
import { CONFIDENCE_THRESHOLD } from './types';

/**
 * Rich user profile — persona alone is not enough.
 *
 * Two students both classified as "student" should diverge once intent and
 * journey stage differ (exploring careers vs comparing fees vs ready to book).
 *
 * This module is pure derivation + optional local persistence of intent locks.
 * PersonaProvider owns when to rebuild and expose the profile.
 */

export const JOURNEY_STAGES = [
  'discover',
  'explore',
  'compare',
  'counsel',
  'admit',
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

type NextBestActionId =
  | 'choose-intent'
  | 'continue-course'
  | 'explore-persona-path'
  | 'compare-courses'
  | 'review-fees'
  | 'book-counselling'
  | 'continue-franchise'
  | 'talk-to-expert';

export interface NextBestAction {
  id: NextBestActionId;
  label: string;
  href: string;
  reason: string;
}

export interface UserProfile {
  visitorId: string;
  persona: PersonaId;
  /** Persona-engine confidence 0–1. */
  confidence: number;
  /** Human label, e.g. "Cyber Security" or "Cloud career". */
  intent?: string;
  /** Machine hint — course slug or interest tag. */
  intentKey?: string;
  stage: JourneyStage;
  returning: boolean;
  nextBestAction: NextBestAction;
  updatedAt: string;
}

/** Explicit intent set by AI / UI — survives re-derivation until cleared. */
export interface ProfileIntentLock {
  intent: string;
  intentKey?: string;
  lockedAt: string;
}

const INTENT_LOCK_KEY = 'jk_intent_lock_v1';
const PROFILE_CACHE_KEY = 'jk_user_profile_v1';

const PERSONA_PATH: Record<KnownPersonaId, { href: string; exploreLabel: string }> = {
  student: { href: '/student', exploreLabel: 'Continue your student path' },
  professional: { href: '/professional', exploreLabel: 'Explore upskilling courses' },
  parent: { href: '/parent', exploreLabel: 'Continue your parent path' },
  franchise: { href: '/franchise', exploreLabel: 'Continue franchise opportunity' },
};

const COUNSEL_CTA: Record<KnownPersonaId | 'unknown', { label: string; href: string }> = {
  student: { label: 'Book free counselling', href: '/enquiry' },
  professional: { label: 'Book career upgrade session', href: '/enquiry' },
  parent: { label: 'Talk to an education expert', href: '/enquiry' },
  franchise: { label: 'Schedule business discussion', href: '/enquiry' },
  unknown: { label: 'Book free counselling', href: '/enquiry' },
};

/** Title-case interest tags for display. */
export function formatIntentLabel(raw: string): string {
  const cleaned = raw.replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return raw;
  const aliases: Record<string, string> = {
    ai: 'AI',
    cyber: 'Cyber Security',
    cloud: 'Cloud',
    devops: 'DevOps',
  };
  const lower = cleaned.toLowerCase();
  if (aliases[lower]) return aliases[lower];
  return cleaned
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function humanizeSlug(slug: string): string {
  return formatIntentLabel(slug.replace(/-specialist|-engineer|-programme|-track$/i, ''));
}

/**
 * Intent from browse history, unless an explicit lock was set (AI / save flow).
 */
export function deriveIntent(
  behaviour: BehaviourInput,
  lock: ProfileIntentLock | null,
): { intent?: string; intentKey?: string } {
  if (lock?.intent) {
    return { intent: lock.intent, intentKey: lock.intentKey };
  }

  // `.at(-1)` is `string | undefined` under noUncheckedIndexedAccess — narrow it
  // rather than asserting, so an empty-but-truthy interests array cannot produce
  // an `intent` of "Undefined".
  const latestInterest = behaviour.interests.at(-1);
  if (latestInterest) {
    return { intent: formatIntentLabel(latestInterest), intentKey: latestInterest };
  }

  if (behaviour.lastCourse) {
    return {
      intent: humanizeSlug(behaviour.lastCourse),
      intentKey: behaviour.lastCourse,
    };
  }

  return {};
}

/**
 * Journey stage from behaviour — progresses; does not regress on light noise.
 */
export function deriveStage(behaviour: BehaviourInput): JourneyStage {
  const completedEnquiry = behaviour.formAttempts.some(
    (f) => f.formId === 'enquiry' && f.status === 'completed',
  );
  if (completedEnquiry) return 'admit';

  const startedEnquiry = behaviour.formAttempts.some(
    (f) => f.formId === 'enquiry' && f.status === 'started',
  );
  if (startedEnquiry) return 'counsel';

  const distinctCourses = new Set(behaviour.courseViews).size;
  const comparing =
    behaviour.feeDepthViews >= 1 ||
    distinctCourses >= 2 ||
    (distinctCourses >= 1 && behaviour.centreViews >= 1);

  if (comparing) return 'compare';

  if (
    behaviour.courseViews.length >= 1 ||
    behaviour.interests.length >= 1 ||
    behaviour.centreViews >= 1 ||
    behaviour.franchiseViews >= 1 ||
    behaviour.visitedPages.length >= 2
  ) {
    return 'explore';
  }

  return 'discover';
}

export function deriveNextBestAction(input: {
  persona: PersonaId;
  confidence: number;
  stage: JourneyStage;
  intent?: string;
  intentKey?: string;
  lastCourse?: string;
}): NextBestAction {
  const { persona, confidence, stage, intent, lastCourse } = input;
  const known = persona !== 'unknown' && confidence >= CONFIDENCE_THRESHOLD;
  // `known` already narrows `persona` to KnownPersonaId — re-testing it here was a
  // no-op comparison TS flags as unintentional.
  const path = known ? PERSONA_PATH[persona] : null;
  const counsel = COUNSEL_CTA[persona];

  if (stage === 'admit' || stage === 'counsel') {
    return {
      id: persona === 'parent' ? 'talk-to-expert' : 'book-counselling',
      label: counsel.label,
      href: counsel.href,
      reason:
        stage === 'admit'
          ? 'Enquiry already started — complete counselling next'
          : 'Ready for a counsellor conversation',
    };
  }

  if (stage === 'compare') {
    return {
      id: 'book-counselling',
      label: counsel.label,
      href: counsel.href,
      reason: intent
        ? `Comparing ${intent} options — counselling helps them decide`
        : 'Comparing options — counselling is the next best step',
    };
  }

  if (stage === 'explore') {
    if (lastCourse) {
      return {
        id: 'continue-course',
        label: intent ? `Continue exploring ${intent}` : 'Continue where you left off',
        href: `/courses/${lastCourse}`,
        reason: 'Resume the last course they viewed',
      };
    }
    if (path) {
      return {
        id: persona === 'franchise' ? 'continue-franchise' : 'explore-persona-path',
        label: intent ? `Continue your ${intent} journey` : path.exploreLabel,
        href: path.href,
        reason: 'Persona known — deepen their path',
      };
    }
    return {
      id: 'compare-courses',
      label: 'Explore courses',
      href: '/courses',
      reason: 'Browsing without a locked persona',
    };
  }

  // discover
  if (path) {
    return {
      id: 'explore-persona-path',
      label: path.exploreLabel,
      href: path.href,
      reason: 'Persona chosen — enter their experience',
    };
  }

  return {
    id: 'choose-intent',
    label: 'What brings you here today?',
    href: '/',
    reason: 'Unknown visitor — identify intent first',
  };
}

export function buildUserProfile(input: {
  visitorId: string;
  classification: Classification;
  behaviour: BehaviourInput;
  returning: boolean;
  intentLock?: ProfileIntentLock | null;
  now?: string;
}): UserProfile {
  const { classification, behaviour, visitorId, returning } = input;
  const lock = input.intentLock ?? null;
  const { intent, intentKey } = deriveIntent(behaviour, lock);
  const stage = deriveStage(behaviour);
  const nextBestAction = deriveNextBestAction({
    persona: classification.persona,
    confidence: classification.confidence,
    stage,
    intent,
    intentKey,
    lastCourse: behaviour.lastCourse,
  });

  return {
    visitorId,
    persona: classification.persona,
    confidence: classification.confidence,
    intent,
    intentKey,
    stage,
    returning,
    nextBestAction,
    updatedAt: input.now ?? new Date().toISOString(),
  };
}

export const EMPTY_USER_PROFILE: UserProfile = {
  visitorId: '',
  persona: 'unknown',
  confidence: 0,
  stage: 'discover',
  returning: false,
  nextBestAction: {
    id: 'choose-intent',
    label: 'What brings you here today?',
    href: '/',
    reason: 'Cold start',
  },
  updatedAt: '',
};

/* ── Persistence (intent lock + last computed profile cache) ─────────────── */

export function readIntentLock(): ProfileIntentLock | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(INTENT_LOCK_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const row = parsed as Partial<ProfileIntentLock>;
    if (typeof row.intent !== 'string' || !row.intent.trim()) return null;
    return {
      intent: row.intent.trim(),
      intentKey: typeof row.intentKey === 'string' ? row.intentKey : undefined,
      lockedAt: typeof row.lockedAt === 'string' ? row.lockedAt : '',
    };
  } catch {
    return null;
  }
}

export function lockIntent(intent: string, intentKey?: string): ProfileIntentLock {
  const lock: ProfileIntentLock = {
    intent: formatIntentLabel(intent),
    intentKey,
    lockedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(INTENT_LOCK_KEY, JSON.stringify(lock));
    } catch {
      // ignore
    }
  }
  return lock;
}

export function clearIntentLock(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(INTENT_LOCK_KEY);
  } catch {
    // ignore
  }
}

export function cacheUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}
