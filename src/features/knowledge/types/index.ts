/**
 * Shape of the crawled Jetking knowledge base.
 *
 * Shared by the sync script (`scripts/sync-content.mts`, the writer) and the
 * retrieval layer (the reader), so a schema change breaks both sides at
 * compile time instead of silently at runtime.
 */

export type PageSection =
  | 'home'
  | 'courses'
  | 'course-detail'
  | 'centres'
  | 'centre-detail'
  | 'audience'
  | 'about'
  | 'enquiry'
  | 'other';

export interface SourcePage {
  id: string;
  /** Site-relative path, e.g. "/courses/ethical-hacking-specialist". */
  path: string;
  title: string;
  description: string;
  section: PageSection;
}

type ChunkKind = 'heading' | 'paragraph' | 'list' | 'faq' | 'fact';

export interface Chunk {
  id: string;
  pageId: string;
  /** Nearest preceding heading, for context in the answer. */
  heading: string | null;
  text: string;
  kind: ChunkKind;
}

export type CourseCategory = 'degree' | 'career' | 'certification' | 'short';

export interface CourseRecord {
  id: string;
  name: string;
  category: CourseCategory;
  /** Normalised for sorting and filtering; null when the site does not state it. */
  durationMonths: number | null;
  durationLabel: string;
  path: string;
  summary: string;
  /** Verbatim values from the course page's definition list. */
  eligibility: string;
  fees: string;
  payment: string;
  /** "What you will study" */
  topics: string[];
  /** "Programme highlights" */
  highlights: string[];
  /** "What you will be able to do" */
  outcomes: string[];
  certifications: string[];
}

interface CentreLocation {
  name: string;
  locality: string;
}

export interface CentreRecord {
  id: string;
  city: string;
  path: string;
  summary: string;
  locations: CentreLocation[];
  /** Programme names offered at this city's centres. */
  programmes: string[];
}

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  path: string;
  /** Course name when the FAQ came from a course page. */
  scope: string | null;
}

export interface StatRecord {
  id: string;
  value: string;
  label: string;
}

export interface ContactRecord {
  phone: string;
  email: string;
  address: string;
  enquiryPath: string;
}

export interface KnowledgeBase {
  /** ISO timestamp of the crawl that produced this file. */
  crawledAt: string;
  /**
   * Origin the crawl read from, for provenance only. Never used to build a
   * link — every record stores a site-relative path so the corpus is portable.
   */
  crawledFrom: string;
  pages: SourcePage[];
  chunks: Chunk[];
  courses: CourseRecord[];
  centres: CentreRecord[];
  faqs: FaqRecord[];
  stats: StatRecord[];
  contact: ContactRecord;
}