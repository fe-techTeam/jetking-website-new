import type { LogoList } from '../types';
import { CERT_LOGOS, MORE_EMPLOYER_LOGOS } from '@/components/home/sections/data';
import { PLACEMENT_PARTNERS } from '@/components/explore/partners';
import { HIRING_PARTNERS } from '@/components/professional/data';

/**
 * The in-repo DEFAULTS for the editable logo lists: they seed the CMS (`logo_lists`) and are what a
 * page falls back to when a record is missing or still a draft. The arrays they are built from
 * stay exported next to their components, so there is one source of truth.
 */
export const logoListDefaults: LogoList[] = [
  {
    id: 'home-certifications',
    title: 'Home: certifications',
    description: 'The “certifications the curriculum prepares you for” logo row on the home page.',
    items: CERT_LOGOS.map((l) => ({ name: l.name, file: l.file, dark: false })),
  },
  {
    id: 'home-employers',
    title: 'Home: where alumni work',
    description: 'The employer logo row on the home page.',
    items: [
      ...HIRING_PARTNERS.map((p) => ({ name: p.name, file: p.logo, dark: false })),
      ...MORE_EMPLOYER_LOGOS.map((l) => ({ name: l.name, file: l.file, dark: Boolean(l.dark) })),
    ],
  },
  {
    id: 'explore-partners',
    title: 'Explore: placement partners',
    description: 'The “Our Placement Partners” grid on /explore. A company without an image shows as a plain name tile.',
    items: PLACEMENT_PARTNERS.map((p) => ({ name: p.name, file: p.file ?? '', dark: Boolean(p.dark) })),
  },
  {
    id: 'professional-employers',
    title: 'Professionals: hiring partners',
    description: 'The scrolling hiring-partner strip on the Professionals page.',
    items: HIRING_PARTNERS.map((p) => ({ name: p.name, file: p.logo, dark: false })),
  },
];

export const logoListFallback = (id: string): LogoList =>
  logoListDefaults.find((l) => l.id === id) ?? { id, title: id, description: '', items: [] };
