import {
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Handshake,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Course, Testimonial, TrustSignal } from '@/lib/content/types';
import { siteConfig } from '@/lib/site';
import { StudentJourney } from './journey/StudentJourney';
import { StudentTestimonialSlider } from './StudentTestimonialSlider';

const BENEFITS = [
  {
    title: 'Live Projects',
    detail: 'Build portfolio-ready work in guided labs, not slide decks.',
    icon: Sparkles,
  },
  {
    title: 'Expert Trainers',
    detail: 'Learn from faculty who teach what centres actually run.',
    icon: Users,
  },
  {
    title: 'Flexible Batches',
    detail: 'Weekday and weekend options so study fits your schedule.',
    icon: Clock3,
  },
  {
    title: '100% Support',
    detail: 'Counsellors guide courses, centres and next steps — no pressure.',
    icon: CheckCircle2,
  },
] as const;

function buildWhyStats(counts: {
  courses: number;
  centres: number;
  cities: number;
}): Array<{ icon: typeof Building2; value: string; label: string }> {
  return [
    { icon: Building2, value: '50+', label: 'Learning Centres' },
    { icon: ShieldCheck, value: 'Support', label: 'Placement Assistance' },
    { icon: Handshake, value: `${counts.cities}+`, label: 'Cities Across India' },
    { icon: Users, value: `${counts.courses}`, label: 'Courses On Offer' },
    { icon: Award, value: 'In Person', label: 'Labs & Assessment' },
  ];
}

export function StudentLanding({
  courses,
  counts,
  testimonials,
}: {
  courses: Course[];
  counts: { courses: number; centres: number; cities: number };
  trust: TrustSignal[];
  heroImage?: string;
  testimonials?: Testimonial[];
}) {
  const whyStats = buildWhyStats(counts);

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
        <StudentJourney courses={courses} counts={counts} />
      </div>

      {/* ── Why Jetking ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14" aria-labelledby="stu-why">
        <div className="shell">
          <div className="stu-why overflow-hidden rounded-[28px] px-6 py-10 text-[var(--stu-ink)] xs:rounded-[32px] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
              <div>
                <h2
                  id="stu-why"
                  className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:text-[28px] sm:text-[32px]"
                >
                  Why Students Choose{' '}
                  <span className="text-[var(--stu-accent-soft)]">{siteConfig.name}</span>
                </h2>

                <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-3">
                  {whyStats.map((stat) => (
                    <div key={stat.label} className="text-center sm:text-left lg:text-center">
                      <stat.icon
                        className="mx-auto h-6 w-6 text-[var(--stu-accent-soft)] sm:mx-0 lg:mx-auto"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="mt-2.5 block font-display text-[20px] leading-none font-extrabold sm:text-[22px]">
                          {stat.value}
                        </span>
                        <span className="mt-1.5 block text-[12.5px] leading-snug text-[var(--stu-ink-secondary)]">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <StudentTestimonialSlider testimonials={testimonials} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <section
        className="bg-[var(--stu-surface)] py-10 sm:py-12 lg:py-14"
        aria-labelledby="stu-benefits"
      >
        <div className="shell">
          <div className="grid gap-6 xs:gap-7 sm:gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6 xl:gap-x-10">
            <div className="max-w-xl lg:col-span-7 xl:col-span-8">
              <h2
                id="stu-benefits"
                className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:text-[26px] sm:text-[28px] lg:text-[30px]"
              >
                Student Benefits
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--stu-ink-muted)] sm:text-[15px]">
                What you get when you join a Jetking course.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 xs:gap-3.5 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:row-start-2 xl:col-span-8">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="min-w-0">
                  <article className="stu-card flex h-full gap-3.5 rounded-[18px] p-4 xs:gap-4 xs:rounded-[20px] xs:p-5 sm:flex-col sm:gap-0">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--stu-accent-soft)]/40 bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)] xs:h-11 xs:w-11 sm:h-12 sm:w-12"
                    >
                      <benefit.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 sm:mt-4">
                      <h3 className="text-[15px] font-extrabold text-[var(--stu-ink)] xs:text-[16px]">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-snug text-[var(--stu-ink-muted)] xs:mt-1.5 xs:text-[13.5px] sm:leading-relaxed">
                        {benefit.detail}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>

            <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-stretch xl:col-span-4">
              <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[22px] border border-[var(--stu-hairline)] bg-[var(--stu-card)] p-6 xs:rounded-[24px] xs:p-7 sm:rounded-[28px] sm:p-8 lg:p-7 xl:p-8">
                <span
                  aria-hidden="true"
                  className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)] shadow-[0_8px_20px_rgb(196_30_36/0.2)] xs:h-12 xs:w-12"
                >
                  <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <h2 className="relative mt-4 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:mt-5 xs:text-[24px] sm:text-[26px]">
                  Ready to start?
                </h2>
                <p className="relative mt-2.5 text-[14px] leading-relaxed text-[var(--stu-ink-secondary)] xs:mt-3 xs:text-[15px]">
                  Use the guided journey above — discover your path, get recommendations, and
                  book counselling when you&rsquo;re ready.
                </p>

                <a
                  href="#start-journey"
                  className="group/book relative mt-6 inline-flex w-full min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--stu-navy)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 xs:mt-7 xs:text-[15px]"
                >
                  <span>Start your career journey</span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
