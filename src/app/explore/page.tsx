import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { ExploreLanding } from '@/components/explore/ExploreLanding';

export const metadata: Metadata = buildMetadata(
  {
    title: `Explore ${siteConfig.name} — Courses, Centres & Placements`,
    description:
      'Browse Jetking courses, placement stories and centres across India — no commitment needed, just explore at your own pace.',
  },
  '/explore',
);

export default async function ExplorePage() {
  const [courses, home, posts, centres, cities] = await Promise.all([
    content.listCourses(),
    loadHomeData(),
    content.listPosts({ limit: 3 }),
    content.listCentres(),
    content.listCities(),
  ]);

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <ExploreLanding
        courses={courses}
        counts={home.counts}
        posts={posts}
        enquiryCentres={toEnquiryCentres(centres, cities)}
      />
    </>
  );
}
