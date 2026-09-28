import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { ProfessionalLanding } from '@/components/professional/ProfessionalLanding';

export const metadata: Metadata = buildMetadata(
  {
    title: `Working Professional Path — Upskill & Advance | ${siteConfig.name}`,
    description:
      'Upgrade your career with Jetking upskilling courses — cloud, cyber security, DevOps and AI tracks with flexible batches, certifications and career support for working professionals.',
  },
  '/professional',
);

export default async function ProfessionalPage() {
  const [courses, home] = await Promise.all([content.listCourses(), loadHomeData()]);

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
    { name: 'Working Professional', path: '/professional' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <ProfessionalLanding
        courses={professionalCourses}
        testimonials={testimonials}
      />
    </>
  );
}
