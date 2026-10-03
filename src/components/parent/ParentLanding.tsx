'use client';

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
  MessageCircle,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Course, Testimonial } from '@/lib/content/types';
import { RecommendedCourses } from '@/components/student/RecommendedCourses';
import { siteConfig } from '@/lib/site';
import { FOUNDED_YEAR, SINCE_FOUNDED, type NetworkCounts } from '@/lib/brand-facts';
import { ParentTestimonialSlider } from './ParentTestimonialSlider';

const HERO_FEATURES = [
  { label: 'Industry Relevant Courses', icon: BookOpen },
  { label: 'Practical Learning', icon: Sparkles },
  { label: 'Placement Assistance', icon: Briefcase },
  { label: 'Trusted by Parents', icon: ShieldCheck },
] as const;

function trustStats(counts: NetworkCounts) {
  return [
    { icon: Building2, value: `${counts.centres}`, label: 'Centres to visit in person' },
    { icon: Briefcase, value: 'Support', label: 'Placement Assistance' },
    { icon: GraduationCap, value: 'Industry', label: 'Aligned Curriculum' },
    { icon: Award, value: SINCE_FOUNDED, label: 'Trusted Brand Legacy' },
  ] as const;
}

const JOURNEY_STEPS = [
  { title: 'Career Guidance', detail: '& Counselling', icon: MessageCircle },
  { title: 'Choose the', detail: 'Right Course', icon: BookOpen },
  { title: 'Hands-on Training', detail: '& Projects', icon: Sparkles },
  { title: 'Placement', detail: 'Support', icon: Briefcase },
  { title: 'Successful', detail: 'Career', icon: GraduationCap },
] as const;

const HELP_LINKS = [
  { label: 'Talk to Parent Advisor', href: '/enquiry', icon: Phone },
  { label: 'Download Course Brochure', href: '/enquiry', icon: Download },
  { label: 'Visit Nearest Centre', href: '/centres', icon: Building2 },
  { label: 'Fee & Scholarship Options', href: '/enquiry', icon: IndianRupee },
] as const;

const PARENT_LOVES = [
  { label: 'Safe & Secure Learning Environment', icon: Shield },
  { label: 'Dedicated Mentors', icon: Users },
  { label: 'Hands-on Labs', icon: Sparkles },
  { label: 'Career Counselling', icon: MessageCircle },
  { label: `Trusted Legacy ${SINCE_FOUNDED}`, icon: Award },
] as const;

const STORY_AVATARS = [
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
] as const;

export function ParentLanding({
  courses,
  counts,
  testimonials,
}: {
  courses: Course[];
  counts: NetworkCounts;
  testimonials?: Testimonial[];
}) {
  const stats = trustStats(counts);
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
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--dc-accent-soft)]">
              Welcome Parent!
            </p>

            <h1 className="page-title mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
              Your Child&rsquo;s Future Starts with the{' '}
              <span className="text-[var(--dc-accent-soft)]">Right Education</span> Today
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
              Help your child build a future-ready IT career with industry-aligned courses,
              practical labs, and placement support — with fee clarity before you commit.
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
              {HERO_FEATURES.map((item) => (
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
                href="#courses"
                className="group/cta inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                Explore Courses for Your Child
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href={'/enquiry' as Route}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-[var(--dc-accent)] px-5 py-3 text-[15px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)]"
              >
                Book Free Career Guidance
              </Link>
            </div>
          </div>

          <div className="relative lg:col-span-5 xl:col-span-5">
            {/* Extra bottom/side room so the trust card can hang off the photo */}
            <div className="relative pb-6 sm:pb-8 lg:pb-10 lg:pr-4 xl:pr-6">
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--dc-hairline-strong)] shadow-[var(--dc-shadow)]">
                <Image
                  src="/parent/hero.jpg"
                  alt="Parent and student exploring career options together"
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
                  Why Parents Trust {siteConfig.name}
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
      <section className="bg-[var(--dc-surface)] py-10 sm:py-12 lg:py-14" aria-labelledby="par-journey">
        <div className="shell">
          <div className="overflow-hidden rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-5 py-7 sm:rounded-[28px] sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
              >
                <ShieldCheck className="h-5 w-5" strokeWidth={1.85} />
              </span>
              <h2
                id="par-journey"
                className="font-display text-[18px] font-extrabold text-[var(--dc-ink)] sm:text-[20px]"
              >
                We&rsquo;re with you at every step
              </h2>
            </div>

            <ol className="relative mt-8 grid grid-cols-2 gap-x-4 gap-y-7 xs:gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
              <div
                aria-hidden="true"
                className="par-journey-line absolute top-[22px] right-[10%] left-[10%] hidden lg:block"
              />
              {JOURNEY_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className={[
                    'relative z-10 flex flex-col items-center text-center',
                    // On the 2-col mobile grid, 5 items leave a lone last item in
                    // its own row — span both columns so it centers instead of
                    // sitting left-aligned. Not needed at sm:/lg: (3/5 columns).
                    index === JOURNEY_STEPS.length - 1 ? 'col-span-2 sm:col-span-1' : '',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--dc-accent-soft)] bg-[var(--dc-card)] text-[var(--dc-accent-soft)]"
                  >
                    <step.icon className="h-5 w-5" strokeWidth={1.85} />
                  </span>
                  <span className="mt-3 text-[13px] leading-snug font-extrabold text-[var(--dc-ink)] sm:text-[13.5px]">
                    {step.title}
                  </span>
                  <span className="text-[12px] text-[var(--dc-ink-muted)]">{step.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Courses (student RecommendedCourses pattern) ─────────────────── */}
      <div id="courses" className="scroll-mt-24 bg-[var(--dc-surface)]">
        <RecommendedCourses
          courses={courses}
          headingId="par-courses"
          title="Top Career Options Your Child Can Build"
          description="Proven courses parents compare — labs, certifications, and support."
        />
      </div>

      {/* ── Let us help you ──────────────────────────────────────────────── */}
      <section className="bg-[var(--dc-surface)] py-10 sm:py-12 lg:py-14" aria-labelledby="par-help">
        <div className="shell">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-5 sm:p-6 lg:col-span-8">
              <h2
                id="par-help"
                className="font-display text-[18px] font-extrabold text-[var(--dc-ink)] sm:text-[20px]"
              >
                Let Us Help You
              </h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {HELP_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href as Route}
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
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] text-[var(--dc-ink-muted)]">
                {counts.centres} centres across {counts.cities} cities — visit before you decide.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] p-5 sm:p-6 lg:col-span-4">
              <p className="flex items-start gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                <FileText
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Have questions? We&rsquo;re here to help you!
              </p>
              <Link
                href={'/chatbot' as Route}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--dc-accent)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Chat with Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Success stories ──────────────────────────────────────────────── */}
      <section
        className="bg-[var(--dc-surface)] py-10 sm:py-12 lg:py-14"
        aria-labelledby="par-stories"
      >
        <div className="shell">
          <div className="stu-why rounded-[28px] px-6 py-10 text-[var(--dc-ink)] xs:rounded-[28px] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="par-stories"
                  className="section-title font-display text-[var(--dc-ink)]"
                >
                  Real Success Stories.{' '}
                  <span className="text-[var(--dc-accent-soft)]">Real Parents.</span> Real Results.
                </h2>

                <div className="mt-8 flex flex-wrap items-end gap-8">
                  <div>
                    <p className="font-display text-[48px] leading-none font-extrabold text-[var(--dc-accent-soft)] sm:text-[56px]">
                      {FOUNDED_YEAR}
                    </p>
                    <p className="mt-2 text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                      Training IT talent since
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-[32px] leading-none font-extrabold text-[var(--dc-ink)] sm:text-[36px]">
                      {counts.cities}
                    </p>
                    <p className="mt-2 text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">Cities with a Jetking centre</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <span aria-hidden="true" className="flex -space-x-2.5">
                    {STORY_AVATARS.map((src) => (
                      <span
                        key={src}
                        className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--dc-card)]"
                      >
                        <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                    ))}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--dc-ink-secondary)]">
                    Parents &amp; learners across India
                  </span>
                </div>
              </div>

              <ParentTestimonialSlider testimonials={testimonials} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Things parents love ──────────────────────────────────────────── */}
      <section
        className="bg-[var(--dc-surface)] py-10 sm:py-12 lg:py-14"
        aria-labelledby="par-loves"
      >
        <div className="shell">
          <h2
            id="par-loves"
            className="subsection-title font-display text-[var(--dc-ink)]"
          >
            Things Parents Love About {siteConfig.name}
          </h2>

          <ul className="mt-6 flex flex-wrap gap-3 lg:gap-4">
            {PARENT_LOVES.map((item) => (
              <li key={item.label} className="@container min-w-0 flex-[1_1_140px]">
                <article className="stu-card flex h-full flex-col items-start gap-3 rounded-[16px] p-4 max-sm:@[260px]:flex-row max-sm:@[260px]:items-center sm:items-center sm:p-5 sm:text-center">
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
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--dc-surface)] py-14 sm:py-16 lg:py-20" aria-labelledby="par-cta">
        <div className="shell">
          <div className="rounded-[28px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] xs:rounded-[28px]">
            <div className="grid items-center gap-8 p-7 sm:gap-10 sm:p-9 lg:grid-cols-12 lg:gap-8 lg:p-10 xl:gap-12">
              <div className="flex min-w-0 flex-col items-start lg:col-span-7">
                <h2
                  id="par-cta"
                  className="section-title max-w-[22ch] font-display text-[var(--dc-ink)]"
                >
                  Not sure which course is right for your child?
                </h2>
                <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
                  Book a free counselling session with a parent advisor. Compare tracks, fees, and
                  centres — no pressure to enrol.
                </p>

                <Link
                  href={'/enquiry' as Route}
                  className="group/book mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 sm:text-[15px]"
                >
                  Book Free Career Counselling
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </Link>

                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[12.5px] font-bold text-[var(--dc-ink-secondary)] sm:text-[13px]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0 text-[var(--dc-accent-soft)]"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  No obligation · 100% free
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-[340px] lg:col-span-5 lg:mx-0 lg:ml-auto lg:max-w-[360px]">
                <div className="relative aspect-square w-full">
                  <div className="absolute inset-[8%] overflow-hidden rounded-full border border-[var(--dc-hairline-strong)] bg-[linear-gradient(160deg,var(--dc-card),var(--dc-surface),var(--dc-card))] shadow-media">
                    <Image
                      src="/parent/hero.jpg"
                      alt={`Parent researching ${siteConfig.name} career guidance for their child`}
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
        </div>
      </section>
    </div>
  );
}
