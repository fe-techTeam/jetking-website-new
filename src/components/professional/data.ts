import {
  Award,
  Briefcase,
  CalendarDays,
  Clock3,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Mic,
  MonitorPlay,
  Moon,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';

// The words for all of these live in the page copy (`lib/content/copy/pages/professional.ts`, keyed by
// index: `hero.features.N`, `growth.N.*`, `impact.N.*`, `benefits.N.*`, `flex.N.label`, `cta.features.N`).
// Only the icon paired with each item stays here — it is layout, not copy.
export const HERO_FEATURE_ICONS = [Sparkles, Clock3, Users, Award] as const;

export const GROWTH_STEP_ICONS = [Briefcase, TrendingUp, Award, GraduationCap, Trophy] as const;

export const IMPACT_STAT_ICONS = [Wrench, Award, Briefcase, Landmark] as const;

export const BENEFIT_ICONS = [Sparkles, Award, Clock3, Users, Mic, Briefcase] as const;

export const FLEXIBLE_OPTION_ICONS = [CalendarDays, Moon, MonitorPlay, HeartHandshake] as const;

export const BOTTOM_CTA_FEATURE_ICONS = [Users, Sparkles, GraduationCap] as const;

export { HIRING_PARTNERS } from '@/lib/content/fixtures/logo-sources';

/** Story ids; the story text and portraits (`stories.N.*`, `stories.N.avatar`) live in the page copy. */
export const SUCCESS_STORIES = [
  { id: 'pro-story-1' },
  { id: 'pro-story-2' },
  { id: 'pro-story-3' },
] as const;
