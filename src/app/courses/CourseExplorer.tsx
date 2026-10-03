'use client';

import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Search, X } from 'lucide-react';
import type { Course, CourseLevel } from '@/lib/content/types';
import { usePersona } from '@/persona/PersonaProvider';
import { useFlip } from '@/components/motion/flip';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { track } from '@/lib/analytics';
import { ActiveFilterChips, FilterSheet, SheetChip, SheetFacet } from '@/components/FilterSheet';
import { COURSE_LEVELS, COURSE_LEVEL_LABEL } from '@/lib/course-categories';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COURSE EXPLORER
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * A left filter sidebar + a grid of course cards, in the Future-Ready dark
 * language shared with the blog and centres index (`.dc-*` primitives).
 *
 * How this stays SEO-safe:
 *
 *   1. Client component, but Next still SERVER-RENDERS it: every course card and
 *      its link is in the initial HTML. The sidebar filters and the search only
 *      toggle `hidden` on already-rendered cards — they never conditionally
 *      render them away. With JavaScript off, the visitor gets the complete list.
 *
 *   2. Filter/search state lives in the URL via `history.replaceState`, NOT via
 *      router navigation. The page stays statically generated, a filtered view is
 *      still shareable, and the canonical stays `/courses` (set on the server), so
 *      faceted URLs cannot fragment the index.
 *
 *   3. Each card links straight to its own `/courses/[slug]` page — no in-place
 *      expansion — so the crawlable route structure is exactly the sitemap.
 */

const LEVELS: Array<{ id: CourseLevel | 'all'; label: string }> = [
  { id: 'all', label: 'All levels' },
  ...COURSE_LEVELS,
];

type Technology =
  | 'cloud'
  | 'cyber-security'
  | 'networking'
  | 'data'
  | 'design-gaming'
  | 'marketing'
  | 'hardware-os';

const TECHNOLOGIES: Array<{ id: Technology | 'all'; label: string }> = [
  { id: 'all', label: 'All technologies' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'cyber-security', label: 'Cyber Security' },
  { id: 'networking', label: 'Networking' },
  { id: 'data', label: 'Data' },
  { id: 'design-gaming', label: 'Design & Gaming' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'hardware-os', label: 'Hardware & OS' },
];

/*
 * There is no dedicated category field in the course schema, so the facet is
 * derived from each course's slug + title — grounded in real course names
 * rather than an invented taxonomy. A course can match more than one
 * technology (e.g. the Cloud & Cyber Security degrees match both).
 */
const TECHNOLOGY_KEYWORDS: Record<Technology, RegExp> = {
  cloud: /cloud|\baws\b|azure/,
  'cyber-security': /cyber|hacking|security/,
  networking: /network|routing|switching|cisco/,
  data: /\bdata\b/,
  'design-gaming': /multimedia|animation|gaming|metaverse|design/,
  marketing: /marketing/,
  'hardware-os': /hardware|windows|server|red hat/,
};

function courseTechnologies(course: Course): Technology[] {
  const haystack = `${course.slug} ${course.title}`.toLowerCase().replace(/-/g, ' ');
  return (Object.keys(TECHNOLOGY_KEYWORDS) as Technology[]).filter((tech) =>
    TECHNOLOGY_KEYWORDS[tech].test(haystack),
  );
}

function matchesQuery(course: Course, needle: string): boolean {
  if (!needle) return true;
  return (
    course.title.toLowerCase().includes(needle) ||
    course.level.toLowerCase().includes(needle) ||
    course.duration.toLowerCase().includes(needle) ||
    course.eligibility.toLowerCase().includes(needle) ||
    course.summary.toLowerCase().includes(needle)
  );
}

interface ViewState {
  level: CourseLevel | 'all';
  technology: Technology | 'all';
  query: string;
}

const DEFAULT_VIEW: ViewState = { level: 'all', technology: 'all', query: '' };

function readViewFromUrl(): ViewState {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level');
  const technology = params.get('tech');
  const query = params.get('q');

  return {
    level: LEVELS.some((x) => x.id === level) ? (level as CourseLevel) : 'all',
    technology: TECHNOLOGIES.some((x) => x.id === technology) ? (technology as Technology) : 'all',
    query: typeof query === 'string' ? query : '',
  };
}

export function CourseExplorer({ courses }: { courses: Course[] }) {
  const { classification, hydrated } = usePersona();
  const inputId = useId();
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
  const listRef = useRef<HTMLDivElement>(null);
  const { level, technology, query } = view;

  /*
   * The two facet groups are accordions at every width — closed by default
   * so the results aren't pushed down by every option sitting expanded; see
   * `.dc-filter-group` in dark-canvas.css. On desktop (lg, the width where the
   * sidebar sits beside the results instead of above them) there's no such
   * crowding concern, so Level starts open there — see the post-hydration
   * check below.
   */
  const [levelOpen, setLevelOpen] = useState(false);
  const [technologyOpen, setTechnologyOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  /*
   * Restore a shared filtered URL — a genuine external-source sync, not derived
   * state: `window.location` does not exist during SSR, so reading it in a lazy
   * initialiser would cause a hydration mismatch. The one-time post-hydration
   * read is the correct and only safe option. A restored filter also opens its
   * accordion, so a shared link doesn't hide the very facet it points at.
   *
   * The desktop-open default for Level is read the same way, for the same
   * reason: `window.innerWidth` doesn't exist during SSR either.
   */
  /* eslint-disable react-hooks/set-state-in-effect --
     one-time post-hydration restore, not a synchronisation loop */
  useEffect(() => {
    const restored = readViewFromUrl();
    setView(restored);
    if (window.matchMedia('(min-width: 1024px)').matches) setLevelOpen(true);
    if (restored.level !== 'all') setLevelOpen(true);
    if (restored.technology !== 'all') setTechnologyOpen(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /*
   * The read above lands in state one render after mount — the reflect effect
   * below must not fire on that first render, or it writes `view`'s stale
   * DEFAULT_VIEW back into `history`, erasing whatever `?level=` a Link (e.g.
   * the homepage's "MCA & BCA degrees" callout) just navigated here with,
   * before the read effect's setState has had a chance to apply.
   */
  const skippedFirstSync = useRef(false);

  // ── Reflect state into the URL without navigating ─────────────────────────
  useEffect(() => {
    if (!skippedFirstSync.current) {
      skippedFirstSync.current = true;
      return;
    }
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (level !== 'all') params.set('level', level);
    if (technology !== 'all') params.set('tech', technology);
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [level, technology, query, hydrated]);

  // ── Ordering: persona relevance, then editorial order. Stable. ────────────
  const ordered = useMemo(() => {
    const persona = classification.persona;
    const canRank = hydrated && persona !== 'unknown' && classification.confidence >= 0.5;
    if (!canRank) return courses;
    return courses
      .map((course, index) => ({
        course,
        index,
        score: course.personaRelevance[persona] ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.course);
  }, [courses, classification.persona, classification.confidence, hydrated]);

  const needle = query.trim().toLowerCase();

  // ── Facet counts: each group counts what the *other* active filters leave ──
  const levelCounts = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const course of courses) {
      if (technology !== 'all' && !courseTechnologies(course).includes(technology)) continue;
      if (!matchesQuery(course, needle)) continue;
      map.set(course.level, (map.get(course.level) ?? 0) + 1);
      total += 1;
    }
    map.set('all', total);
    return map;
  }, [courses, technology, needle]);

  const technologyCounts = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const course of courses) {
      if (level !== 'all' && course.level !== level) continue;
      if (!matchesQuery(course, needle)) continue;
      for (const tech of courseTechnologies(course)) map.set(tech, (map.get(tech) ?? 0) + 1);
      total += 1;
    }
    map.set('all', total);
    return map;
  }, [courses, level, needle]);

  const visible = useMemo(
    () =>
      new Set(
        ordered
          .filter(
            (course) =>
              (level === 'all' || course.level === level) &&
              (technology === 'all' || courseTechnologies(course).includes(technology)) &&
              matchesQuery(course, needle),
          )
          .map((course) => course.slug),
      ),
    [ordered, level, technology, needle],
  );

  // Signature encodes arrangement + membership, so FLIP fires on any
  // reorganisation and not on unrelated renders.
  const signature = `${ordered.map((c) => c.slug).join(',')}|${[...visible].join(',')}`;
  useFlip(listRef, signature);

  const hasActiveFilters = level !== 'all' || technology !== 'all' || needle !== '';

  function clearFilters() {
    setView(DEFAULT_VIEW);
  }

  function pickLevel(id: CourseLevel | 'all') {
    setView((v) => ({ ...v, level: id }));
    track('nudge_clicked', { nudge_id: 'explorer-level', href: String(id) });
  }

  function pickTechnology(id: Technology | 'all') {
    setView((v) => ({ ...v, technology: id }));
    track('nudge_clicked', { nudge_id: 'explorer-technology', href: String(id) });
  }

  const activeFacetCount = (level !== 'all' ? 1 : 0) + (technology !== 'all' ? 1 : 0);
  const activeLevelLabel = LEVELS.find((x) => x.id === level)?.label;
  const activeTechnologyLabel = TECHNOLOGIES.find((x) => x.id === technology)?.label;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-12">
      {/* ── Left: filter sidebar ─────────────────────────────────────────── */}
      <aside
        className="dc-panel hidden flex-col self-start rounded-[20px] lg:flex xs:rounded-[24px] lg:sticky lg:top-[6.5rem] lg:z-[2] lg:max-h-[calc(100vh-7.5rem)] xl:top-28"
        aria-label="Filter courses"
      >
        {/* Pinned: title + search always visible while the lists scroll */}
        <div className="shrink-0 rounded-t-[20px] border-b border-[var(--dc-accent-soft)]/18 bg-[var(--dc-card)] p-5 xs:rounded-t-[24px] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="label-mono">Filters</p>
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
            <span className="sr-only">Search courses</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setView((v) => ({ ...v, query: e.target.value }))}
              placeholder="Search courses..."
              autoComplete="off"
              className="dc-input w-full rounded-full py-2.5 pr-10 pl-10 text-[13.5px]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setView((v) => ({ ...v, query: '' }))}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[var(--dc-ink-muted)] transition-colors hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-ink)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
              </button>
            ) : null}
          </label>
        </div>

        {/* Scrollable: level + technology lists */}
        <div className="dc-filter-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <FilterGroup label="Level" open={levelOpen} onToggle={() => setLevelOpen((v) => !v)}>
            {LEVELS.map((option) => (
              <FilterRow
                key={option.id}
                active={level === option.id}
                onClick={() => pickLevel(option.id)}
                label={option.label}
                count={levelCounts.get(option.id) ?? 0}
              />
            ))}
          </FilterGroup>

          <FilterGroup
            label="Technology"
            className="mt-6"
            open={technologyOpen}
            onToggle={() => setTechnologyOpen((v) => !v)}
          >
            {TECHNOLOGIES.map((option) => (
              <FilterRow
                key={option.id}
                active={technology === option.id}
                onClick={() => pickTechnology(option.id)}
                label={option.label}
                count={technologyCounts.get(option.id) ?? 0}
              />
            ))}
          </FilterGroup>
        </div>
      </aside>

      {/* ── Right: results ───────────────────────────────────────────────── */}
      <div className="min-w-0">
        {/* Below lg the sidebar collapses into this toolbar + a bottom sheet. */}
        <div className="mb-5 lg:hidden">
          <div className="flex gap-2.5">
            <label htmlFor={`${inputId}-m`} className="relative block min-w-0 flex-1">
              <span className="sr-only">Search courses</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <input
                id={`${inputId}-m`}
                type="search"
                value={query}
                onChange={(e) => setView((v) => ({ ...v, query: e.target.value }))}
                placeholder="Search courses..."
                autoComplete="off"
                enterKeyHint="search"
                className="dc-input h-11 w-full rounded-full pr-11 pl-10 text-[14px]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setView((v) => ({ ...v, query: '' }))}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-0 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[var(--dc-ink-muted)] hover:text-[var(--dc-ink)]"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <FilterSheet
              title="Filter courses"
              activeCount={activeFacetCount}
              resultLabel={`Show ${visible.size} ${visible.size === 1 ? 'course' : 'courses'}`}
              canClear={hasActiveFilters}
              onClear={clearFilters}
              open={sheetOpen}
              onOpenChange={setSheetOpen}
            >
              <SheetFacet label="Level">
                {LEVELS.map((option) => (
                  <SheetChip
                    key={option.id}
                    active={level === option.id}
                    onClick={() => pickLevel(option.id)}
                    label={option.label}
                    count={levelCounts.get(option.id) ?? 0}
                  />
                ))}
              </SheetFacet>
              <SheetFacet label="Technology">
                {TECHNOLOGIES.map((option) => (
                  <SheetChip
                    key={option.id}
                    active={technology === option.id}
                    onClick={() => pickTechnology(option.id)}
                    label={option.label}
                    count={technologyCounts.get(option.id) ?? 0}
                  />
                ))}
              </SheetFacet>
            </FilterSheet>
          </div>

          <ActiveFilterChips
            items={[
              ...(level !== 'all'
                ? [{ key: 'level', label: activeLevelLabel ?? level, onRemove: () => pickLevel('all') }]
                : []),
              ...(technology !== 'all'
                ? [{ key: 'tech', label: activeTechnologyLabel ?? technology, onRemove: () => pickTechnology('all') }]
                : []),
            ]}
          />
        </div>

        <p
          aria-live="polite"
          className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--dc-ink-muted)] uppercase"
        >
          {visible.size} {visible.size === 1 ? 'course' : 'courses'}
          {hasActiveFilters ? ' matching' : null}
        </p>

        <div
          ref={listRef}
          className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
        >
          {ordered.map((course) => {
            const isVisible = visible.has(course.slug);
            const levelLabel = COURSE_LEVEL_LABEL[course.level];

            return (
              <article
                key={course.slug}
                data-flip-key={course.slug}
                /*
                  `hidden` keeps filtered-out courses in the DOM and in the
                  server-rendered HTML — they are only visually removed, so a
                  crawler and any visitor without JS still get every course link.
                */
                hidden={!isVisible}
                className="relative h-full"
              >
                <TransitionLink
                  href={`/courses/${course.slug}`}
                  onClick={() =>
                    track('course_viewed', { course_slug: course.slug, surface: 'explorer-card' })
                  }
                  className="dc-card-shell dc-card-interactive group/card block h-full"
                >
                  <div className="dc-card flex h-full overflow-hidden sm:flex-col">
                    {/* Phones: a thumbnail beside the text, so 18 cards don't stack into a 10,000px+ page. */}
                    <div className="dc-card-media relative min-h-[112px] w-[104px] shrink-0 overflow-hidden min-[400px]:w-[120px] sm:aspect-[16/10] sm:min-h-0 sm:w-auto">
                      {course.heroImage ? (
                        <Image
                          src={course.heroImage.url}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 42vw, 120px"
                          className="object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/card:scale-[1.04]"
                        />
                      ) : null}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/65 via-transparent to-transparent"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-7">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
                        {levelLabel}
                      </span>
                      <span className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]">
                        {course.duration}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-[15.5px] leading-snug font-extrabold tracking-[-0.02em] text-balance text-[var(--dc-ink)] transition-colors group-hover/card:text-[var(--dc-accent-soft)] sm:mt-3.5 sm:text-[18px]">
                      {course.title}
                    </h2>

                    <p className="mt-2 line-clamp-2 flex-1 text-[14px] leading-relaxed max-sm:hidden text-[var(--dc-ink-muted)]">
                      {course.eligibility}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 sm:pt-6">
                      <span className="text-[13.5px] font-bold text-[var(--dc-accent-soft)]">
                        View course
                      </span>
                      <span
                        aria-hidden="true"
                        className="dc-cta hidden h-10 w-10 shrink-0 place-items-center rounded-full sm:grid"
                      >
                        <ArrowRight
                          className="h-[18px] w-[18px] transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/card:translate-x-0.5"
                          strokeWidth={2.25}
                        />
                      </span>
                    </div>
                    </div>
                  </div>
                </TransitionLink>
              </article>
            );
          })}
        </div>

        {visible.size === 0 ? (
          <div className="dc-panel mt-6 rounded-[20px] px-6 py-12 text-center sm:px-8">
            <p className="font-display text-[18px] font-extrabold text-[var(--dc-ink)]">
              No course matches those filters
            </p>
            <p className="mt-2 text-[14px] text-[var(--dc-ink-secondary)]">
              Try a different level, technology, or search term.
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
  );
}

/* ── Small parts ─────────────────────────────────────────────────────────── */

function FilterGroup({
  label,
  className,
  open,
  onToggle,
  children,
}: {
  label: string;
  className?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = useId();
  return (
    <div className={`dc-filter-group${className ? ` ${className}` : ''}`} data-open={open}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="dc-filter-group-trigger"
      >
        <span className="text-[12px] font-bold tracking-[0.12em] text-[var(--dc-ink-muted)] uppercase">
          {label}
        </span>
        <ChevronDown
          className="dc-filter-group-chevron h-4 w-4"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} className="dc-filter-group-panel">
        <ul className="mt-2.5 flex flex-col gap-1">{children}</ul>
      </div>
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="dc-filter-row text-[13.5px]"
      >
        <span className="truncate">{label}</span>
        <span className="numeral shrink-0 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-ink-muted)]">
          {count}
        </span>
      </button>
    </li>
  );
}
