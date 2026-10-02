import type { Metadata } from 'next';
import type { Centre, Course, Faq, Post, Seo } from '@/lib/content/types';
import { absoluteUrl, siteConfig } from './site';
import { centrePath } from './centre-path';
import { SOCIAL_LINKS } from './social';
import { FOUNDED_YEAR } from './brand-facts';
import { cleanBlogBody } from './content/cleanBlogBody';

/**
 * SEO helpers.
 *
 * Every indexable page goes through `buildMetadata`, which guarantees the four
 * things the CI SEO gate asserts (DEVELOPMENT-PLAN §6.2): a non-empty title, a
 * non-empty description, a self-referential absolute canonical, and correct
 * indexability. Pages cannot forget these because there is no other path to
 * metadata in the codebase.
 */

/** 1200×630 share card (public/og-default.png), used when a page has no image of its own. */
const DEFAULT_OG_IMAGE = { url: '/og-default.png', width: 1200, height: 630 } as const;

export function buildMetadata(seo: Seo, path: string): Metadata {
  const canonical = absoluteUrl(seo.canonicalPath ?? path);
  const image = seo.ogImage
    ? { url: absoluteUrl(seo.ogImage) }
    : { url: absoluteUrl(DEFAULT_OG_IMAGE.url), width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };

  return {
    // `absolute` suppresses the root layout's "%s | Jetking" template. SEO titles
    // are authored complete (they already carry the brand), so letting the template
    // apply produces "… | Jetking | Jetking".
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical },
    robots: seo.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: seo.title,
      description: seo.description,
      url: canonical,
      images: [{ ...image, alt: seo.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [image.url],
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Structured data                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

type JsonLd = Record<string, unknown>;

/** Stable node ids, so every page's schema points at the same Organization / WebSite entity. */
export const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

const organizationRef = { '@id': ORGANIZATION_ID } as const;

export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    alternateName: ['Jetking Infotrain', 'Jetking Infotrain Ltd'],
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/brand/jetking-shield.png'),
      width: 238,
      height: 266,
    },
    image: absoluteUrl('/og-default.png'),
    description: siteConfig.description,
    foundingDate: String(FOUNDED_YEAR),
    areaServed: { '@type': 'Country', name: 'India' },
    knowsAbout: [
      'Cloud computing',
      'Cyber security',
      'Ethical hacking',
      'Computer networking',
      'IT infrastructure',
      'DevOps',
      'Data analytics',
      'Artificial intelligence',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+91-${siteConfig.helpline.replace(/^0/, '')}`,
      contactType: 'admissions',
      areaServed: 'IN',
    },
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: 'en-IN',
    publisher: organizationRef,
  };
}

const DURATION_UNITS = {
  year: { designator: 'Y', days: 365 },
  month: { designator: 'M', days: 30 },
  week: { designator: 'W', days: 7 },
  day: { designator: 'D', days: 1 },
} as const;

/** "3 years" / "2.5 months" → ISO 8601 ("P3Y" / "P75D"), the only form `timeRequired` accepts. */
export function isoDuration(duration: string): string | undefined {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(year|month|week|day)s?\b/i.exec(duration);
  if (!match?.[1] || !match[2]) return undefined;
  const value = Number(match[1]);
  const unit = DURATION_UNITS[match[2].toLowerCase() as keyof typeof DURATION_UNITS];
  return Number.isInteger(value)
    ? `P${value}${unit.designator}`
    : `P${Math.round(value * unit.days)}D`;
}

/**
 * Course schema deliberately omits `offers`/price. Emitting a price we are not
 * certain of is the structured-data equivalent of the AI Guide quoting a wrong fee
 * (risk R4) — and unlike a chat reply, a wrong price in schema can surface directly
 * in search results.
 */
export function courseSchema(course: Course): JsonLd {
  const url = absoluteUrl(`/courses/${course.slug}`);
  const duration = isoDuration(course.duration);
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name: course.title,
    description: course.seo.description,
    url,
    inLanguage: 'en-IN',
    provider: {
      '@type': 'EducationalOrganization',
      '@id': ORGANIZATION_ID,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    ...(course.heroImage ? { image: absoluteUrl(course.heroImage.url) } : {}),
    ...(course.eligibility ? { coursePrerequisites: course.eligibility } : {}),
    ...(course.outcomes.length ? { teaches: course.outcomes } : {}),
    ...(course.modules.length ? { syllabusSections: course.modules.map((name) => ({ '@type': 'Syllabus', name })) } : {}),
    educationalCredentialAwarded: course.level === 'degree' ? 'Bachelor Degree' : 'Certificate',
    ...(duration ? { timeRequired: duration } : {}),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Onsite',
      ...(duration ? { courseWorkload: duration } : {}),
    },
  };
}

export function centreSchema(centre: Centre, cityName: string): JsonLd {
  const url = absoluteUrl(centrePath(centre.slug));
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': `${url}#centre`,
    name: centre.name,
    url,
    image: absoluteUrl('/og-default.png'),
    parentOrganization: organizationRef,
    areaServed: { '@type': 'City', name: cityName },
    ...(centre.email ? { email: centre.email } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: centre.addressLine,
      addressLocality: cityName,
      addressRegion: centre.state,
      postalCode: centre.pincode,
      addressCountry: 'IN',
    },
    ...(centre.phone ? { telephone: centre.phone } : {}),
    ...(centre.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: centre.geo.lat, longitude: centre.geo.lng } }
      : {}),
  };
}

export function articleSchema(post: Post): JsonLd {
  const url = absoluteUrl(post.seo.canonicalPath ?? `/blog/${post.slug}`);
  const image = post.heroImage?.url ?? post.seo.ogImage ?? DEFAULT_OG_IMAGE.url;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title.slice(0, 110),
    description: postDescription(post),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'en-IN',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    author: { '@type': 'Organization', name: post.author, url: siteConfig.url },
    publisher: organizationRef,
    isPartOf: { '@id': WEBSITE_ID },
    image: absoluteUrl(image),
  };
}

const DESCRIPTION_MAX = 155;

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trims at a word boundary so a snippet never ends mid-word. */
function clip(text: string, max = DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–—-]+$/, '')}…`;
}

/**
 * Many migrated posts carry a description that is just the title repeated, or one the
 * legacy CMS cut mid-word at 160 characters. Both waste the search snippet and give
 * answer engines nothing to quote, so fall back to the excerpt or the opening paragraph.
 */
export function postDescription(post: Post): string {
  const stored = plainText(post.seo.description ?? '');
  const title = post.title.trim().toLowerCase();
  const usable =
    stored.length >= 70 &&
    stored.toLowerCase() !== title &&
    stored.toLowerCase() !== post.seo.title.trim().toLowerCase() &&
    (stored.length < 150 || /[.!?)"”']$/.test(stored));
  if (usable) return clip(stored);

  const excerpt = plainText(post.excerpt ?? '');
  if (excerpt.length >= 70 && excerpt.toLowerCase() !== title) return clip(excerpt);

  const firstParagraph = cleanBlogBody(post.body).find(
    (block): block is Extract<typeof block, { type: 'paragraph' }> =>
      block.type === 'paragraph' && plainText(block.text).length >= 70,
  );
  return clip(firstParagraph ? plainText(firstParagraph.text) : stored || post.title);
}

export function faqSchema(faqs: Array<Pick<Faq, 'question' | 'answer'>>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
