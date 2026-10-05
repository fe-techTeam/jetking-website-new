import 'server-only';
import { content } from './index';
import { mergeCopy, fill, type PageCopyDef } from './copy/define';
import { exploreCopy } from './copy/pages/explore';
import { franchiseCopy } from './copy/pages/franchise';
import { parentCopy } from './copy/pages/parent';
import { professionalCopy } from './copy/pages/professional';
import { studentCopy } from './copy/pages/student';
import type { LegalBlock, LegalDoc } from './types';
import { SINCE_FOUNDED, legacyStats } from '@/lib/brand-facts';

/**
 * The page-level facts the chatbot retrieves from, built from the SAME content the pages render — the
 * About, Placements and legal documents and each landing page's text — so an edit in the admin reaches
 * the chatbot's corpus the next time it is exported (`npm run export:chatbot-content`) instead of
 * living on as a stale hand-copied string.
 *
 * Record ids, types, titles and paths are the ones the retrieval index already weights, so which
 * passage answers which question doesn't shift; only where the words come from does.
 */

export interface CorpusItem {
  id: string;
  type: string;
  title: string;
  path: string;
  text: string;
  source: 'website-content-source';
}

const item = (id: string, type: string, title: string, path: string, text: string): CorpusItem => ({
  id,
  type,
  title,
  path,
  // build-index.mjs prepends `${title}\n` itself, so `text` must not repeat the title.
  text: text.trim(),
  source: 'website-content-source',
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lower = (s: string) => s.toLowerCase();

/** A page's text as the website renders it: shipped defaults with any published CMS overrides applied. */
async function pageCopy<T extends Record<string, string>>(def: PageCopyDef<T>): Promise<T> {
  return mergeCopy(def.defaults, await content.getPageCopyOverrides(def.id));
}

/**
 * `copy['group.0.title']`, `copy['group.1.title']`, … — a repeating block has a fixed shape, so rows are read
 * until none of a row's fields exist. (A field can legitimately be absent on one row, e.g. a stat with a label
 * but no headline value.)
 */
function indexed(copy: Record<string, string>, group: string, fields: string[]): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  for (let i = 0; fields.some((f) => copy[`${group}.${i}.${f}`] !== undefined); i++) {
    rows.push(Object.fromEntries(fields.map((f) => [f, copy[`${group}.${i}.${f}`] ?? ''])));
  }
  return rows;
}

/* ── About ─────────────────────────────────────────────────────────────── */

async function aboutItems(counts: { courses: number; centres: number; cities: number }): Promise<CorpusItem[]> {
  const about = await content.getAboutPage();
  const timeline = about.timeline;
  const early = timeline.filter((m) => Number(m.year) < 2010);
  const recent = timeline.filter((m) => Number(m.year) >= 2010);
  const milestone = (m: { year: string; title: string; body?: string }) =>
    `${m.year}: ${m.title}${m.body ? ` — ${m.body}` : ''}`;
  const first = timeline[0];

  return [
    item(
      'about-overview',
      'about',
      'About Jetking',
      '/about-us',
      `${about.hero.lede} ` +
        `${about.purpose.map((p) => `${p.title}: ${p.body}`).join(' ')} ` +
        `Values: ${about.values.join(', ')}. ` +
        `${legacyStats(counts).map((s) => `${s.value} ${s.label}`).join(', ')}.`,
    ),
    ...[...about.directors, ...about.managementTeam]
      .filter((leader) => leader.name)
      .map((leader) =>
        item(
          `about-leader-${slugify(leader.name)}`,
          'about',
          leader.name,
          '/about-us',
          leader.bio ? `${leader.role ?? 'Management team, Jetking'}\n${leader.bio.join(' ')}` : (leader.role ?? 'Management team, Jetking'),
        ),
      ),
    // One focused passage per fact: folding the founding fact in among eight other early milestones dilutes
    // its embedding enough that "who founded Jetking?" stops surfacing it.
    ...(first
      ? [item('about-founder', 'about', 'Who founded Jetking', '/about-us', `Jetking's founder — ${first.year}: ${first.title}. ${first.body ?? ''}`)]
      : []),
    item('about-history-founding', 'about', "Jetking's founding and early history", '/about-us', early.map(milestone).join(' ')),
    item('about-history-recent', 'about', "Jetking's recent milestones", '/about-us', recent.map(milestone).join(' ')),
    item('about-achievements', 'about', 'Jetking awards and achievements', '/about-us', about.achievements.map((a) => `${a.title}: ${a.body}`).join(' ')),
    ...(about.partnerships.length
      ? [item('about-partnerships', 'about', 'Jetking partners', '/about-us', about.partnerships.map((p) => `${p.name}: ${p.body}`).join(' '))]
      : []),
  ];
}

/* ── Placements ────────────────────────────────────────────────────────── */

async function placementItems(): Promise<CorpusItem[]> {
  const p = await content.getPlacementsPage();
  return [
    item(
      'placement-records',
      'placement',
      'Jetking placement records — companies that hired students',
      '/placements',
      `Students placed at companies including: ${p.placedCandidates.map((c) => `${c.name} at ${c.company}`).join(', ')}.`,
    ),
    item(
      'placement-testimonials',
      'placement',
      'Jetking alumni placement testimonials',
      '/placements',
      p.testimonials.map((t) => `${t.name}, ${t.role}: "${t.quote}"`).join(' '),
    ),
    item(
      'placement-process',
      'placement',
      'How Jetking placement support works',
      '/placements',
      `Process: ${p.processSteps.map((s) => `${s.step}. ${s.title}`).join(', ')}. ` +
        `What students gain: ${p.studentBenefits.map((b) => b.title).join(', ')}. ${p.disclaimer}`,
    ),
    item(
      'placement-recruiters',
      'placement',
      'Companies that recruit Jetking students',
      '/placements',
      `Hiring partners include: ${p.recruiters.map((r) => r.name).join(', ')}. ${p.recruitersDisclaimer}`,
    ),
  ];
}

/* ── Landing pages (their page text) ───────────────────────────────────── */

async function franchiseItems(): Promise<CorpusItem[]> {
  const c = await pageCopy(franchiseCopy);
  const why = indexed(c, 'why', ['value', 'label']);
  const jump = indexed(c, 'jump', ['title', 'detail']);
  const launch = indexed(c, 'launch', ['step', 'title', 'body']);
  const market = indexed(c, 'market', ['value', 'label']);
  const courses = indexed(c, 'courses', ['title', 'body']);
  const bands = [c['investment.band.0'], c['investment.band.1'], c['investment.band.2']].filter(Boolean);
  const P = '/franchise';

  return [
    item('franchise-why-stats', 'franchise', 'Why partner with Jetking — franchise track record', P, why.map((s) => `${s.value} ${s.label}`).join(', ')),
    item('franchise-support', 'franchise', 'Franchise partner support from Jetking', P, jump.map((s) => `${s.title}: ${s.detail}`).join(' ')),
    item('franchise-launch-process', 'franchise', 'Jetking franchise launch process', P, launch.map((s) => `${s.step}. ${s.title}: ${s.body}`).join(' ')),
    item('franchise-market-opportunity', 'franchise', 'IT training market opportunity for Jetking franchisees', P, market.map((s) => `${s.value} — ${s.label}`).join('. ')),
    item('franchise-course-categories', 'franchise', 'Course categories offered at Jetking franchise centres', P, courses.map((s) => `${s.title}: ${s.body}`).join(' ')),
    item(
      'franchise-investment',
      'franchise',
      'Jetking franchise investment and contact',
      P,
      `Investment capacity bands: ${bands.join(', ')}. Franchise enquiries: ${c['contact.email']}.`,
    ),
  ];
}

async function professionalItems(): Promise<CorpusItem[]> {
  const c = await pageCopy(professionalCopy);
  const impact = indexed(c, 'impact', ['value', 'label']);
  const benefits = indexed(c, 'benefits', ['title', 'detail']);
  const flex = indexed(c, 'flex', ['label']);
  const stories = indexed(c, 'stories', ['name', 'from', 'to', 'hike', 'quote']);
  const P = '/professional';

  return [
    item(
      'professional-impact-stats',
      'professional',
      'Jetking outcomes for working professionals',
      P,
      `${impact.map((s) => `${s.value} — ${s.label}`).join('; ')}.`,
    ),
    item('professional-benefits', 'professional', 'Why working professionals choose Jetking to upskill', P, benefits.map((b) => `${b.title}: ${b.detail}`).join(' ')),
    item('professional-flexible-batches', 'professional', 'Flexible batch options for working professionals', P, `Batch formats: ${flex.map((f) => f.label).join(', ')}.`),
    item(
      'professional-success-stories',
      'professional',
      'Working-professional success stories at Jetking',
      P,
      stories.map((s) => `${s.name}, ${s.from} to ${s.to} (${s.hike} hike): "${s.quote}"`).join(' '),
    ),
  ];
}

async function parentItems(counts: { centres: number; cities: number }): Promise<CorpusItem[]> {
  const c = await pageCopy(parentCopy);
  const loves = indexed(c, 'loves', ['label']).map((l) => fill(l.label ?? '', { since: SINCE_FOUNDED }));
  const journey = indexed(c, 'journey', ['title', 'detail']);
  const trust = indexed(c, 'trust', ['value', 'label']);
  const P = '/parent';
  // Trust figures: the first is the live centre count, the rest are the page's own words.
  // Page order is: centres, "<Support> Placement Assistance", "<Industry> Aligned Curriculum", "Trusted Brand Legacy" —
  // the stat's headline word only belongs in the sentence for the curriculum one ("industry aligned curriculum").
  const trustWords = trust.slice(1).map((t, i) => lower(i === 1 ? `${t.value} ${t.label}` : t.label ?? ''));

  return [
    item(
      'parent-trust-stats',
      'parent',
      'Why parents trust Jetking',
      P,
      `${counts.centres} ${lower(trust[0]?.label ?? 'centres to visit in person')} across ${counts.cities} cities, ${trustWords.join(', ')} ${SINCE_FOUNDED.toLowerCase()}.`,
    ),
    item('parent-loves', 'parent', 'What parents value about Jetking', P, `${loves.join(', ')}.`),
    item('parent-journey-steps', 'parent', "A student's journey at Jetking, for parents", P, `${journey.map((j) => `${j.title} ${j.detail}`).join(' → ')}.`),
  ];
}

async function studentItems(): Promise<CorpusItem[]> {
  const c = await pageCopy(studentCopy);
  const benefits = indexed(c, 'benefits', ['title', 'detail']);
  return [item('student-benefits', 'student', 'What students get at Jetking', '/student', benefits.map((b) => `${b.title}: ${b.detail}`).join(' '))];
}

// Certification tracks are brand names rather than page prose, so they stay a code list.
const CERTIFICATIONS = ['Cisco', 'CompTIA', 'Red Hat', 'CEH', 'AWS', 'Microsoft Azure', 'Google Cloud', 'Kubernetes', 'Docker', 'Linux', 'Splunk', 'Checkpoint'];

async function exploreItems(): Promise<CorpusItem[]> {
  const c = await pageCopy(exploreCopy);
  const reasons = indexed(c, 'reasons', ['title', 'detail']);
  const universities = indexed(c, 'universities', ['name']);
  const affiliations = indexed(c, 'affiliation', ['name']);
  const P = '/explore';

  return [
    item('explore-reasons', 'explore', "Why choose Jetking — every student's reasons", P, reasons.map((r) => `${r.title}: ${r.detail}`).join(' ')),
    item('explore-university-partners', 'explore', 'Universities and institutions Jetking partners with', P, `Jetking collaborates with: ${universities.map((u) => u.name).join(', ')}.`),
    item('explore-certification-partners', 'explore', 'Industry certifications available through Jetking', P, `Certification tracks include: ${CERTIFICATIONS.join(', ')}.`),
    item('explore-affiliations', 'explore', 'Jetking affiliations and accreditations', P, `Jetking is affiliated with: ${affiliations.map((a) => a.name).join(', ')}.`),
  ];
}

/* ── Legal pages ───────────────────────────────────────────────────────── */

const LEGAL_PATHS: Record<string, string> = {
  'privacy-policy': '/privacy-policy',
  'terms-conditions': '/terms-conditions',
  'enrollment-terms-and-conditions': '/enrollment-terms-and-conditions',
};

/** Same rule as the Guide corpus (risk R4): money amounts never go into retrievable text. */
const HAS_AMOUNT = /(?:\bRs\.?\s?\d|₹|\bINR\b|\bUSD\b|\$\s?\d)/i;
/**
 * Conditional placement/job guarantees stay on the legal page for people reading it, but are kept out of what
 * the chatbot retrieves: the site's placement pages state that nothing is guaranteed, and a chatbot paraphrasing
 * "we can guarantee placement" would contradict that.
 */
const PROMISES_OUTCOME = /\b(?:placement|job)\s+guarantee/i;
const MAX_SECTION_CHARS = 1100;

function blockText(block: LegalBlock): string {
  switch (block.t) {
    case 'h2':
    case 'h3':
    case 'p':
      return block.text;
    case 'ul':
    case 'ol':
      return block.items.map((i) => `${i.m ? `${i.m} ` : ''}${i.text}`).join(' ');
    case 'table':
      return [block.head.join(' | '), ...block.rows.map((r) => r.join(' | '))].join('. ');
    case 'img':
      return '';
  }
}

/** A single paragraph longer than a passage is cut at sentence boundaries so retrieval never truncates mid-clause. */
function splitLong(text: string): string[] {
  if (text.length <= MAX_SECTION_CHARS) return [text];
  const out: string[] = [];
  let current = '';
  for (const sentence of text.split(/(?<=[.;:!?])\s+/)) {
    if (current && current.length + sentence.length > MAX_SECTION_CHARS) {
      out.push(current);
      current = '';
    }
    current += `${current ? ' ' : ''}${sentence}`;
  }
  if (current) out.push(current);
  return out;
}

/** Splits a legal document into passages at its headings, then at paragraph boundaries so none runs long. */
function legalItems(doc: LegalDoc): CorpusItem[] {
  const path = LEGAL_PATHS[doc.slug] ?? `/${doc.slug}`;
  const sections: Array<{ heading: string; parts: string[] }> = [{ heading: doc.title, parts: [] }];
  for (const block of doc.blocks) {
    if (block.t === 'h2' || block.t === 'h3') {
      sections.push({ heading: block.text, parts: [] });
      continue;
    }
    const current = sections[sections.length - 1]!;
    // A section whose heading names a guarantee is dropped whole; so is any single passage that promises one.
    if (PROMISES_OUTCOME.test(current.heading)) continue;
    const text = blockText(block);
    if (text && !HAS_AMOUNT.test(text) && !PROMISES_OUTCOME.test(text)) current.parts.push(text);
  }

  const out: CorpusItem[] = [];
  sections.forEach((section, index) => {
    if (section.parts.length === 0) return;
    let buffer = '';
    let part = 1;
    const flush = () => {
      if (!buffer.trim()) return;
      out.push(
        item(
          `legal-${doc.slug}-${index + 1}${part > 1 ? `-${part}` : ''}`,
          'info',
          section.heading === doc.title ? doc.title : `${doc.title} — ${section.heading}`,
          path,
          buffer,
        ),
      );
      part += 1;
      buffer = '';
    };
    for (const text of section.parts.flatMap(splitLong)) {
      if (buffer && buffer.length + text.length > MAX_SECTION_CHARS) flush();
      buffer += `${buffer ? ' ' : ''}${text}`;
    }
    flush();
  });
  return out;
}

/* ── Entry point ───────────────────────────────────────────────────────── */

export async function buildSiteCorpusItems(counts: { courses: number; centres: number; cities: number }): Promise<CorpusItem[]> {
  const [about, placements, franchise, professional, parent, student, explore, legalDocs] = await Promise.all([
    aboutItems(counts),
    placementItems(),
    franchiseItems(),
    professionalItems(),
    parentItems(counts),
    studentItems(),
    exploreItems(),
    content.listLegalDocuments(),
  ]);
  return [...about, ...placements, ...franchise, ...professional, ...parent, ...student, ...explore, ...legalDocs.flatMap(legalItems)];
}
