/**
 * Franchise page structures (why-stats, jump-start, launch steps, market stats, courses, investment bands) built
 * from the franchise page text DEFAULTS in `lib/content/copy/pages/franchise.ts`. They are plain data — no icon
 * components or Next.js imports — so they stay usable from non-Next code.
 *
 * The chatbot corpus no longer reads this file: `lib/content/site-corpus.ts` merges the page's published CMS
 * edits over the same defaults, so an admin edit reaches the chatbot. The rendered page does the same through
 * `loadCopy`. This file reads the shipped defaults only.
 */

import { franchiseCopy } from '../../lib/content/copy/pages/franchise';

const d: Record<string, string> = franchiseCopy.defaults;

export const WHY_STATS = [0, 1, 2, 3, 4].map((i) => ({
  value: d[`why.${i}.value`]!,
  label: d[`why.${i}.label`]!,
}));

export const JUMP_START = [0, 1, 2, 3].map((i) => ({
  title: d[`jump.${i}.title`]!,
  detail: d[`jump.${i}.detail`]!,
}));

export const LAUNCH_STEPS = [0, 1, 2, 3].map((i) => ({
  step: d[`launch.${i}.step`]!,
  title: d[`launch.${i}.title`]!,
  body: d[`launch.${i}.body`]!,
}));

export const MARKET_STATS = [0, 1, 2, 3].map((i) => ({
  value: d[`market.${i}.value`]!,
  label: d[`market.${i}.label`]!,
}));

export const COURSES = [0, 1, 2].map((i) => ({
  title: d[`courses.${i}.title`]!,
  body: d[`courses.${i}.body`]!,
}));

export const FRANCHISE_INVESTMENT = {
  capacityBands: [d['investment.band.0']!, d['investment.band.1']!, d['investment.band.2']!],
  contactEmail: d['contact.email']!,
};
