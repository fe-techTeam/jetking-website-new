import type { FirstTouchInput } from './types';

/**
 * Acquisition channel — how the visitor arrived (first touch).
 *
 * Organic search = search-engine referrer AND no paid markers.
 * Google no longer sends the keyword; we only know the channel.
 */

export const ACQUISITION_CHANNELS = [
  'organic_search',
  'paid_search',
  'social',
  'campaign',
  'referral',
  'direct',
] as const;

export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number];

const SEARCH_ENGINE_HOST =
  /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia)\./i;

const SOCIAL_HOST =
  /(^|\.)(facebook|instagram|linkedin|twitter|x\.com|t\.co|youtube|snapchat|whatsapp)\./i;

const PAID_MEDIUM = /^(cpc|ppc|paid|paidsearch|paid[_-]?social|sem|display|cpm)$/i;

function isSearchEngineReferrer(host: string | undefined): boolean {
  return Boolean(host && SEARCH_ENGINE_HOST.test(host));
}

export function isPaidSearch(input: Pick<FirstTouchInput, 'utmMedium' | 'utmSource' | 'gclid'>): boolean {
  if (input.gclid) return true;
  if (input.utmMedium && PAID_MEDIUM.test(input.utmMedium.trim())) return true;
  if (input.utmSource && /googleads|ads\.google|bingads|doubleclick/i.test(input.utmSource)) {
    return true;
  }
  return false;
}

/** Normal (organic) search: search-engine referrer, no paid markers. */
export function isOrganicSearch(input: FirstTouchInput): boolean {
  return isSearchEngineReferrer(input.referrerHost) && !isPaidSearch(input);
}

export function resolveAcquisitionChannel(input: FirstTouchInput): AcquisitionChannel {
  if (isPaidSearch(input) && (isSearchEngineReferrer(input.referrerHost) || input.gclid || input.utmSource)) {
    return 'paid_search';
  }
  if (isPaidSearch(input)) {
    // Paid medium without search referrer (e.g. paid social) — still not organic.
    if (input.utmMedium && /paid[_-]?social|cpc|ppc/i.test(input.utmMedium)) {
      return input.referrerHost && SOCIAL_HOST.test(input.referrerHost) ? 'social' : 'campaign';
    }
    return 'campaign';
  }
  if (isOrganicSearch(input)) return 'organic_search';
  if (input.utmCampaign || input.utmSource || input.utmMedium) return 'campaign';
  if (input.referrerHost && SOCIAL_HOST.test(input.referrerHost)) return 'social';
  if (input.referrerHost) return 'referral';
  return 'direct';
}
