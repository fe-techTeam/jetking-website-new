'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { usePersona } from './PersonaProvider';
import type { KnownPersonaId } from './types';
import { track } from '@/lib/analytics';
import { useFlip } from '@/components/motion/flip';
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * THE ONLY SANCTIONED WAY CONTENT ADAPTS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Three primitives, no more (DEVELOPMENT-PLAN §4.4):
 *
 *   AdaptiveCta   — swap CTA copy/destination within a fixed layout
 *   AdaptiveNudge — inject a contextual prompt into a pre-reserved slot
 *   AdaptiveList  — re-rank an already-rendered list; every item stays in the DOM
 *
 * Hard constraints these components enforce structurally:
 *
 *   1. The `fallback` renders on the server and during first client paint. It is
 *      what crawlers index and what the user sees before hydration. Adaptation is
 *      strictly additive on top of it.
 *   2. AdaptiveList never removes items — it only changes their order. Indexable
 *      content cannot disappear because of a persona classification.
 *   3. Nudges reserve their space up front, so injecting one cannot shift layout.
 *
 * Break any of these and the site stops being adaptive and starts being cloaking.
 *
 * API note: every prop here is serialisable — plain data or pre-rendered ReactNodes,
 * never callbacks. These components are called from server components, and a render
 * callback cannot cross the server/client boundary. That constraint also keeps the
 * adaptive surface deliberately narrow: you cannot express arbitrary per-persona
 * rendering, only the three sanctioned transforms.
 */

type PersonaVariants<T> = Partial<Record<KnownPersonaId, T>>;

/* ────────────────────────────────────────────────────────────────────────── */
/* AdaptiveNudge — the `nudge` primitive                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export interface NudgeContent {
  headline: string;
  body?: string;
  ctaLabel: string;
  /** Omit when `ctaAction` is set. */
  ctaHref?: string;
  /** 'guide' sends the visitor to Jetking AI with the headline as their question. */
  ctaAction?: 'guide';
}

/**
 * Space reserved for a nudge before it hydrates.
 *
 * The tension: most first-time visitors classify as `unknown` and see no nudge, so
 * reserving space leaves a gap for them. Not reserving it means the nudge shifts
 * everything below when it appears — that is CLS, and CLS is a ranking factor on
 * pages this project exists to protect.
 *
 * Resolution: reserve by default, and use `none` only where nothing follows the slot
 * in normal flow, because a shift that moves nothing costs nothing. Heights are
 * responsive — the nudge stacks on mobile and sits in a row from `sm` up.
 */
const RESERVE = {
  /** Nothing follows this slot — collapsing it shifts no content. */
  none: '',
  /** Headline + CTA, no body copy. */
  compact: 'min-h-[104px] sm:min-h-[74px]',
  /** Headline + body + CTA. The common case. */
  standard: 'min-h-[128px] sm:min-h-[90px]',
} as const;

export function AdaptiveNudge({
  id,
  variants,
  reserve = 'standard',
  minConfidence = 0.5,
  tone = 'default',
}: {
  id: string;
  variants: PersonaVariants<NudgeContent>;
  reserve?: keyof typeof RESERVE;
  minConfidence?: number;
  /** Match the nudge to the light site, blog skin, or shared dark canvas. */
  tone?: 'default' | 'blog' | 'dark';
}) {
  const { classification, hydrated } = usePersona();
  const shownRef = useRef(false);

  const persona = classification.persona;
  const eligible = hydrated && persona !== 'unknown' && classification.confidence >= minConfidence;
  const nudge = eligible ? variants[persona] : undefined;

  useEffect(() => {
    if (!nudge || shownRef.current) return;
    shownRef.current = true;
    track('nudge_shown', {
      nudge_id: id,
      persona,
      confidence: classification.confidence,
      rules_version: classification.version,
    });
  }, [nudge, id, persona, classification.confidence, classification.version]);

  const nudgeHref = !nudge
    ? undefined
    : nudge.ctaAction === 'guide'
      ? (`/chatbot?q=${encodeURIComponent(nudge.headline)}` as Route)
      : (nudge.ctaHref as Route | undefined);
  const skin = NUDGE_SKINS[tone];

  return (
    <div className={`slot-stable ${RESERVE[reserve]}`} data-slot={id}>
      {nudge && nudgeHref ? (
        <aside className={skin.aside} aria-label="Suggested next step">
          <div className="min-w-0">
            <p className={skin.eyebrow}>Suggested for you</p>
            <p className={skin.headline}>{nudge.headline}</p>
            {nudge.body ? <p className={skin.body}>{nudge.body}</p> : null}
          </div>
          <Link
            href={nudgeHref}
            onClick={() => track('nudge_clicked', { nudge_id: id, persona, href: nudgeHref })}
            className={skin.cta}
          >
            {nudge.ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      ) : null}
    </div>
  );
}

const NUDGE_SKINS: Record<
  'default' | 'blog' | 'dark',
  { aside: string; eyebrow: string; headline: string; body: string; cta: string }
> = {
  default: {
    aside:
      'nudge-enter flex flex-col gap-4 rounded-[var(--radius-card)] border border-jk-200 bg-jk-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
    eyebrow: 'label-mono text-jk-700',
    headline: 'mt-1.5 font-semibold text-ink-900',
    body: 'mt-1 text-sm text-ink-600',
    cta: 'inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-jk-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-jk-500',
  },
  blog: {
    aside:
      'nudge-enter flex flex-col gap-4 rounded-[20px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-5 shadow-[var(--dc-shadow)] sm:flex-row sm:items-center sm:justify-between sm:gap-6',
    eyebrow: 'text-[12px] font-bold tracking-[0.12em] text-[var(--dc-accent-soft)] uppercase',
    headline: 'mt-1.5 font-semibold text-[var(--dc-ink)]',
    body: 'mt-1 text-sm text-[var(--dc-ink-muted)]',
    cta: 'inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--dc-accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-jk-700)]',
  },
  dark: {
    aside:
      'nudge-enter flex flex-col gap-4 rounded-[20px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] p-5 shadow-[var(--dc-shadow)] sm:flex-row sm:items-center sm:justify-between sm:gap-6',
    eyebrow: 'text-[12px] font-bold tracking-[0.12em] text-[var(--dc-accent-soft)] uppercase',
    headline: 'mt-1.5 font-semibold text-[var(--dc-ink)]',
    body: 'mt-1 text-sm text-[var(--dc-ink-muted)]',
    cta: 'dc-cta inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-5 text-sm font-semibold',
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* AdaptiveList — the `reorder` primitive                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface AdaptiveItem {
  /** Stable React key. */
  key: string;
  /** Per-persona relevance, 0–1. Missing personas score 0. */
  relevance?: Partial<Record<KnownPersonaId, number>>;
  /** Pre-rendered on the server. The list re-orders these nodes; it never builds them. */
  node: ReactNode;
}

/**
 * Re-ranks a list by per-persona relevance.
 *
 * Every item is preserved — this only changes order, never membership, so nothing
 * indexable can be hidden. The server renders the source order; after hydration the
 * list re-sorts. Because items are keyed, React moves DOM nodes rather than
 * recreating them, so no image reloads and no flash.
 *
 * The sort is stable: equal-relevance items keep their editorial source order rather
 * than shuffling arbitrarily.
 */
export function AdaptiveList({
  id,
  items,
  className = '',
  minConfidence = 0.5,
  /** CMS variant courseBoost / centreBoost — floated above relevance sort. */
  boostKeys = [],
  as = 'div',
}: {
  id: string;
  items: AdaptiveItem[];
  /**
   * Layout classes for the container. AdaptiveList owns the container rather than
   * being dropped into a parent grid, because FLIP has to measure the items and a
   * `display: contents` wrapper has no box to measure.
   */
  className?: string;
  minConfidence?: number;
  boostKeys?: string[];
  /**
   * `ul` renders the container as a list and each item as an `li`. Catalogue
   * surfaces — the homepage programme index, centre indexes — are lists
   * semantically, and "list, 6 items" from a screen reader is materially better
   * than a pile of divs. The reorder contract is identical either way.
   */
  as?: 'div' | 'ul';
}) {
  const { classification, hydrated } = usePersona();
  const reportedRef = useRef(false);
  const containerRef = useRef<HTMLElement>(null);

  const persona = classification.persona;
  const shouldReorder =
    hydrated && persona !== 'unknown' && classification.confidence >= minConfidence;

  const ordered = useMemo(() => {
    if (!shouldReorder && boostKeys.length === 0) return items;
    if (!shouldReorder) return items;

    const boostRank = new Map(boostKeys.map((key, i) => [key, boostKeys.length - i]));
    return items
      .map((item, index) => ({
        item,
        index,
        boost: boostRank.get(item.key) ?? 0,
        score: item.relevance?.[persona] ?? 0,
      }))
      .sort((a, b) => b.boost - a.boost || b.score - a.score || a.index - b.index)
      .map((entry) => entry.item);
  }, [items, persona, shouldReorder, boostKeys]);

  useEffect(() => {
    if (!shouldReorder || reportedRef.current) return;
    reportedRef.current = true;
    track('adaptive_slot_rendered', {
      slot_id: id,
      persona,
      strategy: 'reorder',
      item_count: items.length,
    });
  }, [shouldReorder, id, persona, items.length]);

  /*
   * Animating the re-rank is not decoration. When a persona is inferred and six
   * cards silently swap order, the visitor cannot tell whether the set changed or
   * merely reordered — and the whole product claim is that the site is responding
   * to them. Watching the cards move says so without a banner announcing it.
   */
  useFlip(containerRef, ordered.map((item) => item.key).join(','));

  const Container = as;
  const Item = as === 'ul' ? 'li' : 'div';

  return (
    <Container ref={containerRef as never} className={className}>
      {ordered.map((item) => (
        <Item key={item.key} data-flip-key={item.key} className="h-full">
          {item.node}
        </Item>
      ))}
    </Container>
  );
}
