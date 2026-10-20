import { seoSettingsDefaults } from './fixtures/seo-settings';

/**
 * Scraped Jetking social/share cards (baked-in titles, logos, CTAs).
 * Fine for Open Graph — unsuitable as on-page article or card photography.
 *
 * Defaults ship in SEO settings (`blogMarketingCovers`); editors can add/remove
 * paths under Admin → SEO settings. Call sites should prefer the list from
 * `getSeoSettings()` and fall back to these defaults.
 */
export const BLOG_MARKETING_COVERS = new Set<string>(seoSettingsDefaults.blogMarketingCovers);

export function isBlogMarketingCover(
  url: string | undefined | null,
  denylist: Iterable<string> = BLOG_MARKETING_COVERS,
): boolean {
  if (!url) return false;
  const set = denylist instanceof Set ? denylist : new Set(denylist);
  return set.has(url);
}
