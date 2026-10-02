'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { HERO_FEATURES } from './data';

export function ProfessionalHero() {
  return (
    <div
      className={[
        'grid items-start gap-8',
        'xs:gap-9 sm:gap-10 md:gap-12',
        'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-8',
        'xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] xl:gap-8',
        '2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] 2xl:gap-10',
        '3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] 3xl:gap-12',
      ].join(' ')}
      role="group" aria-labelledby="pro-hero-heading"
    >
      <div className="flex flex-col justify-start">
        <p className="text-[12px] font-bold tracking-[0.16em] text-[var(--v2-eyebrow)] uppercase xs:text-[12px] sm:text-[13px] sm:tracking-[0.18em]">
          For Working Professionals
        </p>

        <h1
          id="pro-hero-heading"
          className={[
            'mt-4 font-display leading-[1.08] font-extrabold tracking-[-0.035em] text-[var(--v2-ink)]',
            'text-[36px] xs:mt-5 xs:text-[40px]',
            'sm:text-[44px] md:text-[48px]',
            'lg:mt-6 lg:text-[48px]',
            'xl:text-[52px]',
            '2xl:text-[58px]',
            '3xl:text-[62px] 4xl:text-[68px]',
          ].join(' ')}
        >
          Upgrade Your Career.
          <br />
          <span className="text-[var(--v2-accent)]">Double</span> Your
          <br />
          Impact.
        </h1>

        <p className="mt-5 max-w-[42ch] text-[15px] leading-[1.6] text-[var(--v2-ink-secondary)] xs:mt-6 xs:text-[15.5px] sm:text-[16px] lg:text-[17px] 3xl:text-[18px]">
          Industry-relevant skills. Hands-on learning.
          <br className="hidden sm:inline" /> Real career growth.
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 xs:mt-6 sm:gap-x-6">
          {HERO_FEATURES.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--v2-ink-secondary)] sm:text-[13px]"
            >
              <item.icon
                className="h-4 w-4 shrink-0 text-[var(--v2-accent-soft)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col items-start gap-5 xs:mt-7 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-5 lg:mt-8 2xl:mt-[34px]">
          <Link
            href={'/courses' as Route}
            className="v2-cta-glow group/explore inline-flex min-h-12 items-center gap-5 rounded-full py-3.5 pr-5 pl-6 text-[15px] font-bold text-white transition-[background-color,box-shadow] duration-200 sm:gap-6 sm:py-4 sm:pr-5.5 sm:pl-7 sm:text-[16px]"
          >
            Explore Courses
            <ArrowRight
              className="h-5 w-5 transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/explore:translate-x-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Link>
        </div>

        <Link
          href={'/enquiry' as Route}
          className="tap mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--v2-ink-muted)] transition-colors hover:text-[var(--v2-accent-soft)] sm:mt-6"
        >
          Book a free career upgrade session
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>

      <div className="v2-hero-stage relative flex flex-col items-center justify-start">
        <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[400px] xl:max-w-[420px] 2xl:max-w-[440px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-[var(--v2-hairline)] bg-[var(--v2-card)] shadow-media sm:rounded-[28px] lg:aspect-[5/6]">
            <Image
              src="/professional/hero.webp"
              alt={`${siteConfig.name} working professional upskilling for career growth`}
              fill
              priority
              sizes="(min-width: 1024px) 420px, 85vw"
              className="object-cover object-[center_18%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
