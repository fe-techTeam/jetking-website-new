import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site';
import { content } from '@/lib/content';

/**
 * Staging must never be indexed — a crawlable staging copy competes with production
 * for the exact keywords the migration is protecting. Gated on an explicit env flag
 * rather than on NODE_ENV, because staging builds are production builds.
 *
 * AI crawler names, disallow paths and the indexing switch all come from SEO settings
 * in the admin (SEO settings). The env flag is only an emergency staging kill-switch.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await content.getSeoSettings();
  const indexable = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'false' && seo.allowIndexing;

  if (!indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const always = seo.alwaysDisallow.map((p) => p.trim()).filter((p) => p.startsWith('/'));
  const extra = seo.extraDisallow.map((p) => p.trim()).filter((p) => p.startsWith('/'));
  const disallow = [...always, ...extra];
  const aiAgents = seo.aiCrawlers.map((a) => a.trim()).filter(Boolean);

  return {
    rules: [
      // Bingbot is a search engine, not only an AI crawler: it stays allowed even when AI crawlers are blocked.
      { userAgent: 'Bingbot', allow: '/', disallow },
      ...(aiAgents.length
        ? [
            {
              userAgent: aiAgents,
              ...(seo.blockAiCrawlers ? { disallow: '/' } : { allow: '/', disallow }),
            },
          ]
        : []),
      {
        userAgent: '*',
        allow: '/',
        // Thin pages (e.g. /enquiry) stay crawlable so their noindex meta is seen — do not
        // put them in alwaysDisallow unless you intentionally want them uncrawlable.
        disallow,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  };
}
