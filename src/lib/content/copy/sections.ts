/**
 * Page-section show/hide, stored as ordinary page_copy strings so no schema
 * change is needed: `sections.<id>.visible` is `"true"` (default) or `"false"`.
 *
 * Editors toggle these in Page text; page components call `isSectionVisible`
 * before rendering each block. Content fields for a hidden section stay editable
 * so turning it back on does not lose copy.
 */

/** Human labels for known section ids — used by the Page text admin toggles. */
export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero banner',
  placementBand: 'Placement band',
  programs: 'Courses',
  marquee: 'Trusted-by logos',
  why: 'Why Jetking',
  how: 'How it works',
  proof: 'Placement stories',
  recognition: 'Recognition',
  network: 'Centre network',
  blog: 'Blog teaser',
  counsellor: 'Counsellor band',
  cta: 'Closing call to action',
  faq: 'FAQ',
  franchise: 'Franchise band',
  legacy: 'Legacy stats',
  purpose: 'Purpose & values',
  leaders: 'Leadership',
  timeline: 'History timeline',
  achievements: 'Achievements',
  partnerships: 'Partnerships',
  affiliations: 'Affiliations',
  families: 'What families value',
  future: 'Toward the future',
  disclaimer: 'Placement disclaimer',
  recruiters: 'Recruiters',
  testimonials: 'Testimonials',
  process: 'How placement works',
  benefits: 'What you build',
  offers: 'Sample offer letters',
  centre: 'Centre callout',
  stories: 'Partner stories',
  jump: 'Jump-start support',
  launch: 'Launch steps',
  courses: 'Courses you can offer',
  investment: 'Investment',
  enquire: 'Franchise enquiry',
  opportunity: 'Market opportunity',
  contact: 'Contact bar',
  explorer: 'Course explorer',
  guidance: 'Guidance cards',
  topics: 'FAQ topics',
  more: 'Need more help',
  list: 'Article list',
  index: 'Browse / index',
  form: 'Enquiry form',
  next: 'What happens next',
  reports: 'Reports & disclosures',
  pages: 'Page groups',
  centres: 'Centres list',
  intro: 'Page intro',
  body: 'Document body',
  alsoRead: 'Also read links',
  sites: 'Sister sites',
  ai: 'AI & Robotics',
  blockchain: 'Blockchain',
  header: 'Site header',
  footer: 'Site footer',
  mobileBar: 'Mobile contact bar',
  announcement: 'Announcement bar',
  exitIntent: 'Exit-intent popup',
  notFound: '404 page',
  // Course detail (/courses/[slug])
  courseHero: 'Course banner',
  courseEnquiry: 'Course enquiry form',
  courseFacts: 'Key highlights',
  courseWhy: 'Why this course',
  courseInternship: 'Internship & placements',
  coursePhoto: 'Photo band',
  courseUniversity: 'About the university',
  courseJourney: 'Learning journey',
  courseCurriculum: 'Curriculum',
  courseTools: 'Tools & technologies',
  courseCerts: 'Certifications',
  courseRecords: 'Placement records',
  courseCentres: 'Centre advantage',
  courseClosing: 'Closing call to action',
  courseFaqs: 'Course FAQs',
  courseRelated: 'Similar courses',
};

const VISIBLE_KEY = /^sections\.([^.]+)\.visible$/;

export function sectionVisibleKey(id: string): string {
  return `sections.${id}.visible`;
}

/** Defaults for a page: every listed section starts visible. */
export function sectionVisibilityDefaults(ids: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of ids) out[sectionVisibleKey(id)] = 'true';
  return out;
}

/**
 * Whether a section should render. Missing / empty / anything other than an
 * explicit off-value keeps the section on, so older page_copy records stay safe.
 */
export function isSectionVisible(copy: Record<string, string>, id: string): boolean {
  const value = (copy[sectionVisibleKey(id)] ?? 'true').trim().toLowerCase();
  return value !== 'false' && value !== '0' && value !== 'no' && value !== 'off' && value !== 'hidden';
}

export function isSectionVisibilityKey(key: string): boolean {
  return VISIBLE_KEY.test(key);
}

export function listSectionToggles(
  defaults: Record<string, string>,
): Array<{ id: string; key: string; label: string }> {
  const items: Array<{ id: string; key: string; label: string }> = [];
  for (const key of Object.keys(defaults)) {
    const match = VISIBLE_KEY.exec(key);
    if (!match) continue;
    const id = match[1]!;
    items.push({ id, key, label: SECTION_LABELS[id] ?? humanizeId(id) });
  }
  return items;
}

function humanizeId(id: string): string {
  const spaced = id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
