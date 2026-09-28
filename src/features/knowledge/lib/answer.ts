import type { KnowledgeIndex } from '@/features/knowledge/lib/index-builder';
import { detectIntent } from '@/features/knowledge/lib/intent';
import { tokenize } from '@/features/knowledge/lib/tokenize';
import { SITE } from '@/lib/config/site';
import type {
  CentreRecord,
  Chunk,
  CourseRecord,
  FaqRecord,
  PageSection,
  SourcePage,
} from '@/features/knowledge/types';
import type {
  AnswerBlock,
  AnswerConfidence,
  AnswerIntent,
  AnswerPage,
  AnswerSource,
  KeyValue,
} from '@/features/knowledge/types/answer';

/**
 * Composes a structured answer page from retrieval hits.
 *
 * Everything rendered is text that exists on the Jetking site — the composer
 * selects and arranges, it never writes new claims. That is what makes a
 * template-driven answer trustworthy without a model in the loop.
 */

/** BM25 scores above which a hit is treated as a confident match. */
const STRONG_COURSE_SCORE = 3.5;
const STRONG_FAQ_SCORE = 3.5;
const STRONG_CHUNK_SCORE = 4.5;
const STRONG_CENTRE_SCORE = 3;

const MAX_COURSES = 6;
const MAX_CENTRES = 6;
const MAX_FAQS = 4;
const MAX_PARAGRAPHS = 3;

/** Weak hits are noise; a fee question should not drag in a hardware FAQ. */
const RELEVANT_SCORE = 1.5;

interface Scored<T> {
  record: T;
  score: number;
}

interface Retrieved {
  courses: Array<Scored<CourseRecord>>;
  faqs: Array<Scored<FaqRecord>>;
  chunks: Array<Scored<Chunk>>;
  centres: Array<Scored<CentreRecord>>;
}

function retrieve(index: KnowledgeIndex, query: string): Retrieved {
  const lookup = <T>(hits: Array<{ id: string; score: number }>, map: Map<string, T>) =>
    hits.flatMap(({ id, score }) => {
      const record = map.get(id);
      return record ? [{ record, score }] : [];
    });

  return {
    courses: lookup(index.courses.search(query, MAX_COURSES), index.courseById),
    faqs: lookup(index.faqs.search(query, MAX_FAQS), index.faqById),
    chunks: lookup(index.chunks.search(query, 10), index.chunkById),
    centres: lookup(index.centres.search(query, MAX_CENTRES), index.centreById),
  };
}

function gradeConfidence({ courses, faqs, chunks, centres }: Retrieved): AnswerConfidence {
  const best = <T>(list: Array<Scored<T>>) => list[0]?.score ?? 0;

  if (
    best(courses) >= STRONG_COURSE_SCORE ||
    best(faqs) >= STRONG_FAQ_SCORE ||
    best(chunks) >= STRONG_CHUNK_SCORE ||
    best(centres) >= STRONG_CENTRE_SCORE
  ) {
    return 'high';
  }

  return courses.length + faqs.length + chunks.length + centres.length > 0 ? 'medium' : 'none';
}

/**
 * Which parts of the site can plausibly answer each kind of question.
 *
 * Keyword scoring alone is section-blind: "where are your centres and how do I
 * contact you?" scores a routing-and-switching paragraph highly because it
 * talks about networks. Preferring chunks from the matching section fixes that
 * class of miss without touching the ranking itself.
 */
const INTENT_SECTIONS: Partial<Record<AnswerIntent, readonly PageSection[]>> = {
  course: ['course-detail', 'courses'],
  fees: ['course-detail', 'courses'],
  eligibility: ['course-detail', 'courses'],
  centres: ['centre-detail', 'centres'],
  contact: ['enquiry', 'centre-detail', 'centres'],
  about: ['about', 'home'],
  placement: ['audience', 'home', 'about'],
};

/**
 * Intents where an out-of-section paragraph is worse than none.
 *
 * "Where are your centres?" answered with a paragraph about network routing is
 * actively misleading; better to fall through to the centre summary.
 */
const SECTION_STRICT: ReadonlySet<AnswerIntent> = new Set(['centres', 'contact']);

/**
 * Substantial prose only, with chunks from the intent's own section first.
 * Ordering is stable, so relevance still decides within each group.
 */
function pickParagraphs(
  chunks: Retrieved['chunks'],
  index: KnowledgeIndex,
  intent: AnswerIntent,
  limit = MAX_PARAGRAPHS,
): string[] {
  const preferred = new Set(INTENT_SECTIONS[intent] ?? []);

  const usable = chunks.filter(
    ({ record }) => record.kind === 'paragraph' && record.text.length >= 70,
  );

  const inSection = ({ record }: Scored<Chunk>) =>
    preferred.has(index.pageById.get(record.pageId)?.section ?? 'other');

  const ordered = SECTION_STRICT.has(intent)
    ? usable.filter(inSection)
    : [...usable.filter(inSection), ...usable.filter((hit) => !inSection(hit))];

  const seen = new Set<string>();
  const paragraphs: string[] = [];

  for (const { record } of ordered) {
    const key = record.text.slice(0, 60).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    paragraphs.push(record.text);
    if (paragraphs.length >= limit) break;
  }

  return paragraphs;
}

function toSource(page: SourcePage | undefined): AnswerSource | null {
  if (!page) return null;
  return { title: page.title, path: page.path };
}

/**
 * Cites only the pages the answer actually drew from, strongest first.
 *
 * Course and centre records are the highest-signal hits, so they lead; prose
 * chunks contribute last and only when they scored well, otherwise a weak
 * keyword brush against an unrelated page ends up cited as a source.
 */
function collectSources(index: KnowledgeIndex, retrieved: Retrieved): AnswerSource[] {
  const sources = new Map<string, AnswerSource>();

  const add = (source: AnswerSource | null) => {
    if (source && !sources.has(source.path)) sources.set(source.path, source);
  };

  for (const { record } of retrieved.courses.slice(0, 3)) {
    add({ title: record.name, path: record.path });
  }

  for (const { record } of retrieved.centres.slice(0, 2)) {
    add({ title: `Jetking ${record.city}`, path: record.path });
  }

  for (const { record, score } of retrieved.faqs.slice(0, 2)) {
    if (score < RELEVANT_SCORE) continue;
    add(toSource(index.base.pages.find((page) => page.path === record.path)));
  }

  for (const { record, score } of retrieved.chunks.slice(0, MAX_PARAGRAPHS)) {
    if (score < RELEVANT_SCORE) continue;
    add(toSource(index.pageById.get(record.pageId)));
  }

  return [...sources.values()].slice(0, 6);
}

const INTENT_TITLE: Record<AnswerIntent, string> = {
  course: 'Courses at Jetking',
  placement: 'Placements and job support',
  fees: 'Fees and payment options',
  eligibility: 'Eligibility and entry requirements',
  about: 'About Jetking',
  contact: 'Talk to Jetking',
  centres: 'Jetking training centres',
  general: 'Jetking',
};

/**
 * True when the question actually names the thing.
 *
 * Score alone cannot tell "how long is the gaming course?" (which means one
 * specific programme) from "which course is best?" (which does not), because
 * both put a course at the top of the ranking.
 */
function namesSubject(query: string, subject: string): boolean {
  const asked = new Set(tokenize(query));
  const overlap = tokenize(subject).filter((term) => asked.has(term));
  return overlap.length >= 2;
}

function buildTitle(intent: AnswerIntent, retrieved: Retrieved, query: string): string {
  const [topCourse, runnerUp] = retrieved.courses;
  const topCentre = retrieved.centres[0];

  // A location question names a place, so the place wins the headline even
  // when some course scores higher overall.
  if (
    (intent === 'centres' || intent === 'contact') &&
    topCentre &&
    (topCentre.score >= STRONG_CENTRE_SCORE || namesSubject(query, topCentre.record.city))
  ) {
    return `Jetking centres in ${topCentre.record.city}`;
  }

  // A dominant course match, or one the question names outright, beats the
  // generic heading.
  if (topCourse && topCourse.score >= STRONG_COURSE_SCORE) {
    const dominant = !runnerUp || topCourse.score > runnerUp.score * 1.6;
    if (dominant || namesSubject(query, topCourse.record.name)) return topCourse.record.name;
  }

  if (intent === 'general') {
    const trimmed = query.trim().replace(/\?+$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  return INTENT_TITLE[intent];
}

function buildLede(
  retrieved: Retrieved,
  confidence: AnswerConfidence,
  title: string,
  index: KnowledgeIndex,
  intent: AnswerIntent,
  query: string,
): string {
  if (confidence === 'none') {
    return 'I could not find anything about that on the Jetking site. Try asking about a course, placements, fees, eligibility, or a training centre near you.';
  }

  const topFaq = retrieved.faqs[0];
  const topCourse = retrieved.courses[0];
  const topCentre = retrieved.centres[0];

  // When the headline is a specific course, its own summary is the answer — a
  // generic page paragraph can outrank it while saying nothing about it.
  if (topCourse && topCourse.record.name === title && topCourse.record.summary) {
    return topCourse.record.summary;
  }

  if (topCentre && title.includes(topCentre.record.city) && topCentre.record.summary) {
    return topCentre.record.summary;
  }

  // For location questions a high-scoring FAQ is usually off-topic — "what is
  // routing and switching?" outranks anything about visiting a centre.
  if (SECTION_STRICT.has(intent)) {
    const inSection = pickParagraphs(retrieved.chunks, index, intent, 1)[0];
    if (inSection) return inSection;

    // Only speak for a city the question actually named; otherwise the top
    // centre hit is arbitrary and reads as a wrong answer.
    if (topCentre?.record.summary && namesSubject(query, topCentre.record.city)) {
      return topCentre.record.summary;
    }

    return `Jetking runs ${index.base.centres.length} training centres across India. Pick a city below, or contact the team directly.`;
  }

  if (topFaq && topFaq.score >= STRONG_FAQ_SCORE) return topFaq.record.answer;

  const paragraph = pickParagraphs(retrieved.chunks, index, intent, 1)[0];
  if (paragraph) return paragraph;

  // Below the confidence bar, the best FAQ still beats a filler sentence.
  if (topCentre?.record.summary && SECTION_STRICT.has(intent)) return topCentre.record.summary;
  if (topFaq) return topFaq.record.answer;
  if (topCourse?.record.summary) return topCourse.record.summary;
  if (topCentre?.record.summary) return topCentre.record.summary;

  return 'Here is what the Jetking site covers on this topic.';
}

function buildFollowUps(retrieved: Retrieved, intent: AnswerIntent, query: string): string[] {
  const candidates: string[] = [];
  const topCourse = retrieved.courses[0]?.record;
  const topCentre = retrieved.centres[0]?.record;

  if (topCourse) {
    candidates.push(`What will I study in ${topCourse.name}?`);
    if (topCourse.eligibility) candidates.push(`Who is eligible for ${topCourse.name}?`);
  }
  if (topCentre) candidates.push(`Which courses run at the ${topCentre.city} centre?`);

  candidates.push(
    'Does Jetking guarantee placement after the course?',
    'What are the course fees and payment options?',
    'Which courses can I do after 12th?',
    'Where is my nearest Jetking centre?',
  );

  const asked = query.toLowerCase();
  return [...new Set(candidates)]
    .filter((candidate) => {
      // Drop suggestions that just restate the question.
      const overlap = candidate
        .toLowerCase()
        .split(' ')
        .filter((word) => word.length > 4 && asked.includes(word));
      return overlap.length < 2;
    })
    .slice(0, 4);
}

/** Duration, eligibility, fees and payment, as published on the course page. */
function courseFacts(course: CourseRecord): KeyValue[] {
  return [
    { label: 'Duration', value: course.durationLabel || 'See course page' },
    { label: 'Eligibility', value: course.eligibility || 'See course page' },
    { label: 'Fees', value: course.fees || 'See course page' },
    { label: 'Payment', value: course.payment || 'See course page' },
  ].filter((fact) => fact.value !== 'See course page' || fact.label === 'Duration');
}

function buildBlocks(
  index: KnowledgeIndex,
  retrieved: Retrieved,
  intent: AnswerIntent,
  confidence: AnswerConfidence,
  title: string,
): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const { base } = index;

  if (confidence === 'none') {
    blocks.push({
      type: 'courses',
      heading: 'Popular courses',
      courses: base.courses.slice(0, MAX_COURSES),
    });
    blocks.push({ type: 'contact', heading: 'Talk to Jetking', contact: base.contact });
    return blocks;
  }

  const courses = retrieved.courses.filter((hit) => hit.score > 1).map((hit) => hit.record);
  const centres = retrieved.centres.filter((hit) => hit.score > 1).map((hit) => hit.record);
  const faqs = retrieved.faqs.filter((hit) => hit.score >= RELEVANT_SCORE).map((hit) => hit.record);

  // Only the course the answer is actually *about* gets a details table;
  // otherwise a placement question shows an unrelated programme's fees.
  const topCourse = retrieved.courses[0]?.record;
  const focusCourse = topCourse?.name === title ? topCourse : undefined;

  const leadWithCourses = intent === 'course' || intent === 'fees' || intent === 'eligibility';
  const leadWithCentres = intent === 'centres' || intent === 'contact';

  if (leadWithCentres) {
    // A "where are you?" question with no city named still deserves a list of
    // places to go, so fall back to the first few centres on the site.
    const shown = centres.length ? centres : base.centres.slice(0, 4);
    if (shown.length) {
      blocks.push({
        type: 'centres',
        heading: centres.length ? 'Centres' : `Centres across India (${base.centres.length})`,
        centres: shown,
      });
    }
  }

  if (leadWithCourses && courses.length) {
    blocks.push({ type: 'courses', heading: 'Matching courses', courses });
  }

  // The facts table is the answer for fee, duration and eligibility questions.
  if (focusCourse) {
    blocks.push({
      type: 'facts',
      heading: `${focusCourse.name} — key details`,
      items: courseFacts(focusCourse),
    });

    if (focusCourse.topics.length) {
      blocks.push({
        type: 'prose',
        heading: 'What you will study',
        paragraphs: [focusCourse.topics.join(' · ')],
      });
    }
  }

  const paragraphs = pickParagraphs(retrieved.chunks, index, intent);
  if (paragraphs.length) {
    blocks.push({
      type: 'prose',
      heading: retrieved.chunks[0]?.record.heading ?? null,
      paragraphs,
    });
  }

  if (faqs.length) {
    blocks.push({ type: 'faqs', heading: 'Frequently asked', faqs });
  }

  if (!leadWithCourses && courses.length) {
    blocks.push({ type: 'courses', heading: 'Related courses', courses });
  }

  if (!leadWithCentres && centres.length && intent === 'about') {
    blocks.push({ type: 'centres', heading: 'Nearby centres', centres: centres.slice(0, 3) });
  }

  if ((intent === 'about' || intent === 'placement') && base.stats.length) {
    blocks.push({ type: 'stats', heading: 'Jetking by the numbers', stats: base.stats });
  }

  if (intent === 'contact' || intent === 'centres' || intent === 'fees') {
    blocks.push({ type: 'contact', heading: 'Talk to Jetking', contact: base.contact });
  }

  return blocks;
}

export function composeAnswer(index: KnowledgeIndex, query: string): AnswerPage {
  const intent = detectIntent(query);
  const retrieved = retrieve(index, query);
  const confidence = gradeConfidence(retrieved);

  // Best score across every record type — the signal a caller can threshold to
  // reject weak, off-topic matches (BM25 keyword noise) before answering.
  const topScore = Math.max(
    retrieved.courses[0]?.score ?? 0,
    retrieved.faqs[0]?.score ?? 0,
    retrieved.chunks[0]?.score ?? 0,
    retrieved.centres[0]?.score ?? 0,
  );

  const title =
    confidence === 'none' ? 'No match on the Jetking site' : buildTitle(intent, retrieved, query);

  return {
    query,
    intent,
    title,
    // From config, never from the crawl. Whichever machine built the corpus is
    // an implementation detail; what the reader needs is the public site.
    sourceLabel: SITE.sourceLabel,
    sourceUrl: SITE.sourceSite,
    lede: buildLede(retrieved, confidence, title, index, intent, query),
    blocks: buildBlocks(index, retrieved, intent, confidence, title),
    sources: confidence === 'none' ? [] : collectSources(index, retrieved),
    followUps: buildFollowUps(retrieved, intent, query),
    confidence,
    topScore,
  };
}
