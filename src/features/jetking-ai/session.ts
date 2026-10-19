import type { PersonaId } from './persona';

/**
 * Client-carried conversation state for the /api/chat widget.
 *
 * Round-tripped by the client (sent on each request, replaced from the
 * response) rather than persisted server-side — same "no infra yet" choice
 * already made for the message transcript itself.
 *
 * v2: the profile fields (educationLevel, stream, careerGoal, concerns,
 * preferredCourseType) are populated by the planner (planner.ts) when the
 * deterministic layer can't classify a message — see needsPlanner(). version
 * bump is safe with no migration: sessions never persist across a reload, so
 * there's no old-shape data to reconcile.
 */
export interface CounsellingSession {
  version: 2;
  persona: PersonaId;
  /** Subject labels mentioned so far (e.g. "Cyber Security"), most recent last, capped. */
  interests: string[];
  lastSubject?: string;
  lastCity?: string;
  lastFacet?: string;
  turnCount: number;
  educationLevel?: string;
  stream?: string;
  careerGoal?: string;
  concerns?: string[];
  preferredCourseType?: 'degree' | 'career' | 'short-course';
}

const MAX_INTERESTS = 8;
const MAX_CONCERNS = 5;

export const EMPTY_SESSION: CounsellingSession = {
  version: 2,
  persona: 'unknown',
  interests: [],
  turnCount: 0,
};

interface PlannerProfileUpdates {
  educationLevel?: string;
  stream?: string;
  careerGoal?: string;
  interests?: string[];
  concerns?: string[];
  preferredCourseType?: 'degree' | 'career' | 'short-course';
}

export interface SessionUpdateInput {
  persona: PersonaId;
  subject: string | null;
  cityHint: string | null;
  answeredFacet: string;
  /** From planner.ts's runPlanner() — only set on turns where the planner actually ran. */
  plannerUpdates?: PlannerProfileUpdates;
}

/** Pure — no I/O, so the eval script can replay conversations without a server or model. */
export function updateSession(
  prev: CounsellingSession | undefined,
  input: SessionUpdateInput,
): CounsellingSession {
  const base = prev ?? EMPTY_SESSION;
  const planner = input.plannerUpdates;

  let interests = base.interests;
  if (input.subject && !interests.includes(input.subject)) {
    interests = [...interests, input.subject];
  }
  for (const tag of planner?.interests ?? []) {
    if (!interests.includes(tag)) interests = [...interests, tag];
  }
  interests = interests.slice(-MAX_INTERESTS);

  let concerns = base.concerns;
  if (planner?.concerns?.length) {
    const merged = [...(base.concerns ?? [])];
    for (const c of planner.concerns) if (!merged.includes(c)) merged.push(c);
    concerns = merged.slice(-MAX_CONCERNS);
  }

  return {
    version: 2,
    persona: input.persona !== 'unknown' ? input.persona : base.persona,
    interests,
    lastSubject: input.subject ?? base.lastSubject,
    lastCity: input.cityHint ?? base.lastCity,
    lastFacet: input.answeredFacet || base.lastFacet,
    turnCount: base.turnCount + 1,
    educationLevel: planner?.educationLevel ?? base.educationLevel,
    stream: planner?.stream ?? base.stream,
    careerGoal: planner?.careerGoal ?? base.careerGoal,
    concerns,
    preferredCourseType: planner?.preferredCourseType ?? base.preferredCourseType,
  };
}
