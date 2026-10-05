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

/**
 * Recruiters Jetking itself publishes on jetking.com. Logos are the site's own
 * (vector logos in /public/logos/employers; Tikona is a raster in /public/placements/recruiters); a company that is not listed there is not
 * shown here, rather than being drawn from a generic "top IT employers" list.
 */
export const HIRING_PARTNERS = [
  { name: 'Accenture', logo: '/logos/employers/accenture.svg' },
  { name: 'Amazon', logo: '/logos/employers/amazon.svg' },
  { name: 'Capgemini', logo: '/logos/employers/capgemini.svg' },
  { name: 'IBM', logo: '/logos/employers/ibm.svg' },
  { name: 'Infosys', logo: '/logos/employers/infosys.svg' },
  { name: 'Microsoft', logo: '/logos/employers/microsoft.svg' },
  { name: 'Samsung', logo: '/logos/employers/samsung.svg' },
  { name: 'SAP', logo: '/logos/employers/sap.svg' },
  { name: 'Tech Mahindra', logo: '/logos/employers/tech-mahindra.svg' },
  { name: 'Tikona', logo: '/placements/recruiters/tikona.png' },
  { name: 'Vodafone', logo: '/logos/employers/vodafone.svg' },
  { name: 'Wipro', logo: '/placements/partners/wipro.svg' },
] as const;

/** Story ids and portraits; the story text (`stories.N.*`) lives in the page copy. */
export const SUCCESS_STORIES = [
  { id: 'pro-story-1', avatar: '/professional/avatar-rahul.webp' },
  { id: 'pro-story-2', avatar: '/professional/avatar-priya.webp' },
  { id: 'pro-story-3', avatar: '/professional/avatar-vikram.webp' },
] as const;
