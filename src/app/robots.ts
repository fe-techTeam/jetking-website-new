import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site';
import { content } from '@/lib/content';

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'CCBot',
];

/**
 * Staging must never be indexed — a crawlable staging copy competes with production
 * for the exact keywords the migration is protecting. Gated on an explicit env flag
 * rather than on NODE_ENV, because staging builds are production builds.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await content.getSeoSettings();
  // The env flag is the hard stop for staging builds; the admin switch can only add to it.
  const indexable = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false' && seo.allowIndexing;

  if (!indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const extra = seo.extraDisallow.map((p) => p.trim()).filter((p) => p.startsWith('/'));
  const disallow = ['/api/', ...extra];

  return {
    rules: [
      // Bingbot is a search engine, not only an AI crawler: it stays allowed even when AI crawlers are blocked.
      { userAgent: 'Bingbot', allow: '/', disallow },
      {
        // Named explicitly because several of these crawlers only index sites that admit
        // them by name, and being crawlable is the precondition for being cited in AI answers.
        userAgent: AI_CRAWLERS,
        ...(seo.blockAiCrawlers ? { disallow: '/' } : { allow: '/', disallow }),
      },
      {
        userAgent: '*',
        allow: '/',
        // /enquiry is kept out of the index via its own `noindex` meta tag
        // (see src/app/enquiry/page.tsx), not disallowed here — a disallowed
        // URL is never crawled at all, so Google never sees that noindex
        // tag and can't act on it. Blocking the crawl instead of letting the
        // tag do its job is also how an already-indexed URL gets stuck
        // showing as a bare, description-less listing in search results.
        disallow,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  };
}
