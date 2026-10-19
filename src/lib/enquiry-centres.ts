import type { Centre, City } from '@/lib/content/types';
import type { LocatedCentre } from '@/components/useEnquiryLocation';

/** Centres shaped for the State → City → Centre enquiry dropdowns (adds the city's display name). */
export function toEnquiryCentres(
  centres: Pick<Centre, 'slug' | 'name' | 'citySlug' | 'state'>[],
  cities: Pick<City, 'slug' | 'name'>[],
): LocatedCentre[] {
  const cityName = new Map(cities.map((c) => [c.slug, c.name]));
  return centres.map((c) => ({
    slug: c.slug,
    name: c.name,
    citySlug: c.citySlug,
    city: cityName.get(c.citySlug) ?? c.citySlug,
    state: c.state,
  }));
}
