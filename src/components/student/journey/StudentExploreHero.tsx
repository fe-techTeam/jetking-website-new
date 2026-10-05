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
import { fill } from '@/lib/content/copy/define';
import type { StudentCopy } from '@/lib/content/copy/pages/student';
import { track } from '@/lib/analytics';
import { HeroOrbit, type OrbitItem } from '@/components/HeroOrbit';

const ORBIT_SLOTS = [
  {
    icon: GraduationCap,
    className: 'top-[6%] left-0 sm:left-[-4%] lg:left-[-8%]',
  },
  {
    icon: Code2,
    className: 'top-[4%] right-0 sm:right-[-2%] lg:right-[-6%]',
  },
  {
    icon: Target,
    className: 'bottom-[10%] left-0 sm:left-[-2%] lg:left-[-10%]',
  },
  {
    icon: Briefcase,
    className: 'bottom-[8%] right-0 sm:right-[-2%] lg:right-[-8%]',
  },
] as const;

export function StudentExploreHero({
  cities,
  onStartJourney,
  copy,
}: {
  cities: number;
  onStartJourney: () => void;
  copy: StudentCopy;
}) {
  const phoneHref = siteConfig.phone ? `tel:${siteConfig.phone}` : undefined;
  const avatars = [
    copy['hero.avatar.0'],
    copy['hero.avatar.1'],
    copy['hero.avatar.2'],
    copy['hero.avatar.3'],
  ];
  const orbit = [
    { label: copy['orbit.0.label'], detail: copy['orbit.0.detail'], ...ORBIT_SLOTS[0] },
    { label: copy['orbit.1.label'], detail: copy['orbit.1.detail'], ...ORBIT_SLOTS[1] },
    { label: copy['orbit.2.label'], detail: copy['orbit.2.detail'], ...ORBIT_SLOTS[2] },
    { label: copy['orbit.3.label'], detail: copy['orbit.3.detail'], ...ORBIT_SLOTS[3] },
  ] satisfies readonly OrbitItem[];

  return (
    <section className="shell relative pt-8 pb-6 xs:pt-10 sm:pt-12 lg:pt-14 lg:pb-8">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-10">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]">
            {copy['hero.eyebrow']} <span aria-hidden="true">👋</span>
          </p>

          <h1 className="page-title-hero mt-5 font-display text-[var(--dc-ink)] sm:mt-6">
            {copy['hero.title']}{' '}
            <span className="text-[var(--dc-accent-soft)]">{copy['hero.titleAccent']}</span>
          </h1>

          <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[16px] sm:mt-6">
            {copy['hero.body']}
          </p>

          <div className="mt-7 flex flex-row flex-wrap items-center gap-1.5 sm:mt-8 sm:gap-4">
            <Link
              href={copy['hero.cta.href'] as Route}
              className="group/cta inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--dc-accent)] py-2.5 pr-2 pl-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-jk-700 sm:min-h-12 sm:gap-3 sm:py-3 sm:pr-3 sm:pl-6 sm:text-[15px]"
            >
              {copy['hero.cta.label']}
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
              className="group/path inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-[var(--dc-accent)] bg-transparent px-3 py-2 text-[12.5px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)] sm:min-h-12 sm:gap-2.5 sm:px-5 sm:py-3 sm:text-[15px]"
            >
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden="true" />
              {copy['hero.pathCta.label']}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-10">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex -space-x-2.5">
                {avatars.map((src) => (
                  <span
                    key={src}
                    className="relative h-9 w-9 overflow-hidden rounded-full border-[2.5px] border-[var(--dc-card)] shadow-sm"
                  >
                    <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ))}
              </span>
              <span className="text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
                {fill(copy['hero.cities'], { cities })}
              </span>
            </div>
            <span className="hidden h-4 w-px bg-[var(--dc-hairline-strong)] sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--dc-ink-secondary)]">
              <ShieldCheck
                className="h-4 w-4 text-[var(--dc-accent-soft)]"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              {copy['hero.trust']}
            </span>
          </div>

          {phoneHref ? (
            <a
              href={phoneHref}
              className="tap mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-muted)] transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              <Headphones className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {copy['hero.call']}
            </a>
          ) : null}
        </div>

        <HeroOrbit
          src={copy['hero.image']}
          alt={fill(copy['hero.imageAlt'], { siteName: siteConfig.name })}
          items={orbit}
          imageClassName="object-cover object-[center_18%]"
        />
      </div>
    </section>
  );
}
