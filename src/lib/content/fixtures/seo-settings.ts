import type { SeoSettings } from '../types';
import { SOCIAL_LINKS } from '@/lib/social';
import { siteConfig } from '@/lib/site';

/** What the site does today — so an unedited SEO settings record changes nothing. */
export const seoSettingsDefaults: SeoSettings = {
  id: 'seo',
  allowIndexing: true,
  blockAiCrawlers: false,
  extraDisallow: [],
  sitemapExclude: [],
  defaultOgImage: '/og-default.png',
  twitterHandle: '@JetkingLtd',
  googleVerification: '',
  bingVerification: '',
  organization: {
    description: siteConfig.description,
    logo: '/brand/jetking-shield.png',
    phone: `+91-${siteConfig.helpline.replace(/^0/, '')}`,
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  },
};
