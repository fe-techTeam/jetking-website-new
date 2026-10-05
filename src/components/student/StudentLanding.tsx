import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Clock3,
  FolderKanban,
  Headset,
  MapPin,
  Monitor,
  UserCheck,
} from 'lucide-react';
import type { Course, Testimonial, TrustSignal } from '@/lib/content/types';
import { siteConfig } from '@/lib/site';
import type { StudentCopy } from '@/lib/content/copy/pages/student';
import { FeatureCard, Section } from '@/components/kit';
import { StudentJourney } from './journey/StudentJourney';
import { StudentTestimonialSlider } from './StudentTestimonialSlider';

const BENEFIT_ICONS = [FolderKanban, UserCheck, Clock3, Headset] as const;

function buildWhyStats(
  counts: {
    courses: number;
    centres: number;
    cities: number;
  },
  copy: StudentCopy,
): Array<{ icon: typeof Building2; value: string; label: string }> {
  return [
    { icon: Building2, value: `${counts.centres}`, label: copy['why.stats.0.label'] },
    { icon: Briefcase, value: copy['why.stats.1.value'], label: copy['why.stats.1.label'] },
    { icon: MapPin, value: `${counts.cities}`, label: copy['why.stats.2.label'] },
    { icon: BookOpen, value: `${counts.courses}`, label: copy['why.stats.3.label'] },
    { icon: Monitor, value: copy['why.stats.4.value'], label: copy['why.stats.4.label'] },
  ];
}

export function StudentLanding({
  courses,
  counts,
  testimonials,
  copy,
}: {
  courses: Course[];
  counts: { courses: number; centres: number; cities: number };
  trust: TrustSignal[];
  heroImage?: string;
  testimonials?: Testimonial[];
  copy: StudentCopy;
}) {
  const whyStats = buildWhyStats(counts, copy);
  const benefits = BENEFIT_ICONS.map((icon, i) => ({
    icon,
    title: copy[`benefits.${i}.title` as keyof StudentCopy],
    detail: copy[`benefits.${i}.detail` as keyof StudentCopy],
  }));

  return (
    <div
      className={[
        'student-page relative overflow-hidden',
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
      <div id="student-journey">
        <StudentJourney courses={courses} counts={counts} copy={copy} />
      </div>

      {/* ── Why Jetking ───────────────────────────────────────────────────── */}
      <Section tone="tint" deco="glow" labelledBy="stu-why">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
          <div>
            <h2 id="stu-why" className="section-title text-[var(--k-ink)]">
              {copy['why.title']} <span className="text-[var(--k-red)]">{siteConfig.name}</span>
            </h2>

            {/* Wraps into as many rows as the width allows; each row's tiles grow to fill it. */}
            <dl className="mt-7 flex flex-wrap gap-3 sm:gap-4 lg:gap-3 xl:gap-4">
              {whyStats.map((stat) => (
                <div key={stat.label} className="kit kit-card @container min-w-0 flex-[1_1_136px] p-4">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="flex h-full flex-col items-start gap-3 @[200px]:flex-row @[200px]:items-center @[200px]:gap-3.5">
                    <span aria-hidden="true" className="kit-iconwell !h-10 !w-10">
                      <stat.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[20px] leading-none font-extrabold whitespace-nowrap text-[var(--k-ink)] sm:text-[22px]">
                        {stat.value}
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-snug text-[var(--k-ink-2)]">{stat.label}</span>
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <StudentTestimonialSlider testimonials={testimonials} copy={copy} />
        </div>
      </Section>

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="stu-benefits">
        <div className="grid gap-6 xs:gap-7 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6 xl:gap-x-10">
          <div className="max-w-xl lg:col-span-7 xl:col-span-8">
            <h2 id="stu-benefits" className="section-title text-[var(--k-ink)]">
              {copy['benefits.title']}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)]">{copy['benefits.body']}</p>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:row-start-2 xl:col-span-8">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="min-w-0">
                <FeatureCard icon={benefit.icon} title={benefit.title} compact>
                  {benefit.detail}
                </FeatureCard>
              </li>
            ))}
          </ul>

          <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-stretch xl:col-span-4">
            <div className="kit kit-card relative flex h-full flex-col justify-center overflow-hidden border-[color-mix(in_srgb,var(--k-red-fill)_16%,transparent)] bg-[var(--k-red-wash)] p-6 sm:p-8 lg:p-7 xl:p-8">
              <span aria-hidden="true" className="kit-iconwell bg-[var(--k-bg)]">
                <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
              </span>

              <h2 className="subsection-title mt-4 text-[var(--k-ink)]">{copy['cta.title']}</h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--k-ink-2)]">
                {copy['cta.body']}
              </p>

              <a
                href={copy['cta.href']}
                className="group/book mt-6 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-[var(--k-red-fill)] py-3 pr-3 pl-5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
              >
                <span>{copy['cta.label']}</span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--k-red)] transition-transform duration-200 group-hover/book:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
