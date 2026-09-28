import { Building2, GraduationCap, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TrustSignal } from '@/lib/content/types';

/**
 * The homepage's figures, for both leads.
 *
 * The mocks fill these with 100+ / 90% / 75,000+ / 25+ / 1000+. None of those
 * survive contact with `fixtures/trust.ts`: every scale claim Jetking has supplied
 * so far is `verified: false`, and the content source strips unverified signals
 * before a template can reach them. Publishing "90% placement assistance" because
 * it looked good in a mock is exactly the class of claim this project refuses to
 * make (DEVELOPMENT-PLAN risk R4).
 *
 * So the figures are derived from the catalogue and true by construction, and
 * verified trust signals fill the remaining slot as soon as Jetking substantiates
 * them. The visuals are the mocks'; the numbers are ours.
 */
export interface Figure {
  icon: LucideIcon;
  value: string;
  label: string;
}

export function buildFigures({
  centres,
  cities,
  courses,
  trust,
}: {
  centres: number;
  cities: number;
  courses: number;
  trust: TrustSignal[];
}): Figure[] {
  const derived: Figure[] = [
    { icon: Building2, value: String(centres), label: 'Learning centres\nacross India' },
    { icon: MapPin, value: String(cities), label: 'Cities across\nIndia' },
    { icon: Sparkles, value: String(courses), label: 'Courses\non offer' },
  ];

  const verified: Figure[] = trust
    .slice(0, 1)
    .map((signal) => ({ icon: ShieldCheck, value: signal.value, label: signal.label }));

  return verified.length > 0
    ? [...derived, ...verified]
    : [
        ...derived,
        { icon: GraduationCap, value: '1990', label: 'Training arm\nestablished' },
      ];
}
