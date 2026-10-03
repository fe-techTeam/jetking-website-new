import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
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

  const [allCourses, centres, cities, siteFaqs] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
    content.listFaqs(),
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
  const related = allCourses
    .filter((c) => c.slug !== course.slug && c.level === course.level)
    .slice(0, 3);

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
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
      />
      <StickyCourseCta anchorId="course-hero-cta" title={course.shortTitle || course.title} duration={course.duration} />
    </>
  );
}
