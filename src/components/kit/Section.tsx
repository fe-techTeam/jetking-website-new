import type { ReactNode } from 'react';

/**
 * Page section with a background tone. Alternate `plain` → `tint` → `wash` down a page for rhythm;
 * add `deco` (dots | glow | grid) on one plain/tint section per screen to break flat colour.
 * Never dark: the palette is white / grey / red only.
 */
export function Section({
  tone = 'plain',
  deco,
  id,
  labelledBy,
  className,
  children,
}: {
  tone?: 'plain' | 'tint' | 'wash';
  deco?: 'dots' | 'glow' | 'grid';
  id?: string;
  /** id of the section's heading, for the landmark name. */
  labelledBy?: string;
  /** Extra utility classes on the section element (e.g. `max-lg:order-last` inside a flex-column page). */
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} data-tone={tone} data-deco={deco} className={`kit kit-section${className ? ` ${className}` : ''}`}>
      <div className="shell">{children}</div>
    </section>
  );
}

/** Eyebrow + h2 + lede, with an optional action on the right (a link or button). */
export function SectionHeader({
  id,
  eyebrow,
  title,
  lede,
  action,
  align = 'left',
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  align?: 'left' | 'center';
}) {
  const center = align === 'center';
  return (
    <header
      className={`mb-8 flex flex-col gap-4 sm:mb-10 ${
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      }`}
    >
      <div className={center ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow ? (
          <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{eyebrow}</p>
        ) : null}
        <h2 id={id} className={`section-title text-[var(--k-ink)] ${eyebrow ? 'mt-2.5' : ''}`}>
          {title}
        </h2>
        {lede ? <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
