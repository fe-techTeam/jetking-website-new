import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { buildMetadata } from '@/lib/seo';
import { CentreDetail } from '@/components/CentreDetail';

/**
 * Centre page — `/centres/{slug}`.
 *
 * The live jetking.com site uses flat centre URLs (`/centres/ameerpet`). There is no
 * city landing page: "all centres in {city}" is the centres directory filtered to that
 * city (`/centres?q={city}`), which already groups State → City → Centre. Old city URLs
 * (`/centres/pune`) therefore permanently redirect there instead of 404ing, so links and
 * search rankings that point at them keep working.
 *
 * A segment can be both a city and a centre (`/centres/durg` is the city Durg and the
 * centre Jetking Durg) — the centre wins, since it is the more specific page.
 */

export async function generateStaticParams() {
  const centres = await content.listCentres();
  return centres.map((centre) => ({ city: centre.slug }));
}

/** Where a city URL sends visitors: the directory, filtered to that city. */
function cityDirectoryPath(cityName: string): string {
  return `/centres?q=${encodeURIComponent(cityName)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: segment } = await params;

  const centre = await content.getCentreBySlug(segment);
  if (!centre) return {};

  return buildMetadata(centre.seo, centrePath(centre.slug));
}

export default async function CentrePage({ params }: { params: Promise<{ city: string }> }) {
  const { city: segment } = await params;

  const centre = await content.getCentreBySlug(segment);
  if (!centre) {
    const city = await content.getCity(segment);
    if (city) permanentRedirect(cityDirectoryPath(city.name) as Route);
    notFound();
  }

  const [parentCity, courses, allCentres, cities] = await Promise.all([
    content.getCity(centre.citySlug),
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
  ]);
  if (!parentCity) notFound();
  const cityCentres = allCentres.filter((c) => c.citySlug === centre.citySlug);

  return (
    <CentreDetail
      centre={centre}
      city={parentCity}
      courses={courses}
      siblingCentres={cityCentres}
      canonicalPath={centrePath(centre.slug)}
      network={{ courses: courses.length, centres: allCentres.length, cities: cities.length }}
    />
  );
}
