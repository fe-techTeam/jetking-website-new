import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Shared primitives — Editorial Premium.
 *
 * Every visual decision in here is documented in design-system/MASTER.md. The two
 * are a pair: a change to one without the other is how v1 of this project ended up
 * with a design system document that described a site nobody had built.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ── Layout ──────────────────────────────────────────────────────────────── */

export type SectionTone = 'default' | 'sunken' | 'inverse';

/**
 * `tone="inverse"` applies `.surface-inverse`, which re-points the semantic colour
 * variables at the dark end of the ramp. Children keep using `text-foreground` and
 * `border-border` unchanged — no component needs a dark-mode branch.
 */
export function Section({
  children,
  className,
  tone = 'default',
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: SectionTone;
  /** Skip the `.shell` frame — for sections that manage their own grid. */
  bleed?: boolean;
}) {
  const tones: Record<SectionTone, string> = {
    default: 'bg-background',
    sunken: 'bg-surface',
    inverse: 'surface-inverse',
  };

  return (
    <section className={cx('section-y', tones[tone], className)}>
      {bleed ? children : <div className="shell">{children}</div>}
    </section>
  );
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Exported so AdaptiveCta renders a visually identical button without duplicating
 * these classes. Two copies of button styling drift the moment the theme changes —
 * which is exactly what happened once already.
 *
 * The primary fill is jk-600, not the jk-500 brand red: white on jk-500 measures
 * 4.48:1 and fails WCAG AA. jk-600 measures 5.92:1 and still reads as Jetking red.
 */
const buttonTones: Record<ButtonTone, string> = {
  primary:
    'bg-jk-600 text-white hover:bg-jk-500 hover:shadow-[var(--shadow-accent)] active:bg-jk-700',
  secondary:
    'bg-background text-foreground border border-border-medium hover:border-foreground hover:shadow-[var(--shadow-sm)]',
  ghost:
    'bg-transparent text-foreground border border-transparent hover:border-border-medium',
  text: 'bg-transparent text-foreground link-underline h-auto rounded-none px-0 hover:text-[var(--accent-ink)]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-sm',
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-7 text-base',
};

const buttonBase =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-45';

export function ButtonLink({
  tone = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone; size?: ButtonSize }) {
  return (
    <Link
      className={cx(buttonBase, tone !== 'text' && buttonSizes[size], buttonTones[tone], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Button({
  tone = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ComponentProps<'button'> & { tone?: ButtonTone; size?: ButtonSize }) {
  return (
    <button
      className={cx(buttonBase, tone !== 'text' && buttonSizes[size], buttonTones[tone], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Inline "read more" affordance — an arrow link, not a button. */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: Route | string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href as Route}
      className={cx(
        'group/arrow inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-ink)]',
        className,
      )}
    >
      <span className="link-underline">{children}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/arrow:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

/**
 * A row in an index list: title, optional supporting line, optional right-aligned
 * figure, hairline underneath.
 *
 * This is the site's default way of presenting a set of links — courses at a centre,
 * centres in a city, related articles. Rows beat cards here because the values line
 * up in a column the eye can scan, and because a list of six cards is six boxes of
 * chrome around what is really six links.
 *
 * Always render inside a `<ul>` with `border-t border-border`, so the first row has a
 * rule above it and the set closes cleanly.
 */
export function IndexRow({
  href,
  title,
  meta,
  trailing,
  numeric,
}: {
  href: Route | string;
  title: ReactNode;
  /** Secondary line under the title. */
  meta?: ReactNode;
  /** Right-aligned value — duration, count, date. */
  trailing?: ReactNode;
  /** Renders `trailing` with tabular figures. */
  numeric?: boolean;
}) {
  return (
    <li>
      <Link
        href={href as Route}
        className="group/row flex items-baseline justify-between gap-6 border-b border-border py-4.5 transition-colors duration-200 hover:bg-surface"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-foreground transition-colors group-hover/row:text-[var(--accent-ink)]">
            {title}
          </span>
          {meta ? (
            <span className="mt-0.5 block text-sm text-foreground-muted">{meta}</span>
          ) : null}
        </span>
        {trailing ? (
          <span
            className={cx(
              'shrink-0 text-sm text-foreground-muted',
              numeric && 'numeral',
            )}
          >
            {trailing}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="shrink-0 text-[var(--accent-ink)] transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/row:translate-x-1"
          >
            →
          </span>
        )}
      </Link>
    </li>
  );
}

/* ── Form controls ───────────────────────────────────────────────────────── */

/*
 * Re-exported from `./form`, which carries the `'use client'` boundary.
 *
 * They cannot live in this file: `Field` builds its `aria-describedby` wiring with
 * `createContext`, and a module-level `createContext()` call throws the moment a
 * Server Component imports it — which this module is, on every page that renders a
 * `Section` or a `JsonLd`. Re-exporting keeps `@/components/ui` the single import
 * surface for callers while the client boundary sits one file down.
 */
export { Field,  Input, Select, Textarea } from './form';

/* ── Notices ─────────────────────────────────────────────────────────────── */

export function Notice({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: 'neutral' | 'accent' | 'success';
  title?: ReactNode;
  children: ReactNode;
}) {
  const tones = {
    neutral: 'border-border bg-surface',
    // `--accent-border`/`--accent-soft` (globals.css), not the raw jk-200/jk-50
    // primitives: those stay the same pale pink in dark mode, which measured
    // ~1.5:1 against the light `text-foreground-secondary` body text placed on
    // it here — a WCAG 1.4.3 failure. The semantic tokens already redefine for
    // `.dark` (a translucent red), which is what a dark surface needs.
    accent: 'border-[var(--accent-border)] bg-[var(--accent-soft)]',
    success: 'border-growth-600/25 bg-growth-50',
  } as const;

  return (
    <div className={cx('rounded-[var(--radius-card)] border p-5', tones[tone])}>
      {title ? <p className="font-semibold text-foreground">{title}</p> : null}
      <div className={cx('text-sm text-foreground-secondary', Boolean(title) && 'mt-1.5')}>
        {children}
      </div>
    </div>
  );
}

/* ── Structured data ─────────────────────────────────────────────────────── */

/**
 * JSON-LD injection. Content is JSON-serialised from typed objects built in
 * lib/seo.ts, never from user or CMS free text, so there is no injection surface —
 * but `<` is escaped anyway as defence in depth against a `</script>` in a field.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

/* ── Breadcrumbs ─────────────────────────────────────────────────────────── */

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-foreground-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((item, index) => {
          // Trails are assembled from real routes inside page components; the
          // typedRoutes union cannot see through an array, hence the cast here
          // rather than a generic that would infect every call site.
          const href = item.path as Route;
          const isLast = index === trail.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-foreground-disabled">
                  /
                </span>
              ) : null}
              {isLast ? (
                <span aria-current="page" className="text-foreground-secondary">
                  {item.name}
                </span>
              ) : (
                <Link href={href} className="link-underline tap inline-flex min-h-11 items-center sm:min-h-6 hover:text-[var(--accent-ink)]">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
