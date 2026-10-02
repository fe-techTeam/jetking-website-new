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
}

const seoBlank = () => ({ title: '', description: '', canonicalPath: '', ogImage: '', noindex: false });
const imageBlank = () => ({ url: '', alt: '' });
const personaRelevanceBlank = () => ({ student: 0, professional: 0, parent: 0, franchise: 0 });

const today = () => new Date().toISOString().slice(0, 10);

const courses: AdminFormConfig = {
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
      ],
    },
  },
  sections: [
    {
      title: 'Basics',
      fields: ['slug', 'title', 'shortTitle', 'level', 'duration', 'eligibility', 'summary', 'university', 'featured'],
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
        'phases',
        'curriculum',
        'faqs',
        'hiringPartners',
      ],
    },
    { title: 'Fees & audience', fields: ['fees', 'personaRelevance'] },
    { title: 'Media & SEO', fields: ['heroImage', 'certificateImage', 'seo', 'updatedAt'] },
  ],
};

const cities: AdminFormConfig = {
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
  blank: () => ({
    slug: '',
    name: '',
    citySlug: '',
    addressLine: '',
    locality: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    helpline: '',
    headline: '',
    intro: '',
    body: '',
    featuredProgrammes: [],
    eligibility: [],
    journey: [],
    faculty: [],
    placements: [],
    faqs: [],
    testimonials: [],
    geo: { lat: 0, lng: 0 },
    coursesOffered: [],
    seo: seoBlank(),
    updatedAt: today(),
    status: 'draft',
  }),
  itemTemplates: {
    featuredProgrammes: { title: '', subtitle: '', duration: '', mode: '' },
    eligibility: { title: '', items: [] },
    journey: { title: '', items: [] },
    faculty: { name: '', title: '', bio: '', photoUrl: '' },
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
        'addressLine',
        'locality',
        'state',
        'pincode',
        'phone',
        'email',
        'helpline',
        'updatedAt',
      ],
    },
    {
      title: 'Content',
      fields: ['headline', 'intro', 'body', 'featuredProgrammes', 'eligibility', 'journey', 'coursesOffered'],
    },
    { title: 'People & proof', fields: ['faculty', 'placements', 'testimonials', 'faqs'] },
    { title: 'Location & SEO', fields: ['geo', 'seo'] },
  ],
};

const posts: AdminFormConfig = {
  blank: () => ({
    slug: '',
    title: '',
    excerpt: '',
    body: [],
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
    { title: 'Content', fields: ['body', 'tags'] },
    { title: 'Audience & SEO', fields: ['personaRelevance', 'heroImage', 'seo'] },
  ],
};

const faqs: AdminFormConfig = {
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
};
