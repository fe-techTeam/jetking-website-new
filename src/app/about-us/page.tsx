import type { Metadata } from 'next';
import { AboutLanding } from '@/components/about/AboutLanding';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { content } from '@/lib/content';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import { siteConfig } from '@/lib/site';
import { aboutCopy } from '@/lib/content/copy/pages/about';
import { fill } from '@/lib/content/copy/define';
import { loadCopy } from '@/lib/content/copy/load';
import { exploreCopy } from '@/lib/content/copy/pages/explore';
import { parentCopy } from '@/lib/content/copy/pages/parent';

export async function generateMetadata(): Promise<Metadata> {
  const [centres, copy] = await Promise.all([content.listCentres(), loadCopy(aboutCopy)]);
  const values = {
    name: siteConfig.name,
    since: SINCE_FOUNDED,
    sinceLower: SINCE_FOUNDED.toLowerCase(),
    centres: centres.length,
  };
  return buildMetadata(
    {
      title: fill(copy['seo.title'], values),
      description: fill(copy['seo.description'], values),
    },
    '/about-us',
  );
}

export default async function AboutPage() {
  const [copy, explore, parent] = await Promise.all([loadCopy(aboutCopy), loadCopy(exploreCopy), loadCopy(parentCopy)]);
  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.about'], path: '/about-us' },
  ];
  const [courses, centres, cities, about] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
    content.getAboutPage(),
  ]);
  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <AboutLanding
        copy={copy}
        about={about}
        explore={explore}
        parent={parent}
        counts={{ courses: courses.length, centres: centres.length, cities: cities.length }}
      />
    </>
  );
}
