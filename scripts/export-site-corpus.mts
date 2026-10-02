/**
 * Exports every record exposed by the website ContentSource into a compact
 * retrieval corpus for Jetking AI.
 *
 * This is the bridge between the website CMS/fixtures and the chatbot. It
 * intentionally uses the same ContentSource as the pages, so switching
 * CONTENT_SOURCE from local to admin changes both surfaces together.
 */
import './load-dotenv.mjs';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCorpus } from '@/guide/corpus';
import type { ChunkType } from '@/guide/types';
import { content } from '@/lib/content';
import { legacyStats, SINCE_FOUNDED } from '@/lib/brand-facts';
import {
  ABOUT_HERO,
  ACHIEVEMENTS,
  DIRECTORS,
  MANAGEMENT_TEAM,
  PURPOSE,
  TIMELINE,
  VALUES,
} from '@/components/about/data';
import {
  PLACED_CANDIDATES,
  PLACEMENT_DISCLAIMER,
  PROCESS_STEPS,
  STUDENT_BENEFITS,
  TESTIMONIALS as PLACEMENT_TESTIMONIALS,
} from '@/components/placements/data';
import {
  COURSES as FRANCHISE_COURSES,
  FRANCHISE_INVESTMENT,
  JUMP_START,
  LAUNCH_STEPS,
  MARKET_STATS,
  WHY_STATS as FRANCHISE_WHY_STATS,
} from '@/components/franchise/data';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(HERE, '../src/content/website-corpus.json');

const typeMap: Record<ChunkType, string> = {
  course: 'course',
  faq: 'faq',
  post: 'blog',
  news: 'blog',
  centre: 'centre',
  city: 'centre',
  policy: 'info',
  faculty: 'info',
  placement: 'placement',
};

const [chunks, courses, centres, cities] = await Promise.all([
  buildCorpus(),
  content.listCourses(),
  content.listCentres(),
  content.listCities(),
]);
const items = chunks.map((chunk) => ({
  id: chunk.id,
  type: typeMap[chunk.type],
  title: chunk.title,
  path: chunk.url,
  text: chunk.text,
  source: 'website-content-source' as const,
}));

/**
 * The About and Placements pages carry real, verified Jetking copy (company
 * history, leadership, published placement records) that lives only in their
 * component data files — not behind the `content` ContentSource, so
 * `buildCorpus()` never sees it and the chatbot has been answering "who
 * founded Jetking" / "which companies recruit from Jetking" from stray blog
 * mentions instead of this source-of-truth data. Folded in by hand here
 * rather than promoting About/Placements into a full ContentSource type:
 * this is static company copy, not admin-editable records.
 */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const earlyTimeline = TIMELINE.filter((m) => Number(m.year) < 2010);
const recentTimeline = TIMELINE.filter((m) => Number(m.year) >= 2010);
const milestoneText = (m: { year: string; title: string; body?: string }) =>
  `${m.year}: ${m.title}${m.body ? ` — ${m.body}` : ''}`;

// build-index.mjs's section-3 merge prepends `${item.title}\n` to every
// website.items row itself (matching how buildCorpus()'s chunks are plain
// body text with no title line) — so `text` below must NOT repeat the title,
// or the embedded passage ends up with it duplicated ("About Jetking About
// Jetking …"), diluting the vector.
const aboutItems = [
  {
    id: 'about-overview',
    type: 'about',
    title: 'About Jetking',
    path: '/about-us',
    text:
      `${ABOUT_HERO.lede} ` +
      `${PURPOSE.map((p) => `${p.title}: ${p.body}`).join(' ')} ` +
      `Values: ${VALUES.join(', ')}. ` +
      `${legacyStats({ courses: courses.length, centres: centres.length, cities: cities.length }).map((s) => `${s.value} ${s.label}`).join(', ')}.`,
    source: 'website-content-source' as const,
  },
  ...[...DIRECTORS, ...MANAGEMENT_TEAM]
    .filter((leader) => leader.name)
    .map((leader) => {
      const role = leader.role ?? 'Management team, Jetking';
      return {
        id: `about-leader-${slugify(leader.name)}`,
        type: 'about',
        title: leader.name,
        path: '/about-us',
        text: leader.bio ? `${role}\n${leader.bio.join(' ')}` : role,
        source: 'website-content-source' as const,
      };
    }),
  {
    // A dedicated, single-fact item: earlyTimeline below folds this founding
    // fact in among eight other 1947-2008 milestones, which dilutes the
    // embedding enough that "who founded Jetking?" fails to surface it (a
    // franchise FAQ ranked above it in testing) — the same "one focused
    // passage per fact" lesson build-index.mjs already applies to fees/
    // eligibility/duration rows.
    id: 'about-founder',
    type: 'about',
    title: 'Who founded Jetking',
    path: '/about-us',
    text: `Jetking's founder — ${TIMELINE[0]!.year}: ${TIMELINE[0]!.title}. ${TIMELINE[0]!.body ?? ''}`,
    source: 'website-content-source' as const,
  },
  {
    id: 'about-history-founding',
    type: 'about',
    title: "Jetking's founding and early history",
    path: '/about-us',
    text: earlyTimeline.map(milestoneText).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'about-history-recent',
    type: 'about',
    title: "Jetking's recent milestones",
    path: '/about-us',
    text: recentTimeline.map(milestoneText).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'about-achievements',
    type: 'about',
    title: 'Jetking awards and achievements',
    path: '/about-us',
    text: ACHIEVEMENTS.map((a) => `${a.title}: ${a.body}`).join(' '),
    source: 'website-content-source' as const,
  },
];

const placementItems = [
  {
    id: 'placement-records',
    type: 'placement',
    title: 'Jetking placement records — companies that hired students',
    path: '/placements',
    text: `Students placed at companies including: ${PLACED_CANDIDATES.map((c) => `${c.name} at ${c.company}`).join(', ')}.`,
    source: 'website-content-source' as const,
  },
  {
    id: 'placement-testimonials',
    type: 'placement',
    title: 'Jetking alumni placement testimonials',
    path: '/placements',
    text: PLACEMENT_TESTIMONIALS.map((t) => `${t.name}, ${t.role}: "${t.quote}"`).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'placement-process',
    type: 'placement',
    title: 'How Jetking placement support works',
    path: '/placements',
    text:
      `Process: ${PROCESS_STEPS.map((s) => `${s.step}. ${s.title}`).join(', ')}. ` +
      `What students gain: ${STUDENT_BENEFITS.join(', ')}. ${PLACEMENT_DISCLAIMER}`,
    source: 'website-content-source' as const,
  },
];

// The franchise page (src/components/franchise/FranchiseLandingLight.tsx)
// carries real operational facts — support pillars, the launch process,
// market-opportunity stats, investment bands — that live only in that page
// component, outside the ContentSource `buildCorpus()` reads from. Same gap
// as About/Placements: a prospective franchisee asking the chatbot "what
// support does Jetking give franchise partners" had nothing to draw on.
const franchiseItems = [
  {
    id: 'franchise-why-stats',
    type: 'franchise',
    title: 'Why partner with Jetking — franchise track record',
    path: '/franchise',
    text: FRANCHISE_WHY_STATS.map((s) => `${s.value} ${s.label}`).join(', '),
    source: 'website-content-source' as const,
  },
  {
    id: 'franchise-support',
    type: 'franchise',
    title: 'Franchise partner support from Jetking',
    path: '/franchise',
    text: JUMP_START.map((s) => `${s.title}: ${s.detail}`).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'franchise-launch-process',
    type: 'franchise',
    title: 'Jetking franchise launch process',
    path: '/franchise',
    text: LAUNCH_STEPS.map((s) => `${s.step}. ${s.title}: ${s.body}`).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'franchise-market-opportunity',
    type: 'franchise',
    title: 'IT training market opportunity for Jetking franchisees',
    path: '/franchise',
    text: MARKET_STATS.map((s) => `${s.value} — ${s.label}`).join('. '),
    source: 'website-content-source' as const,
  },
  {
    id: 'franchise-course-categories',
    type: 'franchise',
    title: 'Course categories offered at Jetking franchise centres',
    path: '/franchise',
    text: FRANCHISE_COURSES.map((c) => `${c.title}: ${c.body}`).join(' '),
    source: 'website-content-source' as const,
  },
  {
    id: 'franchise-investment',
    type: 'franchise',
    title: 'Jetking franchise investment and contact',
    path: '/franchise',
    text: `Investment capacity bands: ${FRANCHISE_INVESTMENT.capacityBands.join(', ')}. Franchise enquiries: ${FRANCHISE_INVESTMENT.contactEmail}.`,
    source: 'website-content-source' as const,
  },
];

/**
 * The Professional, Parent, Student and Explore landing pages carry the same
 * class of real, page-only copy as About/Placements/Franchise above — persona
 * stats, named hiring partners, testimonials, "why choose Jetking" reasons —
 * that live in component arrays, not the ContentSource `buildCorpus()` reads.
 * Without this, a working-professional or parent visitor's questions ("which
 * companies hire from Jetking", "is Jetking safe for my child") had nothing
 * persona-specific to draw on even though the answer is on the page they're
 * standing on.
 *
 * The values below are hand-copied from their source arrays rather than
 * imported, because those files (src/components/professional/data.ts,
 * .../parent/ParentLanding.tsx, .../student/StudentLanding.tsx,
 * .../explore/ExploreLanding.tsx) also import lucide-react icon components —
 * unavailable under this script's `--conditions=react-server` runtime, same
 * reason franchise/data.ts documents for keeping icons out of its own arrays.
 * Keep these in sync by hand if the source arrays change.
 */
const professionalItems = [
  {
    id: 'professional-impact-stats',
    type: 'professional',
    title: 'Jetking outcomes for working professionals',
    path: '/professional',
    text: `Hands-on portfolio-ready lab projects, industry credentials included, placement assistance and interview prep. Training IT talent ${SINCE_FOUNDED.toLowerCase()}.`,
    source: 'website-content-source' as const,
  },
  {
    id: 'professional-benefits',
    type: 'professional',
    title: 'Why working professionals choose Jetking to upskill',
    path: '/professional',
    text:
      'Hands-on Projects: Build portfolio-ready work in guided labs — not theory-only sessions. ' +
      'Recognized Certifications: Industry credentials included to strengthen your professional profile. ' +
      'Flexible Batches: Weekend and evening options designed around a full-time work schedule. ' +
      'Career Counsellors: Dedicated guidance on courses, timing, and your next career move. ' +
      'Interview Preparation: Mock interviews and resume support before you step into hiring loops. ' +
      'Hiring Network: Access to Jetking’s hiring partners across roles, sectors, and cities.',
    source: 'website-content-source' as const,
  },
  {
    id: 'professional-flexible-batches',
    type: 'professional',
    title: 'Flexible batch options for working professionals',
    path: '/professional',
    text: 'Batch formats: Weekend Batches, Evening Batches, Online Live Classes, Career Break Friendly.',
    source: 'website-content-source' as const,
  },
  {
    id: 'professional-success-stories',
    type: 'professional',
    title: 'Working-professional success stories at Jetking',
    path: '/professional',
    text:
      'Rahul M., System Admin to Cloud Engineer (70% hike): "Evening batches meant I could upskill without quitting. Within 8 months I moved to a cloud role with a 70% salary hike." ' +
      'Priya K., IT Support to Cyber Security Analyst (85% hike): "The hands-on labs and mock interviews made the career switch feel achievable — not just theoretical." ' +
      'Vikram S., Network Engineer to DevOps Lead (60% hike): "Jetking mapped my existing skills to what hiring managers actually wanted. The DevOps track was spot on."',
    source: 'website-content-source' as const,
  },
];

const parentItems = [
  {
    id: 'parent-trust-stats',
    type: 'parent',
    title: 'Why parents trust Jetking',
    path: '/parent',
    text: `${centres.length} centres to visit in person across ${cities.length} cities, placement assistance, industry aligned curriculum, trusted brand legacy ${SINCE_FOUNDED.toLowerCase()}.`,
    source: 'website-content-source' as const,
  },
  {
    id: 'parent-loves',
    type: 'parent',
    title: 'What parents value about Jetking',
    path: '/parent',
    text: 'Safe & Secure Learning Environment, Dedicated Mentors, Hands-on Labs, Career Counselling, Trusted Legacy Since 1947.',
    source: 'website-content-source' as const,
  },
  {
    id: 'parent-journey-steps',
    type: 'parent',
    title: "A student's journey at Jetking, for parents",
    path: '/parent',
    text: 'Career Guidance & Counselling → Choose the Right Course → Hands-on Training & Projects → Placement Support → Successful Career.',
    source: 'website-content-source' as const,
  },
];

const studentItems = [
  {
    id: 'student-benefits',
    type: 'student',
    title: 'What students get at Jetking',
    path: '/student',
    text:
      'Live Projects: Build portfolio-ready work in guided labs, not slide decks. ' +
      'Expert Trainers: Learn from faculty who teach what centres actually run. ' +
      'Flexible Batches: Weekday and weekend options so study fits your schedule. ' +
      '100% Support: Counsellors guide courses, centres and next steps — no pressure.',
    source: 'website-content-source' as const,
  },
];

const exploreItems = [
  {
    id: 'explore-reasons',
    type: 'explore',
    title: "Why choose Jetking — every student's reasons",
    path: '/explore',
    text:
      'Trained & Certified Faculty: Award winning and internationally bench-marked training faculty. ' +
      'Practical Foundation through Labs: One computer per student, so every theory lesson gets hands-on practice. ' +
      'Placement Support: We take every necessary step to help you get a suitable job on completing the course. ' +
      'Scenario Based Learning: Case studies and animated scenarios give you real-life problem-solving practice. ' +
      'SmartLabPlus Teaching Methodology: Innovative methods of teaching that make learning fun and easy to remember. ' +
      'Countrywide Network: A well-established, nationally recognised institute with centres across India. ' +
      'Personality Development: Builds confidence and supports better job and salary prospects. ' +
      'State-of-the-Art Infrastructure: Every centre is equipped for a successful learning environment. ' +
      'De-stress with Yoga: A relaxed mind finds it easier to learn. ' +
      'Partnership with NSDC: Associated with the National Skill Development Corporation as a skill development partner.',
    source: 'website-content-source' as const,
  },
  {
    id: 'explore-university-partners',
    type: 'explore',
    title: 'Universities and institutions Jetking partners with',
    path: '/explore',
    text: 'Jetking collaborates with: Yenepoya (Deemed to be University), Tilak Maharashtra Vidyapeeth Pune, Pearson, Lincoln University College.',
    source: 'website-content-source' as const,
  },
  {
    id: 'explore-certification-partners',
    type: 'explore',
    title: 'Industry certifications available through Jetking',
    path: '/explore',
    text: 'Certification tracks include: Cisco, CompTIA, Red Hat, CEH, AWS, Microsoft Azure, Google Cloud, Kubernetes, Docker, Linux, Splunk, Checkpoint.',
    source: 'website-content-source' as const,
  },
  {
    id: 'explore-affiliations',
    type: 'explore',
    title: 'Jetking affiliations and accreditations',
    path: '/explore',
    text: 'Jetking is affiliated with: Skill India, NSDC, Red Hat, Delhi Capitals.',
    source: 'website-content-source' as const,
  },
];

items.push(
  ...aboutItems,
  ...placementItems,
  ...franchiseItems,
  ...professionalItems,
  ...parentItems,
  ...studentItems,
  ...exploreItems,
);

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(
  OUTPUT,
  `${JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      contentSource: process.env['CONTENT_SOURCE'] ?? 'local',
      count: items.length,
      items,
      structured: { courses, centres, cities },
    },
    null,
    2,
  )}\n`,
  'utf8',
);

const byType = Object.groupBy(items, (item) => item.type);
const distribution = Object.fromEntries(
  Object.entries(byType).map(([type, rows]) => [type, rows?.length ?? 0]),
);

console.log(`Exported ${items.length} website records to src/content/website-corpus.json`);
console.log(`By type: ${JSON.stringify(distribution)}`);
