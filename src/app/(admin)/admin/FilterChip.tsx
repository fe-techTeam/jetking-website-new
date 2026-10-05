'use client';

import type { ReactNode } from 'react';

/**
 * The pill-shaped toggle used for every filter row in the panel (Leads'
 * status/source filters, Team's role filter) — extracted because the active
 * vs. inactive class string was copy-pasted six times across two files
 * before this existed. `aria-pressed` is what makes these behave like real
 * toggle buttons for a screen reader, not just visually-distinct `<button>`s.
 */
export function FilterChip({
  active,
  onClick,
  capitalize = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  /** Only for chips whose label is a raw, lowercase data value (e.g. a lead
   *  `source`) — never for an already human-cased label, where CSS
   *  `capitalize` would incorrectly title-case every word (e.g. "Centre
   *  staff" → "Centre Staff"). */
  capitalize?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 cursor-pointer rounded-full border px-3.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:min-h-9 ${capitalize ? 'capitalize' : ''} ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'border-border-medium bg-background text-foreground-secondary hover:border-border-strong hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
