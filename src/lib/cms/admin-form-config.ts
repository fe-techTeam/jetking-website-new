import type { CmsCollection } from './types';

/**
 * Drives the generic admin record form (`RecordEditor` + `ValueEditor`) — the
 * replacement for the old raw-JSON textarea editor. Nothing here changes what a
 * saved record looks like (still validated by `cms/schemas.ts` on save); it only
 * tells the form (a) what an empty new record starts as, so every possible field
 * is visible instead of requiring staff to know which JSON keys to type, (b) what
 * a fresh item looks like inside a repeatable list (an array of objects can't
 * infer its own shape once it's empty), and (c) which string fields are actually
 * a fixed set of choices.
 */

interface SelectFieldConfig {
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface AdminFormConfig {
  /** A fresh, fully-populated record for "+ New record" — every optional field
   *  present with an empty value, so nothing requires knowing a hidden field name. */
  blank: () => Record<string, unknown>;
  /** Shape of one new item for an array-of-objects field, keyed by field name. */
  itemTemplates?: Record<string, Record<string, unknown>>;
  /** Renders a <select> instead of a text input for this field name. */
  selectFields?: Record<string, SelectFieldConfig>;
  /** Groups fields under named headers for a record long enough to need one —
   *  a course has 20+ fields with no natural single reading order otherwise.
   *  Any field not listed in a section still renders, under a trailing "More"
   *  section, so a config that misses a field can't silently hide it.
   *  Collections without `sections` render as one flat list, unchanged. */
  sections?: Array<{ title: string; fields: string[] }>;
  /** String-array fields that hold paragraphs (one textarea each) rather than short tags. */
  paragraphFields?: string[];
  /** Top-level fields not shown at all — a singleton's fixed `id` means nothing to an editor. */
  hiddenFields?: string[];
  /** Text fields edited in the rich-text editor (dotted path, `[]` for list items): `answer`, `faqs[].answer`. */
  richFields?: string[];
  /** Fields the site cannot render without — marked * and checked before saving. */
  requiredFields?: string[];
  /** Top-level fields shown read-only — identity keys that must not be renamed (a singleton's `id`). */
  lockedFields?: string[];
  /** Override the humanized field label in the form (e.g. `enabled` → “Show on website”). */
  fieldLabels?: Record<string, string>;
}

const seoBlank = () => ({ title: '', description: '', canonicalPath: '', ogImage: '', noindex: false });
const imageBlank = () => ({ url: '', alt: '' });
const personaRelevanceBlank = () => ({ student: 0, professional: 0, parent: 0, franchise: 0 });

const today = () => new Date().toISOString().slice(0, 10);

const courses: AdminFormConfig = {
  richFields: ['faqs[].answer'],
  requiredFields: ['slug', 'title', 'shortTitle', 'duration', 'eligibility', 'summary'],
  blank: () => ({
    slug: '',
    title: '',
    shortTitle: '',
    level: 'certification',
    duration: '',
    eligibility: '',
    summary: '',
    outcomes: [],
    modules: [],
    certifications: [],
    fees: { disclosed: false, totalInr: 0, basis: '', emiAvailable: false, note: '' },
    personaRelevance: personaRelevanceBlank(),
    heroImage: imageBlank(),
    seo: seoBlank(),
    featured: false,
    hasDetailPage: true,
    updatedAt: today(),
    highlights: [],
    tools: [],
    careerRoles: [],
    phases: [],
    faqs: [],
    curriculum: [],
    university: '',
    hiringPartners: [],
    certificateImage: imageBlank(),
    jetkingCertificateImage: imageBlank(),
    whyNow: { intro: '', headline: '', points: [], demandValue: '', demandLabel: '', demandSource: '' },
    status: 'draft',
  }),
  itemTemplates: {
    phases: { title: '', description: '' },
    faqs: { question: '', answer: '' },
    curriculum: { title: '', items: [] },
  },
  selectFields: {
    level: {
      label: 'Level',
      options: [
        { value: 'degree', label: 'Degree' },
        { value: 'diploma', label: 'Diploma' },
        { value: 'certification', label: 'Certification' },
        { value: 'short', label: 'Short' },
        { value: 'suny', label: 'State University of New York' },
      ],
    },
  },
  sections: [
    {
      title: 'Basics',
      fields: [
        'slug',
        'title',
        'shortTitle',
        'level',
        'duration',
        'eligibility',
        'summary',
        'university',
        'featured',
        'hasDetailPage',
      ],
    },
    {
      title: 'Curriculum & outcomes',
      fields: [
        'outcomes',
        'modules',
        'certifications',
        'highlights',
        'tools',
        'careerRoles',
        'whyNow',
        'phases',
        'curriculum',
        'faqs',
        'hiringPartners',
      ],
    },
    { title: 'Fees & audience', fields: ['fees', 'personaRelevance'] },
    { title: 'Media & SEO', fields: ['heroImage', 'certificateImage', 'jetkingCertificateImage', 'seo', 'updatedAt'] },
  ],
};

const cities: AdminFormConfig = {
  requiredFields: ['slug', 'name', 'state', 'intro'],
  blank: () => ({
    slug: '',
    name: '',
    state: '',
    intro: '',
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
};

const centres: AdminFormConfig = {
  richFields: ['faqs[].answer'],
  requiredFields: ['slug', 'name', 'citySlug', 'addressLine', 'locality', 'state', 'pincode'],
  blank: () => ({
    slug: '',
    name: '',
    citySlug: '',
    addressLine: '',
    locality: '',
    state: '',
    country: 'India',
    centreCode: '',
    pincode: '',
    phone: '',
    email: '',
    helpline: '',
    headline: '',
    intro: '',
    body: '',
    featuredProgrammes: [],
    highlights: { programs: '', placement: '', facility: '', timing: '' },
    eligibility: [],
    journey: [],
    gallery: [],
    experiencePhotos: { lab: '', classroom: '', counselling: '', mockInterview: '' },
    faculty: [],
    updates: [],
    placements: [],
    faqs: [],
    testimonials: [],
    geo: { lat: 0, lng: 0 },
    sortOrder: 100,
    coursesOffered: [],
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
  itemTemplates: {
    featuredProgrammes: { title: '', subtitle: '', duration: '', mode: '' },
    eligibility: { title: '', items: [] },
    journey: { title: '', items: [] },
    gallery: { url: '', caption: '' },
    faculty: { name: '', title: '', qualification: '', experience: '', specialisation: '', bio: '', photoUrl: '' },
    updates: { title: '', summary: '', date: today(), category: '', image: '', link: '' },
    placements: { name: '', company: '', package: '', photoUrl: '' },
    faqs: { question: '', answer: '' },
    testimonials: { quote: '', name: '', role: '' },
  },
  sections: [
    {
      title: 'Basics',
      fields: [
        'slug',
        'name',
        'citySlug',
        'sortOrder',
        'addressLine',
        'locality',
        'country',
        'state',
        'centreCode',
        'pincode',
        'phone',
        'email',
        'helpline',
        'updatedAt',
      ],
    },
    {
      title: 'Content',
      fields: ['headline', 'intro', 'body', 'highlights', 'experiencePhotos', 'featuredProgrammes', 'eligibility', 'journey', 'coursesOffered'],
    },
    { title: 'People & proof', fields: ['gallery', 'faculty', 'updates', 'placements', 'testimonials', 'faqs'] },
    { title: 'Location & SEO', fields: ['geo', 'seo'] },
  ],
};

const posts: AdminFormConfig = {
  requiredFields: ['slug', 'title', 'excerpt', 'author', 'publishedAt'],
  blank: () => ({
    slug: '',
    title: '',
    excerpt: '',
    body: [],
    bodyHtml: '',
    author: '',
    publishedAt: today(),
    updatedAt: today(),
    category: '',
    tags: [],
    personaRelevance: personaRelevanceBlank(),
    heroImage: imageBlank(),
    seo: seoBlank(),
    legacyPath: '',
    kind: 'blog',
    status: 'draft',
  }),
  // `body` (the plain structured text) is derived from the rich article on save, so only the rich editor is shown.
  hiddenFields: ['body'],
  selectFields: {
    kind: {
      label: 'Kind',
      options: [
        { value: 'blog', label: 'Blog' },
        { value: 'news', label: 'News' },
      ],
    },
  },
  sections: [
    { title: 'Basics', fields: ['slug', 'title', 'excerpt', 'author', 'publishedAt', 'updatedAt', 'category', 'kind', 'legacyPath'] },
    { title: 'Content', fields: ['bodyHtml', 'tags'] },
    { title: 'Audience & SEO', fields: ['personaRelevance', 'heroImage', 'seo'] },
  ],
};

const faqs: AdminFormConfig = {
  richFields: ['answer'],
  requiredFields: ['id', 'question', 'answer'],
  blank: () => ({
    id: '',
    question: '',
    answer: '',
    topic: 'admissions',
    personaRelevance: personaRelevanceBlank(),
    relatedCourseSlugs: [],
    status: 'draft',
  }),
  selectFields: {
    topic: {
      label: 'Topic',
      options: [
        { value: 'admissions', label: 'Admissions' },
        { value: 'fees', label: 'Fees' },
        { value: 'placement', label: 'Placement' },
        { value: 'courses', label: 'Courses' },
        { value: 'centres', label: 'Centres' },
        { value: 'franchise', label: 'Franchise' },
      ],
    },
  },
};

const policies: AdminFormConfig = {
  blank: () => ({
    slug: '',
    title: '',
    summary: '',
    body: [],
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
};

const faculty: AdminFormConfig = {
  blank: () => ({
    slug: '',
    name: '',
    title: '',
    bio: '',
    specialisations: [],
    centreSlugs: [],
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
};

const placements: AdminFormConfig = {
  blank: () => ({
    id: '',
    title: '',
    summary: '',
    body: [],
    stats: [],
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
  itemTemplates: {
    stats: { label: '', value: '', verified: false, source: '' },
  },
};

const trust_signals: AdminFormConfig = {
  blank: () => ({
    id: '',
    value: '',
    label: '',
    verified: false,
    source: '',
    status: 'draft',
  }),
};

const homepage_variants: AdminFormConfig = {
  // Only the testimonials are shown on the site; the other fields belong to the retired personalisation feature.
  hiddenFields: ['banner', 'cta', 'stories', 'video', 'courseBoost', 'centreBoost'],
  blank: () => ({
    id: '',
    label: '',
    banner: { eyebrow: '', headline: '', lede: '', imageUrl: '' },
    cta: { label: '', href: '' },
    testimonials: [],
    stories: [],
    video: { title: '', src: '', poster: '' },
    courseBoost: [],
    centreBoost: [],
    status: 'draft',
  }),
  itemTemplates: {
    testimonials: { id: '', quote: '', name: '', role: '' },
    stories: { id: '', title: '', summary: '', href: '' },
  },
};

const persona_rules: AdminFormConfig = {
  blank: () => ({
    id: '',
    label: '',
    priority: 0,
    matchAll: true,
    conditions: [],
    homepageVariantId: '',
    enabled: true,
    status: 'draft',
  }),
  itemTemplates: {
    conditions: { field: 'persona', op: 'eq', value: '' },
  },
  selectFields: {
    field: {
      label: 'Field',
      options: [
        'location.city',
        'interest',
        'returning',
        'utm.campaign',
        'utm.source',
        'device',
        'persona',
        'path',
        'visitCount',
        'channel',
      ].map((v) => ({ value: v, label: v })),
    },
    op: {
      label: 'Operator',
      options: ['eq', 'neq', 'contains', 'gte', 'lte', 'in'].map((v) => ({ value: v, label: v })),
    },
  },
};

/* ── Site pages managed as CMS documents ───────────────────────────────────── */

const about_page: AdminFormConfig = {
  blank: () => ({
    id: 'about',
    hero: { eyebrow: '', titleLead: '', titleAccent: '', lede: '' },
    purpose: [],
    values: [],
    directors: [],
    managementTeam: [],
    timeline: [],
    achievements: [],
    partnerships: [],
    status: 'draft',
  }),
  hiddenFields: ['id'],
  paragraphFields: ['bio'],
  itemTemplates: {
    purpose: { title: '', body: '' },
    directors: { name: '', role: '', photoUrl: '', bio: [] },
    managementTeam: { name: '', role: '', photoUrl: '', bio: [] },
    timeline: { year: '', title: '', body: '', link: { href: '', label: '' } },
    achievements: { title: '', body: '', imageSrc: '' },
    partnerships: { name: '', body: '', logo: '' },
  },
  sections: [
    { title: 'Hero', fields: ['hero'] },
    { title: 'Vision, mission & values', fields: ['purpose', 'values'] },
    { title: 'Leadership', fields: ['directors', 'managementTeam'] },
    { title: 'History', fields: ['timeline'] },
    { title: 'Recognition & partners', fields: ['achievements', 'partnerships'] },
  ],
};

const placements_page: AdminFormConfig = {
  blank: () => ({
    id: 'placements',
    hero: { eyebrow: '', titleLead: '', titleAccent: '', lede: '' },
    disclaimer: '',
    processSteps: [],
    studentBenefits: [],
    placedCandidates: [],
    testimonials: [],
    videoTestimonials: [],
    contact: { phone: '', email: '' },
    offerLetters: [],
    recruiters: [],
    recruitersDisclaimer: '',
    stats: { partners: '', learnersPlaced: { value: '', label: '' } },
    status: 'draft',
  }),
  hiddenFields: ['id'],
  itemTemplates: {
    processSteps: { step: '', title: '', description: '' },
    studentBenefits: { title: '', description: '' },
    placedCandidates: { name: '', company: '' },
    testimonials: { name: '', role: '', quote: '' },
    videoTestimonials: { name: '', title: '', provider: 'youtube', videoId: '', thumbnail: '' },
    offerLetters: { src: '', title: '', sector: '' },
    recruiters: { name: '', src: '' },
  },
  selectFields: {
    provider: {
      label: 'Video provider',
      options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
      ],
    },
  },
  sections: [
    { title: 'Hero & disclaimer', fields: ['hero', 'disclaimer'] },
    { title: 'Process & benefits', fields: ['processSteps', 'studentBenefits'] },
    { title: 'Stories', fields: ['placedCandidates', 'testimonials', 'videoTestimonials'] },
    { title: 'Recruiters & offer letters', fields: ['recruiters', 'recruitersDisclaimer', 'offerLetters'] },
    { title: 'Figures & contact', fields: ['stats', 'contact'] },
  ],
};

const investors_page: AdminFormConfig = {
  blank: () => ({
    id: 'investors',
    company: { registeredOffice: '', phone: '', email: '', listedAt: '', scripCode: '', tradingSymbol: '' },
    stockLive: '',
    latestNews: '',
    grievanceOfficer: { name: '', phone: '', email: '' },
    registrar: { name: '', address: '', phone: '', fax: '', email: '', website: '' },
    kmp: [],
    syncedAt: today(),
    sections: [],
    status: 'draft',
  }),
  hiddenFields: ['id'],
  itemTemplates: {
    kmp: { name: '', designation: '', phone: '', email: '' },
    sections: { id: '', title: '', items: [] },
    items: { label: '', href: '' },
  },
  sections: [
    { title: 'Company & listing', fields: ['company', 'stockLive', 'latestNews'] },
    { title: 'Investor contacts', fields: ['grievanceOfficer', 'registrar', 'kmp'] },
    { title: 'Disclosure documents', fields: ['syncedAt', 'sections'] },
  ],
};

const legal_documents: AdminFormConfig = {
  blank: () => ({
    slug: '',
    title: '',
    sourceUrl: '',
    blocks: [],
    status: 'draft',
  }),
  lockedFields: ['slug'],
  sections: [
    { title: 'Document', fields: ['slug', 'title', 'sourceUrl'] },
    { title: 'Text', fields: ['blocks'] },
  ],
};

const logo_lists: AdminFormConfig = {
  blank: () => ({ id: '', title: '', description: '', items: [], status: 'draft' }),
  lockedFields: ['id'],
  itemTemplates: { items: { name: '', file: '', dark: false } },
  sections: [
    { title: 'List', fields: ['id', 'title', 'description'] },
    { title: 'Logos', fields: ['items'] },
  ],
};

const site_navigation: AdminFormConfig = {
  requiredFields: ['id', 'title'],
  blank: () => ({ id: '', title: '', description: '', items: [], status: 'draft' }),
  lockedFields: ['id'],
  itemTemplates: { items: { label: '', href: '/' } },
  sections: [
    { title: 'Menu', fields: ['id', 'title', 'description'] },
    { title: 'Links', fields: ['items'] },
  ],
};

/** Edited by the dedicated Page text editor, not the generic record form — present only to satisfy the collection map. */
const page_copy: AdminFormConfig = {
  blank: () => ({ id: '', entries: {}, status: 'published' }),
};

const announcements: AdminFormConfig = {
  requiredFields: ['id', 'message'],
  blank: () => ({
    id: '',
    message: '',
    linkLabel: '',
    linkHref: '',
    tone: 'info',
    startsAt: '',
    endsAt: '',
    dismissible: true,
    status: 'draft',
  }),
  selectFields: {
    tone: {
      label: 'Style',
      options: [
        { value: 'info', label: 'Info (neutral)' },
        { value: 'promo', label: 'Promotion (brand red)' },
        { value: 'alert', label: 'Alert (amber)' },
      ],
    },
  },
};

const seo_settings: AdminFormConfig = {
  blank: () => ({
    id: 'seo',
    allowIndexing: true,
    blockAiCrawlers: false,
    extraDisallow: [],
    alwaysDisallow: ['/api/'],
    sitemapExclude: [],
    sitemapInclude: [],
    aiCrawlers: [],
    blogMarketingCovers: [],
    forcedNoindexPaths: ['/account', '/chatbot', '/design-kit'],
    defaultOgImage: '/og-default.png',
    twitterHandle: '',
    googleVerification: '',
    bingVerification: '',
    organization: {
      name: '',
      legalName: '',
      alternateName: [],
      description: '',
      logo: '',
      phone: '',
      sameAs: [],
      foundingDate: '',
      areaServed: 'India',
      knowsAbout: [],
    },
    status: 'published',
  }),
  itemTemplates: {
    sitemapInclude: { path: '', priority: 0.5, changeFrequency: 'monthly' },
  },
  lockedFields: ['id'],
  sections: [
    {
      title: 'Search engines',
      fields: ['allowIndexing', 'blockAiCrawlers', 'aiCrawlers', 'alwaysDisallow', 'extraDisallow'],
    },
    {
      title: 'Sitemap',
      fields: ['sitemapInclude', 'sitemapExclude'],
    },
    {
      title: 'Sharing & verification',
      fields: ['defaultOgImage', 'twitterHandle', 'googleVerification', 'bingVerification'],
    },
    {
      title: 'Blog cover denylist',
      fields: ['blogMarketingCovers'],
    },
    {
      title: 'Always noindex',
      fields: ['forcedNoindexPaths'],
    },
    { title: 'Organization (structured data)', fields: ['organization'] },
  ],
};

const centres_settings: AdminFormConfig = {
  requiredFields: ['listSort', 'shuffleEveryDays'],
  blank: () => ({
    id: 'centres',
    listSort: 'name',
    shuffleEveryDays: 1,
    status: 'published',
  }),
  lockedFields: ['id'],
  fieldLabels: {
    shuffleEveryDays: 'Reshuffle every N days (city-wise)',
  },
  selectFields: {
    listSort: {
      label: 'List sort',
      options: [
        { value: 'name', label: 'Name (A–Z)' },
        { value: 'manual', label: 'Manual (sort order on each centre)' },
        { value: 'shuffle', label: 'Shuffle within each city (every N days)' },
      ],
    },
  },
  sections: [
    {
      title: 'Directory order',
      fields: ['listSort', 'shuffleEveryDays'],
    },
  ],
};

const chatbot_settings: AdminFormConfig = {
  requiredFields: ['name', 'welcomeMessage', 'noMatchReply', 'offTopicReply'],
  blank: () => ({
    id: 'chatbot',
    enabled: true,
    disabledMessage:
      'Jetking AI is taking a short break. Please use the enquiry form and a counsellor will get back to you.',
    name: 'Jetking AI',
    welcomeMessage: '',
    welcomeChips: [],
    inputPlaceholder: '',
    noMatchReply: '',
    offTopicReply: '',
    status: 'published',
  }),
  itemTemplates: { welcomeChips: { label: '', query: '' } },
  lockedFields: ['id'],
  // disabledMessage is retained in the schema for older records; public hide is a hard 404.
  hiddenFields: ['disabledMessage'],
  fieldLabels: { enabled: 'Show on website' },
  sections: [
    { title: 'Availability', fields: ['enabled'] },
    { title: 'Greeting', fields: ['name', 'welcomeMessage', 'welcomeChips', 'inputPlaceholder'] },
    { title: 'When it cannot answer', fields: ['noMatchReply', 'offTopicReply'] },
  ],
};

const chatbot_knowledge: AdminFormConfig = {
  requiredFields: ['id', 'question', 'answer'],
  blank: () => ({ id: '', question: '', answer: '', link: '', tags: [], status: 'draft' }),
};

export const ADMIN_FORM_CONFIG: Record<CmsCollection, AdminFormConfig> = {
  courses,
  cities,
  centres,
  posts,
  faqs,
  policies,
  faculty,
  placements,
  trust_signals,
  homepage_variants,
  persona_rules,
  about_page,
  placements_page,
  investors_page,
  legal_documents,
  logo_lists,
  site_navigation,
  page_copy,
  announcements,
  seo_settings,
  centres_settings,
  chatbot_settings,
  chatbot_knowledge,
};
