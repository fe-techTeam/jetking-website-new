'use client';

import { EnquiryLink } from '@/components/EnquirySheet';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  IndianRupee,
  Laptop,
  MessageCircle,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Wrench,
} from 'lucide-react';
import type { Course, Testimonial } from '@/lib/content/types';
import { RecommendedCourses } from '@/components/student/RecommendedCourses';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { ParentCopy } from '@/lib/content/copy/pages/parent';
import { FOUNDED_YEAR, SINCE_FOUNDED, type NetworkCounts } from '@/lib/brand-facts';
import { Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import { ParentTestimonialSlider } from './ParentTestimonialSlider';

function heroFeatures(copy: ParentCopy) {
  return [
    { label: copy['features.0.label'], icon: BookOpen },
    { label: copy['features.1.label'], icon: Sparkles },
    { label: copy['features.2.label'], icon: Briefcase },
    { label: copy['features.3.label'], icon: ShieldCheck },
  ] as const;
}

function trustStats(counts: NetworkCounts, copy: ParentCopy) {
  return [
    { icon: Building2, value: `${counts.centres}`, label: copy['trust.0.label'] },
    { icon: Briefcase, value: copy['trust.1.value'], label: copy['trust.1.label'] },
    { icon: GraduationCap, value: copy['trust.2.value'], label: copy['trust.2.label'] },
    { icon: Award, value: SINCE_FOUNDED, label: copy['trust.3.label'] },
  ] as const;
}

function journeySteps(copy: ParentCopy) {
  return [
    { title: copy['journey.0.title'], detail: copy['journey.0.detail'], icon: MessageCircle },
    { title: copy['journey.1.title'], detail: copy['journey.1.detail'], icon: BookOpen },
    { title: copy['journey.2.title'], detail: copy['journey.2.detail'], icon: Wrench },
    { title: copy['journey.3.title'], detail: copy['journey.3.detail'], icon: Briefcase },
    { title: copy['journey.4.title'], detail: copy['journey.4.detail'], icon: Trophy },
  ] as const;
}

function helpLinks(copy: ParentCopy) {
  return [
    { label: copy['help.0.label'], href: '/enquiry', icon: Phone },
    { label: copy['help.1.label'], href: '/enquiry', icon: Download },
    { label: copy['help.2.label'], href: '/enquiry', icon: Building2 },
    { label: copy['help.3.label'], href: '/enquiry', icon: IndianRupee },
  ] as const;
}

function parentLoves(copy: ParentCopy) {
  return [
    { label: copy['loves.0.label'], icon: Shield },
    { label: copy['loves.1.label'], icon: UserCheck },
    { label: copy['loves.2.label'], icon: Laptop },
    { label: copy['loves.3.label'], icon: MessageCircle },
    { label: fill(copy['loves.4.label'], { since: SINCE_FOUNDED }), icon: Award },
  ] as const;
}

export function ParentLanding({
  courses,
  counts,
  testimonials,
  copy,
}: {
  courses: Course[];
  counts: NetworkCounts;
  testimonials?: Testimonial[];
  copy: ParentCopy;
}) {
  const stats = trustStats(counts, copy);
  const storyAvatars = [copy['stories.avatar.0'], copy['stories.avatar.1'], copy['stories.avatar.2']];
  return (
    <div
      className={[
        'student-page relative flex flex-col overflow-hidden',
        /* Bleed the page's own gradient background up behind the sticky,
           transparent header instead of stopping in a hard line at its
           bottom edge — see the matching fix in home/v2/HomeV2.tsx. Offsets
           must match SiteHeader's height breakpoints (72/80/88/96). */
        '-mt-[72px] pt-[72px]',
        'xs:-mt-[80px] xs:pt-[80px]',
        'sm:-mt-[88px] sm:pt-[88px]',
        '2xl:-mt-[96px] 2xl:pt-[96px]',
      ].join(' ')}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-8 pb-10 xs:pt-10 sm:pt-12 sm:pb-12 lg:pt-14 lg:pb-14">

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <div className="lg:col-span-7 xl:col-span-7">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]">
              {copy['hero.eyebrow']}
            </p>

            <h1 className="page-title-hero mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
              {copy['hero.title']}{' '}
              <span className="text-[var(--dc-accent-soft)]">{copy['hero.titleAccent']}</span> {copy['hero.titleEnd']}
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
              {copy['hero.body']}
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
              {heroFeatures(copy).map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col items-start gap-2 sm:items-center sm:text-center"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 place-items-center rounded-full bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.85} />
                  </span>
                  <span className="text-[12px] leading-snug font-semibold text-[var(--dc-ink-secondary)] sm:text-[12.5px]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={copy['hero.cta.href'] as Route}
                className="group/cta inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                {copy['hero.cta.label']}
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <EnquiryLink
                source="parent"
                className="inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-[var(--dc-accent)] px-5 py-3 text-[15px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)]"
              >
                {copy['hero.guidance.label']}
              </EnquiryLink>
            </div>
          </div>

          <div className="relative lg:col-span-5 xl:col-span-5">
            {/* Extra bottom/side room so the trust card can hang off the photo */}
            <div className="relative pb-6 sm:pb-8 lg:pb-10 lg:pr-4 xl:pr-6">
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--dc-hairline-strong)] shadow-[var(--dc-shadow)]">
                <Image
                  src={copy['hero.image']}
                  alt={copy['hero.imageAlt']}
                  width={900}
                  height={720}
                  priority
                  className="aspect-[5/4] w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/55 via-transparent to-transparent"
                />
              </div>

              <div
                className={[
                  'par-trust-card static mt-4 rounded-[20px] p-4',
                  /*
                   * The card's content (heading + 4 stat rows) is taller than
                   * the small bottom margin reserved on the photo wrapper —
                   * absolutely overlaying it on mobile made it overflow
                   * upward past the photo and overlap whatever came before
                   * this block. Flowing normally below the photo avoids that
                   * unconditionally; the "hanging off the photo" overlay look
                   * only turns on from sm: up, where there's enough room.
                   */
                  'sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-2 sm:z-10 sm:mt-0 sm:w-[min(92%,268px)] sm:rounded-[24px] sm:p-5',
                  'lg:right-0 lg:bottom-0 xl:-right-3',
                ].join(' ')}
              >
                <h2 className="font-display text-[15px] font-extrabold text-[var(--dc-ink)] sm:text-[16px]">
                  {fill(copy['trust.title'], { siteName: siteConfig.name })}
                </h2>
                <ul className="mt-3 space-y-2.5 sm:mt-3.5 sm:space-y-3">
                  {stats.map((stat) => (
                    <li key={stat.label} className="flex items-start gap-2.5 sm:gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] sm:h-8 sm:w-8"
                      >
                        <stat.icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-extrabold text-[var(--dc-ink)] sm:text-[13.5px]">
                          {stat.value}
                        </span>
                        <span className="block text-[12px] leading-snug text-[var(--dc-ink-muted)] sm:text-[12px]">
                          {stat.label}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Journey steps ────────────────────────────────────────────────── */}
      <Section tone="plain" deco="grid" labelledBy="par-journey">
        <SectionHeader id="par-journey" title={copy['journey.title']} />
        <Reveal>
          <StepPath
            steps={journeySteps(copy).map((step) => ({
              icon: step.icon,
              title: `${step.title} ${step.detail}`,
              body: null,
            }))}
          />
        </Reveal>
      </Section>

      {/* ── Courses (student RecommendedCourses pattern) ─────────────────── */}
      <RecommendedCourses
        id="courses"
        className="scroll-mt-24"
        tone="tint"
        courses={courses}
        headingId="par-courses"
        title={copy['courses.title']}
        description={copy['courses.description']}
        viewAllLabel={copy['courses.viewAll.label']}
        viewAllHref={copy['courses.viewAll.href']}
        badgeLabel={copy['courses.badge']}
        trackLabel={copy['courses.trackLabel']}
      />

      {/* ── Let us help you ──────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="par-help">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="kit kit-card p-5 sm:p-6 lg:col-span-8">
              <h2
                id="par-help"
                className="font-display text-[18px] font-extrabold text-[var(--dc-ink)] sm:text-[20px]"
              >
                {copy['help.title']}
              </h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {helpLinks(copy).map((item) => (
                  <li key={item.label}>
                    <EnquiryLink
                      source="parent-help"
                      className="par-help-row flex items-center gap-3 rounded-2xl border px-3.5 py-3"
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                      >
                        <item.icon className="h-4 w-4" strokeWidth={1.85} />
                      </span>
                      <span className="min-w-0 flex-1 text-[13.5px] font-bold text-[var(--dc-ink)]">
                        {item.label}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-[var(--dc-ink-muted)]"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    </EnquiryLink>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[14px] text-[var(--dc-ink-muted)]">
                {fill(copy['help.centres'], { centres: counts.centres, cities: counts.cities })}
              </p>
            </div>

            <div className="kit kit-card flex flex-col justify-center bg-[var(--k-red-wash)] p-5 sm:p-6 lg:col-span-4">
              <p className="flex items-start gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                <FileText
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {copy['help.question']}
              </p>
              <Link
                href={copy['help.chat.href'] as Route}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--dc-accent)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                {copy['help.chat.label']}
              </Link>
            </div>
          </div>
        </Section>

      {/* ── Success stories ──────────────────────────────────────────────── */}
      <Section tone="tint" deco="glow" labelledBy="par-stories">
          <div>
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="par-stories"
                  className="section-title font-display text-[var(--dc-ink)]"
                >
                  {copy['stories.title']}{' '}
                  <span className="text-[var(--dc-accent-soft)]">{copy['stories.titleAccent']}</span> {copy['stories.titleEnd']}
                </h2>

                <div className="mt-8 flex flex-wrap items-end gap-8">
                  <div>
                    <p className="font-display text-[48px] leading-none font-extrabold text-[var(--dc-accent-soft)] sm:text-[56px]">
                      {FOUNDED_YEAR}
                    </p>
                    <p className="mt-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                      {copy['stories.foundedLabel']}
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-[32px] leading-none font-extrabold text-[var(--dc-ink)] sm:text-[36px]">
                      {counts.cities}
                    </p>
                    <p className="mt-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">{copy['stories.citiesLabel']}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <span aria-hidden="true" className="flex -space-x-2.5">
                    {storyAvatars.map((src) => (
                      <span
                        key={src}
                        className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--dc-card)]"
                      >
                        <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                    ))}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--dc-ink-secondary)]">
                    {copy['stories.caption']}
                  </span>
                </div>
              </div>

              <ParentTestimonialSlider testimonials={testimonials} copy={copy} />
            </div>
          </div>
        </Section>

      {/* ── Things parents love ──────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="par-loves">
          <h2
            id="par-loves"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {fill(copy['loves.title'], { siteName: siteConfig.name })}
          </h2>

          <ul className="mt-6 flex flex-wrap gap-3 lg:gap-4">
            {parentLoves(copy).map((item) => (
              <li key={item.label} className="@container min-w-0 flex-[1_1_140px]">
                <article className="kit kit-card flex h-full flex-col items-start gap-3 p-4 max-sm:@[260px]:flex-row max-sm:@[260px]:items-center sm:items-center sm:p-5 sm:text-center">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-full bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] leading-snug font-bold text-[var(--dc-ink-secondary)] sm:text-[13.5px]">
                    {item.label}
                  </span>
                </article>
              </li>
            ))}
          </ul>
        </Section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <Section tone="wash" labelledBy="par-cta">
          <div className="kit kit-card">
            <div className="grid items-center gap-8 p-7 sm:gap-10 sm:p-9 lg:grid-cols-12 lg:gap-8 lg:p-10 xl:gap-12">
              <div className="flex min-w-0 flex-col items-start lg:col-span-7">
                <h2
                  id="par-cta"
                  className="section-title max-w-[22ch] font-display text-[var(--dc-ink)]"
                >
                  {copy['cta.title']}
                </h2>
                <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
                  {copy['cta.body']}
                </p>

                <EnquiryLink
                  source="parent"
                  className="group/book mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 sm:text-[15px]"
                >
                  {copy['cta.label']}
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </EnquiryLink>

                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-ink-secondary)]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0 text-[var(--dc-accent-soft)]"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {copy['cta.badge']}
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-[340px] lg:col-span-5 lg:mx-0 lg:ml-auto lg:max-w-[360px]">
                <div className="relative aspect-square w-full">
                  <div className="absolute inset-[8%] overflow-hidden rounded-full border border-[var(--dc-hairline-strong)] bg-[linear-gradient(160deg,var(--dc-card),var(--dc-surface),var(--dc-card))] shadow-media">
                    <Image
                      src={copy['cta.image']}
                      alt={fill(copy['cta.imageAlt'], { siteName: siteConfig.name })}
                      fill
                      sizes="360px"
                      className="object-cover object-center opacity-90"
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-[6%] grid h-12 w-12 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-accent-soft)] shadow-[var(--dc-shadow)]"
                  >
                    <GraduationCap className="h-5 w-5" strokeWidth={1.85} />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute top-[30%] left-0 grid h-11 w-11 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-cyber)] shadow-[var(--dc-shadow)]"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.85} />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute right-0 bottom-[14%] grid h-11 w-11 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-cloud)] shadow-[var(--dc-shadow)]"
                  >
                    <Briefcase className="h-4 w-4" strokeWidth={1.85} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
    </div>
  );
}
