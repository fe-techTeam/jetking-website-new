import { content } from '@/lib/content';
import { loadCopy } from '@/lib/content/copy/load';
import { fill } from '@/lib/content/copy/define';
import { studentCopy } from '@/lib/content/copy/pages/student';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { JsonLd, type Crumb } from '@/components/ui';
import { ScrollDepthTracker } from '@/components/ScrollDepthTracker';
import { loadHomeData } from '@/components/home/data';
import { StudentLanding } from '@/components/student/StudentLanding';

export async function generateMetadata() {
  const copy = await loadCopy(studentCopy);
  return buildMetadata(
    {
      title: fill(copy['seo.title'], { siteName: siteConfig.name }),
      description: copy['seo.description'],
    },
    '/student',
  );
}

export default async function StudentPage() {
  const [courses, home, copy] = await Promise.all([content.listCourses(), loadHomeData(), loadCopy(studentCopy)]);

  const preferred = [
    'ethical-hacking-specialist',
    'cloud-computing-engineer-ai',
    'routing-switching-administrator',
    'cloud-computing-professional-ai',
    'bca-cloud-cyber-security',
    'pc-hardware-support',
  ];
  const studentCourses = [...courses].sort((a, b) => {
    const ia = preferred.indexOf(a.slug);
    const ib = preferred.indexOf(b.slug);
    const ra = ia === -1 ? 99 : ia;
    const rb = ib === -1 ? 99 : ib;
    if (ra !== rb) return ra - rb;
    return (b.personaRelevance.student ?? 0) - (a.personaRelevance.student ?? 0);
  });

  const studentVariant =
    home.variants.find((v) => v.id === 'student') ??
    home.variants.find((v) => v.id === 'default') ??
    home.variants[0];
  const testimonials = studentVariant?.testimonials ?? [];

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.current'], path: '/student' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <ScrollDepthTracker />
      <StudentLanding
        courses={studentCourses}
        counts={home.counts}
        trust={home.trust}
        heroImage={home.heroImage}
        testimonials={testimonials}
        copy={copy}
      />
    </>
  );
}
