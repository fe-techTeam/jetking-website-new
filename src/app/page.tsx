import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { content } from '@/lib/content';
import { loadHomeData } from '@/components/home/data';
import { HomeHero } from '@/components/home/hero/HomeHero';
import { HomeSections } from '@/components/home/sections/HomeSections';
import { PlacementBand } from '@/components/home/sections/PlacementBand';
import { fill } from '@/lib/content/copy/define';
import { loadCopy } from '@/lib/content/copy/load';
import { homeCopy } from '@/lib/content/copy/pages/home';

export async function generateMetadata() {
  const copy = await loadCopy(homeCopy);
  return buildMetadata(
    {
      title: fill(copy['seo.title'], { siteName: siteConfig.name }),
      description: fill(copy['seo.description'], { siteName: siteConfig.name }),
    },
    '/',
  );
}

/**
 * The homepage.
 *
 * `HomeHero` (hero/) is the hero lead: headline, persona chooser, action bar and quick-action
 * rail. `HomeSections` (sections/) is everything below it, ending in the site's normal footer
 * (see `FooterChrome`).
 */
export default async function HomePage() {
  const [data, centres, cities, copy] = await Promise.all([
    loadHomeData(),
    content.listCentres(),
    content.listCities(),
    loadCopy(homeCopy),
  ]);
  const enquiryCentres = toEnquiryCentres(centres, cities);

  return (
    <>
      <ScrollDepthTracker />
      <div className="relative overflow-hidden [transform:translateZ(0)]">
        <HomeHero
          enquiryCentres={enquiryCentres}
          counts={data.counts}
          placed={data.placements.stats.learnersPlaced}
          copy={copy}
        />
      </div>
      <PlacementBand copy={copy} placed={data.placements.stats.learnersPlaced} />
      <HomeSections data={data} enquiryCentres={enquiryCentres} copy={copy} />
    </>
  );
}
