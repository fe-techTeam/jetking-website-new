import Image from 'next/image';
import { Section } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Compass,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { Course, CourseLevel, Post } from '@/lib/content/types';
import { PLACEMENT_PARTNERS } from './partners';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { exploreCopy } from '@/lib/content/copy/pages/explore';
import { legacyStats } from '@/lib/brand-facts';
import type { AboutPageContent, PlacementsPageContent } from '@/lib/content/types';
import { RecommendedCourses } from '@/components/student/RecommendedCourses';
import { PostCard } from '@/components/blog/BlogCards';
import { brandMark } from '@/lib/course-logos';
import { ExploreTestimonialSlider } from './ExploreTestimonialSlider';
import { REASONS } from './content';
import { ExploreEnquiryForm } from './ExploreEnquiryForm';
import { HeroOrbit } from '@/components/HeroOrbit';
import type { LocatedCentre } from '@/components/useEnquiryLocation';

/** Certifications students train toward — real brand marks, kept off white ('unity'/'tcs'/'x'). */
const CERTIFICATIONS = [
  'Cisco',
  'CompTIA',
  'Red Hat',
  'CEH',
  'AWS',
  'Microsoft Azure',
  'Google Cloud',
  'Kubernetes',
  'Docker',
  'Linux',
  'Splunk',
  'Checkpoint',
] as const;

/**
 * Original logos for placement-partner companies — fetched from each company's
 * own official site or Wikimedia/Wikipedia (2026-08-21), not generated. Only
 * included where the company's identity could be confirmed with confidence;
 * ambiguous or unconfirmed names (multiple same-named companies, no verifiable
 * source) are deliberately left out and fall back to the initials tile instead
 * of risking the wrong company's logo.
 */
const PARTNER_LOGOS: Record<string, { src: string; dark?: boolean }> = {
  Wipro: { src: '/placements/partners/wipro.svg' },
  'Bharti Airtel Limited': { src: '/placements/partners/bharti-airtel.svg' },
  'Birla Corp': { src: '/placements/partners/birla-corp.jpg' },
  Laundryheap: { src: '/placements/partners/laundryheap.svg' },
  Futwork: { src: '/placements/partners/futwork.svg', dark: true },
  'Oraiyan Groups': { src: '/placements/partners/oraiyan-groups.png' },
  Reisnet: { src: '/placements/partners/reisnet.png', dark: true },
};

const AVATARS = [
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
  '/student/avatar-4.webp',
] as const;

const ORBIT = [
  {
    icon: Compass,
    className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]',
  },
  {
    icon: BookOpen,
    className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]',
  },
  {
    icon: MapPin,
    className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]',
  },
  {
    icon: ShieldCheck,
    className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]',
  },
] as const;

/** "Our Affiliation" — real logos live on the jetking.com homepage (fetched 2026-08-21); names and image paths come from the page copy. */
const AFFILIATION_COUNT = 4;

const LEVEL_ORDER: CourseLevel[] = ['degree', 'diploma', 'certification', 'short'];

function groupCoursesByLevel(courses: Course[]): Array<{ level: CourseLevel; courses: Course[] }> {
  return LEVEL_ORDER.map((level) => ({
    level,
    courses: courses.filter((c) => c.level === level),
  })).filter((group) => group.courses.length > 0);
}

/** Short initials fallback for names with no local brand mark, e.g. "Bharti Airtel Limited" → "BA". */
function initialsOf(name: string): string {
  return name
    .replace(/[^A-Za-z0-9+/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, part.length <= 4 ? part.length : 1).toUpperCase())
    .join('')
    .slice(0, 4);
}

/**
 * Shared logo-card recipe: every tile is the same fixed rem height and fills its grid column,
 * and the logo is contained (never stretched or cropped), so cards stay equal and reflow
 * instead of breaking when the browser zoom or viewport changes.
 */
const LOGO_TILE =
  'flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--dc-hairline-strong)] p-3 sm:h-[4.5rem]';
const LOGO_IMG = 'max-h-full max-w-full object-contain';
/** Auto-fit columns: as many equal cards per row as fit at >= 6.25rem (phone) / 7.5rem each. */
const LOGO_GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:gap-x-4';

function LogoTile({ name }: { name: string }) {
  const partner = PARTNER_LOGOS[name];
  const mark = partner ? null : brandMark(name);
  return (
    <div className="flex h-full min-w-0 flex-col items-center gap-2.5 text-center">
      <span
        aria-hidden="true"
        className={`${LOGO_TILE} ${partner?.dark ? 'bg-tile-dark' : 'bg-white'}`}
      >
        {partner ? (
          // eslint-disable-next-line @next/next/no-img-element -- real company logo, fetched from its official site/Wikimedia
          <img src={partner.src} alt="" className={LOGO_IMG} />
        ) : mark?.painted ? (
          // eslint-disable-next-line @next/next/no-img-element -- local painted SVG badge
          <img src={mark.src} alt="" className="max-h-full max-w-full rounded-lg object-cover" />
        ) : mark ? (
          <span
            className="dc-logo !h-8 !w-8 sm:!h-9 sm:!w-9"
            style={{ '--logo': `url(${mark.src})`, color: mark.color } as React.CSSProperties}
          />
        ) : (
          <span className="font-display text-[15px] font-extrabold tracking-tight text-[#4b5563]">
            {initialsOf(name) || '·'}
          </span>
        )}
      </span>
      <span className="min-h-[2.5em] max-w-full text-[12px] leading-snug font-semibold text-[var(--dc-ink-secondary)] [overflow-wrap:anywhere]">
        {name}
      </span>
    </div>
  );
}

const PHONE_PREVIEW = 8;

/**
 * Long logo walls: phones see the first few plus a native disclosure for the
 * rest (no client JS); sm+ always shows the full grid. Overflow items render
 * twice with complementary visibility, so each breakpoint shows them once.
 */
function CollapsibleLogoGrid<T>({
  items,
  itemKey,
  render,
  showAll,
  showFewer,
}: {
  items: readonly T[];
  itemKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
  showAll: string;
  showFewer: string;
}) {
  const rest = items.slice(PHONE_PREVIEW);
  return (
    <>
      <ul className={`mt-7 ${LOGO_GRID}`}>
        {items.map((item, i) => (
          <li key={itemKey(item)} className={`min-w-0 ${i >= PHONE_PREVIEW ? 'max-sm:hidden' : ''}`}>
            {render(item)}
          </li>
        ))}
      </ul>
      {rest.length ? (
        <details className="group mt-5 sm:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-5 text-[14px] font-bold text-[var(--dc-ink)] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{fill(showAll, { count: items.length })}</span>
            <span className="hidden group-open:inline">{showFewer}</span>
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </summary>
          <ul className={`mt-5 ${LOGO_GRID}`}>
            {rest.map((item) => (
              <li key={itemKey(item)} className="min-w-0">
                {render(item)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

export function ExploreLanding({
  courses,
  counts,
  posts,
  enquiryCentres,
  about,
  placements,
  copy,
}: {
  about: AboutPageContent;
  placements: PlacementsPageContent;
  enquiryCentres: LocatedCentre[];
  courses: Course[];
  counts: { courses: number; centres: number; cities: number };
  posts: Post[];
  copy: typeof exploreCopy.defaults;
}) {
  // Indexed lists (`reasons.0.title`, …) are read by key.
  const byKey: Record<string, string> = copy;
  const levelLabels: Record<CourseLevel, string> = {
    degree: copy['levels.degree'],
    diploma: copy['levels.diploma'],
    certification: copy['levels.certification'],
    short: copy['levels.short'],
  };
  const orbitItems = ORBIT.map((item, i) => ({
    ...item,
    label: byKey[`orbit.${i}.label`] ?? '',
    detail: byKey[`orbit.${i}.detail`] ?? '',
  }));
  const universityPartners = Array.from({ length: 4 }, (_, i) => ({
    name: byKey[`universities.${i}.name`] ?? '',
    src: byKey[`universities.${i}.image`] ?? '',
  }));
  const affiliations = Array.from({ length: AFFILIATION_COUNT }, (_, i) => ({
    name: byKey[`affiliation.${i}.name`] ?? '',
    src: byKey[`affiliation.${i}.image`] ?? '',
  }));
  const levelGroups = groupCoursesByLevel(courses);
  const { hero: ABOUT_HERO, purpose: PURPOSE, achievements: ACHIEVEMENTS } = about;
  const PLACEMENT_DISCLAIMER = placements.disclaimer;
  /** Real companies from Jetking's own published placement records (CMS `placements_page`). */
  const ALUMNI_COMPANIES = [...new Set(placements.placedCandidates.map((c) => c.company))];

  return (
    <div
      className={[
        'student-page relative flex flex-col overflow-hidden',
        '-mt-[72px] pt-[72px]',
        'xs:-mt-[80px] xs:pt-[80px]',
        'sm:-mt-[88px] sm:pt-[88px]',
        '2xl:-mt-[96px] 2xl:pt-[96px]',
      ].join(' ')}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-8 pb-6 xs:pt-10 sm:pt-12 lg:pt-14 lg:pb-8">

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-10">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]">
              {copy['hero.eyebrow']} <span aria-hidden="true">👋</span>
            </p>

            <h1 className="page-title-hero mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
              {copy['hero.titleLead']} <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span> {copy['hero.titleTrail']}
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
              {fill(copy['hero.body'], { brand: siteConfig.name })}
            </p>

            <div className="mt-7 flex flex-row flex-wrap items-center gap-2 sm:mt-8 sm:gap-4">
              <Link
                href={copy['hero.cta.primary.href'] as Route}
                className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--dc-accent)] py-2.5 pr-2.5 pl-4 text-[13px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
              >
                {copy['hero.cta.primary.label']}
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5 sm:h-9 sm:w-9"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href={copy['hero.cta.secondary.href'] as Route}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border-2 border-[var(--dc-accent)] px-3.5 py-2 text-[13px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)] sm:min-h-12 sm:px-5 sm:py-3 sm:text-[15px]"
              >
                {copy['hero.cta.secondary.label']}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-10">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex -space-x-2.5">
                  {AVATARS.map((src) => (
                    <span
                      key={src}
                      className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--dc-card)] shadow-sm"
                    >
                      <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                  ))}
                </span>
                <span className="text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                  {fill(copy['hero.citiesLine'], { cities: counts.cities })}
                </span>
              </div>
              <span className="hidden h-4 w-px bg-[var(--dc-hairline-strong)] sm:block" aria-hidden="true" />
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                <ShieldCheck
                  className="h-4 w-4 text-[var(--dc-accent-soft)]"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                {copy['hero.noForm']}
              </span>
            </div>
          </div>

          <HeroOrbit
            src={copy['hero.image']}
            alt={copy['hero.imageAlt']}
            items={orbitItems}
            imageClassName="object-cover object-[center_22%]"
          />
        </div>
      </section>

      {/* ── Quick enquiry (optional — no pressure) ───────────────────────── */}
      <Section tone="tint" deco="glow" id="enquire" className="max-lg:order-last">
          <div className="kit kit-card overflow-hidden ">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[200px] overflow-hidden lg:min-h-full">
                <Image
                  src={copy['enquire.image']}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-[center_22%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/88 via-scrim/35 to-transparent lg:bg-gradient-to-r" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                  <p className="font-display text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-[26px]">
                    {copy['enquire.title']}
                  </p>
                  <p className="mt-3 text-[14px] text-white/75">
                    {copy['enquire.note']}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <ExploreEnquiryForm centres={enquiryCentres} copy={copy} />
              </div>
            </div>
          </div>
        </Section>

      {/* ── About Jetking ─────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-about">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
            <div>
              <p className="k-eyebrow">
                {ABOUT_HERO.eyebrow}
              </p>
              <h2
                id="exp-about"
                className="section-title mt-2 font-display text-[var(--dc-ink)]"
              >
                {ABOUT_HERO.titleLead} {ABOUT_HERO.titleAccent}
              </h2>
              <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
                {ABOUT_HERO.lede}
              </p>
              <Link
                href={copy['about.cta.href'] as Route}
                className="tap mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
              >
                {copy['about.cta.label']}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PURPOSE.map((item) => (
                <div key={item.title} className="kit kit-card p-4">
                  <dt className="text-[13px] font-extrabold text-[var(--dc-ink)]">{item.title}</dt>
                  <dd className="mt-1.5 text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

      {/* ── Programmes (shared RecommendedCourses card design) ──────────── */}
      <RecommendedCourses
        tone="plain"
        courses={courses}
        headingId="exp-courses"
        title={copy['courses.title']}
        description={fill(copy['courses.description'], { courses: counts.courses, formats: levelGroups.length })}
      >
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8">
            <span className="text-[13px] font-bold text-[var(--k-ink-3)]">{copy['courses.browseLabel']}</span>
            {levelGroups.map((group) => {
              return (
                <Link
                  key={group.level}
                  href={copy['courses.formatHref'] as Route}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--k-line-strong)] bg-[var(--k-card)] px-3 py-1.5 text-[12.5px] font-bold text-[var(--k-ink-2)] transition-colors hover:border-[var(--k-red)] hover:text-[var(--k-red)]"
                >
                  {levelLabels[group.level]}
                  <span className="text-[var(--k-ink-3)]">{group.courses.length}</span>
                </Link>
              );
            })}
          </div>
      </RecommendedCourses>

      {/* ── Why Jetking + testimonial slider ─────────────────────────────── */}
      <Section tone="tint" deco="glow" labelledBy="exp-why">
          <div>
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="exp-why"
                  className="section-title font-display text-[var(--dc-ink)]"
                >
                  {copy['why.titleLead']}{' '}
                  <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span>
                </h2>

                <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-2">
                  {legacyStats(counts).map((stat) => (
                    <div key={stat.label}>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="block font-display text-[24px] leading-none font-extrabold text-[var(--dc-accent-soft)] sm:text-[28px]">
                          {stat.value}
                        </span>
                        <span className="mt-2 block text-[12.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[13.5px]">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-8 max-w-md text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
                  {PLACEMENT_DISCLAIMER}
                </p>
              </div>

              <ExploreTestimonialSlider testimonials={placements.testimonials} videos={placements.videoTestimonials} copy={copy} />
            </div>
          </div>
        </Section>

      {/* ── Awards & recognition ─────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-awards">
          <h2
            id="exp-awards"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {copy['awards.title']}
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ACHIEVEMENTS.slice(0, 4).map((item) => (
              <li key={item.title}>
                <article className="kit kit-card flex h-full flex-col items-center p-5 text-center">
                  <div className="relative h-24 w-full sm:h-28">
                    <Image
                      src={item.imageSrc}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 20vw, 40vw"
                      className="object-contain"
                    />
                  </div>
                  <h3 className="mt-4 text-[13px] leading-snug font-extrabold text-[var(--dc-ink)]">
                    {item.title}
                  </h3>
                </article>
              </li>
            ))}
          </ul>
        </Section>

      {/* ── 10 reasons why Jetking is every student's choice ─────────────── */}
      <Section tone="tint" labelledBy="exp-benefits">
          <h2
            id="exp-benefits"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {fill(copy['reasons.title'], { brand: siteConfig.name })}
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
            {REASONS.map((card, i) => (
              <li key={card.title} className="min-w-0">
                <article className="kit kit-card flex h-full flex-col gap-0 p-4 sm:rounded-[20px] sm:p-5">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--dc-accent-soft)]/40 bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] sm:h-11 sm:w-11"
                  >
                    <card.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-[14px] leading-snug font-extrabold text-[var(--dc-ink)] sm:mt-4 sm:text-[15px]">
                    {byKey[`reasons.${i}.title`]}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-snug text-[var(--dc-ink-muted)]">
                    {byKey[`reasons.${i}.detail`]}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </Section>

      {/* ── Collaboration with top universities & learning entities ──────── */}
      <Section tone="plain" labelledBy="exp-university-partners">
          <h2
            id="exp-university-partners"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {copy['universities.title']}
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {universityPartners.map((partner) => (
              <li key={partner.name}>
                <div className="kit kit-card flex h-full flex-col items-center gap-3 p-5 text-center">
                  <span className="relative h-16 w-full sm:h-20">
                    <Image src={partner.src} alt="" fill sizes="200px" className="object-contain" />
                  </span>
                  <span className="text-[12px] leading-snug font-semibold text-[var(--dc-ink-secondary)]">
                    {partner.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

      {/* ── Certifications & technology partners ─────────────────────────── */}
      <Section tone="tint" labelledBy="exp-certs">
          <h2
            id="exp-certs"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {copy['certs.title']}
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            {copy['certs.body']}
          </p>
          <ul className={`mt-7 ${LOGO_GRID}`}>
            {CERTIFICATIONS.map((name) => (
              <li key={name}>
                <LogoTile name={name} />
              </li>
            ))}
          </ul>
        </Section>

      {/* ── Where our alumni work ────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-alumni">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2
              id="exp-alumni"
              className="section-title font-display text-[var(--dc-ink)]"
            >
              {copy['alumni.title']}
            </h2>
            <Link
              href={copy['alumni.cta.href'] as Route}
              className="tap inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
            >
              {copy['alumni.cta.label']}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            {copy['alumni.body']}
          </p>
          <CollapsibleLogoGrid
            items={ALUMNI_COMPANIES}
            itemKey={(company) => company}
            render={(company) => <LogoTile name={company} />}
            showAll={copy['alumni.showAll']}
            showFewer={copy['common.showFewer']}
          />
          <p className="mt-7 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
            {PLACEMENT_DISCLAIMER}
          </p>
        </Section>

      {/* ── Our Placement Partners (individual logos; same list as jetking.com's collage) ───────── */}
      <Section tone="tint" labelledBy="exp-partners">
          <h2
            id="exp-partners"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {copy['partners.title']}
          </h2>
          <CollapsibleLogoGrid
            items={PLACEMENT_PARTNERS}
            itemKey={(partner) => partner.name}
            showAll={copy['partners.showAll']}
            showFewer={copy['common.showFewer']}
            render={(partner) => (
              <span className={`${LOGO_TILE} ${partner.dark ? 'bg-tile-dark' : 'bg-white'}`}>
                {partner.file ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small static logos; nothing for the image optimiser to do
                  <img src={partner.file} alt={partner.name} loading="lazy" className={LOGO_IMG} />
                ) : (
                  <span className={`text-center font-display text-[14px] leading-tight font-extrabold [overflow-wrap:anywhere] ${partner.dark ? 'text-white' : 'text-[#374151]'}`}>
                    {partner.name}
                  </span>
                )}
              </span>
            )}
          />
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
            {copy['partners.note']}
          </p>
        </Section>

      {/* ── Our Affiliation ───────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-affiliation">
          <h2
            id="exp-affiliation"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            {copy['affiliation.title']}
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {affiliations.map((item) => (
              <li key={item.name}>
                <div className="kit kit-card flex h-full flex-col items-center gap-3 p-5 text-center">
                  <span className="relative h-16 w-full sm:h-20">
                    <Image src={item.src} alt="" fill sizes="200px" className="object-contain" />
                  </span>
                  <span className="text-[12px] leading-snug font-semibold text-[var(--dc-ink-secondary)]">
                    {item.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

      {/* ── From the blog ────────────────────────────────────────────────── */}
      {posts.length > 0 ? (
        <Section tone="tint" labelledBy="exp-blog"><div className="blog-page relative">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                id="exp-blog"
                className="section-title font-display text-[var(--dc-ink)]"
              >
                {copy['blog.title']}
              </h2>
              <Link
                href={copy['blog.cta.href'] as Route}
                className="tap inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
              >
                {copy['blog.cta.label']}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>
            <ul className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {posts.map((post, i) => (
                <li key={post.slug}>
                  <PostCard post={post} badge={i === 0 ? 'latest' : undefined} />
                </li>
              ))}
            </ul>
          </div></Section>
      ) : null}

      {/* ── Locations + final CTA ────────────────────────────────────────── */}
      <Section tone="wash" deco="glow" labelledBy="exp-cta">
          <div className="kit kit-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
              >
                <MapPin className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2 id="exp-cta" className="section-title mt-4 text-[var(--dc-ink)]">
                {fill(copy['cta.title'], { centres: counts.centres, cities: counts.cities })}
              </h2>
              <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
                {copy['cta.body']}
              </p>
            </div>
            <div className="flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <Link
                href={copy['cta.centres.href'] as Route}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--dc-navy)] px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                {copy['cta.centres.label']}
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href={copy['cta.courses.href'] as Route}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] px-6 py-3.5 text-[14.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
              >
                {copy['cta.courses.label']}
              </Link>
            </div>
          </div>
        </Section>
    </div>
  );
}
