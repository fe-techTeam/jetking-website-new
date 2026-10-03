import Image from 'next/image';
import { Section } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronDown,
  Compass,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { Course, CourseLevel, Post } from '@/lib/content/types';
import { PLACEMENT_PARTNERS } from './partners';
import { siteConfig } from '@/lib/site';
import { ABOUT_HERO, ACHIEVEMENTS, PURPOSE } from '@/components/about/data';
import { legacyStats } from '@/lib/brand-facts';
import { PLACED_CANDIDATES, PLACEMENT_DISCLAIMER } from '@/components/placements/data';
import { RecommendedCourses } from '@/components/student/RecommendedCourses';
import { PostCard } from '@/components/blog/BlogCards';
import { brandMark } from '@/lib/course-logos';
import { ExploreTestimonialSlider } from './ExploreTestimonialSlider';
import { REASONS, UNIVERSITY_PARTNERS } from './content';
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

/** Real companies from Jetking's own published placement records — see placements/data.ts. */
const ALUMNI_COMPANIES = [...new Set(PLACED_CANDIDATES.map((c) => c.company))];

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
    label: 'Browse Freely',
    detail: 'No sign-up needed to look around',
    icon: Compass,
    className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]',
  },
  {
    label: 'Compare Paths',
    detail: 'Degrees, diplomas & short courses',
    icon: BookOpen,
    className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]',
  },
  {
    label: 'Visit a Centre',
    detail: 'Pan-India network near you',
    icon: MapPin,
    className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]',
  },
  {
    label: 'No Pressure',
    detail: 'Talk to us only when ready',
    icon: ShieldCheck,
    className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]',
  },
] as const;

/** "Our Affiliation" — real logos live on the jetking.com homepage (fetched 2026-08-21). */
const AFFILIATIONS = [
  { name: 'Skill India', src: '/affiliations/skill-india.png' },
  { name: 'NSDC', src: '/affiliations/nsdc.png' },
  { name: 'Red Hat', src: '/affiliations/red-hat.png' },
  { name: 'Delhi Capitals', src: '/affiliations/delhi-capitals.png' },
] as const;

const LEVEL_META: Record<CourseLevel, { label: string; blurb: string; icon: typeof GraduationCap }> = {
  degree: {
    label: 'Degree Courses',
    blurb: 'Multi-year BCA-style pathways combining a degree with an IT specialisation.',
    icon: GraduationCap,
  },
  diploma: {
    label: 'Diploma Courses',
    blurb: 'Structured, multi-month diplomas that go deep on one technology track.',
    icon: BookOpen,
  },
  certification: {
    label: 'Career Courses',
    blurb: 'Certification-focused courses built to get you job-ready faster.',
    icon: Award,
  },
  short: {
    label: 'Short Courses',
    blurb: 'Focused, shorter courses to pick up a specific in-demand skill.',
    icon: Zap,
  },
};

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
  noun,
}: {
  items: readonly T[];
  itemKey: (item: T) => string;
  render: (item: T) => React.ReactNode;
  noun: string;
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
            <span className="group-open:hidden">Show all {items.length} {noun}</span>
            <span className="hidden group-open:inline">Show fewer</span>
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
}: {
  enquiryCentres: LocatedCentre[];
  courses: Course[];
  counts: { courses: number; centres: number; cities: number };
  posts: Post[];
}) {
  const levelGroups = groupCoursesByLevel(courses);

  return (
    <div
      className={[
        'student-page relative overflow-hidden',
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
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--dc-accent-soft)]">
              Just Exploring? Welcome! <span aria-hidden="true">👋</span>
            </p>

            <h1 className="page-title-hero mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
              See everything <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span> has to offer
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
              No commitment needed. Browse courses, see why students and franchise
              partners choose {siteConfig.name}, and find a centre near you — at your own
              pace.
            </p>

            <div className="mt-7 flex flex-row flex-wrap items-center gap-2 sm:mt-8 sm:gap-4">
              <Link
                href={'/courses' as Route}
                className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--dc-accent)] py-2.5 pr-2.5 pl-4 text-[13px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
              >
                Explore courses
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5 sm:h-9 sm:w-9"
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href={'/centres' as Route}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border-2 border-[var(--dc-accent)] px-3.5 py-2 text-[13px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)] sm:min-h-12 sm:px-5 sm:py-3 sm:text-[15px]"
              >
                Find a centre
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
                  Centres in {counts.cities} cities
                </span>
              </div>
              <span className="hidden h-4 w-px bg-[var(--dc-hairline-strong)] sm:block" aria-hidden="true" />
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                <ShieldCheck
                  className="h-4 w-4 text-[var(--dc-accent-soft)]"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                No form, no pressure
              </span>
            </div>
          </div>

          <HeroOrbit
            src="/home/journey-explore-v2.jpg"
            alt="Visitor exploring the Jetking campus"
            items={ORBIT}
            imageClassName="object-cover object-[center_22%]"
          />
        </div>
      </section>

      {/* ── Quick enquiry (optional — no pressure) ───────────────────────── */}
      <Section tone="wash" deco="glow" id="enquire">
          <div className="kit kit-card overflow-hidden ">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[200px] overflow-hidden lg:min-h-full">
                <Image
                  src="/home/journey-explore-v2.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-[center_22%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/88 via-scrim/35 to-transparent lg:bg-gradient-to-r" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                  <p className="font-display text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-[26px]">
                    Have a specific question?
                  </p>
                  <p className="mt-3 text-[14px] text-white/75">
                    Leave a note and we&rsquo;ll get back — entirely optional.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <ExploreEnquiryForm centres={enquiryCentres} />
              </div>
            </div>
          </div>
        </Section>

      {/* ── About Jetking ─────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-about">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
            <div>
              <p className="text-[13px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
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
                href={'/about-us' as Route}
                className="tap mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
              >
                Read our story
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PURPOSE.map((item) => (
                <div key={item.title} className="kit kit-card p-4">
                  <dt className="text-[13px] font-extrabold text-[var(--dc-ink)]">{item.title}</dt>
                  <dd className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

      {/* ── Programmes (shared RecommendedCourses card design) ──────────── */}
      <div className="bg-[var(--dc-surface)]">
        <div className="shell pt-8 xs:pt-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-[var(--dc-ink-muted)]">Browse by format:</span>
            {levelGroups.map((group) => {
              const meta = LEVEL_META[group.level];
              return (
                <Link
                  key={group.level}
                  href={'/courses' as Route}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-3 py-1.5 text-[12.5px] font-bold text-[var(--dc-ink-secondary)] transition-colors hover:border-[var(--dc-accent-soft)] hover:text-[var(--dc-accent-soft)]"
                >
                  {meta.label}
                  <span className="text-[var(--dc-ink-muted)]">{group.courses.length}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <RecommendedCourses
          courses={courses}
          headingId="exp-courses"
          title="Courses to explore"
          description={`${counts.courses} courses across ${levelGroups.length} formats — tap a card to see full details.`}
        />
      </div>

      {/* ── Why Jetking + testimonial slider ─────────────────────────────── */}
      <Section tone="tint" deco="glow" labelledBy="exp-why">
          <div>
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="exp-why"
                  className="section-title font-display text-[var(--dc-ink)]"
                >
                  Why People Choose{' '}
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

                <p className="mt-8 max-w-md text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                  {PLACEMENT_DISCLAIMER}
                </p>
              </div>

              <ExploreTestimonialSlider />
            </div>
          </div>
        </Section>

      {/* ── Awards & recognition ─────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-awards">
          <h2
            id="exp-awards"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            Awards &amp; recognition
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
            10 reasons why {siteConfig.name} is every student&rsquo;s choice
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
            {REASONS.map((card) => (
              <li key={card.title} className="min-w-0">
                <article className="kit kit-card flex h-full flex-col gap-0 p-4 sm:rounded-[20px] sm:p-5">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--dc-accent-soft)]/40 bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] sm:h-11 sm:w-11"
                  >
                    <card.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-[14px] leading-snug font-extrabold text-[var(--dc-ink)] sm:mt-4 sm:text-[15px]">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--dc-ink-muted)] sm:text-[13px]">
                    {card.detail}
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
            Collaboration with top universities &amp; learning entities
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {UNIVERSITY_PARTNERS.map((partner) => (
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
            Certifications you can train towards
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            Industry-recognised technologies built into Jetking&rsquo;s curriculum.
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
              Where our alumni work
            </h2>
            <Link
              href={'/placements' as Route}
              className="tap inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
            >
              See placement records
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            Companies from Jetking&rsquo;s own published placement records.
          </p>
          <CollapsibleLogoGrid
            items={ALUMNI_COMPANIES}
            itemKey={(company) => company}
            render={(company) => <LogoTile name={company} />}
            noun="companies"
          />
          <p className="mt-7 max-w-2xl text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)]">
            {PLACEMENT_DISCLAIMER}
          </p>
        </Section>

      {/* ── Our Placement Partners (individual logos; same list as jetking.com's collage) ───────── */}
      <Section tone="tint" labelledBy="exp-partners">
          <h2
            id="exp-partners"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            Our Placement Partners
          </h2>
          <CollapsibleLogoGrid
            items={PLACEMENT_PARTNERS}
            itemKey={(partner) => partner.name}
            noun="partners"
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
          <p className="mt-4 max-w-2xl text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)]">
            Note: Placements are subject to recruitment norms. Jetking does not guarantee
            placements in the above organisations.
          </p>
        </Section>

      {/* ── Our Affiliation ───────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="exp-affiliation">
          <h2
            id="exp-affiliation"
            className="section-title font-display text-[var(--dc-ink)]"
          >
            Our Affiliation
          </h2>
          <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {AFFILIATIONS.map((item) => (
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
                From the blog
              </h2>
              <Link
                href={'/blog' as Route}
                className="tap inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--dc-accent-soft)]"
              >
                Read more
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
              <h2 id="exp-cta" className="subsection-title mt-4 text-[var(--dc-ink)]">
                {counts.centres} centres across {counts.cities} cities
              </h2>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                Not ready to talk to anyone yet? Just browse — every centre and every
                course is listed, no form required.
              </p>
            </div>
            <div className="flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <Link
                href={'/centres' as Route}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--dc-navy)] px-6 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                Browse centres
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href={'/courses' as Route}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] px-6 py-3.5 text-[14.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </Section>
    </div>
  );
}
