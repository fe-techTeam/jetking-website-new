'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, ChevronDown, MapPin, Search } from 'lucide-react';
import type { City } from '@/lib/content/types';
import { centrePath } from '@/lib/centre-path';
import { CITY_COORDS, INDIA_MAP, projectPercent } from './india-map';

interface MapCentre {
  slug: string;
  name: string;
  citySlug: string;
  locality: string;
}

/** Cities directory link — matches `cityDirectoryPath()` in `src/app/centres/[city]/page.tsx`: there is no city landing page, so "all centres in {city}" is the directory pre-filtered by name. */
function cityHref(name: string): Route {
  return `/centres?q=${encodeURIComponent(name)}` as Route;
}

/**
 * India map with a pin per city that has a centre. Selecting a pin (or a city chip)
 * lists that city's centres, each linking to its own page. Pin positions come from
 * `CITY_COORDS` (the content model carries no coordinates); a city without an entry
 * there still appears in the chip list, just not on the map.
 */
export function CentreNetwork({
  cities,
  centres,
  counts,
}: {
  cities: City[];
  centres: MapCentre[];
  counts: { centres: number; cities: number };
}) {
  const groups = useMemo(() => {
    const byCity = new Map<string, MapCentre[]>();
    for (const c of centres) byCity.set(c.citySlug, [...(byCity.get(c.citySlug) ?? []), c]);
    return cities
      .filter((city) => byCity.has(city.slug))
      .map((city) => ({ city, centres: byCity.get(city.slug)! }))
      .sort((a, b) => b.centres.length - a.centres.length || a.city.name.localeCompare(b.city.name));
  }, [cities, centres]);

  const [selected, setSelected] = useState(groups[0]?.city.slug ?? '');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filtered = needle ? groups.filter((g) => g.city.name.toLowerCase().includes(needle)) : groups;
  const active = groups.find((g) => g.city.slug === selected) ?? groups[0];

  return (
    <section className="border-y border-[var(--dc-hairline)] bg-[var(--dc-surface)] py-12 sm:py-14 lg:py-16" aria-labelledby="home-centres-heading">
      <div className="shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="dc-eyebrow text-[13px] font-bold tracking-[0.06em] uppercase">Centre network</p>
            <h2
              id="home-centres-heading"
              className="dc-heading-glow mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[28px] sm:text-[32px]"
            >
              {counts.centres} centres across {counts.cities} cities
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              In-person classes and labs, not a remote-only course. Find a Jetking centre near you and start your journey today.
            </p>
          </div>
          <Link
            href={'/centres' as Route}
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
          >
            Find your centre
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Map */}
          <div
            className="relative mx-auto w-full max-w-[520px]"
            style={{ aspectRatio: `${INDIA_MAP.width} / ${INDIA_MAP.height}` }}
          >
            <svg
              viewBox={`0 0 ${INDIA_MAP.width} ${INDIA_MAP.height}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Map of India with pins for ${counts.centres} Jetking centres in ${counts.cities} cities`}
            >
              <path
                d={INDIA_MAP.path}
                fill="var(--dc-accent-tint)"
                stroke="var(--dc-accent-soft)"
                strokeOpacity="0.45"
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </svg>

            {groups.map(({ city, centres: list }) => {
              const coords = CITY_COORDS[city.slug];
              if (!coords) return null;
              const { left, top } = projectPercent(coords[0], coords[1]);
              const isActive = active?.city.slug === city.slug;
              return (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setSelected(city.slug)}
                  // Pointer-only duplicate of the city chips below (same choice, real buttons in the
                  // tab order), so it is hidden from AT and skipped by Tab — the map pins are too
                  // close together to be reliable 24px targets, the chips are.
                  aria-hidden="true"
                  tabIndex={-1}
                  title={`${city.name} (${list.length})`}
                  className="group absolute z-10 grid h-10 w-10 sm:h-6 sm:w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
                  style={{ left: `${left}%`, top: `${top}%`, zIndex: isActive ? 20 : 10 }}
                >
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute h-6 w-6 animate-ping rounded-full bg-[var(--dc-accent)] opacity-30 motion-reduce:animate-none"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={[
                      'relative grid place-items-center rounded-full border-2 border-white bg-[var(--dc-accent)] text-[12px] font-extrabold text-white shadow-[0_2px_6px_rgb(0_0_0/0.3)] transition-transform duration-200 group-hover:scale-125',
                      isActive ? 'h-5 w-5 scale-110' : list.length > 1 ? 'h-4 w-4' : 'h-3 w-3',
                    ].join(' ')}
                  >
                    {list.length > 1 && !isActive ? list.length : null}
                  </span>
                </button>
              );
            })}
          </div>

          {/* One card: search + city list on the left, the selected city's centres on the right */}
          <div className="min-w-0 rounded-[22px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] p-5 shadow-[var(--dc-shadow)] sm:p-6">
            <label htmlFor="home-city-search" className="font-display text-[18px] font-extrabold text-[var(--dc-ink)]">
              Find a centre near you
            </label>
            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                id="home-city-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, e.g. Mumbai"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] pr-3 pl-10 text-[14px] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--dc-accent-soft)]"
              />
            </div>

            {/* Mobile: a native picker (28 cities is a "find mine", not a "browse", list). sm+: the vertical list. */}
            <div className="relative mt-4 sm:hidden">
              <select
                value={filtered.some((g) => g.city.slug === selected) ? selected : ''}
                onChange={(e) => setSelected(e.target.value)}
                disabled={filtered.length === 0}
                aria-label="Choose a city"
                className="h-11 w-full appearance-none rounded-xl border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] pr-10 pl-3.5 text-[14px] font-semibold text-[var(--dc-ink)] focus-visible:outline-2 focus-visible:outline-[var(--dc-accent-soft)] disabled:text-[var(--dc-ink-muted)]"
              >
                {filtered.length === 0 ? (
                  <option value="">No centre found for &ldquo;{query}&rdquo;</option>
                ) : (
                  filtered.map(({ city, centres: list }) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name} ({list.length})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div className="mt-2 grid gap-5 sm:mt-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-6">
              <ul
                className="hidden sm:block sm:max-h-[340px] sm:overflow-x-hidden sm:overflow-y-auto sm:border-r sm:border-[var(--dc-hairline)] sm:pr-4"
                aria-label="Cities with a Jetking centre"
                // Scroll container: focusable so keyboard users can scroll it with the arrow keys.
                tabIndex={0}
              >
                {filtered.map(({ city, centres: list }) => {
                  const isActive = active?.city.slug === city.slug;
                  return (
                    <li key={city.slug} className="shrink-0 sm:shrink">
                      <button
                        type="button"
                        onClick={() => setSelected(city.slug)}
                        aria-pressed={isActive}
                        className={[
                          /* Mobile: a swipeable chip row (no nested vertical scroll to trap the page). sm+: the vertical list. */
                          'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-full border px-4 text-left text-[14px] font-semibold whitespace-nowrap transition-colors hover:text-[var(--dc-accent-soft)] sm:w-full sm:rounded-none sm:border-0 sm:border-b sm:border-[var(--dc-hairline)]/60 sm:px-1',
                          isActive
                            ? 'border-[var(--dc-accent-soft)] text-[var(--dc-accent-soft)]'
                            : 'border-[var(--dc-hairline-strong)] text-[var(--dc-ink)]',
                        ].join(' ')}
                      >
                        <span className="min-w-0 truncate">{city.name}</span>
                        <span className="shrink-0 text-[12px] font-normal text-[var(--dc-ink-muted)]">{list.length}</span>
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 ? (
                  <li className="py-3 text-[13px] text-[var(--dc-ink-muted)]">No centre found for &ldquo;{query}&rdquo;.</li>
                ) : null}
              </ul>

              {active ? (
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">{active.city.state}</p>
                      <h3 className="mt-1 font-display text-[22px] font-extrabold text-[var(--dc-ink)]">
                        {active.city.name}
                      </h3>
                    </div>
                    <span className="dc-chip px-3 py-1 text-[12px] uppercase">
                      {active.centres.length} {active.centres.length === 1 ? 'centre' : 'centres'}
                    </span>
                  </div>
                  <ul className="mt-3 border-t border-[var(--dc-hairline)]">
                    {active.centres.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={centrePath(c.slug) as Route}
                          className="group/row flex items-center justify-between gap-3 border-b border-[var(--dc-hairline)]/60 py-3 text-[14px]"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <MapPin
                              className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-[var(--dc-ink)]">{c.name}</span>
                              {c.locality ? (
                                <span className="block truncate text-[12.5px] text-[var(--dc-ink-muted)]">
                                  {c.locality}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)] transition-transform group-hover/row:translate-x-0.5"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={cityHref(active.city.name)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--dc-accent-soft)]"
                  >
                    All centres in {active.city.name}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>

            <Link
              href={'/centres' as Route}
              className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-[var(--dc-hairline-strong)] px-4 text-[13px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
            >
              View all {counts.centres} centres
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
