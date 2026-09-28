'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Briefcase,
  Code2,
  GraduationCap,
  Headphones,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { track } from '@/lib/analytics';

const AVATARS = [
  '/student/avatar-1.png',
  '/student/avatar-2.png',
  '/student/avatar-3.png',
  '/student/avatar-4.png',
] as const;

const ORBIT = [
  {
    label: 'Learn',
    detail: 'Industry relevant skills',
    icon: GraduationCap,
    className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]',
  },
  {
    label: 'Practice',
    detail: 'Hands-on labs & projects',
    icon: Code2,
    className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]',
  },
  {
    label: 'Get Certified',
    detail: 'Industry-recognised certs',
    icon: Target,
    className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]',
  },
  {
    label: 'Get Placed',
    detail: 'Interview & placement support',
    icon: Briefcase,
    className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]',
  },
] as const;

export function StudentExploreHero({
  cities,
  onStartJourney,
}: {
  cities: number;
  onStartJourney: () => void;
}) {
  const phoneHref = siteConfig.phone ? `tel:${siteConfig.phone}` : undefined;

  return (
    <section className="shell relative pt-8 pb-6 xs:pt-10 sm:pt-12 lg:pt-14 lg:pb-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-60px] right-[8%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgb(232_36_43/0.22),transparent_68%)]"
      />

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-10">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stu-hairline)] bg-[var(--stu-accent-tint)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--stu-accent-soft)]">
            Welcome Future Tech Leader! <span aria-hidden="true">👋</span>
          </p>

          <h1 className="mt-5 font-display text-[36px] leading-[1.08] font-extrabold tracking-[-0.035em] text-[var(--stu-ink)] xs:text-[42px] sm:mt-6 sm:text-[48px] md:text-[52px] lg:text-[50px] xl:text-[58px]">
            Your Dream Career in Tech{' '}
            <span className="text-[var(--stu-accent-soft)]">Starts Now</span>
          </h1>

          <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.65] text-[var(--stu-ink-secondary)] xs:text-[16px] sm:mt-6">
            Explore courses, placement support and labs — then get a personalised career
            path when you&rsquo;re ready. No login required to browse.
          </p>

          <div className="mt-7 flex flex-row flex-wrap items-center gap-1.5 sm:mt-8 sm:gap-4">
            <Link
              href={'/courses' as Route}
              className="group/cta inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--stu-accent)] py-2.5 pr-2 pl-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
            >
              Explore Courses
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5 sm:h-9 sm:w-9"
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.25} />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                track('journey_start_clicked', { surface: 'student-hero' });
                onStartJourney();
              }}
              className="group/path inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-[var(--stu-accent)] bg-transparent px-3 py-2 text-[12.5px] font-bold text-[var(--stu-accent-soft)] transition-colors hover:bg-[var(--stu-accent-tint)] sm:min-h-12 sm:gap-2.5 sm:px-5 sm:py-3 sm:text-[15px]"
            >
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden="true" />
              Find my career path
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-10">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex -space-x-2.5">
                {AVATARS.map((src) => (
                  <span
                    key={src}
                    className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--stu-card)] shadow-sm"
                  >
                    <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ))}
              </span>
              <span className="text-[13.5px] font-semibold text-[var(--stu-ink-secondary)]">
                Learners across {cities}+ cities
              </span>
            </div>
            <span className="hidden h-4 w-px bg-[var(--stu-hairline)] sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--stu-ink-secondary)]">
              <ShieldCheck
                className="h-4 w-4 text-[var(--stu-accent-soft)]"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              Placement support included
            </span>
          </div>

          {phoneHref ? (
            <a
              href={phoneHref}
              className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--stu-ink-muted)] transition-colors hover:text-[var(--stu-accent-soft)]"
            >
              <Headphones className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Prefer to talk? Call a counsellor
            </a>
          ) : null}
        </div>

        <div className="stu-hero-glow relative mx-auto w-full max-w-[540px] lg:max-w-none">
          <div className="relative mx-auto aspect-square w-[min(100%,440px)] lg:w-full lg:max-w-[500px]">
            <div
              aria-hidden="true"
              className="stu-orbit-ring absolute inset-[10%] rounded-full"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[16%] rounded-full border border-dashed border-[rgb(232_36_43/0.28)]"
            />

            <div className="absolute inset-[20%] overflow-hidden rounded-full bg-[linear-gradient(160deg,var(--card),var(--surface-sunken),var(--card))] shadow-[0_28px_70px_rgb(0_0_0/0.55)]">
              <Image
                src="/student/hero.png"
                alt={`${siteConfig.name} student ready for a tech career`}
                fill
                priority
                sizes="(min-width: 1024px) 380px, 75vw"
                className="object-cover object-[center_18%]"
              />
            </div>

            {ORBIT.map((item) => (
              <div
                key={item.label}
                className={`stu-float absolute z-10 flex max-w-[158px] items-start gap-2.5 rounded-2xl p-3 sm:max-w-[172px] sm:p-3.5 ${item.className}`}
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)]"
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-[13px] font-extrabold text-[var(--stu-ink)]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-[var(--stu-ink-secondary)]">
                    {item.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
