import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { CentresLanding } from '@/components/centres/CentresLanding';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Jetking Centres Across India | Find Your Nearest',
    description:
      'Find Jetking IT training centres by city. Browse centres across India offering cloud computing, cyber security, DevOps and networking courses.',
  },
  '/centres',
);

/**
 * Centres index — Future-Ready dark canvas (home / blog / student language).
 *
 * Every city and centre (address, phone) is server-rendered in the initial HTML.
 * Search / filters only toggle visibility — nothing is hidden from crawlers.
 */
export default async function CentresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const [cities, centres] = await Promise.all([content.listCities(), content.listCentres()]);

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Centres', path: '/centres' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <CentresLanding
        cities={cities.map((c) => ({ slug: c.slug, name: c.name, state: c.state }))}
        centres={centres.map((c) => ({
          slug: c.slug,
          name: c.name,
          citySlug: c.citySlug,
          addressLine: c.addressLine,
          locality: c.locality,
          state: c.state,
          pincode: c.pincode,
          phone: c.phone,
        }))}
        initialQuery={typeof rawQuery === 'string' ? rawQuery : ''}
      />
    </>
  );
}
