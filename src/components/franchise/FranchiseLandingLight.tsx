import Image from 'next/image';
import { FaqList, Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Download,
  GraduationCap,
  Handshake,
  Headphones,
  HeartHandshake,
  Landmark,
  LineChart,
  Mail,
  Megaphone,
  Network,
  Rocket,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { Faq, Testimonial } from '@/lib/content/types';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { franchiseCopy } from '@/lib/content/copy/pages/franchise';
import { FranchiseTestimonialSliderLight } from './FranchiseTestimonialSliderLight';
import { FranchiseEnquiryFormLight } from './FranchiseEnquiryFormLight';
import { HeroOrbit } from '@/components/HeroOrbit';

// Icons paired with ./data's arrays by index — kept here, not in the shared
// data file, since lucide-react's icon components use React context
// internals unavailable when scripts/export-site-corpus.mts imports that
// data file under Node's `--conditions=react-server`.
const WHY_STATS_ICONS = [Workflow, Rocket, Network, Landmark, Award];
const JUMP_START_ICONS = [Users, Settings2, Megaphone, Rocket];
const LAUNCH_STEPS_ICONS = [ClipboardList, Rocket, GraduationCap, HeartHandshake];
const COURSES_ICONS = [Briefcase, GraduationCap, BadgeCheck];

const PARTNER_AVATARS = [
  '/franchise/partner-avatar-1.webp',
  '/franchise/partner-avatar-2.webp',
  '/franchise/partner-avatar-3.webp',
  '/franchise/hero-partner.webp',
] as const;

// Orbit chips: icon + position are layout; their words come from the page copy (`orbit.N.*`).
const ORBIT_LAYOUT = [
  { icon: Award, className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]' },
  { icon: Handshake, className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]' },
  { icon: Megaphone, className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]' },
  { icon: LineChart, className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]' },
] as const;

export function FranchiseLandingLight({
  copy,
  testimonials,
  faqs,
}: {
  copy: typeof franchiseCopy.defaults;
  testimonials?: Testimonial[];
  faqs?: Faq[];
}) {
  const phone = siteConfig.phone || '8422055373';
  const telPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  // Indexed copy fields (`why.0.value`, `jump.2.title`…): the item count is fixed by the layout.
  const k = (key: string) => (copy as Record<string, string>)[key] ?? '';
  const orbit = ORBIT_LAYOUT.map((item, i) => ({
    ...item,
    label: k(`orbit.${i}.label`),
    detail: k(`orbit.${i}.detail`),
  }));
  const bands = [0, 1, 2].map((i) => k(`investment.band.${i}`));

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
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]">
              {copy['hero.eyebrow']}
            </p>

            <h1 className="page-title-hero mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
              {copy['hero.title.prefix']}{' '}
              <span className="text-[var(--dc-accent-soft)]">{copy['hero.title.accent']}</span>
            </h1>

            <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
              {copy['hero.sub']}
            </p>

            <div className="mt-7 flex flex-row flex-wrap items-center gap-2 sm:mt-8 sm:gap-4">
              <Link
                href={copy['hero.cta.href'] as Route}
                className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--dc-accent)] py-2.5 pr-2.5 pl-4 text-[13px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
              >
                {copy['hero.cta.label']}
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5 sm:h-9 sm:w-9"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href={copy['hero.secondary.href'] as Route}
                className="group/path inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[var(--dc-accent)] bg-transparent px-3.5 py-2 text-[13px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)] sm:min-h-12 sm:gap-2.5 sm:px-5 sm:py-3 sm:text-[15px]"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden="true" />
                {copy['hero.secondary.label']}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 sm:mt-10">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex -space-x-2.5">
                  {PARTNER_AVATARS.map((src) => (
                    <span
                      key={src}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--dc-card)] shadow-sm"
                    >
                      <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                  ))}
                </span>
                <span className="whitespace-nowrap text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                  {copy['hero.partners']}
                </span>
              </div>
              <span
                className="hidden h-4 w-px shrink-0 bg-[var(--dc-hairline-strong)] min-[720px]:block"
                aria-hidden="true"
              />
              <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                {copy['hero.capacity']}
              </span>
            </div>

            <a
              href={`tel:${telPhone.replace(/\s/g, '')}`}
              className="tap mt-3 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-muted)] transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              <Headphones className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {copy['hero.call']}
            </a>
          </div>

          <HeroOrbit
            src={copy['hero.image']}
            alt={copy['hero.image.alt']}
            items={orbit}
          />
        </div>
      </section>

      {/* ── Why Franchise (student Why panel) ──────────────────────────── */}
      <Section tone="plain" labelledBy="fra-why">
          <div>
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
              <div>
                <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['why.eyebrow']}</p>
                <h2
                  id="fra-why"
                  className="section-title mt-2.5 font-display text-[var(--dc-ink)]"
                >
                  {copy['why.title.prefix']}{' '}
                  <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span>
                </h2>

                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
                  {copy['why.lede']}
                </p>

                {/* Wraps into as many rows as the width allows; each row's tiles grow to fill it. */}
                <dl className="mt-7 flex flex-wrap gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
                  {WHY_STATS_ICONS.map((Icon, i) => {
                    const stat = { value: k(`why.${i}.value`), label: k(`why.${i}.label`) };
                    return (
                    <div
                      key={stat.label}
                      className="kit kit-card @container min-w-0 flex-[1_1_136px] p-4"
                    >
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="flex h-full flex-col items-start gap-3 @[200px]:flex-row @[200px]:items-center @[200px]:gap-3.5">
                        <span
                          aria-hidden="true"
                          className="kit-iconwell !h-10 !w-10"
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-[20px] leading-none font-extrabold whitespace-nowrap text-[var(--dc-ink)] sm:text-[22px]">
                            {stat.value}
                          </span>
                          <span className="mt-1.5 block text-[12.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[13px]">
                            {stat.label}
                          </span>
                        </span>
                      </dd>
                    </div>
                    );
                  })}
                </dl>
              </div>

              <FranchiseTestimonialSliderLight copy={copy} testimonials={testimonials} />
            </div>
          </div>
        </Section>

      {/* ── Market opportunity + image ─────────────────────────────────── */}
      <Section tone="tint" id="opportunity">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="kit kit-card relative overflow-hidden lg:col-span-5">
              <Image
                src={copy['market.image']}
                alt={copy['market.image.alt']}
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
              <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['market.eyebrow']}</p>
              <h2 className="section-title mt-2.5 font-display text-[var(--dc-ink)]">
                {copy['market.title']}
              </h2>
              <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
                {copy['market.lede']}
              </p>

              <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="kit kit-card p-3.5 sm:p-5">
                    <p className="font-display text-[22px] font-extrabold leading-none text-[var(--dc-accent-soft)] sm:text-[26px]">
                      {k(`market.${i}.value`)}
                    </p>
                    <p className="mt-2 text-[14px] leading-snug text-[var(--dc-ink-secondary)]">
                      {k(`market.${i}.label`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

      {/* ── Partner benefits (student Benefits pattern) ────────────────── */}
      <Section tone="plain" labelledBy="fra-benefits">
          <div className="grid gap-6 xs:gap-7 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6 xl:gap-x-10">
            <div className="max-w-xl lg:col-span-7 xl:col-span-8">
              <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['jump.eyebrow']}</p>
              <h2
                id="fra-benefits"
                className="section-title mt-2.5 font-display text-[var(--dc-ink)]"
              >
                {copy['jump.title']}
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
                {copy['jump.lede']}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 xs:gap-3.5 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:row-start-2 xl:col-span-8">
              {JUMP_START_ICONS.map((Icon, i) => {
                const item = { title: k(`jump.${i}.title`), detail: k(`jump.${i}.detail`) };
                return (
                <li key={item.title} className="min-w-0">
                  <article className="kit kit-card flex h-full gap-3.5 p-4 xs:gap-4 xs:p-5 sm:flex-col sm:gap-0">
                    <span
                      aria-hidden="true"
                      className="kit-iconwell"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 sm:mt-4">
                      <h3 className="text-[15px] font-extrabold text-[var(--dc-ink)] xs:text-[16px]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[14px] leading-snug text-[var(--dc-ink-muted)] xs:mt-1.5 sm:leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </article>
                </li>
                );
              })}
            </ul>

            <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-stretch xl:col-span-4">
              <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[var(--k-r)] bg-jk-600 p-6 text-white xs:p-7 sm:p-8 lg:p-7 xl:p-8">
                <span
                  aria-hidden="true"
                  className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white xs:h-12 xs:w-12"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.9} />
                </span>

                <h2 className="subsection-title relative mt-4 font-display !text-white xs:mt-5">
                  {copy['cta.title']}
                </h2>
                <p className="relative mt-2.5 text-[14px] leading-relaxed text-white/85 xs:mt-3 xs:text-[15px]">
                  {copy['cta.body']}
                </p>

                <a
                  href={copy['cta.button.href']}
                  className="group/book relative mt-6 inline-flex w-full min-h-12 items-center justify-between gap-3 rounded-full bg-white py-3 pr-3 pl-5 text-[14.5px] font-bold text-jk-700 transition-colors hover:bg-white/90 xs:mt-7 xs:text-[15px]"
                >
                  <span>{copy['cta.button.label']}</span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-jk-600 text-white transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </a>

                <p className="relative mt-4 text-[14px] text-white/75">
                  {fill(copy['cta.bands'], { bands: bands.join(' · ') })}
                </p>
              </div>
            </div>
          </div>
        </Section>

      {/* ── Launch plan ─────────────────────────────────────────────────── */}
      <Section tone="tint" id="journey">
          <div className="max-w-xl">
            <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['launch.eyebrow']}</p>
            <h2 className="section-title mt-2.5 font-display text-[var(--dc-ink)]">
              {copy['launch.title']}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy['launch.lede']}
            </p>
          </div>

          <div className="mt-10">
            <Reveal>
              <StepPath
                steps={LAUNCH_STEPS_ICONS.map((icon, i) => ({
                  icon,
                  label: k(`launch.${i}.step`),
                  title: k(`launch.${i}.title`),
                  body: <p className="lg:max-w-[13rem]">{k(`launch.${i}.body`)}</p>,
                }))}
              />
            </Reveal>
          </div>
        </Section>

      {/* ── Courses ────────────────────────────────────────────────────── */}
      <Section tone="plain" id="courses">
          <div className="max-w-xl">
            <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['courses.eyebrow']}</p>
            <h2 className="section-title mt-2.5 font-display text-[var(--dc-ink)]">
              {copy['courses.title']}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy['courses.lede']}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative isolate min-h-[200px] overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] sm:min-h-[260px] lg:min-h-full">
            <Image src="/home/campus-lab.jpg" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="-z-10 object-cover" />
          </div>
          <ul className="grid gap-3 sm:gap-4">
            {COURSES_ICONS.map((Icon, i) => {
              const course = { title: k(`courses.${i}.title`), body: k(`courses.${i}.body`) };
              return (
              <li key={i}>
                <article className="kit kit-card flex h-full items-start gap-4 p-5">
                  <span
                    aria-hidden="true"
                    className="kit-iconwell"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-extrabold text-[var(--dc-ink)]">{course.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">{course.body}</p>
                  </div>
                </article>
              </li>
              );
            })}
          </ul>
          </div>
        </Section>

      {/* ── FAQs ───────────────────────────────────────────────────────── */}
      {faqs?.length ? (
        <Section tone="tint" labelledBy="fra-faq">
          <SectionHeader id="fra-faq" eyebrow={copy['faq.eyebrow']} title={copy['faq.title']} />
          <FaqList items={faqs} />
        </Section>
      ) : null}

      {/* ── Enquire ────────────────────────────────────────────────────── */}
      <Section tone="tint" id="enquire">
          <div className="kit kit-card overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[220px] overflow-hidden lg:min-h-full">
                <Image
                  src="/franchise/hero-building.webp"
                  alt={copy['enquire.image.alt']}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/88 via-scrim/35 to-transparent lg:bg-gradient-to-r" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                  <p className="font-display text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-[26px]">
                    {copy['enquire.tagline']}
                  </p>
                  <p className="mt-3 text-[14px] text-white/75">
                    {copy['enquire.note']}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <FranchiseEnquiryFormLight copy={copy} />
              </div>
            </div>
          </div>
        </Section>

      {/* ── Contact bar ────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] py-5">
        <div className="shell">
          <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:flex-wrap sm:gap-8">
            <a
              href={`tel:${telPhone.replace(/\s/g, '')}`}
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)] transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              <Headphones
                className="h-4 w-4 text-[var(--dc-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              {fill(copy['contact.call'], { phone })}
            </a>
            <a
              href={`mailto:${copy['contact.email']}`}
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)] transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              <Mail
                className="h-4 w-4 text-[var(--dc-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              {copy['contact.email']}
            </a>
            <Link
              href={copy['contact.web.href'] as Route}
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)] transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              <Download
                className="h-4 w-4 text-[var(--dc-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              {copy['contact.web.label']}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
