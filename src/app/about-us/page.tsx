import type { Metadata } from 'next';
import { AboutLanding } from '@/components/about/AboutLanding';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { content } from '@/lib/content';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import { siteConfig } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const centres = await content.listCentres();
  return buildMetadata(
    {
      title: `About ${siteConfig.name} — Training IT Talent ${SINCE_FOUNDED}`,
      description: `Jetking is India's foremost computer networking and IT training institute — training IT talent ${SINCE_FOUNDED.toLowerCase()}, with ${centres.length} centres and placement support for students across India.`,
    },
    '/about-us',
  );
}

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about-us' },
];

export default async function AboutPage() {
  const [courses, centres, cities] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
  ]);
  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <AboutLanding counts={{ courses: courses.length, centres: centres.length, cities: cities.length }} />
    </>
  );
}
