/**
 * Which tracking tags the site loads. Pure (no React, no I/O) so it can be unit-tested and read anywhere.
 *
 * The defaults are the tags the live jetking.com already runs; each is overridable from the environment, and
 * an empty value switches that tag off. Tracking only runs in a production build that search engines may
 * index — never on localhost, preview/staging deployments (`NEXT_PUBLIC_ALLOW_INDEXING=false`) or when
 * `NEXT_PUBLIC_TRACKING_ENABLED=false`.
 *
 * Each value is read through a literal `process.env.NEXT_PUBLIC_*` so Next inlines it (see `config/env.ts`).
 */

/** Google Tag Manager container the live site uses. */
const DEFAULT_GTM_ID = 'GTM-NS3S5GL';
/** Google Analytics 4 properties and the Google Ads account on the live site (the old UA-… property is shut down). */
const DEFAULT_GOOGLE_TAG_IDS = 'G-0X1JFRD2CY,G-W63BK7Z7N8,AW-16690495274';
/** Meta (Facebook) pixels on the live site. */
const DEFAULT_META_PIXEL_IDS = '712749829308803,982141604187576';

const GTM_ID = /^GTM-[A-Z0-9]{4,10}$/;
const GOOGLE_TAG_ID = /^(G|AW|GT|DC)-[A-Z0-9]{6,14}$/;
const META_PIXEL_ID = /^\d{8,20}$/;

export interface TrackingConfig {
  enabled: boolean;
  gtmId: string | null;
  googleTagIds: string[];
  metaPixelIds: string[];
}

/** `undefined` = not set (use the default); `''` = set to empty (off). Splits on commas/spaces, keeps valid ids only. */
function pickIds(value: string | undefined, fallback: string, valid: RegExp): string[] {
  const raw = value === undefined ? fallback : value;
  return [...new Set(raw.split(/[\s,]+/).map((id) => id.trim()).filter((id) => valid.test(id)))];
}

export function resolveTracking(env: {
  production: boolean;
  allowIndexing?: string;
  enabled?: string;
  gtmId?: string;
  googleTagIds?: string;
  metaPixelIds?: string;
}): TrackingConfig {
  const enabled = env.production && env.allowIndexing !== 'false' && env.enabled !== 'false';
  if (!enabled) return { enabled: false, gtmId: null, googleTagIds: [], metaPixelIds: [] };
  return {
    enabled: true,
    gtmId: pickIds(env.gtmId, DEFAULT_GTM_ID, GTM_ID)[0] ?? null,
    googleTagIds: pickIds(env.googleTagIds, DEFAULT_GOOGLE_TAG_IDS, GOOGLE_TAG_ID),
    metaPixelIds: pickIds(env.metaPixelIds, DEFAULT_META_PIXEL_IDS, META_PIXEL_ID),
  };
}

export const tracking: TrackingConfig = resolveTracking({
  production: process.env.NODE_ENV === 'production',
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
  enabled: process.env.NEXT_PUBLIC_TRACKING_ENABLED,
  gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  googleTagIds: process.env.NEXT_PUBLIC_GA_IDS,
  metaPixelIds: process.env.NEXT_PUBLIC_META_PIXEL_IDS,
});
