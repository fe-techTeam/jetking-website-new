/**
 * Where links in an answer point.
 *
 * The knowledge base stores relative paths only — it is a self-contained local
 * corpus and must not carry the address of whatever machine crawled it. The
 * public origin is joined on at render time, so the same committed data works
 * in dev, in staging, and embedded in the live site.
 */
import { publicEnv } from '@/lib/config/env';

/** Static product metadata. Single source of truth for naming and copy. */
export const SITE = {
  name: 'Jetking Assistant',
  shortName: 'Jetking',
  description:
    'Ask anything about Jetking courses, placements, fees, eligibility and training centres — answered from jetking.com.',
  organisation: 'Jetking Infotrain Limited',
  /** The site every answer is grounded in. */
  sourceSite: publicEnv.siteUrl,
  sourceLabel: publicEnv.siteHost,
} as const;
