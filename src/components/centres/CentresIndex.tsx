'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building2, ChevronDown, Map as MapIcon, MapPin, Phone, Search, X } from 'lucide-react';
import { track } from '@/lib/analytics';
import { centrePath } from '@/lib/centre-path';
import { usePersona } from '@/persona/PersonaProvider';
import { ActiveFilterChips, FilterSheet, SheetChip, SheetFacet } from '@/components/FilterSheet';
import { subscribeCentresSearch } from './CentresHeroSearch';

type CitySummary = { slug: string; name: string; state: string };
type CentreSummary = {
  slug: string;
  name: string;
  citySlug: string;
  addressLine: string;
  locality: string;
  state: string;
  pincode: string;
  phone?: string;
};

function matchesCity(city: CitySummary, needle: string): boolean {
  if (!needle) return true;
  return (
    city.name.toLowerCase().includes(needle) ||
    city.state.toLowerCase().includes(needle) ||
    city.slug.includes(needle)
  );
}

function matchesCentre(centre: CentreSummary, needle: string): boolean {
  if (!needle) return true;
  return (
    centre.name.toLowerCase().includes(needle) ||
    centre.locality.toLowerCase().includes(needle) ||
    centre.addressLine.toLowerCase().includes(needle) ||
    centre.pincode.includes(needle) ||
    centre.slug.includes(needle) ||
    (centre.phone?.toLowerCase().includes(needle) ?? false)
  );
}

function cityMatchesFilters(
  city: CitySummary,
  cityCentres: CentreSummary[],
  needle: string,
  activeState: string | null,
  activeCity: string | null,
): boolean {
  if (activeCity && city.slug !== activeCity) return false;
  if (activeState && city.state !== activeState) return false;
  if (!needle) return true;
  if (matchesCity(city, needle)) return true;
  return cityCentres.some((c) => matchesCentre(c, needle));
}

/**
 * Centres index — left filter sidebar + right results with full centre details.
 *
 * Search and sidebar filters only toggle `hidden` on already-rendered cards.
 * Every city and centre stays in the HTML for crawlers.
 */
export function CentresIndex({
  cities,
  centres,
  initialQuery = '',
}: {
  cities: CitySummary[];
  centres: CentreSummary[];
  initialQuery?: string;
}) {
  const inputId = useId();
  const { classification, hydrated } = usePersona();
  const [query, setQuery] = useState(initialQuery);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const trackedRef = useRef('');

  /*
   * The sidebar's State and City facet lists are accordions at every width —
   * up to 28 cities has no business sitting fully expanded by default, phone
   * or desktop. Closed until the visitor opens one, and mutually exclusive —
   * opening one closes the other, so the sidebar never shows both long lists
   * stacked at once.
   */
  const [openFacet, setOpenFacet] = useState<'state' | 'city' | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const states = useMemo(() => {
    const map = new Map<string, number>();
    for (const city of cities) {
      const count = centres.filter((c) => c.citySlug === city.slug).length;
      map.set(city.state, (map.get(city.state) ?? 0) + count);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [cities, centres]);

  // Results are grouped State > City — same shape as the sidebar facets, so
  // browsing the whole country reads as one hierarchy instead of two.
  const citiesByState = useMemo(() => {
    const byState = new Map<string, CitySummary[]>();
    for (const city of cities) {
      const list = byState.get(city.state);
      if (list) list.push(city);
      else byState.set(city.state, [city]);
    }
    return states.map(([state, count]) => ({
      state,
      count,
      cities: (byState.get(state) ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [cities, states]);

  /*
   * The results list itself is grouped State > City, each level its own
   * accordion (keyed by name/slug, not a single bool — many groups, each
   * independently toggled). The first state opens by default, and the first
   * city within it too, so a first-time visitor immediately sees a real,
   * fully-expanded centre card rather than a wall of collapsed rows; every
   * other group stays closed until touched, or forced open the moment a
   * filter or search actually matches it.
   */
  const [openResultStates, setOpenResultStates] = useState<
    Record<string, boolean>
  >(() => (states[0] ? { [states[0][0]]: true } : {}));
  const [openResultCities, setOpenResultCities] = useState<
    Record<string, boolean>
  >(() => {
    const firstCity = citiesByState[0]?.cities[0];
    return firstCity ? { [firstCity.slug]: true } : {};
  });

  /*
   * On desktop the sidebar's own first facet group (State) opens by default
   * too — same treatment as the course explorer's "Level" group — since
   * `window.innerWidth` doesn't exist during SSR, this is a one-time
   * post-hydration read, not a synchronisation loop.
   */
  /* eslint-disable react-hooks/set-state-in-effect --
     one-time post-hydration read, not a synchronisation loop */
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) setOpenFacet('state');
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    const next = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [query, hydrated]);

  useEffect(() => subscribeCentresSearch((next) => setQuery(next)), []);

  const needle = query.trim().toLowerCase();

  const sidebarCities = useMemo(() => {
    return cities.filter((city) => {
      if (activeState && city.state !== activeState) return false;
      const cityCentres = centres.filter((c) => c.citySlug === city.slug);
      if (!needle) return true;
      return (
        matchesCity(city, needle) ||
        cityCentres.some((c) => matchesCentre(c, needle))
      );
    });
  }, [cities, centres, activeState, needle]);

  // Facet counts follow the search text, so "Maharashtra 12" never sits beside 1 result.
  const matchCountByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const city of cities) {
      const cityCentres = centres.filter((c) => c.citySlug === city.slug);
      const count =
        !needle || matchesCity(city, needle)
          ? cityCentres.length
          : cityCentres.filter((c) => matchesCentre(c, needle)).length;
      map.set(city.slug, count);
    }
    return map;
  }, [cities, centres, needle]);

  const matchCountByState = useMemo(() => {
    const map = new Map<string, number>();
    for (const city of cities) {
      map.set(city.state, (map.get(city.state) ?? 0) + (matchCountByCity.get(city.slug) ?? 0));
    }
    return map;
  }, [cities, matchCountByCity]);

  const matchCountAll = useMemo(
    () => [...matchCountByState.values()].reduce((a, b) => a + b, 0),
    [matchCountByState],
  );

  const visibleCentreCount = useMemo(() => {
    return cities.reduce((total, city) => {
      const cityCentres = centres.filter((c) => c.citySlug === city.slug);
      if (
        !cityMatchesFilters(city, cityCentres, needle, activeState, activeCity)
      )
        return total;
      return (
        total +
        cityCentres.filter(
          (c) =>
            !needle || matchesCentre(c, needle) || matchesCity(city, needle),
        ).length
      );
    }, 0);
  }, [cities, centres, needle, activeState, activeCity]);

  function onSearchChange(value: string) {
    setQuery(value);
    const trimmed = value.trim();
    if (trimmed.length >= 2 && trimmed !== trackedRef.current) {
      trackedRef.current = trimmed;
      track('centre_searched', {
        query: trimmed,
        persona: classification.persona,
      });
    }
  }

  function clearFilters() {
    setActiveState(null);
    setActiveCity(null);
    onSearchChange('');
  }

  const hasActiveFilters = Boolean(activeState || activeCity || needle);

  return (
    <section
      id="centres-index"
      className="shell scroll-mt-24 pt-4 pb-14 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20"
      aria-labelledby="centres-index-heading"
    >
      <div className="max-w-2xl">
        <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-ink-muted)] uppercase">
          Browse by city
        </p>
        <h2
          id="centres-index-heading"
          className="section-title mt-2 font-display text-[var(--dc-ink)]"
        >
          Centres across India
        </h2>
      </div>

      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-12">
        {/* ── Left: filters ─────────────────────────────────────────────── */}
        <div
          role="group"
          className="centres-card hidden flex-col self-start rounded-[20px] xs:rounded-[24px] lg:flex lg:sticky lg:top-[6.5rem] lg:z-[2] lg:max-h-[calc(100vh-7.5rem)] xl:top-28"
          aria-label="Filter centres"
        >
          {/* Pinned: title + search always visible while lists scroll */}
          <div className="centres-filter-sticky shrink-0 rounded-t-[20px] border-b border-[var(--dc-accent-soft)]/18 p-5 xs:rounded-t-[24px] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-ink-muted)] uppercase">
                Filters
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="-my-2 inline-block cursor-pointer py-2 text-[12px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:text-[var(--dc-ink)]"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <label htmlFor={inputId} className="relative mt-5 block">
              <span className="sr-only">Search centres</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search cities, states..."
                autoComplete="off"
                className="centres-sidebar-search-input w-full rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] py-2.5 pr-10 pl-10 text-[13.5px] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--dc-accent-soft)]/70 focus:ring-3 focus:ring-[var(--dc-accent-soft)]/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2.5 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--dc-ink-muted)] transition-colors hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-ink)]"
                >
                  <X
                    className="h-3.5 w-3.5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </label>
          </div>

          {/* Scrollable: state + city lists */}
          <div className="centres-filter-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <FilterGroup
              label="State"
              icon={MapIcon}
              value={activeState}
              open={openFacet === 'state'}
              onToggle={() =>
                setOpenFacet((v) => (v === 'state' ? null : 'state'))
              }
            >
              <li>
                <FilterButton
                  active={!activeState}
                  onClick={() => {
                    setActiveState(null);
                    setActiveCity(null);
                  }}
                  label="All states"
                  count={matchCountAll}
                />
              </li>
              {states.map(([state]) => (
                <li key={state}>
                  <FilterButton
                    active={activeState === state}
                    onClick={() => {
                      setActiveState(state);
                      setActiveCity(null);
                    }}
                    label={state}
                    count={matchCountByState.get(state) ?? 0}
                  />
                </li>
              ))}
            </FilterGroup>

            <FilterGroup
              label="City"
              icon={Building2}
              value={activeCity ? (cities.find((c) => c.slug === activeCity)?.name ?? null) : null}
              className="mt-4"
              open={openFacet === 'city'}
              onToggle={() =>
                setOpenFacet((v) => (v === 'city' ? null : 'city'))
              }
            >
              <li>
                <FilterButton
                  active={!activeCity}
                  onClick={() => setActiveCity(null)}
                  label="All cities"
                  count={
                    activeState
                      ? (matchCountByState.get(activeState) ?? 0)
                      : matchCountAll
                  }
                />
              </li>
              {sidebarCities.map((city) => {
                const cityCount = matchCountByCity.get(city.slug) ?? 0;
                return (
                  <li key={city.slug}>
                    <FilterButton
                      active={activeCity === city.slug}
                      onClick={() => setActiveCity(city.slug)}
                      label={city.name}
                      count={cityCount}
                      icon={MapPin}
                    />
                  </li>
                );
              })}
            </FilterGroup>
          </div>
        </div>

        {/* ── Right: full centre details ─────────────────────────────────── */}
        <div className="min-w-0">
          {/* Below lg the sidebar collapses into this toolbar + a bottom sheet. */}
          <div className="mb-5 lg:hidden">
            <div className="flex gap-2.5">
              <label htmlFor={`${inputId}-m`} className="relative block min-w-0 flex-1">
                <span className="sr-only">Search centres</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                <input
                  id={`${inputId}-m`}
                  type="search"
                  value={query}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search cities, states..."
                  autoComplete="off"
                  enterKeyHint="search"
                  className="centres-sidebar-search-input h-11 w-full rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] pr-11 pl-10 text-[14px] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--dc-accent-soft)]/70 focus:ring-3 focus:ring-[var(--dc-accent-soft)]/20"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-0 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[var(--dc-ink-muted)] hover:text-[var(--dc-ink)]"
                  >
                    <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <FilterSheet
                title="Filter centres"
                activeCount={(activeState ? 1 : 0) + (activeCity ? 1 : 0)}
                resultLabel={`Show ${visibleCentreCount} ${visibleCentreCount === 1 ? 'centre' : 'centres'}`}
                canClear={hasActiveFilters}
                onClear={clearFilters}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
              >
                <SheetFacet label="State">
                  <SheetChip
                    active={!activeState}
                    onClick={() => {
                      setActiveState(null);
                      setActiveCity(null);
                    }}
                    label="All states"
                    count={matchCountAll}
                  />
                  {states.map(([state]) => (
                    <SheetChip
                      key={state}
                      active={activeState === state}
                      onClick={() => {
                        setActiveState(state);
                        setActiveCity(null);
                      }}
                      label={state}
                      count={matchCountByState.get(state) ?? 0}
                    />
                  ))}
                </SheetFacet>
                <SheetFacet label={activeState ? `City in ${activeState}` : 'City'}>
                  <SheetChip
                    active={!activeCity}
                    onClick={() => setActiveCity(null)}
                    label="All cities"
                    count={activeState ? (matchCountByState.get(activeState) ?? 0) : matchCountAll}
                  />
                  {sidebarCities.map((city) => (
                    <SheetChip
                      key={city.slug}
                      active={activeCity === city.slug}
                      onClick={() => setActiveCity(city.slug)}
                      label={city.name}
                      count={matchCountByCity.get(city.slug) ?? 0}
                    />
                  ))}
                </SheetFacet>
              </FilterSheet>
            </div>

            <ActiveFilterChips
              items={[
                ...(activeState
                  ? [
                      {
                        key: 'state',
                        label: activeState,
                        onRemove: () => {
                          setActiveState(null);
                          setActiveCity(null);
                        },
                      },
                    ]
                  : []),
                ...(activeCity
                  ? [
                      {
                        key: 'city',
                        label: cities.find((c) => c.slug === activeCity)?.name ?? activeCity,
                        onRemove: () => setActiveCity(null),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p
              aria-live="polite"
              className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--dc-ink-muted)] uppercase"
            >
              {visibleCentreCount}{' '}
              {visibleCentreCount === 1 ? 'centre' : 'centres'}
              {hasActiveFilters ? ' matching' : null}
            </p>
            {activeCity ? (
              <p className="text-[14px] text-[var(--dc-ink-secondary)]">
                Showing{' '}
                <span className="font-bold text-[var(--dc-ink)]">
                  {cities.find((c) => c.slug === activeCity)?.name}
                </span>
              </p>
            ) : activeState ? (
              <p className="text-[14px] text-[var(--dc-ink-secondary)]">
                Showing{' '}
                <span className="font-bold text-[var(--dc-ink)]">
                  {activeState}
                </span>
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-4 sm:mt-6">
            {citiesByState.map(({ state, cities: stateCities }) => {
              const count = matchCountByState.get(state) ?? 0;
              const stateVisible = stateCities.some((city) => {
                const cityCentres = centres.filter(
                  (c) => c.citySlug === city.slug,
                );
                return cityMatchesFilters(
                  city,
                  cityCentres,
                  needle,
                  activeState,
                  activeCity,
                );
              });
              const stateOpen =
                hasActiveFilters || Boolean(openResultStates[state]);

              return (
                <div
                  key={state}
                  className={`centres-accordion centres-card scroll-mt-28 rounded-[16px]${stateVisible ? '' : ' hidden'}`}
                  data-open={stateOpen}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenResultStates((prev) => ({
                        ...prev,
                        [state]: !prev[state],
                      }))
                    }
                    aria-expanded={stateOpen}
                    aria-controls={`state-panel-${state}`}
                    className="centres-accordion-trigger px-5 py-4 sm:px-6"
                  >
                    <span className="min-w-0 text-left">
                      <span className="block font-display text-[19px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[21px]">
                        {state}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
                        {count} {count === 1 ? 'centre' : 'centres'}
                      </span>
                    </span>
                    <ChevronDown
                      className="centres-accordion-chevron h-5 w-5"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`state-panel-${state}`}
                    className="centres-accordion-panel"
                  >
                    <div
                      className={
                        stateOpen
                          ? 'divide-y divide-[var(--dc-hairline-strong)] border-t border-[var(--dc-hairline-strong)]'
                          : 'divide-y divide-[var(--dc-hairline-strong)]'
                      }
                    >
                      {stateCities.length === 1 ? (
                        // A state with exactly one city has nothing to group by — a
                        // city-level accordion here would just repeat the state name
                        // right back at the visitor (e.g. "Delhi" state containing a
                        // single "Delhi" city row). Skip straight to its centres.
                        <ul
                          className={
                            stateOpen
                              ? 'divide-y divide-[var(--dc-hairline-strong)]'
                              : ''
                          }
                        >
                          {centres
                            .filter((c) => c.citySlug === stateCities[0]!.slug)
                            .map((centre) => (
                              <CentreCard
                                key={centre.slug}
                                centre={centre}
                                city={stateCities[0]!}
                                needle={needle}
                              />
                            ))}
                        </ul>
                      ) : (
                        stateCities.map((city) => {
                          const cityCentres = centres.filter(
                            (c) => c.citySlug === city.slug,
                          );
                          const cityVisible = cityMatchesFilters(
                            city,
                            cityCentres,
                            needle,
                            activeState,
                            activeCity,
                          );
                          const cityOpen =
                            hasActiveFilters ||
                            Boolean(openResultCities[city.slug]);

                          return (
                            <div
                              key={city.slug}
                              id={`city-${city.slug}`}
                              className={`centres-accordion scroll-mt-28${cityVisible ? '' : ' hidden'}`}
                              data-open={cityOpen}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenResultCities((prev) => ({
                                    ...prev,
                                    [city.slug]: !prev[city.slug],
                                  }))
                                }
                                aria-expanded={cityOpen}
                                aria-controls={`city-panel-${city.slug}`}
                                className="centres-accordion-trigger px-5 py-4 sm:px-6"
                              >
                                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                  <span
                                    id={`city-heading-${city.slug}`}
                                    className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[17px]"
                                  >
                                    {city.name}
                                  </span>
                                  <span className="text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
                                    {matchCountByCity.get(city.slug) ?? 0}{' '}
                                    {matchCountByCity.get(city.slug) === 1
                                      ? 'centre'
                                      : 'centres'}
                                  </span>
                                </span>
                                <ChevronDown
                                  className="centres-accordion-chevron h-4 w-4"
                                  strokeWidth={2.25}
                                  aria-hidden="true"
                                />
                              </button>

                              <div
                                id={`city-panel-${city.slug}`}
                                className="centres-accordion-panel"
                              >
                                <ul
                                  className={
                                    cityOpen
                                      ? 'divide-y divide-[var(--dc-hairline-strong)] border-t border-[var(--dc-hairline-strong)]'
                                      : 'divide-y divide-[var(--dc-hairline-strong)]'
                                  }
                                >
                                  {cityCentres.map((centre) => (
                                    <CentreCard
                                      key={centre.slug}
                                      centre={centre}
                                      city={city}
                                      needle={needle}
                                    />
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCentreCount === 0 ? (
            <div className="centres-card mt-5 rounded-[20px] px-6 py-12 text-center sm:px-8">
              <p className="font-display text-[18px] font-extrabold text-[var(--dc-ink)]">
                No centres match your filters
              </p>
              <p className="mt-2 text-[14px] text-[var(--dc-ink-secondary)]">
                Try a different city, state, or search term.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="-my-2 mt-5 inline-block cursor-pointer py-2 text-[14px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:text-[var(--dc-ink)]"
              >
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CentreCard({
  centre,
  city,
  needle,
}: {
  centre: CentreSummary;
  city: CitySummary;
  needle: string;
}) {
  const centreVisible =
    !needle || matchesCentre(centre, needle) || matchesCity(city, needle);
  const telHref = centre.phone
    ? `tel:${centre.phone.replace(/[^\d+]/g, '').split('/')[0]}`
    : null;
  // A few centres (Balasore, Orai) sit in a city of the same name — collapse
  // "Balasore, Balasore" down to the one distinct value.
  const localityCityLabel =
    centre.locality.trim().toLowerCase() === city.name.trim().toLowerCase()
      ? city.name
      : `${centre.locality}, ${city.name}`;

  return (
    <li
      id={`centre-${centre.slug}`}
      className={
        centreVisible ? 'flex scroll-mt-28 flex-col p-5 xs:p-6' : 'hidden'
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-4 sm:gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[18px] lg:text-[20px]">
            <Link
              href={centrePath(centre.slug) as Route}
              className="transition-colors hover:text-[var(--dc-accent-soft)]"
            >
              {centre.name}
            </Link>
          </h3>
          <p className="mt-1 text-[14px] font-semibold text-[var(--dc-accent-soft)]">
            {localityCityLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={centrePath(centre.slug) as Route}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--dc-hairline-strong)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]/60 hover:bg-[var(--dc-accent-tint)] sm:px-4 sm:text-[13px]"
          >
            View details
          </Link>
          <Link
            href={`/enquiry?centre=${centre.slug}` as Route}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--dc-accent)] px-3.5 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-jk-700 sm:px-4 sm:text-[13px]"
          >
            Enquire
          </Link>
        </div>
      </div>

      <address className="mt-4 flex-1 text-[13.5px] leading-relaxed text-[var(--dc-ink-secondary)] not-italic sm:text-[14px]">
        {centre.addressLine}
        <br />
        {localityCityLabel}
        <br />
        {centre.state} {centre.pincode}
      </address>

      {centre.phone ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
          <Phone
            className="h-3.5 w-3.5 text-[var(--dc-accent-soft)]"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="text-[12px] font-bold tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
            Phone
          </span>
          {telHref ? (
            <a
              href={telHref}
              className="tap numeral font-semibold text-[var(--dc-ink)] transition-colors hover:text-[var(--dc-accent-soft)]"
              onClick={() =>
                track('phone_clicked', { centre_slug: centre.slug })
              }
            >
              {centre.phone}
            </a>
          ) : (
            <span className="numeral font-semibold text-[var(--dc-ink)]">
              {centre.phone}
            </span>
          )}
        </p>
      ) : null}
    </li>
  );
}

/**
 * A sidebar filter group (State, City). The header is a proper control rather than a small
 * muted label: it reads as a button, takes the same accent highlight as a selected option while
 * it is open or holds a selection, and shows the current pick as a chip — so a visitor can see
 * which filters are applied without opening each group.
 */
function FilterGroup({
  label,
  icon: Icon,
  value,
  className,
  open,
  onToggle,
  children,
}: {
  label: string;
  icon: typeof MapPin;
  /** The applied selection's name, or `null` when the group is on "All". */
  value: string | null;
  className?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = useId();
  const highlighted = open || Boolean(value);
  return (
    <div
      className={`centres-accordion${className ? ` ${className}` : ''}`}
      data-open={open}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={[
          'centres-accordion-trigger rounded-[12px] border px-3.5 py-3 transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]',
          highlighted
            ? 'border-[var(--dc-accent-soft)]/55 bg-[var(--dc-accent-tint)]'
            : 'border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] hover:border-[var(--dc-accent-soft)]/35 hover:bg-[var(--dc-accent-soft)]/6',
        ].join(' ')}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${highlighted ? 'text-[var(--dc-accent-soft)]' : 'text-[var(--dc-ink-muted)]'}`}
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="text-[12.5px] font-extrabold tracking-[0.1em] text-[var(--dc-ink)] uppercase">
          {label}
        </span>
        {value ? (
          <span className="ml-auto min-w-0 max-w-[9rem] truncate rounded-full border border-[var(--dc-accent-soft)]/50 bg-[var(--dc-card)] px-2.5 py-0.5 text-[12px] font-bold text-[var(--dc-accent-soft)]">
            {value}
            <span className="sr-only"> selected</span>
          </span>
        ) : (
          <span className="ml-auto text-[12px] font-semibold text-[var(--dc-ink-muted)]">All</span>
        )}
        <ChevronDown
          className="centres-accordion-chevron h-4 w-4"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} className="centres-accordion-panel">
        <ul className="mt-2.5 flex flex-col gap-1">{children}</ul>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: typeof MapPin;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'centres-filter-btn flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13.5px] font-semibold transition-[background-color,border-color,color] duration-200',
        active
          ? 'border border-[var(--dc-accent-soft)]/55 bg-[var(--dc-accent-tint)] text-[var(--dc-ink)]'
          : 'border border-transparent text-[var(--dc-ink-secondary)] hover:border-[var(--dc-accent-soft)]/20 hover:bg-[var(--dc-accent-soft)]/6 hover:text-[var(--dc-ink)]',
      ].join(' ')}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon ? (
          <Icon
            className={[
              'h-3.5 w-3.5 shrink-0',
              active
                ? 'text-[var(--dc-accent-soft)]'
                : 'text-[var(--dc-ink-muted)]',
            ].join(' ')}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="numeral shrink-0 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-ink-muted)]">
        {count}
      </span>
    </button>
  );
}
