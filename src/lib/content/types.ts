/**
 * Domain content model — CMS-agnostic.
 *
 * These types are the contract between the site and whatever content system is
 * chosen. Pages import ONLY from here. Adapters map CMS shape onto these types.
 *
 * Design note: fields that the AI Guide is allowed to state as fact are marked
 * `@grounded`. Anything not marked is presentational and must never be quoted
 * as authoritative by the AI assistant.
 */

export type PersonaId = 'student' | 'professional' | 'parent' | 'franchise' | 'unknown';

/** Personas a piece of content is especially relevant to. Drives re-ranking. */
type PersonaRelevance = Partial<Record<Exclude<PersonaId, 'unknown'>, number>>;

export interface Seo {
  /** @grounded */
  title: string;
  /** @grounded */
  description: string;
  /** Absolute or root-relative. Absent => derived from the route. */
  canonicalPath?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface ImageRef {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Courses                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export type CourseLevel = 'degree' | 'diploma' | 'certification' | 'short';

/**
 * Structured fee data. The AI Guide renders this through a deterministic
 * component and NEVER generates fee figures as free text (DEVELOPMENT-PLAN §5.2,
 * risk R4). If `disclosed` is false the Guide must hand off to a counsellor.
 */
interface Fees {
  disclosed: boolean;
  /** @grounded Total programme fee in INR. Only meaningful when disclosed. */
  totalInr?: number;
  /** @grounded e.g. "per year", "one-time" */
  basis?: string;
  emiAvailable?: boolean;
  /** @grounded Free-text policy note sourced from Jetking, never model-authored. */
  note?: string;
}

/** One programme phase — a stage in a multi-year / multi-semester journey. */
export interface CoursePhase {
  /** @grounded e.g. "Year 1 — Foundation", "Semester 3" */
  title: string;
  /** @grounded */
  description: string;
}

/** A single course FAQ. */
export interface CourseFaq {
  /** @grounded */
  question: string;
  /** @grounded */
  answer: string;
}

/** One curriculum group — a semester / module / phase and its topics. */
export interface CourseTerm {
  /** @grounded e.g. "Semester 1", "Module 2" */
  title: string;
  /** @grounded */
  items: string[];
}

export interface Course {
  slug: string;
  /** @grounded */
  title: string;
  /** @grounded */
  shortTitle: string;
  level: CourseLevel;
  /** @grounded e.g. "3 years", "6 months" */
  duration: string;
  /** @grounded */
  eligibility: string;
  /** @grounded One-paragraph summary. Safe for the Guide to paraphrase. */
  summary: string;
  /** @grounded */
  outcomes: string[];
  /** @grounded */
  modules: string[];
  /** @grounded */
  certifications: string[];
  fees: Fees;
  personaRelevance: PersonaRelevance;
  heroImage?: ImageRef;
  seo: Seo;
  featured?: boolean;
  updatedAt: string;

  /*
   * Optional enrichment sections, sourced per-programme from the live site.
   * Every one is optional and rendered only when present — programmes carry
   * different subsets, so a page shows a section only if its data exists.
   */
  /** @grounded Key programme features / highlights. */
  highlights?: string[];
  /** @grounded Tools & technologies covered (product/tech names). */
  tools?: string[];
  /** @grounded Career opportunities — specific job titles this leads to. */
  careerRoles?: string[];
  /** @grounded Learning journey — year/semester/stage breakdown. */
  phases?: CoursePhase[];
  /** @grounded Frequently asked questions. */
  faqs?: CourseFaq[];
  /** @grounded Full curriculum grouped by semester / module / phase. */
  curriculum?: CourseTerm[];
  /** @grounded Awarding / partner university (degree programmes only). */
  university?: string;
  /** @grounded Recruiter / alumni employer names, where the page lists them. */
  hiringPartners?: string[];
  /** @grounded Specimen of the certificate / credential awarded. */
  certificateImage?: ImageRef;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Centres & cities                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export interface CentreFeaturedProgramme {
  title: string;
  subtitle?: string;
  duration?: string;
  mode?: string;
}

interface CentreEligibilityBlock {
  title: string;
  items: string[];
}

interface CentreJourneyStep {
  title: string;
  items: string[];
}

interface CentreFaq {
  question: string;
  answer: string;
}

export interface CentreTestimonial {
  quote: string;
  name: string;
  role?: string;
}

interface CentreFaculty {
  name: string;
  title: string;
  bio?: string;
  /** Portrait URL from the live centre page when available. */
  photoUrl?: string;
}

interface CentrePlacement {
  name: string;
  company: string;
  package?: string;
  /** Portrait URL from the live centre page when available. */
  photoUrl?: string;
}

export interface Centre {
  slug: string;
  /** @grounded */
  name: string;
  citySlug: string;
  /** @grounded */
  addressLine: string;
  /** @grounded */
  locality: string;
  /** @grounded */
  state: string;
  /** @grounded */
  pincode: string;
  phone?: string;
  /** Centre admissions / contact email when published on jetking.com */
  email?: string;
  /** National admissions helpline (live site). */
  helpline?: string;
  /** Hero headline from the live centre page. */
  headline?: string;
  /** Short intro from the live centre page. */
  intro?: string;
  /** Longer body copy from the live centre page. */
  body?: string;
  /** Featured degree / career programmes called out on the live page. */
  featuredProgrammes?: CentreFeaturedProgramme[];
  /** Eligibility blocks (e.g. BCA / MCA). */
  eligibility?: CentreEligibilityBlock[];
  /** Multi-year transformation journey when published. */
  journey?: CentreJourneyStep[];
  /** Centre faculty when published on the live page. */
  faculty?: CentreFaculty[];
  /** Recent placement highlights from the live page. */
  placements?: CentrePlacement[];
  /** Centre-page FAQs from jetking.com. */
  faqs?: CentreFaq[];
  /** Student testimonials from the live centre page. */
  testimonials?: CentreTestimonial[];
  geo?: { lat: number; lng: number };
  coursesOffered: string[];
  seo: Seo;
  updatedAt: string;
}

export interface City {
  slug: string;
  /** @grounded */
  name: string;
  /** @grounded */
  state: string;
  /** @grounded */
  intro: string;
  seo: Seo;
  updatedAt: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Editorial                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export type BodyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; image: ImageRef };

export interface Post {
  slug: string;
  /** @grounded */
  title: string;
  /** @grounded */
  excerpt: string;
  body: BodyBlock[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  personaRelevance: PersonaRelevance;
  heroImage?: ImageRef;
  seo: Seo;
  /** Present when migrated from the legacy site — used to verify the redirect map. */
  legacyPath?: string;
  /** blog (default) or news — both index into the Guide KB. */
  kind?: 'blog' | 'news';
}

/* ────────────────────────────────────────────────────────────────────────── */
/* FAQ                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export interface Faq {
  id: string;
  /** @grounded */
  question: string;
  /** @grounded */
  answer: string;
  topic: 'admissions' | 'fees' | 'placement' | 'courses' | 'centres' | 'franchise';
  personaRelevance: PersonaRelevance;
  relatedCourseSlugs?: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Policies · Faculty · Placement                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export interface Policy {
  slug: string;
  /** @grounded */
  title: string;
  /** @grounded */
  summary: string;
  body: BodyBlock[];
  seo: Seo;
  updatedAt: string;
}

export interface Faculty {
  slug: string;
  /** @grounded */
  name: string;
  /** @grounded */
  title: string;
  /** @grounded */
  bio: string;
  /** @grounded */
  specialisations: string[];
  centreSlugs?: string[];
  seo: Seo;
  updatedAt: string;
}

interface PlacementStat {
  /** @grounded */
  label: string;
  /** @grounded */
  value: string;
  verified: boolean;
  source?: string;
}

export interface PlacementPage {
  id: string;
  /** @grounded */
  title: string;
  /** @grounded */
  summary: string;
  body: BodyBlock[];
  stats: PlacementStat[];
  seo: Seo;
  updatedAt: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Trust signals                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export interface TrustSignal {
  id: string;
  /** @grounded The figure itself, e.g. "100+". */
  value: string;
  /** @grounded What it counts, e.g. "Centres nationwide". */
  label: string;
  verified: boolean;
  /** Where the claim comes from. Required for anything rendered. */
  source?: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Homepage variants + CMS persona rules                                      */
/* ────────────────────────────────────────────────────────────────────────── */

interface BannerContent {
  eyebrow?: string;
  headline: string;
  lede: string;
  imageUrl?: string;
}

interface CtaContent {
  label: string;
  href: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

interface SuccessStory {
  id: string;
  title: string;
  summary: string;
  href?: string;
}

interface VideoContent {
  title: string;
  src: string;
  poster?: string;
}

export interface HomepageVariant {
  id: string;
  label: string;
  banner?: BannerContent;
  cta?: CtaContent;
  testimonials?: Testimonial[];
  stories?: SuccessStory[];
  video?: VideoContent;
  courseBoost?: string[];
  centreBoost?: string[];
}

type RuleConditionField =
  | 'location.city'
  | 'interest'
  | 'returning'
  | 'utm.campaign'
  | 'utm.source'
  | 'device'
  | 'persona'
  | 'path'
  | 'visitCount'
  | 'channel';

export interface RuleCondition {
  field: RuleConditionField;
  op: 'eq' | 'neq' | 'contains' | 'gte' | 'lte' | 'in';
  value: string | number | boolean | string[];
}

export interface PersonaRule {
  id: string;
  label: string;
  priority: number;
  matchAll: boolean;
  conditions: RuleCondition[];
  homepageVariantId: string;
  enabled: boolean;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Content source contract                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ContentSource {
  readonly name: string;

  listCourses(): Promise<Course[]>;
  getCourse(slug: string): Promise<Course | null>;

  listCities(): Promise<City[]>;
  getCity(slug: string): Promise<City | null>;

  listCentres(opts?: { citySlug?: string }): Promise<Centre[]>;
  getCentre(citySlug: string, slug: string): Promise<Centre | null>;
  /** Resolve a centre by its slug alone — matches the live site's flat /centres/{slug} URLs. */
  getCentreBySlug(slug: string): Promise<Centre | null>;

  listPosts(opts?: { limit?: number; category?: string; kind?: 'blog' | 'news' }): Promise<Post[]>;
  getPost(slug: string): Promise<Post | null>;

  listFaqs(): Promise<Faq[]>;

  /** Returns verified signals only. Unverified claims never reach a template. */
  listTrustSignals(): Promise<TrustSignal[]>;

  listPolicies(): Promise<Policy[]>;
  getPolicy(slug: string): Promise<Policy | null>;

  listFaculty(): Promise<Faculty[]>;
  getFaculty(slug: string): Promise<Faculty | null>;

  listPlacements(): Promise<PlacementPage[]>;
  getPlacement(id: string): Promise<PlacementPage | null>;

  listHomepageVariants(): Promise<HomepageVariant[]>;
  getHomepageVariant(id: string): Promise<HomepageVariant | null>;

  listPersonaRules(): Promise<PersonaRule[]>;
}
