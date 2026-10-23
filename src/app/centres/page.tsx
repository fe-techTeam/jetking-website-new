import { content } from '@/lib/content';
import { centresCopy } from '@/lib/content/copy/pages/centres';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { CentresLanding } from '@/components/centres/CentresLanding';

export async function generateMetadata() {
  return pageMetadata(centresCopy, '/centres');
}

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
  const copy = await loadCopy(centresCopy);
  const [cities, centres] = await Promise.all([content.listCities(), content.listCentres()]);
  // A centre with no country is an Indian one; a city takes the country of its centres.
  const countryOf = (c: { country?: string }) => c.country?.trim() || 'India';
  const cityCountry = new Map<string, string>();
  for (const c of centres) if (!cityCountry.has(c.citySlug)) cityCountry.set(c.citySlug, countryOf(c));

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.centres'], path: '/centres' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <CentresLanding
        copy={copy}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name, state: c.state, country: cityCountry.get(c.slug) ?? 'India' }))}
        centres={centres.map((c) => ({
          slug: c.slug,
          name: c.name,
          citySlug: c.citySlug,
          cityName: cities.find((city) => city.slug === c.citySlug)?.name ?? c.citySlug,
          addressLine: c.addressLine,
          locality: c.locality,
          state: c.state,
          country: countryOf(c),
          pincode: c.pincode,
          phone: c.phone,
          geo: c.geo,
        }))}
        initialQuery={typeof rawQuery === 'string' ? rawQuery : ''}
      />
    </>
  );
}
