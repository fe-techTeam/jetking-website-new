import type { PersonaId } from '@/lib/content/types';
import type { AcquisitionChannel } from './channel';

export type { PersonaId };

export const PERSONA_IDS = ['student', 'professional', 'parent', 'franchise'] as const;
export type KnownPersonaId = (typeof PERSONA_IDS)[number];

/** Confidence below this is not actionable — the visitor is treated as `unknown`. */
export const CONFIDENCE_THRESHOLD = 0.45;

/** Bumped whenever rules.ts / channel detection changes. */
export const RULES_VERSION = '1.2.0';

/**
 * A single piece of evidence contributing to a classification.
 * Every classification carries its full signal trail — this is what makes the
 * engine auditable rather than a black box (DEVELOPMENT-PLAN §4.3).
 */
export interface SignalHit {
  /** Stable rule identifier, e.g. 'referrer:linkedin' */
  id: string;
  persona: KnownPersonaId;
  weight: number;
  /** Human-readable reason, surfaced in the debug panel and logged with events. */
  detail: string;
  source: 'first-touch' | 'behaviour';
}

/** Normalised inputs available at the edge, before any behaviour exists. */
export interface FirstTouchInput {
  path: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  /** Google Ads click id — presence means paid search, not organic. */
  gclid?: string;
  referrerHost?: string;
  /** Resolved by the hosting platform's geo header where available. */
  geoCity?: string;
  geoRegion?: string;
  isMobile: boolean;
  /** Local hour 0–23 in IST, used only as a weak supporting signal. */
  hourIst?: number;
}

interface LastCentreRef {
  citySlug: string;
  slug: string;
  name?: string;
}

interface FormAttempt {
  formId: string;
  status: 'started' | 'completed';
  at: string;
}

interface VisitedPage {
  path: string;
  title?: string;
  at: string;
}

/** Behaviour accumulated client-side over the session and across visits. */
export interface BehaviourInput {
  /** Course slugs viewed, most recent last. */
  courseViews: string[];
  /** Course levels viewed, e.g. 'degree' → student signal. */
  levelViews: string[];
  /** Number of times fee/EMI content was viewed in depth. */
  feeDepthViews: number;
  /** Centre-locator or centre-page interactions. */
  centreViews: number;
  /** Franchise-section engagement. */
  franchiseViews: number;
  /** Blog categories read. */
  categoryViews: string[];
  /** Distinct visits (sessions) recorded. */
  visitCount: number;
  /** Most recently viewed course slug. */
  lastCourse?: string;
  /** Most recently viewed centre. */
  lastCentre?: LastCentreRef;
  /** Enquiry / form attempts. */
  formAttempts: FormAttempt[];
  /** Recent paths for "Recently Viewed". */
  visitedPages: VisitedPage[];
  /** Free-text interest tags derived from browsing (e.g. AI, cloud). */
  interests: string[];
  /** Last known geo city from edge cookie / client. */
  geoCity?: string;
}

export interface Classification {
  persona: PersonaId;
  confidence: number;
  signals: SignalHit[];
  version: string;
  /** Runner-up, used to decide when a nudge should offer an alternative path. */
  runnerUp?: KnownPersonaId;
  classifiedAt: string;
  /** How the visitor arrived — organic_search, paid_search, social, etc. */
  acquisitionChannel?: AcquisitionChannel;
}

export const EMPTY_BEHAVIOUR: BehaviourInput = {
  courseViews: [],
  levelViews: [],
  feeDepthViews: 0,
  centreViews: 0,
  franchiseViews: 0,
  categoryViews: [],
  visitCount: 1,
  formAttempts: [],
  visitedPages: [],
  interests: [],
};

export const UNKNOWN_CLASSIFICATION: Classification = {
  persona: 'unknown',
  confidence: 0,
  signals: [],
  version: RULES_VERSION,
  classifiedAt: '',
  acquisitionChannel: 'direct',
};
