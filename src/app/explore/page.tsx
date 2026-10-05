import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { exploreCopy } from '@/lib/content/copy/pages/explore';
import { fill } from '@/lib/content/copy/define';
import { loadCopy } from '@/lib/content/copy/load';
import { ExploreLanding } from '@/components/explore/ExploreLanding';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(exploreCopy);
  return buildMetadata(
    {
      title: fill(copy['seo.title'], { brand: siteConfig.name }),
      description: fill(copy['seo.description'], { brand: siteConfig.name }),
      // Audience pages are not listed or indexed; the main pages carry their content.
      noindex: true,
    },
    '/explore',
  );
}

export default async function ExplorePage() {
  const copy = await loadCopy(exploreCopy);
  const [courses, home, posts, centres, cities] = await Promise.all([
    content.listCourses(),
    loadHomeData(),
    content.listPosts({ limit: 3 }),
    content.listCentres(),
    content.listCities(),
  ]);

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/explore' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <ExploreLanding
        courses={courses}
        counts={home.counts}
        about={home.about}
        placements={home.placements}
        posts={posts}
        enquiryCentres={toEnquiryCentres(centres, cities)}
        copy={copy}
      />
    </>
  );
}
