import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { coursesCopy } from '@/lib/content/copy/pages/courses';
import { loadCopy } from '@/lib/content/copy/load';
import { courseHasDetailPage } from '@/lib/course-href';
import { breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { CoursePageTemplateB } from '../CoursePageTemplateB';
import { StickyCourseCta } from '../StickyCourseCta';

/*
 * Design preview for the client: the same course content in template B ("studio").
 * Lives at /courses/<slug>/design-2, kept out of search (noindex, canonical = the live page).
 */

export async function generateStaticParams() {
  const courses = await content.listCourses();
  return courses.filter(courseHasDetailPage).map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course || !courseHasDetailPage(course)) return {};
  return {
    title: { absolute: `${course.title} — design 2 preview` },
    robots: { index: false, follow: false },
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CourseDesignTwoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course || !courseHasDetailPage(course)) notFound();

  const copy = await loadCopy(coursesCopy);
  const [allCourses, centres, cities, siteFaqs, placements] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
    content.listFaqs(),
    content.getPlacementsPage(),
  ]);

  const ownFaqs = course.faqs ?? [];
  const ownQuestions = new Set(ownFaqs.map((f) => f.question.trim().toLowerCase()));
  const feeFaqs = siteFaqs
    .filter((f) => (f.topic === 'fees' || f.topic === 'placement') && !ownQuestions.has(f.question.trim().toLowerCase()))
    .map((f) => ({ question: f.question, answer: f.answer }));

  const offeringCentres = centres.filter((c) => c.coursesOffered.includes(course.slug));
  const others = allCourses.filter((c) => c.slug !== course.slug);
  const related = [...others.filter((c) => c.level === course.level), ...others.filter((c) => c.level !== course.level)].slice(0, 4);

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.courses'], path: '/courses' },
    { name: course.shortTitle, path: `/courses/${course.slug}` },
  ];

  return (
    <>
      <JsonLd data={[breadcrumbSchema(trail)]} />
      <CoursePageTemplateB
        course={course}
        trail={trail}
        centres={centres}
        cities={cities}
        offeringCentres={offeringCentres}
        related={related}
        ownFaqs={ownFaqs}
        feeFaqs={feeFaqs}
        placements={placements}
        copy={copy}
      />
      <StickyCourseCta anchorId="course-hero-cta" copy={copy} />
    </>
  );
}
