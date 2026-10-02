import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Handshake,
  Headphones,
  LineChart,
  Mail,
  Megaphone,
  Rocket,
  Settings2,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';
import type { Faq, Testimonial } from '@/lib/content/types';
import { siteConfig } from '@/lib/site';
import { FranchiseTestimonialSliderLight } from './FranchiseTestimonialSliderLight';
import { FranchiseEnquiryFormLight } from './FranchiseEnquiryFormLight';
import { HeroOrbit } from '@/components/HeroOrbit';
import { Disclosure } from '@/components/Disclosure';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import { COURSES, JUMP_START, LAUNCH_STEPS, MARKET_STATS, WHY_STATS } from './data';

// Icons paired with ./data's arrays by index — kept here, not in the shared
// data file, since lucide-react's icon components use React context
// internals unavailable when scripts/export-site-corpus.mts imports that
// data file under Node's `--conditions=react-server`.
const WHY_STATS_ICONS = [Users, UsersRound, Building2, Award, ShieldCheck];
const JUMP_START_ICONS = [Users, Settings2, Megaphone, Rocket];
const LAUNCH_STEPS_ICONS = [FileText, Rocket, Users, Handshake];
const COURSES_ICONS = [Shield, Award, TrendingUp];

const PARTNER_AVATARS = [
  '/franchise/partner-avatar-1.webp',
  '/franchise/partner-avatar-2.webp',
  '/franchise/partner-avatar-3.webp',
  '/franchise/hero-partner.webp',
] as const;

const ORBIT = [
  {
    label: 'Brand',
    detail: `Trusted ${SINCE_FOUNDED.toLowerCase()}`,
    icon: Award,
    className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]',
  },
  {
    label: 'Support',
    detail: 'End-to-end ops help',
    icon: Handshake,
    className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]',
  },
  {
    label: 'Growth',
    detail: 'Local marketing push',
    icon: Megaphone,
    className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]',
  },
  {
    label: 'Returns',
    detail: 'Attractive ROI path',
    icon: LineChart,
    className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]',
  },
] as const;

export function FranchiseLandingLight({
  testimonials,
  faqs,
}: {
  testimonials?: Testimonial[];
  faqs?: Faq[];
}) {
  const phone = siteConfig.phone || '8422055373';
  const telPhone = phone.startsWith('+') ? phone : `+91${phone}`;

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
      {/* ── Hero (student orbit pattern) ───────────────────────────────── */}
      <section className="shell relative pt-8 pb-6 xs:pt-10 sm:pt-12 lg:pt-14 lg:pb-8">

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-10">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stu-hairline)] bg-[var(--stu-accent-tint)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--stu-accent-soft)]">
              Become A Franchise Partner
            </p>

            <h1 className="mt-5 font-display text-[36px] leading-[1.08] font-extrabold tracking-[-0.035em] text-[var(--stu-ink)] xs:text-[42px] sm:mt-6 sm:text-[48px] md:text-[52px] lg:text-[50px] xl:text-[58px]">
              Transform youth with a Jetking Franchise in your{' '}
              <span className="text-[var(--stu-accent-soft)]">City</span>
            </h1>

            <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.65] text-[var(--stu-ink-secondary)] xs:text-[16px] sm:mt-6">
              Join India&rsquo;s trusted IT training network. Proven model, end-to-end
              support, and a path to build lasting local impact — and wealth.
            </p>

            <div className="mt-7 flex flex-row flex-wrap items-center gap-2 sm:mt-8 sm:gap-4">
              <Link
                href="#enquire"
                className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--stu-accent)] py-2.5 pr-2.5 pl-4 text-[13px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
              >
                Enquire Now
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5 sm:h-9 sm:w-9"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href="#enquire"
                className="group/path inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[var(--stu-accent)] bg-transparent px-3.5 py-2 text-[13px] font-bold text-[var(--stu-accent-soft)] transition-colors hover:bg-[var(--stu-accent-tint)] sm:min-h-12 sm:gap-2.5 sm:px-5 sm:py-3 sm:text-[15px]"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden="true" />
                Download Brochure
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 sm:mt-10">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex -space-x-2.5">
                  {PARTNER_AVATARS.map((src) => (
                    <span
                      key={src}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--stu-card)] shadow-sm"
                    >
                      <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                  ))}
                </span>
                <span className="whitespace-nowrap text-[13.5px] font-semibold text-[var(--stu-ink-secondary)]">
                  Partners across India
                </span>
              </div>
              <span
                className="hidden h-4 w-px shrink-0 bg-[var(--stu-hairline)] min-[720px]:block"
                aria-hidden="true"
              />
              <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13.5px] font-semibold text-[var(--stu-ink-secondary)]">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-[var(--stu-accent-soft)]"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                Capacity from ₹50L
              </span>
            </div>

            <a
              href={`tel:${telPhone.replace(/\s/g, '')}`}
              className="tap mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--stu-ink-muted)] transition-colors hover:text-[var(--stu-accent-soft)]"
            >
              <Headphones className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Prefer to talk? Call franchise manager
            </a>
          </div>

          <HeroOrbit
            src="/franchise/hero-building.webp"
            alt="Modern Jetking franchise training centre building"
            items={ORBIT}
          />
        </div>
      </section>

      {/* ── Why Franchise (student Why panel) ──────────────────────────── */}
      <section
        className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14"
        aria-labelledby="fra-why"
      >
        <div className="shell">
          <div className="stu-why overflow-hidden rounded-[28px] px-6 py-10 text-[var(--stu-ink)] xs:rounded-[32px] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="fra-why"
                  className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:text-[28px] sm:text-[32px]"
                >
                  Why Partners Choose{' '}
                  <span className="text-[var(--stu-accent-soft)]">{siteConfig.name}</span>
                </h2>

                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--stu-ink-secondary)] sm:text-[15px]">
                  The numbers behind a franchise model built on decades of trust.
                </p>

                {/* Wraps into as many rows as the width allows; each row's tiles grow to fill it. */}
                <dl className="mt-7 flex flex-wrap gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                  {WHY_STATS.map((stat, i) => {
                    const Icon = WHY_STATS_ICONS[i]!;
                    return (
                    <div
                      key={stat.label}
                      className="stu-card @container min-w-0 flex-[1_1_136px] rounded-2xl p-4"
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="flex h-full flex-col items-start gap-3 @[200px]:flex-row @[200px]:items-center @[200px]:gap-3.5">
                        <span
                          aria-hidden="true"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)]"
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-[20px] leading-none font-extrabold whitespace-nowrap text-[var(--stu-ink)] sm:text-[22px]">
                            {stat.value}
                          </span>
                          <span className="mt-1.5 block text-[12.5px] leading-snug text-[var(--stu-ink-secondary)] sm:text-[13px]">
                            {stat.label}
                          </span>
                        </span>
                      </dd>
                    </div>
                    );
                  })}
                </dl>
              </div>

              <FranchiseTestimonialSliderLight testimonials={testimonials} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner benefits (student Benefits pattern) ────────────────── */}
      <section
        className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14"
        aria-labelledby="fra-benefits"
      >
        <div className="shell">
          <div className="grid gap-6 xs:gap-7 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6 xl:gap-x-10">
            <div className="max-w-xl lg:col-span-7 xl:col-span-8">
              <h2
                id="fra-benefits"
                className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:text-[26px] sm:text-[28px] lg:text-[30px]"
              >
                Jump-start your centre
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--stu-ink-muted)] sm:text-[15px]">
                What you get when you partner with Jetking.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 xs:gap-3.5 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:row-start-2 xl:col-span-8">
              {JUMP_START.map((item, i) => {
                const Icon = JUMP_START_ICONS[i]!;
                return (
                <li key={item.title} className="min-w-0">
                  <article className="stu-card flex h-full gap-3.5 rounded-[18px] p-4 xs:gap-4 xs:rounded-[20px] xs:p-5 sm:flex-col sm:gap-0">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--stu-accent-soft)]/40 bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)] xs:h-11 xs:w-11 sm:h-12 sm:w-12"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 sm:mt-4">
                      <h3 className="text-[15px] font-extrabold text-[var(--stu-ink)] xs:text-[16px]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-snug text-[var(--stu-ink-muted)] xs:mt-1.5 xs:text-[13.5px] sm:leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </article>
                </li>
                );
              })}
            </ul>

            <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-stretch xl:col-span-4">
              <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[22px] border border-[var(--stu-hairline)] bg-[var(--stu-card)] p-6 xs:rounded-[24px] xs:p-7 sm:rounded-[28px] sm:p-8 lg:p-7 xl:p-8">
                <span
                  aria-hidden="true"
                  className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)] shadow-brand xs:h-12 xs:w-12"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <h2 className="relative mt-4 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:mt-5 xs:text-[24px] sm:text-[26px]">
                  Ready to partner?
                </h2>
                <p className="relative mt-2.5 text-[14px] leading-relaxed text-[var(--stu-ink-secondary)] xs:mt-3 xs:text-[15px]">
                  Tell us your preferred city and investment capacity — our franchise team
                  replies within 24 hours.
                </p>

                <a
                  href="#enquire"
                  className="group/book relative mt-6 inline-flex w-full min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--stu-navy)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 xs:mt-7 xs:text-[15px]"
                >
                  <span>Start franchise enquiry</span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </a>

                <p className="relative mt-4 text-[12.5px] text-[var(--stu-ink-muted)]">
                  Capacity bands: UPTO 50 L · UPTO 1 CR · UPTO 3 CR
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Launch plan ─────────────────────────────────────────────────── */}
      <section id="journey" className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14">
        <div className="shell">
          <div className="max-w-xl">
            <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] sm:text-[28px] lg:text-[30px]">
              Launch Plan
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--stu-ink-muted)] sm:text-[15px]">
              A clear path from territory selection to day-to-day operations.
            </p>
          </div>

          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {LAUNCH_STEPS.map((step, i) => {
              const Icon = LAUNCH_STEPS_ICONS[i]!;
              return (
              <li key={step.step}>
                <article className="stu-card flex h-full flex-col rounded-[20px] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--stu-accent-soft)]/40 bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)]"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-[22px] font-extrabold text-[var(--stu-accent-soft)]/70">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[16px] font-extrabold text-[var(--stu-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--stu-ink-muted)]">
                    {step.body}
                  </p>
                </article>
              </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Market opportunity + image ─────────────────────────────────── */}
      <section id="opportunity" className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14">
        <div className="shell">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--stu-hairline)] lg:col-span-5">
              <Image
                src="/franchise/centre-interior.webp"
                alt="Students learning in a modern Jetking-style IT training classroom"
                width={1200}
                height={900}
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/55 via-transparent to-transparent"
              />
            </div>

            <div className="lg:col-span-7">
              <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] sm:text-[28px] lg:text-[30px]">
                The opportunity is real
              </h2>
              <p className="mt-2 max-w-[54ch] text-[14px] leading-relaxed text-[var(--stu-ink-muted)] sm:text-[15px]">
                Skill gaps in cloud, cyber and emerging tech create lasting demand for
                job-ready training centres in every city.
              </p>

              <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
                {MARKET_STATS.map((stat) => (
                  <li key={stat.label} className="stu-card rounded-[18px] p-3.5 sm:p-5">
                    <p className="font-display text-[22px] font-extrabold leading-none text-[var(--stu-accent-soft)] sm:text-[26px]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-snug text-[var(--stu-ink-secondary)] sm:text-[13px]">
                      {stat.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Courses ────────────────────────────────────────────────────── */}
      <section id="courses" className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14">
        <div className="shell">
          <div className="max-w-xl">
            <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] sm:text-[28px] lg:text-[30px]">
              Courses your centre will deliver
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--stu-ink-muted)] sm:text-[15px]">
              Proven courses parents trust and employers recognise.
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {COURSES.map((course, i) => {
              const Icon = COURSES_ICONS[i]!;
              return (
              <li key={course.title}>
                <article className="stu-card flex h-full flex-col rounded-[20px] p-5 sm:p-6">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--stu-accent-soft)]/40 bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)]"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-[16px] font-extrabold text-[var(--stu-ink)]">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--stu-ink-muted)]">
                    {course.body}
                  </p>
                </article>
              </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── FAQs ───────────────────────────────────────────────────────── */}
      {faqs?.length ? (
        <section id="faqs" className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14">
          <div className="shell">
            <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] sm:text-[28px] lg:text-[30px]">
              Frequently Asked Questions
            </h2>
            <div className="fra-faq mt-8 space-y-3">
              {faqs.map((faq) => (
                <Disclosure key={faq.id} summary={faq.question}>
                  <p className="text-[14.5px] leading-relaxed text-[var(--stu-ink-secondary)]">
                    {faq.answer}
                  </p>
                </Disclosure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Enquire ────────────────────────────────────────────────────── */}
      <section id="enquire" className="bg-[var(--stu-surface)] py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="stu-card overflow-hidden rounded-[28px]">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[220px] overflow-hidden lg:min-h-full">
                <Image
                  src="/franchise/hero-building.webp"
                  alt="Modern Jetking franchise centre exterior"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/88 via-scrim/35 to-transparent lg:bg-gradient-to-r" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                  <p className="font-display text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-[26px]">
                    Be your own boss. Build lasting wealth with a trusted brand.
                  </p>
                  <p className="mt-3 text-[14px] text-white/75">
                    Our franchise team gets back within 24 hours.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <FranchiseEnquiryFormLight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact bar ────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--stu-hairline)] bg-[var(--stu-surface)] py-5">
        <div className="shell">
          <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:flex-wrap sm:gap-8">
            <a
              href={`tel:${telPhone.replace(/\s/g, '')}`}
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--stu-ink-secondary)] transition-colors hover:text-[var(--stu-accent-soft)]"
            >
              <Headphones
                className="h-4 w-4 text-[var(--stu-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              Speak to Franchise Manager: +91 {phone}
            </a>
            <a
              href="mailto:franchise@jetking.com"
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--stu-ink-secondary)] transition-colors hover:text-[var(--stu-accent-soft)]"
            >
              <Mail
                className="h-4 w-4 text-[var(--stu-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              franchise@jetking.com
            </a>
            <Link
              href="/franchise"
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--stu-ink-secondary)] transition-colors hover:text-[var(--stu-accent-soft)]"
            >
              <Download
                className="h-4 w-4 text-[var(--stu-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              www.jetking.com/franchise
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
