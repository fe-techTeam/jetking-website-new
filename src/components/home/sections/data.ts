import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Handshake,
  Landmark,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

/**
 * Static homepage content that has no home in the CMS content model — grounded in
 * what already ships elsewhere in this app (About timeline, admissions policy,
 * franchise copy, course fixtures) rather than invented for this page. No figure
 * here is a scale/outcome claim; those come only from `buildFigures()` /
 * `listTrustSignals()`, which is the one place unverified numbers are refused.
 */

/**
 * One of the site's four global category hues (`--theme-{hue}-ink` / `-tint` in
 * globals.css) — the same set `PROGRAM_META` uses for course-card icon chips on the
 * Professional page (`src/components/professional/data.ts`). Reused here, on career
 * paths and the "Why Jetking" cards, instead of inventing new colours per section —
 * that per-card colour-chip treatment is the "internal page" card language this
 * homepage is matching.
 */
export type Hue = 'network' | 'cloud' | 'cyber' | 'ai';

export const HUE_VARS: Record<Hue, { accent: string; tint: string }> = {
  network: { accent: 'var(--theme-network-ink)', tint: 'var(--theme-network-tint)' },
  cloud: { accent: 'var(--theme-cloud-ink)', tint: 'var(--theme-cloud-tint)' },
  cyber: { accent: 'var(--theme-cyber-ink)', tint: 'var(--theme-cyber-tint)' },
  ai: { accent: 'var(--theme-ai-ink)', tint: 'var(--theme-ai-tint)' },
};

/** One of the site's four global category hues (`--theme-{hue}-ink` / `-tint` in globals.css) — the same set `PROGRAM_META` uses on the Professional page, reused here rather than inventing a fifth. */
export { CERT_LOGOS } from '@/lib/content/fixtures/logo-sources';

export { MORE_EMPLOYER_LOGOS } from '@/lib/content/fixtures/logo-sources';

export interface Recognition {
  icon: LucideIcon;
  hue: Hue;
}

/**
 * Every entry is taken from the About timeline (`about/data.ts` TIMELINE) or the course fixtures (`fixtures/courses.ts`) — nothing new is claimed here.
 * Only the icon and hue live here; each card's badge, title and detail are the page copy `recognition.items.N.*`, in this order.
 */
export const RECOGNITIONS: Recognition[] = [
  { icon: BadgeCheck, hue: 'cloud' },
  { icon: Award, hue: 'ai' },
  { icon: Trophy, hue: 'cyber' },
  { icon: Handshake, hue: 'network' },
  { icon: Landmark, hue: 'cloud' },
  { icon: ShieldCheck, hue: 'network' },
];
