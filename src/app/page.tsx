import { toEnquiryCentres } from '@/lib/enquiry-centres';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { content } from '@/lib/content';
import { loadHomeData } from '@/components/home/data';
import { HomeV2 } from '@/components/home/v2/HomeV2';
import { HomeSections } from '@/components/home/v3/HomeSections';

export const metadata: Metadata = buildMetadata(
  {
    title: `${siteConfig.name} — Cloud, Cyber Security & IT Courses`,
    description:
      'Degree, diploma and certification courses in cloud computing, cyber security and IT infrastructure — taught at Jetking centres across India.',
  },
  '/',
);

/**
 * The homepage.
 *
 * `HomeV2` (v2/) is the hero lead: headline, persona chooser, action bar and quick-action
 * rail. `HomeSections` (v3/) is everything below it, ending in the site's normal footer
 * (see `FooterChrome`).
 */
export default async function HomePage() {
  const [data, centres, cities] = await Promise.all([
    loadHomeData(),
    content.listCentres(),
    content.listCities(),
  ]);
  const enquiryCentres = toEnquiryCentres(centres, cities);

  return (
    <>
      <ScrollDepthTracker />
      <div className="relative overflow-hidden [transform:translateZ(0)]">
        <HomeV2 enquiryCentres={enquiryCentres} />
      </div>
      <HomeSections data={data} enquiryCentres={enquiryCentres} />
    </>
  );
}
