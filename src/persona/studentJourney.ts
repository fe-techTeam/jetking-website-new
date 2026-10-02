import type { Course, CourseLevel } from '@/lib/content/types';
import { formatIntentLabel } from './profile';

/**
 * Student end-to-end journey — discover → recommend → save → roadmap → counsel.
 * Persisted client-side, keyed to visitor ID when available.
 */

const STUDENT_JOURNEY_STEPS = [
  'discover',
  'recommend',
  'save',
  'roadmap',
  'counsel',
  'complete',
] as const;

export type StudentJourneyStep = (typeof STUDENT_JOURNEY_STEPS)[number];

export type StudentEducation =
  | '10th'
  | '12th'
  | 'diploma'
  | 'engineering'
  | 'graduate';

export type StudentInterest = 'cyber' | 'cloud' | 'ai' | 'network' | 'unsure';

export interface StudentDiscovery {
  education: StudentEducation;
  interest: StudentInterest;
}

interface StudentSoftIdentity {
  phone: string;
  name?: string;
  savedAt: string;
}

export interface StudentJourneyState {
  step: StudentJourneyStep;
  /** True once the visitor opts into the guided wizard (not shown on first landing). */
  journeyStarted?: boolean;
  discovery?: StudentDiscovery;
  /** Slugs recommended after discovery. */
  recommendedSlugs: string[];
  /** Course the visitor picked for roadmap / counselling. */
  selectedCourseSlug?: string;
  softIdentity?: StudentSoftIdentity;
  updatedAt: string;
}

const STORAGE_KEY = 'jk_student_journey_v1';

const EMPTY_STUDENT_JOURNEY: StudentJourneyState = {
  step: 'discover',
  recommendedSlugs: [],
  updatedAt: '',
};

export const EDUCATION_OPTIONS: Array<{ id: StudentEducation; label: string; hint: string }> = [
  { id: '10th', label: 'After 10th', hint: 'Foundation & certification tracks' },
  { id: '12th', label: 'After 12th', hint: 'Diploma & specialist courses' },
  { id: 'diploma', label: 'Diploma holder', hint: 'Advanced certification paths' },
  { id: 'engineering', label: 'Engineering / B.Tech', hint: 'Degree-aligned tracks' },
  { id: 'graduate', label: 'Graduate', hint: 'Career-start courses' },
];

export const INTEREST_OPTIONS: Array<{ id: StudentInterest; label: string; intent: string }> = [
  { id: 'cyber', label: 'Cyber Security', intent: 'Cyber Security' },
  { id: 'cloud', label: 'Cloud & DevOps', intent: 'Cloud' },
  { id: 'ai', label: 'AI & Data', intent: 'AI' },
  { id: 'network', label: 'Networking', intent: 'Networking' },
  { id: 'unsure', label: 'Not sure yet', intent: 'Tech career' },
];

const INTEREST_SLUGS: Record<StudentInterest, string[]> = {
  cyber: ['ethical-hacking-specialist', 'bca-cloud-cyber-security', 'routing-switching-administrator'],
  cloud: ['cloud-computing-engineer-ai', 'cloud-computing-professional-ai', 'routing-switching-administrator'],
  ai: ['cloud-computing-professional-ai', 'cloud-computing-engineer-ai', 'ethical-hacking-specialist'],
  network: ['routing-switching-administrator', 'cloud-computing-engineer-ai', 'ethical-hacking-specialist'],
  unsure: ['pc-hardware-support', 'cloud-computing-engineer-ai', 'ethical-hacking-specialist'],
};

const LEVELS_BY_EDUCATION: Record<StudentEducation, CourseLevel[]> = {
  '10th': ['short', 'certification', 'diploma'],
  '12th': ['certification', 'diploma', 'degree'],
  diploma: ['certification', 'diploma', 'degree'],
  engineering: ['degree', 'diploma', 'certification'],
  graduate: ['certification', 'diploma', 'degree'],
};

export function readStudentJourney(): StudentJourneyState {
  if (typeof window === 'undefined') return { ...EMPTY_STUDENT_JOURNEY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STUDENT_JOURNEY };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...EMPTY_STUDENT_JOURNEY };
    const row = parsed as Partial<StudentJourneyState>;
    const step = STUDENT_JOURNEY_STEPS.includes(row.step as StudentJourneyStep)
      ? (row.step as StudentJourneyStep)
      : 'discover';
    return {
      step,
      journeyStarted: row.journeyStarted === true,
      discovery: row.discovery,
      recommendedSlugs: Array.isArray(row.recommendedSlugs) ? row.recommendedSlugs : [],
      selectedCourseSlug:
        typeof row.selectedCourseSlug === 'string' ? row.selectedCourseSlug : undefined,
      softIdentity: row.softIdentity,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : '',
    };
  } catch {
    return { ...EMPTY_STUDENT_JOURNEY };
  }
}

export function writeStudentJourney(state: StudentJourneyState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Quota / private mode — journey continues in-session only.
  }
}

export function stepIndex(step: StudentJourneyStep): number {
  return STUDENT_JOURNEY_STEPS.indexOf(step);
}

/**
 * Visible progress steps (excludes the internal `complete`).
 *
 * Declared `as const` so `ProgressStep` is the five-member union rather than all
 * of `StudentJourneyStep` — that is what lets the progress bar's label map be
 * exhaustive without carrying a `complete` entry it would never render.
 */
export const PROGRESS_STEPS = ['discover', 'recommend', 'save', 'roadmap', 'counsel'] as const;

export type ProgressStep = (typeof PROGRESS_STEPS)[number];

export const PROGRESS_STEP_LABELS: Record<ProgressStep, string> = {
  discover: 'Discover',
  recommend: 'Courses',
  save: 'Save',
  roadmap: 'Roadmap',
  counsel: 'Counsel',
};

/**
 * Rank courses for discovery answers. Always returns up to `limit` courses.
 */
export function recommendCourses(
  courses: Course[],
  discovery: StudentDiscovery,
  limit = 4,
): Course[] {
  const preferredSlugs = INTEREST_SLUGS[discovery.interest];
  const allowedLevels = new Set(LEVELS_BY_EDUCATION[discovery.education]);

  const scored = courses.map((course) => {
    let score = course.personaRelevance.student ?? 0;
    const slugIdx = preferredSlugs.indexOf(course.slug);
    if (slugIdx >= 0) score += 10 - slugIdx;
    if (allowedLevels.has(course.level)) score += 3;
    else score -= 2;
    if (course.featured) score += 1;
    return { course, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const picked: Course[] = [];
  const seen = new Set<string>();
  for (const { course } of scored) {
    if (seen.has(course.slug)) continue;
    seen.add(course.slug);
    picked.push(course);
    if (picked.length >= limit) break;
  }

  // Ensure we always surface something useful.
  if (picked.length < limit) {
    for (const course of courses) {
      if (seen.has(course.slug)) continue;
      picked.push(course);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

export function interestIntent(interest: StudentInterest): string {
  return INTEREST_OPTIONS.find((o) => o.id === interest)?.intent ?? formatIntentLabel(interest);
}

export interface RoadmapPhase {
  title: string;
  detail: string;
  duration?: string;
}

/** Career roadmap tailored to selected course + education. */
export function buildCareerRoadmap(
  course: Course,
  discovery: StudentDiscovery,
): RoadmapPhase[] {
  const cert = course.certifications[0];
  const outcome = course.outcomes[0];

  return [
    {
      title: 'Foundation',
      detail: `Build core skills for ${course.shortTitle} — aligned with your ${discovery.education} background.`,
      duration: 'Weeks 1–8',
    },
    {
      title: 'Hands-on labs',
      detail: course.modules.slice(0, 2).join(' · ') || 'Industry labs & real projects',
      duration: 'Weeks 9–16',
    },
    {
      title: 'Certify',
      detail: cert ? `Prepare for ${cert}` : 'Earn industry-recognised certifications',
      duration: course.duration,
    },
    {
      title: 'Career launch',
      detail: outcome ?? 'Placement support, mock interviews & hiring partner intros',
      duration: 'After course',
    },
  ];
}

export function canSkipSoftSave(state: StudentJourneyState): boolean {
  return Boolean(state.softIdentity?.phone);
}

/** Show the guided wizard — not on first landing unless mid-journey. */
export function shouldShowJourneyPanel(state: StudentJourneyState): boolean {
  if (state.journeyStarted) return true;
  return state.step !== 'discover' && state.step !== 'complete';
}

export function isJourneyInProgress(state: StudentJourneyState): boolean {
  return state.step !== 'discover' && state.step !== 'complete';
}

export function startStudentJourney(state: StudentJourneyState): StudentJourneyState {
  return {
    ...state,
    journeyStarted: true,
    step: state.step === 'complete' ? 'discover' : state.step,
  };
}
