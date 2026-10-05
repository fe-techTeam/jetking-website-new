import { Globe, Info } from 'lucide-react';
import type { AppearsOn } from './registry';

/**
 * The strip under a collection's heading: either the public pages this content shows up on
 * (so an editor knows what a save changes), or — when the website doesn't render it — a
 * plain-language warning saying so.
 */
export function WebsiteUsage({
  live,
  appearsOn,
  note,
}: {
  live: boolean;
  appearsOn: AppearsOn[];
  note?: string;
}) {
  if (!live) {
    return (
      <div
        role="note"
        className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-signal-600)]/30 bg-[var(--color-signal-50)] p-4 text-sm text-[#93370d] sm:p-5"
      >
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#b54708]" />
        <div>
          <p className="font-bold">Not shown on the website</p>
          {note ? <p className="mt-1 leading-relaxed">{note}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-background p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Globe aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
        Appears on the website
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {appearsOn.map((page) => (
          <li key={page.label}>
            {page.href ? (
              <a
                href={page.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-border-medium sm:min-h-9 bg-background px-3.5 text-[13px] font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                {page.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span className="inline-flex min-h-9 items-center rounded-full bg-surface px-3.5 text-[13px] font-semibold text-foreground-secondary ring-1 ring-border">
                {page.label}
              </span>
            )}
          </li>
        ))}
      </ul>
      {note ? <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{note}</p> : null}
    </div>
  );
}
