import type { ReactNode } from 'react';
import { IconSlot, type IconInput } from './IconSlot';

/** Icon + title + one or two lines. The default building block for "why us" grids. */
export function FeatureCard({
  icon,
  title,
  badge,
  compact = false,
  children,
}: {
  icon?: IconInput;
  title: string;
  /** Short label top-right (a year, a tag). */
  badge?: string;
  /** Phones: icon beside the text instead of above it, so a stack of short cards stays short. */
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={`kit kit-card kit-card-lift flex h-full ${
        compact ? 'flex-row items-start gap-4 p-4 sm:flex-col sm:items-stretch sm:gap-3 sm:p-6' : 'flex-col gap-3 p-5 sm:p-6'
      }`}
    >
      <div className={`flex items-center justify-between gap-3 ${compact ? 'shrink-0 sm:shrink' : ''}`}>
        {icon ? (
          <span className="kit-iconwell" aria-hidden="true">
            <IconSlot icon={icon} className="h-5 w-5" strokeWidth={1.9} />
          </span>
        ) : (
          <span />
        )}
        {badge ? (
          <span className="rounded-full bg-[var(--k-red-wash)] px-2.5 py-1 text-[12px] font-bold tracking-[0.04em] text-[var(--k-red)] uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? 'gap-1.5 sm:gap-3' : 'gap-3'}`}>
        <h3 className="text-[17px] leading-snug font-bold text-[var(--k-ink)]">{title}</h3>
        <div className="text-[15px] leading-relaxed text-[var(--k-ink-2)]">{children}</div>
      </div>
    </article>
  );
}
