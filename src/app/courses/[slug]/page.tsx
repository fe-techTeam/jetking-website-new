import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { coursesCopy } from '@/lib/content/copy/pages/courses';
import { loadCopy } from '@/lib/content/copy/load';
import { breadcrumbSchema, buildMetadata, courseSchema, faqSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { CourseViewTracker } from './CourseViewTracker';
import { CoursePageTemplate } from './CoursePageTemplate';
import { StickyCourseCta } from './StickyCourseCta';

export async function generateStaticParams() {
  const courses = await content.listCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course) return {};
  // A per-course social card (course title, level, duration and photo) instead of the shared site image.
  return buildMetadata({ ...course.seo, ogImage: course.seo.ogImage ?? `/og/course/${course.slug}` }, `/courses/${course.slug}`);
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course) notFound();

  const copy = await loadCopy(coursesCopy);
  const [allCourses, centres, cities, siteFaqs, placements] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
    content.listFaqs(),
    content.getPlacementsPage(),
  ]);

  // The course's own Q&A first, then the site-wide answers about fees and placement support that
  // every prospective student asks (these used to sit on /placements). Skip any question the
  // course already answers itself.
  const ownQuestions = new Set((course.faqs ?? []).map((f) => f.question.trim().toLowerCase()));
  const ownFaqs = course.faqs ?? [];
  const feeFaqs = siteFaqs
    .filter((f) => (f.topic === 'fees' || f.topic === 'placement') && !ownQuestions.has(f.question.trim().toLowerCase()))
    .map((f) => ({ question: f.question, answer: f.answer }));

  const offeringCentres = centres.filter((c) => c.coursesOffered.includes(course.slug));
  // Same level first, then the rest of the catalogue, so the row is full (four across on a laptop).
  const others = allCourses.filter((c) => c.slug !== course.slug);
  const related = [...others.filter((c) => c.level === course.level), ...others.filter((c) => c.level !== course.level)].slice(0, 4);

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.courses'], path: '/courses' },
    { name: course.shortTitle, path: `/courses/${course.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          courseSchema(course),
          breadcrumbSchema(trail),
          ...(ownFaqs.length + feeFaqs.length ? [faqSchema([...ownFaqs, ...feeFaqs])] : []),
        ]}
      />
      {/* Records the behavioural signal. Client component, no effect on the document. */}
      <CourseViewTracker slug={course.slug} level={course.level} title={course.title} />

      <CoursePageTemplate
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
      <StickyCourseCta anchorId="course-hero-cta" title={course.shortTitle || course.title} duration={course.duration} copy={copy} />
    </>
  );
}
