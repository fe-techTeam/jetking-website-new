import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CircleCheck, GraduationCap, MapPin, Waypoints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { content } from '@/lib/content';
import { brandMark } from '@/lib/course-logos';
import { breadcrumbSchema, buildMetadata, courseSchema, faqSchema } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { AdaptiveNudge } from '@/persona/AdaptiveSlot';
import { Disclosure } from '@/components/Disclosure';
import { CourseViewTracker } from './CourseViewTracker';
import { FeeDepthTracker } from './FeeDepthTracker';
import { StickyCourseCta } from './StickyCourseCta';

/*
 * Shared trust content — the same on every Jetking course page (mirrors the
 * "Why Choose Jetking" cards and headline stats that run across the live site),
 * so it lives here as static content rather than per-course data.
 */
const JETKING_STATS = [
  { value: 'Degree', label: 'From a top university' },
  { value: 'Learn', label: 'In-demand skills & tech tools' },
  { value: 'Get Placed', label: 'With placement assistance from hiring partners' },
];

const WHY_JETKING: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'Top Indian & global faculty',
    body: 'Learn from industry practitioners and expert mentors, not just textbooks.',
    icon: GraduationCap,
  },
  {
    title: 'Career services built in',
    body: 'Resume building, mock interviews and interview preparation throughout the course.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Learn your way',
    body: 'Offline or hybrid delivery, structured to fit how and where you study.',
    icon: Waypoints,
  },
  {
    title: 'Placement support',
    body: 'A recruiter network with 360° placement support to launch your career.',
    icon: BadgeCheck,
  },
];

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
  return buildMetadata(course.seo, `/courses/${course.slug}`);
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await content.getCourse(slug);
  if (!course) notFound();

  const [allCourses, centres, siteFaqs] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
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
  const offeringCityCount = new Set(offeringCentres.map((c) => c.citySlug)).size;
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

      {/*
        Future-Ready dark skin, matching the /courses index. `.dark-canvas`
        supplies the canvas and `--dc-*` accent tokens, both already wired to the
        site's global light/dark toggle. `.surface-inverse` is NOT used here — it
        forces the semantic `--color-*` tokens permanently dark regardless of the
        toggle, which broke theme switching on this page (and on /about-us and
        /courses, fixed alongside this). `.dc-flow` keeps the sticky sidebar
        working; the glow moves onto a self-clipping `.dc-orbs` child.
      */}
      <div className="dark-canvas no-orbs dc-flow pt-6 pb-16 sm:pt-8 lg:pb-20">
        <span className="dc-orbs" aria-hidden="true" />

        <div className="shell">
          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <Breadcrumbs trail={trail} />

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--dc-accent-soft)] uppercase">
                  {course.level}
                </span>
                <span className="inline-flex rounded-full border border-[var(--dc-hairline)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-secondary)] uppercase">
                  {course.duration}
                </span>
                {offeringCentres.length ? (
                  <a
                    href="#course-centres"
                    className="tap inline-flex items-center gap-1 rounded-full border border-[var(--dc-hairline)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-secondary)] uppercase transition-colors hover:border-[var(--dc-accent-soft)] hover:text-[var(--dc-ink)]"
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                    {offeringCentres.length} {offeringCentres.length === 1 ? 'centre' : 'centres'}
                  </a>
                ) : null}
              </div>

              {/*
                The morph target. The explorer names the card heading with the same
                `course-<slug>`, so navigating animates that heading into this one.
              */}
              <h1
                className="mt-5 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-[var(--dc-ink)] sm:text-4xl lg:text-5xl"
                style={{ viewTransitionName: `course-${course.slug}` }}
              >
                {course.title}
              </h1>
              <p className="lede mt-6 max-w-[60ch] text-[var(--dc-ink-secondary)] max-sm:line-clamp-3">
                {course.summary}
              </p>

              {course.outcomes.length ? (
                <ul className="mt-5 grid max-w-[60ch] gap-2.5" aria-label="What you get">
                  {course.outcomes.slice(0, 3).map((outcome) => (
                    <li
                      key={outcome}
                      className="flex gap-2.5 text-[14.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[15px]"
                    >
                      <CircleCheck
                        className="mt-px h-[18px] w-[18px] shrink-0 text-[var(--dc-accent-soft)]"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      {outcome}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div id="course-hero-cta" className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/enquiry"
                  className="dc-cta inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
                >
                  Talk to a counsellor
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                </Link>
                <Link
                  href="/enquiry"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--dc-hairline)] px-6 text-sm font-semibold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-soft)]/8"
                >
                  Download brochure
                </Link>
              </div>

              {course.certifications.length ? (
                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
                    Prepares you for
                  </p>
                  <ul className="flex flex-wrap items-center gap-2">
                    {course.certifications.slice(0, 6).map((cert) => (
                      <li key={cert} title={cert}>
                        <BrandMark name={cert} small />
                        <span className="sr-only">{cert}</span>
                      </li>
                    ))}
                    {course.certifications.length > 6 ? (
                      <li className="text-[12.5px] font-bold text-[var(--dc-ink-muted)]">
                        +{course.certifications.length - 6} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </div>

            {course.heroImage ? (
              <div className="dc-banner relative aspect-[4/3] overflow-hidden rounded-[20px] lg:aspect-[5/6]">
                <Image
                  src={course.heroImage.url}
                  alt={course.heroImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 22rem, 100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/50 via-transparent to-transparent"
                />
              </div>
            ) : null}
          </div>

          {/* ── Trust stats band (shared) ──────────────────────────────────── */}
          <ul className="mt-10 grid gap-2.5 sm:mt-12 sm:grid-cols-3 sm:gap-4">
            {JETKING_STATS.map((stat) => (
              <li
                key={stat.label}
                className="dc-panel flex items-center gap-4 rounded-[16px] px-4 py-3.5 sm:block sm:px-6 sm:py-5 sm:text-center"
              >
                <p className="dc-accent-glow w-[6.5rem] shrink-0 font-display text-lg font-extrabold sm:w-auto sm:text-xl">
                  {stat.value}
                </p>
                <p className="text-[13px] leading-snug font-semibold text-[var(--dc-ink-muted)] sm:mt-1 sm:text-[12.5px]">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>

          {/* ── Body ─────────────────────────────────────────────────────────
              Full width — the sidebar CTAs moved up into the masthead, next to
              the description, so there is no reserved side column left here. */}
          <div className="mt-14">
            <div className="min-w-0">
              {/* "Suggested for you" nudge hidden site-wide per request. */}
              <div className="space-y-14">
                {/* Highlights — shown only when the live page lists key features */}
                {course.highlights?.length ? (
                  <section>
                    <SectionHeading>Course highlights</SectionHeading>
                    <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {course.highlights.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-[15px] text-[var(--dc-ink-secondary)]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dc-accent)]"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {/* Outcomes */}
                <section>
                  <SectionHeading>What you will be able to do</SectionHeading>
                  <ul className="mt-6 border-t border-[var(--dc-hairline)]">
                    {course.outcomes.map((outcome) => (
                      <li
                        key={outcome}
                        className="flex gap-4 border-b border-[var(--dc-hairline)] py-4 text-[15px] text-[var(--dc-ink-secondary)]"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-px w-4 shrink-0 bg-[var(--dc-accent)]"
                        />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Learning journey — shown only when the programme has phases */}
                {course.phases?.length ? (
                  <section>
                    <SectionHeading>Your learning journey</SectionHeading>
                    <ol className="mt-6 space-y-3">
                      {course.phases.map((phase, index) => (
                        <li
                          key={phase.title}
                          className="dc-panel flex gap-4 rounded-[16px] p-5"
                        >
                          <span
                            aria-hidden="true"
                            className="numeral text-[13px] font-bold text-[var(--dc-accent-soft)]"
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--dc-ink)]">
                              {phase.title}
                            </h3>
                            <p className="mt-1 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                              {phase.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}

                {/*
                  Curriculum as progressive disclosure. Every topic is in the
                  server-rendered HTML — Disclosure hides with height, never with
                  conditional rendering — so this reads as a full syllabus to a
                  crawler and as an explorable structure to a visitor. When the
                  full grouped curriculum exists it is shown; otherwise the
                  condensed module list is the fallback.
                */}
                <section>
                  <div className="flex items-baseline justify-between gap-4">
                    <SectionHeading>What you will study</SectionHeading>
                    <span className="label-mono numeral shrink-0">
                      {course.curriculum?.length
                        ? `${course.curriculum.reduce((n, t) => n + t.items.length, 0)} topics`
                        : `${course.modules.length} modules`}
                    </span>
                  </div>
                  <div className="mt-6 border-t border-[var(--dc-hairline)]">
                    {course.curriculum?.length
                      ? course.curriculum.map((term, index) => (
                          <Disclosure
                            key={term.title}
                            tone="flush"
                            defaultOpen={index === 0}
                            summary={term.title}
                            meta={`${term.items.length} topics`}
                          >
                            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                              {term.items.map((item) => (
                                <li
                                  key={item}
                                  className="flex gap-2.5 text-[14px] text-[var(--dc-ink-secondary)]"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--dc-accent)]"
                                  />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </Disclosure>
                        ))
                      : course.modules.map((module, index) => (
                          <Disclosure
                            key={module}
                            tone="flush"
                            defaultOpen={index === 0}
                            summary={module}
                            meta={`Module ${String(index + 1).padStart(2, '0')}`}
                          >
                            <p className="measure text-[15px]">
                              Taught in person at your centre, with lab work and assessment
                              built into the module rather than deferred to the end of the
                              course.
                            </p>
                          </Disclosure>
                        ))}
                  </div>
                </section>

                {/* Tools & technologies — shown only when listed on the page */}
                {course.tools?.length ? (
                  <section>
                    <SectionHeading>Tools &amp; technologies</SectionHeading>
                    <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-5 lg:grid-cols-6">
                      {course.tools.map((tool) => (
                        <li key={tool}>
                          <BrandTile name={tool} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {course.certifications.length ? (
                  <section>
                    <SectionHeading>Industry certifications</SectionHeading>
                    <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-5 lg:grid-cols-6">
                      {course.certifications.map((cert) => (
                        <li key={cert}>
                          <BrandTile name={cert} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {/* The Power of Three — Certificate | Degree | Offer letter. The
                   certificate card only renders for the courses that already
                   have their own real specimen image; Degree Picture and
                   Sample Offer Letter are generic, illustrative mockups
                   shared across every course, so they always render. Grid
                   columns match the actual card count (2 or 3) rather than a
                   fixed 3-up — a 2-card row in a 3-column grid would leave a
                   visibly empty slot on wide screens. */}
                <section>
                  <SectionHeading>The Power of Three</SectionHeading>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
                    Skills you can practise, a degree you can show, and a career outcome you can
                    point to.
                  </p>
                  {(() => {
                    const cards = [
                      course.certificateImage
                        ? {
                            key: 'certificate',
                            label: 'Jetking Certificate',
                            image: course.certificateImage,
                            caption: 'Specimen shown — issued in your name on successful completion.',
                          }
                        : null,
                      {
                        key: 'degree',
                        label: 'Degree Picture',
                        image: { url: '/courses/sample-degree.svg', alt: 'Sample degree certificate' },
                        caption: 'Illustrative sample — actual degree is issued by our university partner.',
                      },
                      {
                        key: 'offer',
                        label: 'Sample Offer Letter',
                        image: { url: '/courses/sample-offer-letter.svg', alt: 'Sample job offer letter' },
                        caption: 'Illustrative sample — actual offer letters vary by employer.',
                      },
                    ].filter((card): card is NonNullable<typeof card> => card !== null);

                    return (
                      <div
                        className={`mt-6 grid gap-5 sm:grid-cols-2 ${
                          cards.length >= 3 ? 'lg:grid-cols-3' : 'lg:max-w-[47rem]'
                        }`}
                      >
                        {cards.map((card) => (
                          <figure
                            key={card.key}
                            className="dc-panel flex h-full flex-col overflow-hidden rounded-[16px] p-3 sm:p-4"
                          >
                            <div className="flex h-56 items-center justify-center overflow-hidden rounded-[12px] bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element -- local SVG/JPEG specimens; next/image's optimizer rejects SVGs without extra config */}
                              <img
                                src={card.image.url}
                                alt={card.image.alt}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <figcaption className="mt-3 px-1">
                              <p className="text-[15px] font-bold text-[var(--dc-ink)]">{card.label}</p>
                              <p className="mt-1 text-[13px] text-[var(--dc-ink-muted)]">{card.caption}</p>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    );
                  })()}
                </section>

                {/* Career opportunities — shown only when roles are listed */}
                {course.careerRoles?.length ? (
                  <section>
                    <SectionHeading>What career this course can provide</SectionHeading>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {course.careerRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--dc-ink)]"
                        >
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-[var(--dc-accent-soft)]"
                          />
                          {role}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                <AdaptiveNudge
                  id="course-detail-nudge"
                  reserve="standard"
                  tone="dark"
                  variants={{
                    student: {
                      headline: 'Want to know how the placement year works?',
                      ctaLabel: 'See placement support',
                      ctaHref: '/placements',
                    },
                    professional: {
                      headline: 'Need to fit this around a full-time job?',
                      body: 'Ask a counsellor which centres run evening batches.',
                      ctaLabel: 'Ask about batches',
                      ctaHref: '/enquiry',
                    },
                    parent: {
                      headline: 'Want the fee structure and EMI options?',
                      body: 'A counsellor can give you the exact figures for your centre.',
                      ctaLabel: 'Request fee details',
                      ctaHref: '/enquiry',
                    },
                    franchise: {
                      headline: 'Evaluating the course portfolio?',
                      ctaLabel: 'Franchise details',
                      ctaHref: '/franchise',
                    },
                  }}
                />

                {offeringCentres.length ? (
                  <section id="course-centres" className="scroll-mt-24">
                    <SectionHeading>Where you can study this</SectionHeading>
                    <div className="dc-panel mt-6 flex flex-col gap-5 rounded-[16px] p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--dc-ink)]">
                          Available at{' '}
                          <span className="numeral text-[var(--dc-accent-soft)]">
                            {offeringCentres.length}
                          </span>{' '}
                          {offeringCentres.length === 1 ? 'centre' : 'centres'}
                        </p>
                        <p className="mt-1 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                          Across {offeringCityCount}{' '}
                          {offeringCityCount === 1 ? 'city' : 'cities'} — pick a location that
                          works for you.
                        </p>
                      </div>
                      <Link
                        href="/centres"
                        className="dc-cta inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
                      >
                        Browse centres
                        <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                      </Link>
                    </div>
                  </section>
                ) : null}

                {/* FAQs — the course's own Q&A plus the site-wide fees and placement answers */}
                {ownFaqs.length + feeFaqs.length ? (
                  <section>
                    <SectionHeading>Frequently asked questions</SectionHeading>
                    <div className="mt-6 border-t border-[var(--dc-hairline)]">
                      {ownFaqs.map((faq) => (
                        <Disclosure key={faq.question} tone="flush" summary={faq.question}>
                          <p className="measure text-[15px]">{faq.answer}</p>
                        </Disclosure>
                      ))}
                      {/* The fees / placement answers: reading this block is the `fee-depth` signal. */}
                      <div id="course-fee-faqs">
                        {feeFaqs.map((faq) => (
                          <Disclosure key={faq.question} tone="flush" summary={faq.question}>
                            <p className="measure text-[15px]">{faq.answer}</p>
                          </Disclosure>
                        ))}
                      </div>
                    </div>
                    {feeFaqs.length ? <FeeDepthTracker targetId="course-fee-faqs" courseSlug={course.slug} /> : null}
                  </section>
                ) : null}
              </div>
            </div>
          </div>

          {/* Where our alumni work — shown only when the page names companies */}
          {course.hiringPartners?.length ? (
            <section className="mt-16 border-t border-[var(--dc-hairline)] pt-12">
              <SectionHeading>Where our alumni work</SectionHeading>
              <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-5 lg:grid-cols-6">
                {course.hiringPartners.map((company) => (
                  <li key={company}>
                    <BrandTile name={company} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── Why choose Jetking (shared) ────────────────────────────────── */}
          <section className="mt-16 border-t border-[var(--dc-hairline)] pt-12">
            <SectionHeading>Why choose Jetking</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_JETKING.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="dc-panel rounded-[16px] p-6">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.85} />
                    </span>
                    <h3 className="mt-4 font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--dc-ink)]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                      {card.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {related.length ? (
            <section className="mt-20 border-t border-[var(--dc-hairline)] pt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <SectionHeading>Similar courses</SectionHeading>
                <Link
                  href="/courses"
                  className="tap inline-flex min-h-6 items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:text-[var(--dc-ink)]"
                >
                  Full catalogue
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.slug} className="relative h-full">
                    <Link
                      href={`/courses/${item.slug}`}
                      className="dc-card-shell dc-card-interactive group/card block h-full"
                    >
                      <div className="dc-card flex h-full overflow-hidden sm:flex-col">
                        <div className="dc-card-media relative min-h-[104px] w-[104px] shrink-0 overflow-hidden min-[400px]:w-[120px] sm:aspect-[16/10] sm:min-h-0 sm:w-auto">
                          {item.heroImage ? (
                            <Image
                              src={item.heroImage.url}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 42vw, 120px"
                              className="object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/card:scale-[1.04]"
                            />
                          ) : null}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/65 via-transparent to-transparent"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
                              {item.level}
                            </span>
                            <span className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]">
                              {item.duration}
                            </span>
                          </div>

                          <h3 className="mt-2 font-display text-[15.5px] leading-snug font-extrabold tracking-[-0.02em] text-balance text-[var(--dc-ink)] transition-colors group-hover/card:text-[var(--dc-accent-soft)] sm:mt-3.5 sm:text-[18px]">
                            {item.shortTitle}
                          </h3>

                          <p className="mt-2 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-[var(--dc-ink-muted)] max-sm:hidden">
                            {item.eligibility}
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 sm:pt-5">
                            <span className="text-[13.5px] font-bold text-[var(--dc-accent-soft)]">
                              View course
                            </span>
                            <span
                              aria-hidden="true"
                              className="dc-cta hidden h-10 w-10 shrink-0 place-items-center rounded-full sm:grid"
                            >
                              <ArrowRight
                                className="h-[18px] w-[18px] transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/card:translate-x-0.5"
                                strokeWidth={2.25}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
      <StickyCourseCta anchorId="course-hero-cta" title={course.shortTitle || course.title} duration={course.duration} />
    </>
  );
}

/** Logo above label — used for the tools / certifications grids. */
function BrandTile({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <BrandMark name={name} />
      <span className="max-w-[8.5rem] text-[13px] leading-snug font-semibold text-[var(--dc-ink-secondary)]">
        {name}
      </span>
    </div>
  );
}

/** The logo square alone; `small` is the masthead's certification strip. */
function BrandMark({ name, small = false }: { name: string; small?: boolean }) {
  const mark = brandMark(name);
  const lightMark = mark ? isLightBrandColor(mark.color) : false;
  const initials = name
    .replace(/[^A-Za-z0-9+/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, part.length <= 4 ? part.length : 1).toUpperCase())
    .join('')
    .slice(0, 4);

  return (
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center overflow-hidden border border-[var(--dc-hairline)] ${
          small ? 'h-10 w-10 rounded-xl' : 'h-16 w-16 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]'
        } ${
          mark?.painted
            ? 'bg-transparent p-0'
            : lightMark
              ? 'bg-tile-dark'
              : 'bg-white'
        }`}
      >
        {mark?.painted ? (
          // eslint-disable-next-line @next/next/no-img-element -- local painted SVG badge
          <img src={mark.src} alt="" className="h-full w-full object-cover" />
        ) : mark ? (
          <span
            className={`dc-logo ${small ? '!h-6 !w-6' : '!h-9 !w-9 sm:!h-10 sm:!w-10'}`}
            style={
              {
                '--logo': `url(${mark.src})`,
                color: mark.color,
              } as React.CSSProperties
            }
          />
        ) : (
          <span className={`font-display font-extrabold tracking-tight text-ink-500 ${small ? 'text-[11px]' : 'text-[15px]'}`}>
            {initials || '·'}
          </span>
        )}
      </span>
  );
}

/** True when a brand hex would vanish on a white tile. */
function isLightBrandColor(hex: string): boolean {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return false;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  // Relative luminance — treat near-white / neon yellows as needing a dark pad.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.82;
}

/** Section heading with the signature red keyline. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span aria-hidden="true" className="block h-0.5 w-10 rounded-full bg-[var(--dc-accent)]" />
      <h2 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

