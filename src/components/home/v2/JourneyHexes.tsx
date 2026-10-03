'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePersona } from '@/persona/PersonaProvider';
import { track } from '@/lib/analytics';
import { cx } from '@/components/ui';
import { JOURNEYS } from '../journeys';

/**
 * Hex journey chooser — responsive:
 *   default → md  → row cards with environment thumb
 *   lg+           → large hexagons, single row of three
 *
 * v2 shows only three journeys (student, working professional, just
 * browsing) — the parent and franchise entries stay in the shared
 * JOURNEYS list (v1's JourneyChooser still uses all five) but are
 * filtered out here. "Just Exploring" is relabelled "Just Browsing"
 * for this lead only.
 */
const HOME_V2_JOURNEY_IDS = ['student', 'professional', 'exploring'];

const homeV2Journeys = JOURNEYS.filter((journey) => HOME_V2_JOURNEY_IDS.includes(journey.id)).map(
  (journey) => (journey.id === 'exploring' ? { ...journey, title: "I'm Just Browsing" } : journey),
);

const STAGGER = [
  'lg:mt-0',
  'lg:mt-2 xl:mt-2 2xl:mt-2.5',
  'lg:mt-0',
  /* Second row tucks into the first-row notches */
  'lg:-mt-8 xl:-mt-7 2xl:-mt-10 3xl:-mt-11',
  'lg:-mt-6 xl:-mt-5 2xl:-mt-8 3xl:-mt-9',
];

/** Grid placement: top row fills cols 1–6; bottom row centres under gaps. */
const GRID_PLACE = [
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2 lg:col-start-2',
  'lg:col-span-2 lg:col-start-4',
];

export function JourneyHexes() {
  const { override } = usePersona();

  return (
    <ul
      className={[
        'flex flex-col gap-3',
        /* One centred column of row cards up to lg — a 2-col grid orphaned the third card. */
        'sm:mx-auto sm:w-full sm:max-w-[560px]',
        'lg:mx-auto lg:grid lg:w-full lg:max-w-[min(100%,960px)] lg:grid-cols-6 lg:gap-x-3 lg:gap-y-0',
        /* Two-column band (1200–1535): tighter column gap buys the hexes a little more width. */
        'lg:gap-x-2',
        'xl:gap-x-2.5',
        '2xl:max-w-[min(100%,900px)] 2xl:gap-x-3',
        '3xl:max-w-[min(100%,960px)] 3xl:gap-x-3.5',
        '4xl:max-w-[min(100%,1024px)]',
      ].join(' ')}
    >
      {homeV2Journeys.map((journey, index) => {
        const ink = `var(--v2-${journey.hue}-ink)`;

        return (
          <li
            key={journey.id}
            className={cx('v2-hex-shell w-full', STAGGER[index], GRID_PLACE[index])}
          >
            <Link
              href={journey.href as Route}
              onClick={() => {
                if (journey.persona) override(journey.persona);
                track('adaptive_slot_rendered', {
                  slot_id: 'home-v2-journey',
                  persona: journey.persona ?? 'unknown',
                  strategy: 'emphasise',
                  journey: journey.id,
                });
              }}
              className={cx(
                'v2-card v2-card-interactive group/hex relative flex min-h-[88px] items-center gap-3.5 overflow-hidden rounded-[12px] p-3.5',
                'xs:min-h-[92px] xs:p-4',
                /* Hex from lg — square, capped, centred in its grid cell so
                   three always fit the stage column and never spill to 4+1. */
                'lg:mx-auto lg:aspect-square lg:h-auto lg:w-full lg:max-w-[240px] lg:flex-col lg:items-stretch lg:justify-end lg:gap-0 lg:rounded-none lg:bg-transparent lg:p-0',
                /* Label stays bottom-aligned (lg:justify-end) at every size. */
                /* Hexes stay full-size (240px) through the stacked lg/xl range so labels
                   never clip; they only shrink at 2xl where the two-column split begins. */
                '2xl:max-w-[280px]',
                '3xl:max-w-[300px]',
                '4xl:max-w-[320px]',
                'v2-hex',
                journey.hue === 'franchise' && 'v2-hex-warm',
              )}
              style={{ '--hex-ink': ink } as CSSProperties}
            >
              {/* Hex rim — sits above the photo so the border always reads */}
              <span aria-hidden="true" className="v2-hex-rim pointer-events-none absolute inset-0 z-[6] hidden lg:block" />

              <span
                aria-hidden="true"
                className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[12px] ring-2 ring-[var(--v2-accent)]/40 xs:h-[72px] xs:w-[72px] lg:absolute lg:inset-0 lg:h-auto lg:w-auto lg:rounded-none lg:ring-0"
              >
                <Image
                  src={journey.image}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(min-width: 1024px) 320px, 72px"
                  className="object-cover object-[center_22%] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover/hex:scale-105"
                />
              </span>

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden bg-linear-180 from-scrim/12 via-scrim/40 via-45% to-scrim/90 lg:block"
              />

              <span className="relative z-10 min-w-0 flex-1 lg:mt-auto lg:flex-none lg:px-5 lg:pt-8 lg:pb-5 lg:text-center lg:px-3 lg:pt-4 lg:pb-4 2xl:px-6 2xl:pt-8 2xl:pb-6">
                <span className="block text-[15px] leading-tight font-extrabold text-[color:var(--hex-ink)] xs:text-[15.5px] lg:text-[15px] lg:text-white lg:text-[12.5px] lg:leading-[1.15] 2xl:text-[16.5px] 2xl:leading-tight">
                  {journey.title}
                </span>
                {/* Sub-text shows at every size. In the compact band (1200–1535) the hex is
                    ~205px, so the detail steps down to 10.5px and tightens its spacing to sit
                    between the title and the arrow without crowding the rim. */}
                <span className="mt-1 block text-[12.5px] leading-snug text-[var(--v2-ink-muted)] xs:mt-1.5 lg:mt-1.5 lg:text-[12.5px] lg:text-white/80 lg:mt-0.5 lg:text-[12px] lg:leading-[1.25] 2xl:mt-1 2xl:text-[13.5px] 2xl:leading-snug">
                  {journey.detail}
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    /* Smaller in the compact 1200–1535 band so it fits with the label;
                       full size again from 2xl. */
                    'v2-hex-arrow mt-3 hidden h-9 w-9 place-items-center rounded-full lg:mx-auto lg:grid lg:mt-2 lg:h-7 lg:w-7 2xl:mt-3.5 2xl:h-10 2xl:w-10',
                    'border border-white/25 bg-white/10 text-white',
                    'transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-out-soft)]',
                    'group-hover/hex:translate-x-0.5 group-hover/hex:border-jk-500',
                    'group-hover/hex:bg-jk-600',
                  ].join(' ')}
                >
                  <ArrowRight className="h-4 w-4 2xl:h-[18px] 2xl:w-[18px]" strokeWidth={2.25} />
                </span>
              </span>

              <span
                aria-hidden="true"
                className={[
                  'v2-hex-arrow grid h-9 w-9 shrink-0 place-items-center rounded-full lg:hidden',
                  'border border-[color:var(--hex-ink)] text-[color:var(--hex-ink)]',
                  'transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)]',
                  'group-hover/hex:translate-x-0.5',
                ].join(' ')}
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

