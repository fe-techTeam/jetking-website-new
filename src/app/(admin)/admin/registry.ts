import type { CmsCollection } from '@/lib/cms/types';
import type { Role } from '@/lib/auth/roles';

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
  /** `list` (default): add/delete records. `fixed`: a set of existing documents. `singleton`: one document. */
  mode?: 'list' | 'fixed' | 'singleton';
  /** Who may open and save it. Defaults to admin + editor. */
  roles?: Role[];
  /** Public URL of one record, with `{field}` placeholders filled from the record (e.g. `/courses/{slug}`). */
  viewPath?: string;
  /** Kept in the database but not offered anywhere in the panel (no menu entry, no page, no search hits). */
  hidden?: boolean;
  /** Records the website never shows (their only page is unreachable), kept in the database but not offered for editing. */
  hiddenRecordIds?: string[];
  /** False for collections that have their own editor and aren't a record count worth charting. */
  dashboard?: boolean;
}

export const GROUP = {
  website: 'Website',
  personalisation: 'Personalisation',
  guide: 'Chatbot',
  /** Records that no public page shows. Folded away in the menu so day-to-day editing stays uncluttered. */
  background: 'Background data',
} as const;

const ALL_COLLECTIONS: AdminCollection[] = [
  {
    key: 'page_copy',
    route: 'page-text',
    idKey: 'id',
    label: 'Page text',
    icon: 'Type',
    group: GROUP.website,
    description:
      'Headings, descriptions, button labels, links and search titles on every page. Site-wide → Contact numbers holds the toll-free Call and WhatsApp lines for sticky bars.',
    live: true,
    dashboard: false,
    appearsOn: [],
  },
  {
    key: 'courses',
    viewPath: '/courses/{slug}',
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
    viewPath: '/centres/{citySlug}/{slug}',
    route: 'centres',
    idKey: 'slug',
    label: 'Centres',
    icon: 'Building2',
    group: GROUP.website,
    description: 'Each centre’s page, address, contact details, gallery and what it teaches.',
    live: true,
    appearsOn: [
      { label: 'Centre directory', href: '/centres' },
      { label: 'Centre pages' },
      { label: 'Home centre map', href: '/' },
      { label: 'Enquiry form', href: '/enquiry' },
    ],
    note: 'Gallery: upload up to four photos here. Empty slots fall back to Page text → Centres (Our centre / Classroom / Team / Labs). Sort order on each centre is used when Centres settings → List sort is Manual.',
  },
  {
    key: 'centres_settings',
    route: 'centres-settings',
    idKey: 'id',
    label: 'Centres settings',
    icon: 'SlidersHorizontal',
    group: GROUP.website,
    description:
      'How centres appear in the public directory and other centre lists: A–Z, manual sort order, or a shuffle that changes every N days.',
    live: true,
    mode: 'singleton',
    appearsOn: [{ label: 'Centre directory', href: '/centres' }, { label: 'Enquiry form', href: '/enquiry' }],
    note: 'Shuffle keeps the same order for the number of days you set, then reshuffles. Manual uses the Sort order number on each centre (lower first).',
  },
  {
    key: 'cities',
    viewPath: '/centres/{slug}',
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
    viewPath: '/blog/{slug}',
    route: 'posts',
    idKey: 'slug',
    label: 'Blog posts',
    icon: 'Newspaper',
    group: GROUP.website,
    description: 'Articles on the blog and the latest-articles strip on the home page.',
    live: true,
    appearsOn: [{ label: 'Blog', href: '/blog' }, { label: 'Article pages' }, { label: 'Home', href: '/' }],
    note: 'Hero image: use a real photograph. Scraped Open Graph / marketing share cards are skipped on the article page; visitors then see Page text → Blog (article.fallbackImage) instead.',
  },
  {
    key: 'about_page',
    route: 'about',
    idKey: 'id',
    label: 'About page',
    icon: 'Info',
    group: GROUP.website,
    description: 'The About page: heading, vision and mission, leadership, company timeline, awards and partners.',
    live: true,
    mode: 'singleton',
    appearsOn: [{ label: 'About', href: '/about-us' }],
    note: 'Set the switch to Draft to show the built-in copy instead of this document.',
  },
  {
    key: 'placements_page',
    route: 'placements-page',
    idKey: 'id',
    label: 'Placements page',
    icon: 'Award',
    group: GROUP.website,
    description: 'Placement stories, process, recruiters, offer letters and the headline figures used across the site.',
    live: true,
    mode: 'singleton',
    appearsOn: [
      { label: 'Placements', href: '/placements' },
      { label: 'Home', href: '/' },
      { label: 'Course pages' },
    ],
    note: 'Set the switch to Draft to show the built-in copy instead of this document. Keep the disclaimer: no figure here may imply a placement guarantee.',
  },
  {
    key: 'investors_page',
    route: 'investors-page',
    idKey: 'id',
    label: 'Investors page',
    icon: 'Landmark',
    group: GROUP.website,
    description: 'Company facts, grievance officer, registrar, key managerial personnel and the disclosure document lists.',
    live: true,
    mode: 'singleton',
    roles: ['admin'],
    appearsOn: [{ label: 'Investors', href: '/investors' }],
    note: 'These are regulatory disclosures (SEBI LODR Regulation 46 and 62). Check every contact and link before publishing; set the switch to Draft to show the built-in copy instead.',
  },
  {
    key: 'legal_documents',
    route: 'legal',
    idKey: 'slug',
    label: 'Legal pages',
    icon: 'Scale',
    group: GROUP.website,
    description: 'The wording of the Privacy Policy, Terms and Conditions, and Enrollment Terms.',
    live: true,
    mode: 'fixed',
    roles: ['admin'],
    appearsOn: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-conditions' },
      { label: 'Enrollment Terms', href: '/enrollment-terms-and-conditions' },
    ],
    note: 'Admins only. These are legal documents: changes go live as soon as they are saved. Set a document to Draft to show the built-in copy instead.',
  },
  {
    key: 'seo_settings',
    route: 'seo-settings',
    idKey: 'id',
    label: 'SEO settings',
    icon: 'Search',
    group: GROUP.website,
    description:
      'Site-wide search: indexing, robots.txt, AI crawlers, sitemap include/exclude, share image, blog cover denylist, always-noindex paths, verification and Organization JSON-LD.',
    live: true,
    mode: 'singleton',
    appearsOn: [{ label: 'robots.txt', href: '/robots.txt' }, { label: 'sitemap.xml', href: '/sitemap.xml' }, { label: 'Every page', href: '/' }],
    note: 'Turning indexing off tells every search engine to stay away — leave it on for the live site. Per-page titles and descriptions are on the SEO overview. Legacy URL redirects are under Redirects.',
  },
  {
    key: 'announcements',
    route: 'announcements',
    idKey: 'id',
    label: 'Announcements',
    icon: 'Megaphone',
    group: GROUP.website,
    description: 'A slim bar at the very top of every page. Shows the most urgent published announcement whose dates are active.',
    live: true,
    appearsOn: [{ label: 'Every page', href: '/' }],
    note: 'Pick a start and end date-time, or leave them empty for no limit. Several active: alert beats promo beats info, then the newest start.',
  },
  {
    key: 'site_navigation',
    route: 'navigation',
    idKey: 'id',
    label: 'Header menu',
    icon: 'PanelTop',
    group: GROUP.website,
    description: 'The links in the site header and its slide-out menu: add, remove, rename and reorder them.',
    live: true,
    mode: 'fixed',
    appearsOn: [{ label: 'Every page', href: '/' }],
    note: 'Published = this menu is shown. Draft = the built-in menu from Page text is shown instead. The first four links also appear in the desktop bar; a link to /courses opens the courses menu.',
  },
  {
    key: 'logo_lists',
    route: 'logo-lists',
    idKey: 'id',
    label: 'Logos & partners',
    icon: 'Boxes',
    group: GROUP.website,
    description: 'Certification, employer and partner logo rows on Home, Explore and Courses.',
    live: true,
    mode: 'fixed',
    appearsOn: [
      { label: 'Home', href: '/' },
      { label: 'Explore', href: '/explore' },
      { label: 'Courses', href: '/courses' },
    ],
    note: 'Each list is a fixed document: add, remove, reorder or rename its logos. A logo without an image shows as a plain name tile. Set a list to Draft to show the built-in logos instead.',
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
    group: GROUP.background,
    description: 'Headline figures (students, placements, centres…) with the source that verifies each.',
    live: false,
    appearsOn: [],
    note: 'The home and landing-page loaders fetch these, but no page displays them today, so saving here does not change what visitors see.',
  },
  {
    key: 'homepage_variants',
    route: 'variants',
    idKey: 'id',
    label: 'Franchise testimonials',
    icon: 'MessageSquareQuote',
    group: GROUP.website,
    description: 'The partner testimonials shown on the Franchise page.',
    live: true,
    note: 'The “franchise” entry is shown on the Franchise page; “default” is the fallback when it is empty or unpublished.',
    hiddenRecordIds: ['student', 'parent', 'professional', 'ai-mumbai'],
    appearsOn: [
      { label: 'Franchise', href: '/franchise' },
    ],
  },
  {
    key: 'persona_rules',
    route: 'rules',
    idKey: 'id',
    label: 'Persona rules',
    hidden: true,
    icon: 'SlidersHorizontal',
    group: GROUP.personalisation,
    description: 'IF/THEN rules that pick a homepage variant for a visitor.',
    live: false,
    appearsOn: [],
    note: 'Nothing on the website reads these rules yet, so saving here does not change what visitors see. The rule matcher exists in code but is not wired to any page.',
  },
  {
    key: 'chatbot_settings',
    route: 'chatbot-settings',
    idKey: 'id',
    label: 'Assistant settings',
    icon: 'Settings',
    group: GROUP.guide,
    description: 'Show or hide Jetking AI across the whole website, plus its name, greeting, starter questions, and replies when it cannot answer.',
    live: true,
    mode: 'singleton',
    appearsOn: [
      { label: 'Header Jetking AI button', href: '/' },
      { label: 'Chat page', href: '/chatbot' },
    ],
    note: 'Availability → Enabled turns Jetking AI on or off for the entire public site (header, Ask links, FAQ, sitemap, /chatbot, chat APIs). When off, /chatbot is not accessible. The assistant only answers from the website’s own content.',
  },
  {
    key: 'chatbot_knowledge',
    route: 'chatbot-knowledge',
    idKey: 'id',
    label: 'Custom answers',
    icon: 'MessageSquareQuote',
    group: GROUP.guide,
    description: 'Question-and-answer pairs you write for the assistant, for things the website does not say yet.',
    live: true,
    appearsOn: [{ label: 'Chat page', href: '/chatbot' }],
    note: 'Published answers join the assistant’s knowledge the next time the index is rebuilt (Chatbot overview → Rebuild knowledge).',
  },
  {
    key: 'policies',
    route: 'policies',
    idKey: 'slug',
    label: 'Policies',
    icon: 'ShieldCheck',
    group: GROUP.background,
    description: 'Policy summaries the Jetking Guide chatbot answers from.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only. The public Privacy, Terms and Enrollment pages are edited under Legal pages.',
  },
  {
    key: 'faculty',
    route: 'faculty',
    idKey: 'slug',
    label: 'Faculty',
    icon: 'UserCog',
    group: GROUP.background,
    description: 'Faculty profiles the Jetking Guide chatbot can cite.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only; no website page lists them. The About page’s leadership is edited under About page.',
  },
  {
    key: 'placements',
    route: 'placements',
    idKey: 'id',
    label: 'Placement notes',
    icon: 'Trophy',
    group: GROUP.background,
    description: 'Placement summaries and stats the Jetking Guide chatbot answers from.',
    live: false,
    appearsOn: [],
    note: 'These records feed the Jetking Guide chatbot only. The public Placements page (recruiters, stats, testimonials) is edited under Placements page.',
  },
];

/**
 * Page-text IDs withheld from the editor.
 * `student` landing is unused (URL redirects home). `parent` / `professional`
 * stay listed under clearer labels for shared About / Courses copy.
 */
export const UNLISTED_PAGE_IDS: readonly string[] = ['student'];

/** Every collection the panel offers (hidden ones are left out of the menu, dashboard, search and site map). */
export const COLLECTIONS: AdminCollection[] = ALL_COLLECTIONS.filter((c) => !c.hidden);

export function collectionByKey(key: CmsCollection): AdminCollection {
  const found = ALL_COLLECTIONS.find((c) => c.key === key);
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
  { name: 'Announcement bar', path: 'every page', cms: ['announcements'] },
  { name: 'Header, footer & search settings', path: 'every page', cms: ['site_navigation', 'page_copy', 'seo_settings'] },
  {
    name: 'Home',
    path: '/',
    href: '/',
    cms: ['page_copy', 'courses', 'centres', 'cities', 'posts', 'faqs', 'placements_page', 'logo_lists'],
    code: 'Icons beside cards and sections',
  },
  {
    name: 'Course catalogue',
    path: '/courses',
    href: '/courses',
    cms: ['page_copy', 'courses', 'centres', 'cities'],
    code: 'Flexible learning band also reads Page text → Professionals (flex.*)',
  },
  { name: 'Course page', path: '/courses/[slug]', cms: ['courses', 'faqs', 'centres', 'placements_page', 'page_copy'] },
  { name: 'Centre directory', path: '/centres', href: '/centres', cms: ['page_copy', 'centres', 'centres_settings', 'cities'] },
  { name: 'City page', path: '/centres/[city]', cms: ['cities', 'centres', 'courses'] },
  {
    name: 'Centre page',
    path: '/centres/[city]/[centre]',
    cms: ['centres', 'page_copy'],
    code: 'Gallery photos: centre CMS uploads first; empty slots use Page text → Centres (centreGallery.slot.*)',
  },
  { name: 'Blog', path: '/blog', href: '/blog', cms: ['page_copy', 'posts'] },
  {
    name: 'Article',
    path: '/blog/[slug]',
    cms: ['posts', 'page_copy'],
    code: 'Scraped share-card heroes are skipped on-page; set a real heroImage or the Blog article.fallbackImage',
  },
  { name: 'FAQ', path: '/faq', href: '/faq', cms: ['page_copy', 'faqs'] },
  { name: 'Franchise', path: '/franchise', href: '/franchise', cms: ['page_copy', 'homepage_variants', 'faqs'] },
  { name: 'Enquiry', path: '/enquiry', href: '/enquiry', cms: ['page_copy', 'courses', 'centres', 'cities'] },
  {
    name: 'About',
    path: '/about-us',
    href: '/about-us',
    cms: ['page_copy', 'about_page', 'courses', 'centres', 'cities'],
    code: 'Affiliations / reasons also read Page text → Explore; “loves” band reads Page text → Parents',
  },
  { name: 'Placements', path: '/placements', href: '/placements', cms: ['page_copy', 'placements_page'] },
  { name: 'Investors', path: '/investors', href: '/investors', cms: ['page_copy', 'investors_page'] },
  {
    name: 'Jetking ABC Labs',
    path: '/jetking-abc-labs',
    href: '/jetking-abc-labs',
    cms: ['page_copy'],
    code: 'Layout/structure in code; page is noindex',
  },
  { name: 'Explore', path: '/explore', href: '/explore', cms: ['page_copy', 'logo_lists'], code: 'Optional landing (noindex); also feeds About extras' },
  // /student, /parent, /professional permanently redirect to / — page_copy for
  // Parents still feeds About “loves”; Professionals flex.* still feeds /courses.
  { name: 'Privacy, Terms & Enrollment', path: '/privacy-policy', href: '/privacy-policy', cms: ['legal_documents', 'page_copy'] },
  { name: 'Site map page', path: '/sitemap', href: '/sitemap', cms: ['page_copy'] },
  { name: 'Chat assistant', path: '/chatbot', href: '/chatbot', cms: ['chatbot_settings', 'chatbot_knowledge'] },
];
