import { z } from 'zod';
import type { CmsCollection } from './types';

/**
 * Runtime shape validation for admin CMS writes.
 *
 * The editor is a raw JSON textarea — nothing upstream of `upsertRecord` checked
 * that a save actually matched its collection's shape. A record saved missing a
 * required field (or with a wrong-typed one) wrote straight to the store and only
 * surfaced later, at render time, as a much less informative crash in whatever
 * page consumed the missing field. These schemas are deliberately not a
 * field-for-field mirror of every optional nested shape in `content/types.ts` —
 * they enforce the fields pages actually dereference unconditionally, so a bad
 * save fails at the point of saving with a clear message instead of at render.
 */

const seoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  canonicalPath: z.string().optional(),
  ogImage: z.string().optional(),
  noindex: z.boolean().optional(),
});

const imageRefSchema = z.object({
  url: z.string().min(1),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const personaRelevanceSchema = z
  .object({
    student: z.number().optional(),
    professional: z.number().optional(),
    parent: z.number().optional(),
    franchise: z.number().optional(),
  })
  .partial();

const bodyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading'), level: z.union([z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string()) }),
  z.object({ type: z.literal('quote'), text: z.string(), attribution: z.string().optional() }),
  z.object({ type: z.literal('image'), image: imageRefSchema }),
]);

const withStatus = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ ...shape, status: z.enum(['draft', 'published']).optional() });

const courseSchema = withStatus({
  slug: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  level: z.enum(['degree', 'diploma', 'certification', 'short']),
  duration: z.string().min(1),
  eligibility: z.string().min(1),
  summary: z.string().min(1),
  outcomes: z.array(z.string()),
  modules: z.array(z.string()),
  certifications: z.array(z.string()),
  fees: z.object({
    disclosed: z.boolean(),
    totalInr: z.number().optional(),
    basis: z.string().optional(),
    emiAvailable: z.boolean().optional(),
    note: z.string().optional(),
  }),
  personaRelevance: personaRelevanceSchema,
  heroImage: imageRefSchema.optional(),
  seo: seoSchema,
  featured: z.boolean().optional(),
  updatedAt: z.string(),
  highlights: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  careerRoles: z.array(z.string()).optional(),
  phases: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  curriculum: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).optional(),
  university: z.string().optional(),
  hiringPartners: z.array(z.string()).optional(),
  certificateImage: imageRefSchema.optional(),
  jetkingCertificateImage: imageRefSchema.optional(),
  whyNow: z
    .object({
      intro: z.string(),
      headline: z.string(),
      points: z.array(z.string()),
      demandValue: z.string(),
      demandLabel: z.string(),
      demandSource: z.string(),
    })
    .optional(),
});

const citySchema = withStatus({
  slug: z.string().min(1),
  name: z.string().min(1),
  state: z.string().min(1),
  intro: z.string().min(1),
  seo: seoSchema,
  updatedAt: z.string(),
});

const centreSchema = withStatus({
  slug: z.string().min(1),
  name: z.string().min(1),
  citySlug: z.string().min(1),
  addressLine: z.string().min(1),
  locality: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  helpline: z.string().optional(),
  headline: z.string().optional(),
  intro: z.string().optional(),
  body: z.string().optional(),
  featuredProgrammes: z
    .array(
      z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        duration: z.string().optional(),
        mode: z.string().optional(),
      }),
    )
    .optional(),
  highlights: z
    .object({
      programs: z.string().optional(),
      placement: z.string().optional(),
      facility: z.string().optional(),
      timing: z.string().optional(),
    })
    .optional(),
  gallery: z.array(z.object({ url: z.string(), caption: z.string().optional() })).optional(),
  experiencePhotos: z
    .object({
      lab: z.string().optional(),
      classroom: z.string().optional(),
      counselling: z.string().optional(),
      mockInterview: z.string().optional(),
    })
    .optional(),
  eligibility: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).optional(),
  journey: z.array(z.object({ title: z.string(), items: z.array(z.string()) })).optional(),
  faculty: z
    .array(
      z.object({
        name: z.string(),
        title: z.string(),
        bio: z.string().optional(),
        qualification: z.string().optional(),
        experience: z.string().optional(),
        specialisation: z.string().optional(),
        photoUrl: z.string().optional(),
      }),
    )
    .optional(),
  updates: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        date: z.string(),
        category: z.string().optional(),
        image: z.string().optional(),
        link: z.string().optional(),
      }),
    )
    .optional(),
  placements: z
    .array(
      z.object({
        name: z.string(),
        company: z.string(),
        package: z.string().optional(),
        photoUrl: z.string().optional(),
      }),
    )
    .optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string(), role: z.string().optional() }))
    .optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  coursesOffered: z.array(z.string()),
  seo: seoSchema,
  updatedAt: z.string(),
});

const postSchema = withStatus({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.array(bodyBlockSchema),
  bodyHtml: z.string().optional(),
  author: z.string().min(1),
  publishedAt: z.string(),
  updatedAt: z.string(),
  category: z.string().min(1),
  tags: z.array(z.string()),
  personaRelevance: personaRelevanceSchema,
  heroImage: imageRefSchema.optional(),
  seo: seoSchema,
  legacyPath: z.string().optional(),
  kind: z.enum(['blog', 'news']).optional(),
});

const faqSchema = withStatus({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  topic: z.enum(['admissions', 'fees', 'placement', 'courses', 'centres', 'franchise']),
  personaRelevance: personaRelevanceSchema,
  relatedCourseSlugs: z.array(z.string()).optional(),
});

const policySchema = withStatus({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.array(bodyBlockSchema),
  seo: seoSchema,
  updatedAt: z.string(),
});

const facultySchema = withStatus({
  slug: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  specialisations: z.array(z.string()),
  centreSlugs: z.array(z.string()).optional(),
  seo: seoSchema,
  updatedAt: z.string(),
});

const placementSchema = withStatus({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.array(bodyBlockSchema),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      verified: z.boolean(),
      source: z.string().optional(),
    }),
  ),
  seo: seoSchema,
  updatedAt: z.string(),
});

const trustSignalSchema = withStatus({
  id: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  verified: z.boolean(),
  source: z.string().optional(),
});

const homepageVariantSchema = withStatus({
  id: z.string().min(1),
  label: z.string().min(1),
  banner: z
    .object({
      eyebrow: z.string().optional(),
      headline: z.string(),
      lede: z.string(),
      imageUrl: z.string().optional(),
    })
    .optional(),
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  testimonials: z
    .array(z.object({ id: z.string(), quote: z.string(), name: z.string(), role: z.string() }))
    .optional(),
  stories: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        href: z.string().optional(),
      }),
    )
    .optional(),
  video: z
    .object({ title: z.string(), src: z.string(), poster: z.string().optional() })
    .optional(),
  courseBoost: z.array(z.string()).optional(),
  centreBoost: z.array(z.string()).optional(),
});

const personaRuleSchema = withStatus({
  id: z.string().min(1),
  label: z.string().min(1),
  priority: z.number(),
  matchAll: z.boolean(),
  conditions: z.array(
    z.object({
      field: z.enum([
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
      ]),
      op: z.enum(['eq', 'neq', 'contains', 'gte', 'lte', 'in']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    }),
  ),
  homepageVariantId: z.string().min(1),
  enabled: z.boolean(),
});

const leaderSchema = z.object({
  /** Empty hides the card until a name is supplied. */
  name: z.string(),
  role: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.array(z.string()).optional(),
});

const aboutPageSchema = withStatus({
  id: z.literal('about'),
  hero: z.object({
    eyebrow: z.string().min(1),
    titleLead: z.string().min(1),
    titleAccent: z.string().min(1),
    lede: z.string().min(1),
  }),
  purpose: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })),
  values: z.array(z.string()),
  directors: z.array(leaderSchema),
  managementTeam: z.array(leaderSchema),
  timeline: z.array(
    z.object({
      year: z.string().min(1),
      title: z.string().min(1),
      body: z.string().optional(),
      link: z.object({ href: z.string(), label: z.string() }).optional(),
    }),
  ),
  achievements: z.array(
    z.object({ title: z.string().min(1), body: z.string().min(1), imageSrc: z.string().min(1) }),
  ),
  partnerships: z.array(
    z.object({ name: z.string().min(1), body: z.string().min(1), logo: z.string().min(1) }),
  ),
});

const placementsPageSchema = withStatus({
  id: z.literal('placements'),
  hero: z.object({
    eyebrow: z.string().min(1),
    titleLead: z.string().min(1),
    titleAccent: z.string().min(1),
    lede: z.string().min(1),
  }),
  disclaimer: z.string().min(1),
  processSteps: z.array(
    z.object({ step: z.string().min(1), title: z.string().min(1), description: z.string().min(1) }),
  ),
  studentBenefits: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })),
  placedCandidates: z.array(z.object({ name: z.string().min(1), company: z.string().min(1) })),
  testimonials: z.array(
    z.object({ name: z.string().min(1), role: z.string().min(1), quote: z.string().min(1) }),
  ),
  videoTestimonials: z.array(
    z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      provider: z.enum(['youtube', 'vimeo']),
      videoId: z.string().min(1),
      thumbnail: z.string().min(1),
    }),
  ),
  contact: z.object({ phone: z.string().min(1), email: z.string().min(1) }),
  offerLetters: z.array(
    z.object({ src: z.string().min(1), title: z.string().min(1), sector: z.string().min(1) }),
  ),
  recruiters: z.array(z.object({ name: z.string().min(1), src: z.string().min(1) })),
  recruitersDisclaimer: z.string().min(1),
  stats: z.object({
    partners: z.string().min(1),
    learnersPlaced: z.object({ value: z.string().min(1), label: z.string().min(1) }),
  }),
});

const investorsPageSchema = withStatus({
  id: z.literal('investors'),
  company: z.object({
    registeredOffice: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().min(1),
    listedAt: z.string().min(1),
    scripCode: z.string().min(1),
    tradingSymbol: z.string().min(1),
  }),
  stockLive: z.string(),
  latestNews: z.string(),
  grievanceOfficer: z.object({ name: z.string().min(1), phone: z.string().min(1), email: z.string().min(1) }),
  registrar: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    fax: z.string(),
    email: z.string().min(1),
    website: z.string().min(1),
  }),
  kmp: z.array(
    z.object({
      name: z.string().min(1),
      designation: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().min(1),
    }),
  ),
  syncedAt: z.string().min(1),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      items: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })),
    }),
  ),
});

const legalBlockSchema = z.discriminatedUnion('t', [
  z.object({ t: z.enum(['h2', 'h3']), text: z.string().min(1) }),
  z.object({ t: z.literal('p'), text: z.string().min(1) }),
  z.object({
    t: z.enum(['ul', 'ol']),
    items: z.array(z.object({ m: z.string().nullable(), text: z.string().min(1) })),
  }),
  z.object({
    t: z.literal('table'),
    caption: z.string().optional(),
    head: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    t: z.literal('img'),
    src: z.string().min(1),
    alt: z.string(),
    w: z.number(),
    h: z.number(),
  }),
]);

const legalDocumentSchema = withStatus({
  slug: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string(),
  blocks: z.array(legalBlockSchema),
});

const logoListSchema = withStatus({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      file: z.string().optional(),
      dark: z.boolean().optional(),
    }),
  ),
});

/** A site path or a full http(s) address — never `javascript:`, `data:` or anything else. */
const NAV_HREF = /^(\/(?!\/)[A-Za-z0-9\-._~/%?#=&+]*|https?:\/\/[^\s<>"']+)$/;

const navigationSchema = withStatus({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Every menu item needs a label').max(40, 'Keep labels under 40 characters'),
        href: z.string().trim().regex(NAV_HREF, 'Use a page path starting with / (like /courses) or a full https:// address'),
      }),
    )
    .min(1, 'Keep at least one menu item')
    .max(12, 'A header menu works best with 12 items or fewer'),
});

const pageCopySchema = withStatus({
  id: z.string().min(1),
  entries: z.record(z.string(), z.string()),
});

const announcementSchema = withStatus({
  id: z.string().min(1),
  message: z.string().min(1),
  linkLabel: z.string(),
  linkHref: z.string(),
  tone: z.enum(['info', 'promo', 'alert']),
  startsAt: z.string(),
  endsAt: z.string(),
  dismissible: z.boolean(),
});

const sitemapChangeFrequency = z.enum([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]);

const seoSettingsSchema = withStatus({
  id: z.literal('seo'),
  allowIndexing: z.boolean(),
  blockAiCrawlers: z.boolean(),
  extraDisallow: z.array(z.string()),
  alwaysDisallow: z.array(z.string()).default(['/api/']),
  sitemapExclude: z.array(z.string()),
  sitemapInclude: z
    .array(
      z.object({
        path: z.string().min(1),
        priority: z.number().min(0).max(1).optional(),
        changeFrequency: sitemapChangeFrequency.optional(),
      }),
    )
    .default([]),
  aiCrawlers: z.array(z.string()).default([]),
  blogMarketingCovers: z.array(z.string()).default([]),
  forcedNoindexPaths: z.array(z.string()).default([]),
  defaultOgImage: z.string(),
  twitterHandle: z.string(),
  googleVerification: z.string(),
  bingVerification: z.string(),
  organization: z.object({
    name: z.string().default(''),
    legalName: z.string().default(''),
    alternateName: z.array(z.string()).default([]),
    description: z.string(),
    logo: z.string(),
    phone: z.string(),
    sameAs: z.array(z.string()),
    foundingDate: z.string().default(''),
    areaServed: z.string().default('India'),
    knowsAbout: z.array(z.string()).default([]),
  }),
});

const chatbotSettingsSchema = withStatus({
  id: z.literal('chatbot'),
  enabled: z.boolean(),
  disabledMessage: z.string(),
  name: z.string().min(1),
  welcomeMessage: z.string().min(1),
  welcomeChips: z.array(z.object({ label: z.string().min(1), query: z.string().min(1) })),
  inputPlaceholder: z.string(),
  noMatchReply: z.string().min(1),
  offTopicReply: z.string().min(1),
});

const chatbotKnowledgeSchema = withStatus({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  link: z.string(),
  tags: z.array(z.string()),
});

const CMS_COLLECTION_SCHEMAS = {
  courses: courseSchema,
  cities: citySchema,
  centres: centreSchema,
  posts: postSchema,
  faqs: faqSchema,
  policies: policySchema,
  faculty: facultySchema,
  placements: placementSchema,
  trust_signals: trustSignalSchema,
  homepage_variants: homepageVariantSchema,
  persona_rules: personaRuleSchema,
  about_page: aboutPageSchema,
  placements_page: placementsPageSchema,
  investors_page: investorsPageSchema,
  legal_documents: legalDocumentSchema,
  logo_lists: logoListSchema,
  site_navigation: navigationSchema,
  page_copy: pageCopySchema,
  announcements: announcementSchema,
  seo_settings: seoSettingsSchema,
  chatbot_settings: chatbotSettingsSchema,
  chatbot_knowledge: chatbotKnowledgeSchema,
} satisfies Record<CmsCollection, z.ZodTypeAny>;

/** Runtime allowlist for `collection` — a compile-time-only `CmsCollection` union
 *  doesn't stop an arbitrary string reaching `store.json` from a raw action call. */
export const CMS_COLLECTIONS = Object.keys(CMS_COLLECTION_SCHEMAS) as CmsCollection[];

export function validateCmsRecord(
  collection: CmsCollection,
  record: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const schema = CMS_COLLECTION_SCHEMAS[collection];
  const parsed = schema.safeParse(record);
  if (parsed.success) return { ok: true, data: parsed.data as Record<string, unknown> };

  const issue = parsed.error.issues[0];
  const path = issue?.path.join('.') || '(root)';
  return { ok: false, error: `${path}: ${issue?.message ?? 'invalid'}` };
}

/** A record id / slug: URL- and filename-safe, so it can't smuggle a path, a query, markup or an object key trick. */
export const CMS_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,199}$/;

const UNSAFE_SCHEME = /^\s*(?:javascript|vbscript|data\s*:\s*(?:text\/html|image\/svg|application\/))/i;
const UNSAFE_SCHEME_MD = /\]\(\s*(?:javascript|vbscript)\s*:/i;
const URL_KEY = /(?:href|url|src|link|image|logo|poster|thumbnail|photo|file|sameas|website)$/i;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Walks a record and returns a message for the first thing that must never be stored: a `javascript:` /
 * `vbscript:` / HTML-data URL in a link-like field (or a markdown link), or a prototype-pollution key.
 * Deliberately keyed on the field name so ordinary prose that merely starts with "JavaScript:" still saves.
 */
export function findUnsafeContent(value: unknown, path = '', inUrlField = false, depth = 0): string | null {
  if (depth > 20) return `${path || '(root)'}: nested too deeply`;
  if (typeof value === 'string') {
    if (UNSAFE_SCHEME_MD.test(value)) return `${path}: contains an unsafe link`;
    if (inUrlField && UNSAFE_SCHEME.test(value)) return `${path}: must be a normal web address or path, not a script`;
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findUnsafeContent(value[i], `${path}.${i}`, inUrlField, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) return `${path ? `${path}.` : ''}${key}: this key is not allowed`;
      const found = findUnsafeContent(child, path ? `${path}.${key}` : key, URL_KEY.test(key), depth + 1);
      if (found) return found;
    }
  }
  return null;
}
