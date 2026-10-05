import type { CmsCollection } from '@/lib/cms/types';

/**
 * One place that says what the admin manages and where it shows up on the public website.
 * The sidebar, dashboard, collection pages and the Website map all read from here, so the
 * admin's structure can't drift from the site's.
 *
 * `live: false` means the website does NOT render this collection — it only feeds the Jetking
 * Guide chatbot's knowledge base (`src/guide/corpus.ts`) or has no consumer at all — and the
 * editor says so up front rather than letting someone believe a save changes a public page.
 */

export interface AppearsOn {
  label: string;
  /** A real, linkable public URL — omit for dynamic patterns like /courses/[slug]. */
  href?: string;
}

export interface AdminCollection {
  key: CmsCollection;
  /** Folder under /admin. Differs from `key` for the few collections whose URL was chosen first. */
  route: string;
  idKey: 'slug' | 'id';
  label: string;
  icon: string;
  group: string;
  description: string;
  live: boolean;
  appearsOn: AppearsOn[];
  /** Shown above the editor when `live` is false (or something else the editor must know). */
  note?: string;
}

export const GROUP = {
  website: 'Website',
  personalisation: 'Personalisation',
  guide: 'Jetking Guide',
} as const;

export const COLLECTIONS: AdminCollection[] = [
  {
    key: 'courses',
    route: 'courses',
    idKey: 'slug',
    label: 'Courses',
    icon: 'GraduationCap',
    group: GROUP.website,
    description: 'Every course page, the catalogue, and the course lists across the site.',
    live: true,
    appearsOn: [
      { label: 'Course catalogue', href: '/courses' },
      { label: 'Course pages' },
      { label: 'Home', href: '/' },
      { label: 'Centre & city pages' },
      { label: 'Enquiry form', href: '/enquiry' },
    ],
  },
  {
    key: 'centres',
    route: 'centres',
    idKey: 'slug',
    label: 'Centres',
    icon: 'Building2',
    group: GROUP.website,
    description: 'Each centre’s page, address, contact details and what it teaches.',
    live: true,
    appearsOn: [
      { label: 'Centre directory', href: '/centres' },
      { label: 'Centre pages' },
      { label: 'Home centre map', href: '/' },
      { label: 'Enquiry form', href: '/enquiry' },
    ],
  },
  {
    key: 'cities',
    route: 'cities',
    idKey: 'slug',
    label: 'Cities',
    icon: 'MapPin',
    group: GROUP.website,
    description: 'City landing pages: the intro copy and SEO that group a city’s centres.',
    live: true,
    appearsOn: [{ label: 'City pages' }, { label: 'Centre directory', href: '/centres' }, { label: 'About', href: '/about-us' }],
  },
  {
    key: 'posts',
    route: 'posts',
    idKey: 'slug',
    label: 'Blog posts',
    icon: 'Newspaper',
    group: GROUP.website,
    description: 'Articles on the blog and the latest-articles strip on the home page.',
    live: true,
    appearsOn: [{ label: 'Blog', href: '/blog' }, { label: 'Article pages' }, { label: 'Home', href: '/' }],
  },
  {
    key: 'faqs',
    route: 'faqs',
    idKey: 'id',
    label: 'FAQs',
    icon: 'HelpCircle',
    group: GROUP.website,
    description: 'Questions answered on the FAQ page, course pages and the franchise page.',
    live: true,
    appearsOn: [{ label: 'FAQ', href: '/faq' }, { label: 'Course pages' }, { label: 'Franchise', href: '/franchise' }],
  },
  {
    key: 'trust_signals',
    route: 'trust-signals',
    idKey: 'id',
    label: 'Trust signals',
    icon: 'BadgeCheck',
    group: GROUP.website,
    description: 'Headline figures (students, placements, centres…) with the source that verifies each.',
    live: false,
    appearsOn: [],
    note: 'The home and landing-page loaders fetch these, but no page displays them today, so saving here does not change what visitors see.',
  },
  {
    key: 'homepage_variants',
    route: 'variants',
    idKey: 'id',
    label: 'Homepage variants',
    icon: 'LayoutTemplate',
    group: GROUP.personalisation,
    description: 'The testimonials shown on each audience landing page.',
    live: true,
    note: 'Only a variant’s testimonials reach the website today. Its banner, CTA, stories and video fields are not rendered by any page yet, and the home page does not use variants.',
    appearsOn: [
      { label: 'Students', href: '/student' },
      { label: 'Parents', href: '/parent' },
      { label: 'Professionals', href: '/professional' },
      { label: 'Franchise', href: '/franchise' },
    ],
  },
  {
    key: 'persona_rules',
    route: 'rules',
    idKey: 'id',
    label: 'Persona rules',
    icon: 'SlidersHorizontal',
    group: GROUP.personalisation,
    description: 'IF/THEN rules that pick a homepage variant for a visitor.',
    live: false,
    appearsOn: [],
    note: 'Nothing on the website reads these rules yet, so saving here does not change what visitors see. The rule matcher exists in code but is not wired to any page.',
  },
  {
    key: 'policies',
    route: 'policies',
    idKey: 'slug',
    label: 'Policies',
    icon: 'ShieldCheck',
    group: GROUP.guide,
    description: 'Policy summaries the Jetking Guide chatbot answers from.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only. The public Privacy, Terms and Enrollment pages are managed in code (src/lib/legal), so editing here will not change them.',
  },
  {
    key: 'faculty',
    route: 'faculty',
    idKey: 'slug',
    label: 'Faculty',
    icon: 'UserCog',
    group: GROUP.guide,
    description: 'Faculty profiles the Jetking Guide chatbot can cite.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only; no website page lists them. The About page’s leadership section is managed in code.',
  },
  {
    key: 'placements',
    route: 'placements',
    idKey: 'id',
    label: 'Placements',
    icon: 'Trophy',
    group: GROUP.guide,
    description: 'Placement summaries and stats the Jetking Guide chatbot answers from.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only. The public Placements page (recruiters, stats, testimonials) is managed in code (src/components/placements), so editing here will not change it.',
  },
];

export function collectionByKey(key: CmsCollection): AdminCollection {
  const found = COLLECTIONS.find((c) => c.key === key);
  if (!found) throw new Error(`No admin registry entry for collection "${key}".`);
  return found;
}

/**
 * Every public page and where its content comes from. `cms` entries link into the editor;
 * `code` entries are the honest answer for pages whose copy lives in the repo — the admin can't
 * change them, and the map says so instead of hiding it.
 */
export interface SitePage {
  name: string;
  path: string;
  href?: string;
  cms: CmsCollection[];
  /** What on this page is NOT editable here. Empty when the whole page is CMS-driven. */
  code?: string;
}

export const SITE_PAGES: SitePage[] = [
  {
    name: 'Home',
    path: '/',
    href: '/',
    cms: ['courses', 'centres', 'cities', 'posts'],
    code: 'Hero, section copy, certification & employer logos, recognitions',
  },
  { name: 'Course catalogue', path: '/courses', href: '/courses', cms: ['courses', 'centres', 'cities'] },
  { name: 'Course page', path: '/courses/[slug]', cms: ['courses', 'faqs', 'centres'] },
  { name: 'Centre directory', path: '/centres', href: '/centres', cms: ['centres', 'cities'] },
  { name: 'City page', path: '/centres/[city]', cms: ['cities', 'centres', 'courses'] },
  { name: 'Centre page', path: '/centres/[city]/[centre]', cms: ['centres'] },
  { name: 'Blog', path: '/blog', href: '/blog', cms: ['posts'] },
  { name: 'Article', path: '/blog/[slug]', cms: ['posts'] },
  { name: 'FAQ', path: '/faq', href: '/faq', cms: ['faqs'] },
  { name: 'Students', path: '/student', href: '/student', cms: ['homepage_variants', 'courses'], code: 'Page copy' },
  { name: 'Parents', path: '/parent', href: '/parent', cms: ['homepage_variants', 'courses'], code: 'Page copy' },
  {
    name: 'Professionals',
    path: '/professional',
    href: '/professional',
    cms: ['homepage_variants', 'courses'],
    code: 'Page copy',
  },
  { name: 'Franchise', path: '/franchise', href: '/franchise', cms: ['homepage_variants', 'faqs'], code: 'Page copy' },
  { name: 'Explore', path: '/explore', href: '/explore', cms: ['courses', 'centres', 'cities', 'posts'], code: 'Page copy' },
  { name: 'Enquiry', path: '/enquiry', href: '/enquiry', cms: ['courses', 'centres', 'cities'], code: 'Form copy (submissions land in Leads)' },
  {
    name: 'About',
    path: '/about-us',
    href: '/about-us',
    cms: ['courses', 'centres', 'cities'],
    code: 'Leadership, timeline, achievements, partnerships (src/components/about)',
  },
  {
    name: 'Placements',
    path: '/placements',
    href: '/placements',
    cms: [],
    code: 'Entire page: stats, recruiters, testimonials, offer letters (src/components/placements)',
  },
  {
    name: 'Investors',
    path: '/investors',
    href: '/investors',
    cms: [],
    code: 'Entire page: contacts and disclosures (src/lib/investors)',
  },
  {
    name: 'Privacy, Terms & Enrollment',
    path: '/privacy-policy',
    href: '/privacy-policy',
    cms: [],
    code: 'Entire pages: legal text (src/lib/legal)',
  },
];
