import type { ReactNode } from 'react';

/**
 * Cards in a row: swipe-snap on phones, an even grid from tablet up, with no JavaScript.
 * `cols` is the desktop column count.
 */
export function CardRail({
  cols = 3,
  colsMd,
  label,
  children,
}: {
  /** Desktop column count. */
  cols?: 2 | 3 | 4 | 5;
  /** Tablet column count (defaults to `cols`). */
  colsMd?: 2 | 3 | 4;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="kit-rail focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-accent)]"
      style={{ '--kit-cols': cols, '--kit-cols-md': colsMd ?? cols } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
