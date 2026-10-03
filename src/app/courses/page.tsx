import type { Metadata } from 'next';
import { EnquiryLink } from '@/components/EnquirySheet';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { AdaptiveNudge } from '@/persona/AdaptiveSlot';
import { HeroEnquiryCard } from '@/components/HeroEnquiryCard';
import { AskAiLink } from '@/components/AskAiLink';
import { CourseExplorer } from './CourseExplorer';

const COURSE_DOMAINS = [
  'Cloud Computing',
  'Cyber Security',
  'AI Engineering',
  'DevOps',
  'Gaming & Metaverse',
  'Networking',
] as const;

export const metadata: Metadata = buildMetadata(
  {
    title: 'IT Courses — Cloud, Cyber Security, AI, DevOps, Gaming & Networking | Jetking',
    description:
      'Jetking courses in cloud computing, cyber security, AI engineering, DevOps, gaming & metaverse and networking — short-term courses to UG and PG degree programs for 10+2 students, graduates and young professionals.',
  },
  '/courses',
);

export default async function CoursesPage() {
  const [courses, centres, cities] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
  ]);
  const levelCount = new Set(courses.map((c) => c.level)).size;

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      {/*
        The Future-Ready dark skin. `.dark-canvas` supplies the canvas and the
        `--dc-*` accent tokens, both already wired to the site's global light/dark
        toggle. `.surface-inverse` is NOT used here — it forces the semantic
        `--color-*` tokens permanently dark regardless of the toggle, which broke
        theme switching on this page (and on /about-us and /courses/[slug], fixed
        alongside this). `.dc-flow` drops the theme's `overflow: hidden` clip so
        the explorer's sticky filter sidebar can pin, and the orbs move onto a
        self-clipping `.dc-orbs` child.
      */}
      <div className="dark-canvas no-orbs dc-flow pt-6 pb-16 sm:pt-8 lg:pb-20">
        <span className="dc-orbs" aria-hidden="true" />

        <div className="shell">
          <Breadcrumbs trail={trail} />

          {/* ── Cinematic banner (blog / centres hero language) ───────────── */}
          <section className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[min(74vw,400px)] overflow-hidden rounded-[24px] xs:min-h-[380px] xs:rounded-[28px] sm:min-h-[420px] sm:rounded-[28px] lg:min-h-[480px]">
              <Image
                src="/home/journey-student-v2.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_22%]"
              />
              <div
                aria-hidden="true"
                className="dc-banner-wash pointer-events-none absolute inset-0"
              />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                <div className="flex flex-1 flex-col justify-center px-6 py-10 xs:px-8 xs:py-12 sm:px-10 sm:py-14 lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
                  <p className="dc-eyebrow label-mono text-[14px]">Courses</p>

                  <h1 className="page-title-hero mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
                    The Most In-Demand
                    <span className="dc-accent-glow mt-1 block sm:mt-1.5">Job-Ready Courses.</span>
                  </h1>

                  {/* Slide 1 order: the domains first, then the programme line. Plain text for search crawlers. */}
                  <ul aria-label="Domains we offer courses in" className="mt-4 flex max-w-[60ch] flex-wrap gap-2 sm:mt-5">
                    {COURSE_DOMAINS.map((domain) => (
                      <li
                        key={domain}
                        className="rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-3 py-1 text-[13px] font-bold text-[var(--dc-ink)]"
                      >
                        {domain}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 max-w-[60ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:text-[16px]">
                    Short term to UG &amp; PG Degree Programs for 10+2 Students, Graduates &amp; Young
                    Professionals
                  </p>

                  <p className="mt-6 numeral text-[13.5px] font-bold tracking-[0.12em] text-[var(--dc-ink-muted)] uppercase sm:mt-7">
                    {courses.length} courses
                    {' · '}
                    {levelCount} levels
                  </p>

                  <AskAiLink className="mt-3 text-[var(--dc-accent-soft)]" />
                </div>

                <HeroEnquiryCard
                  centres={toEnquiryCentres(centres, cities)}
                  source="courses-hero-form"
                  tone="dc"
                  titleId="courses-hero-form-title"
                />
              </div>
            </div>
          </section>

          {/*
            The explorer is a client component, so Next server-renders it: every
            course card and link is in the initial HTML. Its filter sidebar only
            toggles visibility — nothing is hidden from crawlers, and every course
            page stays linked. See the contract at the top of CourseExplorer.tsx.
          */}
          <div className="mt-10 lg:mt-12">
            <CourseExplorer courses={courses} />
          </div>

          {/* Persona-adaptive next step, after the list rather than before it, so the programmes come first. */}
          <div className="mt-10 max-w-2xl">
            <AdaptiveNudge
              id="courses-guidance-nudge"
              reserve="standard"
              tone="dark"
              variants={{
                student: {
                  headline: 'Comparing the cloud and cyber tracks?',
                  body: 'They look similar and suit different people. This explains the difference.',
                  ctaLabel: 'Read the comparison',
                  ctaHref: '/blog/cyber-security-vs-cloud-computing',
                },
                professional: {
                  headline: 'Changing careers rather than starting one?',
                  body: 'What transfers from your current role, and what does not.',
                  ctaLabel: 'Chat with Jetking',
                  ctaAction: 'guide',
                },
                parent: {
                  headline: 'Evaluating on your child’s behalf?',
                  body: 'Seven questions worth asking any training institute — including us.',
                  ctaLabel: 'See the checklist',
                  ctaHref: '/blog/what-parents-should-ask-it-institute',
                },
                franchise: {
                  headline: 'Here about the franchise opportunity?',
                  body: 'The franchise section covers the operating model.',
                  ctaLabel: 'Go to franchise',
                  ctaHref: '/franchise',
                },
              }}
            />
          </div>

          {/* ── Closing CTA — the page's one consolidated enquiry prompt ───── */}
          <section
            className="mt-16 border-t border-[var(--dc-hairline)] pt-12 sm:mt-20 sm:pt-14"
            aria-labelledby="courses-cta"
          >
            <div className="dc-panel flex flex-col items-start gap-6 rounded-[24px] p-7 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-9">
              <div className="max-w-lg">
                <p className="dc-eyebrow label-mono">Still deciding</p>
                <h2
                  id="courses-cta"
                  className="section-title mt-3 font-display text-[var(--dc-ink)]"
                >
                  Not sure which course fits?
                </h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)]">
                  Talk to a counsellor about your goals, eligibility and the right track — no
                  commitment needed.
                </p>
              </div>
              <EnquiryLink
                source="courses-index"
                className="dc-cta inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-7 text-sm font-bold sm:h-14 sm:px-8 sm:text-base"
              >
                Talk to a counsellor
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </EnquiryLink>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
