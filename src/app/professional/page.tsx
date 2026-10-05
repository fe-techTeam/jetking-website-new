import { content } from '@/lib/content';
import { fill } from '@/lib/content/copy/define';
import { loadCopy } from '@/lib/content/copy/load';
import { professionalCopy } from '@/lib/content/copy/pages/professional';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { ProfessionalLanding } from '@/components/professional/ProfessionalLanding';

export async function generateMetadata() {
  const copy = await loadCopy(professionalCopy);
  return buildMetadata(
    {
      title: fill(copy['seo.title'], { siteName: siteConfig.name }),
      description: fill(copy['seo.description'], { siteName: siteConfig.name }),
      // Audience pages are not listed or indexed; the main pages carry their content.
      noindex: true,
    },
    '/professional',
  );
}

export default async function ProfessionalPage() {
  const [copy, courses, home] = await Promise.all([
    loadCopy(professionalCopy),
    content.listCourses(),
    loadHomeData(),
  ]);

  const preferred = [
    'cloud-computing-engineer-ai',
    'ethical-hacking-specialist',
    'cloud-computing-professional-ai',
    'routing-switching-administrator',
    'bca-cloud-cyber-security',
  ];

  const professionalCourses = [...courses]
    .filter((c) => (c.personaRelevance.professional ?? 0) >= 0.5)
    .sort((a, b) => {
      const ia = preferred.indexOf(a.slug);
      const ib = preferred.indexOf(b.slug);
      const ra = ia === -1 ? 99 : ia;
      const rb = ib === -1 ? 99 : ib;
      if (ra !== rb) return ra - rb;
      return (b.personaRelevance.professional ?? 0) - (a.personaRelevance.professional ?? 0);
    })
    .slice(0, 6);

  const professionalVariant =
    home.variants.find((v) => v.id === 'professional') ??
    home.variants.find((v) => v.id === 'default') ??
    home.variants[0];
  const testimonials = professionalVariant?.testimonials ?? [];

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.name'], path: '/professional' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <ProfessionalLanding
        copy={copy}
        courses={professionalCourses}
        testimonials={testimonials}
      />
    </>
  );
}
