import type {
  CentreRecord,
  ContactRecord,
  CourseRecord,
  FaqRecord,
  StatRecord,
} from '@/features/knowledge/types';

/**
 * A composed answer, expressed as structured data rather than prose.
 *
 * The renderer turns this into a page; keeping it declarative means the answer
 * layout is testable, and swapping the retrieval strategy later cannot break
 * the presentation layer.
 */

export type AnswerIntent =
  'course' | 'placement' | 'fees' | 'eligibility' | 'about' | 'contact' | 'centres' | 'general';

export interface AnswerSource {
  title: string;
  /** Site-relative path, e.g. `/courses/x`. */
  path: string;
}

export interface KeyValue {
  label: string;
  value: string;
}

export type AnswerBlock =
  | { type: 'prose'; heading: string | null; paragraphs: string[] }
  | { type: 'courses'; heading: string; courses: CourseRecord[] }
  | { type: 'faqs'; heading: string; faqs: FaqRecord[] }
  | { type: 'stats'; heading: string; stats: StatRecord[] }
  | { type: 'facts'; heading: string; items: KeyValue[] }
  | { type: 'centres'; heading: string; centres: CentreRecord[] }
  | { type: 'contact'; heading: string; contact: ContactRecord };

/** How well the knowledge base actually covered the question. */
export type AnswerConfidence = 'high' | 'medium' | 'none';

export interface AnswerPage {
  query: string;
  intent: AnswerIntent;
  title: string;
  /** Host the answer was drawn from, e.g. "jetking.com". */
  sourceLabel: string;
  /** Public origin of that host, for linking. */
  sourceUrl: string;
  /** One-paragraph answer shown above the detail blocks. */
  lede: string;
  blocks: AnswerBlock[];
  sources: AnswerSource[];
  followUps: string[];
  confidence: AnswerConfidence;
  /** Best retrieval score across all record types — the relevance-gate signal. */
  topScore: number;
}
