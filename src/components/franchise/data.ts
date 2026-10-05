/**
 * Franchise page content for scripts/export-site-corpus.mts (a plain Node/tsx script,
 * run under `--conditions=react-server`) — so it must not pull in lucide-react icon
 * components (they use React context internals unavailable under that condition) or
 * the component's next/image, next/link etc. imports, which only resolve inside the
 * Next.js runtime.
 *
 * The wording itself now lives in `lib/content/copy/pages/franchise.ts` (the page's
 * editable "page text" defaults); these arrays are rebuilt from those defaults so the
 * chatbot's knowledge index and the rendered page share one source. The page reads the
 * live (CMS-merged) copy; this file reads the shipped defaults.
 *
 * Deliberately no `icon` fields here: icons are purely decorative and irrelevant to the
 * chatbot's text index. FranchiseLandingLight pairs each entry with its icon by index
 * when rendering — see the *_ICONS arrays there.
 *
 * Also lets the chatbot's knowledge index draw on this real franchise-operations copy —
 * previously invisible to it entirely, same gap the About/Placements pages had.
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
