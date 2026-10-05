import { EnquiryLink } from '@/components/EnquirySheet';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { content } from '@/lib/content';
import { coursesCopy } from '@/lib/content/copy/pages/courses';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { fill } from '@/lib/content/copy/define';
import { breadcrumbSchema } from '@/lib/seo';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { AdaptiveNudge } from '@/persona/AdaptiveSlot';
import { HeroEnquiryCard } from '@/components/HeroEnquiryCard';
import { AskAiLink } from '@/components/AskAiLink';
import { Section } from '@/components/kit';
import { CourseExplorer } from './CourseExplorer';

export async function generateMetadata() {
  return pageMetadata(coursesCopy, '/courses');
}

export default async function CoursesPage() {
  const copy = await loadCopy(coursesCopy);
  const [courses, centres, cities] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
  ]);
  const levelCount = new Set(courses.map((c) => c.level)).size;
  const domains = [
    copy['hero.domains.0'],
    copy['hero.domains.1'],
    copy['hero.domains.2'],
    copy['hero.domains.3'],
    copy['hero.domains.4'],
    copy['hero.domains.5'],
  ];

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.courses'], path: '/courses' },
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
      <div className="dark-canvas no-orbs dc-flow pt-6 sm:pt-8">
        <span className="dc-orbs" aria-hidden="true" />

        <div className="shell pb-14 sm:pb-16">
          <Breadcrumbs trail={trail} />

          {/* ── Cinematic banner (blog / centres hero language) ───────────── */}
          <section className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[min(74vw,400px)] overflow-hidden rounded-[24px] xs:min-h-[380px] xs:rounded-[28px] sm:min-h-[420px] sm:rounded-[28px] lg:min-h-[480px]">
              <Image
                src={copy['hero.image']}
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_22%]"
              />
              <div
                aria-hidden="true"
                className="dc-banner-wash pointer-events-none absolute inset-0"
              />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                <div className="flex flex-1 flex-col justify-center px-6 py-10 xs:px-8 xs:py-12 sm:px-10 sm:py-14 lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
                  <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>

                  <h1 className="page-title-hero mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
                    {copy['hero.title']}
                    <span className="dc-accent-glow mt-1 block sm:mt-1.5">{copy['hero.titleAccent']}</span>
                  </h1>

                  {/* Slide 1 order: the domains first, then the programme line. Plain text for search crawlers. */}
                  <ul aria-label={copy['hero.domainsLabel']} className="mt-4 flex max-w-[60ch] flex-wrap gap-2 sm:mt-5">
                    {domains.map((domain) => (
                      <li
                        key={domain}
                        className="rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-3 py-1 text-[14px] font-bold text-[var(--dc-ink)]"
                      >
                        {domain}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 max-w-[60ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:text-[16px]">
                    {copy['hero.sub']}
                  </p>

                  <p className="mt-6 numeral text-[13.5px] font-bold tracking-[0.12em] text-[var(--dc-ink-muted)] uppercase sm:mt-7">
                    {fill(copy['hero.stats'], { courses: courses.length, levels: levelCount })}
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
            <CourseExplorer courses={courses} copy={copy} />
          </div>

          {/* Persona-adaptive next step, after the list rather than before it, so the programmes come first. */}
          <div className="mt-10 max-w-2xl">
            <AdaptiveNudge
              id="courses-guidance-nudge"
              reserve="standard"
              tone="dark"
              variants={{
                student: {
                  headline: copy['guidance.student.headline'],
                  body: copy['guidance.student.body'],
                  ctaLabel: copy['guidance.student.ctaLabel'],
                  ctaHref: copy['guidance.student.ctaHref'],
                },
                professional: {
                  headline: copy['guidance.professional.headline'],
                  body: copy['guidance.professional.body'],
                  ctaLabel: copy['guidance.professional.ctaLabel'],
                  ctaAction: 'guide',
                },
                parent: {
                  headline: copy['guidance.parent.headline'],
                  body: copy['guidance.parent.body'],
                  ctaLabel: copy['guidance.parent.ctaLabel'],
                  ctaHref: copy['guidance.parent.ctaHref'],
                },
                franchise: {
                  headline: copy['guidance.franchise.headline'],
                  body: copy['guidance.franchise.body'],
                  ctaLabel: copy['guidance.franchise.ctaLabel'],
                  ctaHref: copy['guidance.franchise.ctaHref'],
                },
              }}
            />
          </div>
        </div>

        {/* ── Closing CTA: the page's one consolidated enquiry prompt ───── */}
        <Section tone="wash" labelledBy="courses-cta">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <p className="k-eyebrow">{copy['cta.eyebrow']}</p>
              <h2 id="courses-cta" className="section-title mt-2.5 font-display text-[var(--k-ink)]">
                {copy['cta.title']}
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
                {copy['cta.body']}
              </p>
            </div>
            <EnquiryLink
              source="courses-index"
              className="dc-cta inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]"
            >
              {copy['cta.button']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </EnquiryLink>
          </div>
        </Section>
      </div>
    </>
  );
}
