"use client";

import { Section, SectionHeader } from "@/components/kit";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  Compass,
  MapPin,
  Mic,
  Monitor,
  Search,
  Users,
} from "lucide-react";
import type { City } from "@/lib/content/types";
import { centrePath } from "@/lib/centre-path";
import { fill } from "@/lib/content/copy/define";
import type { HomeCopy } from "@/lib/content/copy/pages/home";

const CAMPUS_ICONS = [Monitor, CalendarDays, Compass, Mic, Users];

interface MapCentre {
  slug: string;
  name: string;
  citySlug: string;
  locality: string;
}

/**
 * A Jetking centre building beside a finder: pick a city to list its centres, each linking to its own page,
 * then what every centre offers underneath.
 */
export function CentreNetwork({
  cities,
  centres,
  counts,
  copy,
}: {
  cities: City[];
  centres: MapCentre[];
  counts: { centres: number; cities: number };
  copy: HomeCopy;
}) {
  const groups = useMemo(() => {
    const byCity = new Map<string, MapCentre[]>();
    for (const c of centres)
      byCity.set(c.citySlug, [...(byCity.get(c.citySlug) ?? []), c]);
    return cities
      .filter((city) => byCity.has(city.slug))
      .map((city) => ({ city, centres: byCity.get(city.slug)! }))
      .sort(
        (a, b) =>
          b.centres.length - a.centres.length ||
          a.city.name.localeCompare(b.city.name),
      );
  }, [cities, centres]);

  const [selected, setSelected] = useState(groups[0]?.city.slug ?? "");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? groups.filter((g) => g.city.name.toLowerCase().includes(needle))
    : groups;
  const active = groups.find((g) => g.city.slug === selected) ?? groups[0];

  return (
    <Section tone="tint" labelledBy="home-centres-heading">
      <SectionHeader
        id="home-centres-heading"
        eyebrow={copy["network.eyebrow"]}
        title={fill(copy["network.title"], {
          centres: counts.centres,
          cities: counts.cities,
        })}
        lede={copy["network.lede"]}
        action={
          <Link
            href={copy["network.cta.href"] as Route}
            className="tap inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {fill(copy["network.all.label"], { centres: counts.centres })}
            <ArrowRight
              className="h-4 w-4"
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </Link>
        }
      />

      {/* One card: the centre photo and the finder side by side (stacked on phones), as a single piece */}
      <div className="grid overflow-hidden rounded-[28px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        {/* A Jetking centre building: as tall as the finder beside it */}
        <div className="relative min-h-[14rem] w-full sm:min-h-[18rem] lg:min-h-0">
          <Image
            src={copy["network.building"]}
            alt={copy["network.building.alt"]}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover object-[60%_center]"
          />
        </div>

        {/* Search + city list on the left, the selected city's centres on the right */}
        <div className="min-w-0 p-5 sm:p-6 lg:p-6 xl:p-8">
          <label
            htmlFor="home-city-search"
            className="font-display text-[18px] font-extrabold text-[var(--dc-ink)]"
          >
            {copy["network.finder.title"]}
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
              placeholder={copy["network.finder.placeholder"]}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] pr-3 pl-10 text-[14px] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--dc-accent-soft)]"
            />
          </div>

          {/* Mobile: a native picker (28 cities is a "find mine", not a "browse", list). sm+: the vertical list. */}
          <div className="relative mt-4 sm:hidden">
            <select
              value={
                filtered.some((g) => g.city.slug === selected) ? selected : ""
              }
              onChange={(e) => setSelected(e.target.value)}
              disabled={filtered.length === 0}
              aria-label={copy["network.finder.select.aria"]}
              className="h-11 w-full appearance-none rounded-xl border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] pr-10 pl-3.5 text-[14px] font-semibold text-[var(--dc-ink)] focus-visible:outline-2 focus-visible:outline-[var(--dc-accent-soft)] disabled:text-[var(--dc-ink-muted)]"
            >
              {filtered.length === 0 ? (
                <option value="">
                  {fill(copy["network.finder.empty.select"], { query })}
                </option>
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

          <div className="mt-2 grid gap-5 sm:mt-3 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)]">
            <ul
              className="hidden sm:block sm:max-h-[260px] lg:max-h-[280px] sm:overflow-x-hidden sm:overflow-y-auto sm:border-r sm:border-[var(--dc-hairline)] sm:pr-3"
              aria-label={copy["network.finder.list.aria"]}
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
                        "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-full border px-4 text-left text-[14px] font-semibold whitespace-nowrap transition-colors hover:text-[var(--dc-accent-soft)] sm:mb-1 sm:w-full sm:rounded-xl sm:border-0 sm:px-3",
                        isActive
                          ? "border-[var(--dc-accent-soft)] bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                          : "border-[var(--dc-hairline-strong)] text-[var(--dc-ink)] sm:hover:bg-[var(--dc-accent-tint)]",
                      ].join(" ")}
                    >
                      <span className="min-w-0 truncate">{city.name}</span>
                      <span className="shrink-0 text-[12px] font-normal text-[var(--dc-ink-muted)]">
                        {list.length}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="py-3 text-[14px] text-[var(--dc-ink-muted)]">
                  {fill(copy["network.finder.empty.list"], { query })}
                </li>
              ) : null}
            </ul>

            {active ? (
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">
                      {active.city.state}
                    </p>
                    <h3 className="mt-1 font-display text-[22px] font-extrabold text-[var(--dc-ink)]">
                      {active.city.name}
                    </h3>
                  </div>
                  <span className="dc-chip px-3 py-1 text-[12px] uppercase">
                    {fill(
                      active.centres.length === 1
                        ? copy["network.city.one"]
                        : copy["network.city.many"],
                      {
                        count: active.centres.length,
                      },
                    )}
                  </span>
                </div>
                <ul
                  tabIndex={0}
                  aria-label={active.city.name}
                  className="mt-3 max-h-[200px] overflow-x-hidden overflow-y-auto border-t border-[var(--dc-hairline)] lg:max-h-[220px]"
                >
                  {active.centres.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={centrePath(c.slug) as Route}
                        className="group/row flex items-center justify-between gap-3 rounded-xl border-b border-[var(--dc-hairline)]/60 px-2 py-2.5 text-[14px] transition-colors hover:bg-[var(--dc-accent-tint)]"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-[var(--dc-ink)]">
                              {c.name}
                            </span>
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
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* What every centre offers, under the map: the same "mini campus" block as a course page */}
      <div className="mt-12 sm:mt-14">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Photo card carries the block title */}
          <div className="relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] shadow-[var(--k-shadow)] lg:min-h-full">
            <Image
              src={copy["network.campus.image"]}
              alt={copy["network.campus.imageAlt"]}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="-z-10 object-cover object-top"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-scrim/85 via-scrim/0 via-45% to-transparent"
            />
            <div className="p-6 sm:p-8">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
                <Building2
                  className="h-6 w-6"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
              <h3 className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-white sm:text-[30px]">
                {copy["network.campus.title"]}
              </h3>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {CAMPUS_ICONS.map((Icon, i) => (
              <li
                key={i}
                className={[
                  "kit kit-card kit-card-lift group relative flex items-start gap-4 overflow-hidden p-5 sm:flex-col sm:gap-0 sm:p-6",
                  i === CAMPUS_ICONS.length - 1 ? "sm:col-span-2" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--k-red-fill)] transition-transform duration-300 group-hover:scale-x-100"
                />
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--k-red-wash)] text-[var(--k-red)] ring-1 ring-[var(--k-line)] transition-colors duration-200 group-hover:bg-[var(--k-red-fill)] group-hover:text-white">
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h4 className="font-display sm:mt-4 text-[17px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--k-ink)]">
                    {copy[`network.campus.${i}.title` as keyof HomeCopy]}
                  </h4>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-[var(--k-ink-2)] sm:mt-1.5">
                    {copy[`network.campus.${i}.body` as keyof HomeCopy]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
