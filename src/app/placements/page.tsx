import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { PlacementsLanding } from '@/components/placements/PlacementsLanding';
import { content } from '@/lib/content';
import { placementsCopy } from '@/lib/content/copy/pages/placements';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(placementsCopy, '/placements');
}

export default async function PlacementsPage() {
  const [placements, copy] = await Promise.all([content.getPlacementsPage(), loadCopy(placementsCopy)]);
  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.placements'], path: '/placements' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <PlacementsLanding placements={placements} copy={copy} />
    </>
  );
}
