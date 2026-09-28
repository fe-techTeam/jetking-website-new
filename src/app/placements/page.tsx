import type { Metadata } from 'next';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { PlacementsLanding } from '@/components/placements/PlacementsLanding';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Placement Support at Jetking — What It Includes',
    description:
      'What Jetking placement support covers: interview preparation, profile building and employer introductions. Written for students and parents evaluating the course.',
  },
  '/placements',
);

export default function PlacementsPage() {
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Placements', path: '/placements' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <PlacementsLanding />
    </>
  );
}
