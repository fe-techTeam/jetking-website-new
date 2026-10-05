import { content } from '@/lib/content';
import { loadCopy } from '@/lib/content/copy/load';
import { fill } from '@/lib/content/copy/define';
import { parentCopy } from '@/lib/content/copy/pages/parent';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { ParentLanding } from '@/components/parent/ParentLanding';

export async function generateMetadata() {
  const copy = await loadCopy(parentCopy);
  return buildMetadata(
    {
      title: fill(copy['seo.title'], { siteName: siteConfig.name }),
      description: copy['seo.description'],
      // Audience pages are not listed or indexed; the main pages carry their content.
      noindex: true,
    },
    '/parent',
  );
}

export default async function ParentPage() {
  const [courses, home, copy] = await Promise.all([content.listCourses(), loadHomeData(), loadCopy(parentCopy)]);

  const preferred = [
    'bca-cloud-cyber-security',
    'ethical-hacking-specialist',
    'cloud-computing-engineer-ai',
    'routing-switching-administrator',
    'cloud-computing-professional-ai',
    'pc-hardware-support',
  ];

  const parentCourses = [...courses]
    .sort((a, b) => {
      const ia = preferred.indexOf(a.slug);
      const ib = preferred.indexOf(b.slug);
      const ra = ia === -1 ? 99 : ia;
      const rb = ib === -1 ? 99 : ib;
      if (ra !== rb) return ra - rb;
      return (b.personaRelevance.parent ?? 0) - (a.personaRelevance.parent ?? 0);
    })
    .slice(0, 4);

  const parentVariant =
    home.variants.find((v) => v.id === 'parent') ??
    home.variants.find((v) => v.id === 'default') ??
    home.variants[0];
  const testimonials = parentVariant?.testimonials ?? [];

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.current'], path: '/parent' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <ParentLanding
        courses={parentCourses}
        counts={home.counts}
        testimonials={testimonials}
        copy={copy}
      />
    </>
  );
}
