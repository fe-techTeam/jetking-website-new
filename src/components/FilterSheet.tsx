'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useId, type ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

/**
 * Phone/tablet replacement for a filter sidebar: a "Filters" trigger that opens
 * a bottom sheet of facet chips. Filters apply live; the footer only closes.
 * Uses global `--theme-*` tokens so it renders correctly from the body portal,
 * outside any page-scoped token wrapper.
 */
export function FilterSheet({
  title,
  activeCount,
  resultLabel,
  canClear,
  onClear,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  activeCount: number;
  /** e.g. "Show 7 courses" */
  resultLabel: string;
  canClear: boolean;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger
        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[var(--theme-hairline-strong)] bg-[var(--theme-card)] px-4 text-[13.5px] font-bold text-[var(--theme-ink)] transition-colors hover:border-[var(--theme-accent-soft)]"
        aria-label={activeCount ? `Filters, ${activeCount} active` : 'Filters'}
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        Filters
        {activeCount ? (
          <span
            aria-hidden="true"
            className="numeral grid h-5 min-w-5 place-items-center rounded-full bg-[var(--theme-accent)] px-1.5 text-[11px] text-white"
          >
            {activeCount}
          </span>
        ) : null}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="filter-sheet-overlay fixed inset-0 z-50 bg-scrim/50 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="filter-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[24px] border-t border-[var(--theme-hairline-strong)] bg-[var(--theme-card)] text-[var(--theme-ink)] shadow-xl outline-none md:inset-x-auto md:right-1/2 md:w-[min(100%,36rem)] md:translate-x-1/2"
        >
          <span
            aria-hidden="true"
            className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[var(--theme-hairline-strong)]"
          />
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--theme-hairline)] py-1.5 pr-2 pl-5">
            <DialogPrimitive.Title className="font-display text-[18px] font-extrabold tracking-[-0.01em]">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close filters"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-[var(--theme-ink-muted)] transition-colors hover:bg-[var(--theme-accent-tint)] hover:text-[var(--theme-ink)]"
            >
              <X className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
            {children}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-[var(--theme-hairline)] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              className="h-12 shrink-0 cursor-pointer rounded-full border border-[var(--theme-hairline-strong)] px-5 text-[14px] font-bold text-[var(--theme-ink)] transition-colors hover:border-[var(--theme-accent-soft)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Clear all
            </button>
            <DialogPrimitive.Close className="inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full bg-[var(--theme-accent)] px-5 text-[14px] font-bold text-white shadow-brand transition-colors hover:bg-[var(--theme-accent-hover)]">
              {resultLabel}
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SheetFacet({ label, children }: { label: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-[12px] font-bold tracking-[0.12em] text-[var(--theme-ink-muted)] uppercase"
      >
        {label}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">{children}</ul>
    </section>
  );
}

export function SheetChip({
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
        className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13.5px] font-bold transition-colors ${
          active
            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] text-white'
            : 'border-[var(--theme-hairline-strong)] text-[var(--theme-ink-secondary)] hover:border-[var(--theme-accent-soft)] hover:text-[var(--theme-ink)]'
        }`}
      >
        {label}
        <span className="numeral text-[12px] opacity-80">{count}</span>
      </button>
    </li>
  );
}

/** Removable summary of the active facets, shown beside the trigger once the sheet closes. */
export function ActiveFilterChips({
  items,
}: {
  items: Array<{ key: string; label: string; onRemove: () => void }>;
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            onClick={item.onRemove}
            aria-label={`Remove filter: ${item.label}`}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--theme-accent)]/45 bg-[var(--theme-accent-tint)] py-2 pr-3 pl-4 text-[13px] font-bold text-[var(--theme-ink)] transition-colors hover:border-[var(--theme-accent)]"
          >
            {item.label}
            <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
