'use client';

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react';
import { cx } from './ui';

/**
 * Form primitives — Editorial Premium.
 *
 * Split out of `ui.tsx` because `Field` needs `createContext`, which throws in a
 * Server Component. Callers should keep importing from `@/components/ui`, which
 * re-exports everything here.
 */

/**
 * `text-sm` (14px), not the old zoom-safe `text-base` (16px): iOS Safari zooms the
 * viewport on focus for any field under 16px, but that's now handled separately —
 * `iosInputZoomGuardScript` (src/lib/ios-input-zoom-guard.ts) detects real iOS/iPadOS
 * WebKit at runtime and a matching CSS rule in globals.css (`.is-ios-webkit input,
 * select, textarea { font-size: max(16px, 1em) !important }`) pins fields back up to
 * 16px there, and only there. Every other platform keeps this smaller declared size.
 * The placeholder goes smaller still, via `::placeholder`'s own independent font-size.
 */
const fieldControl =
  'w-full rounded-[var(--radius-input)] border border-border bg-background px-4 text-base text-foreground sm:text-sm transition-colors duration-200 placeholder:text-[15px] sm:placeholder:text-[13px] placeholder:text-foreground-disabled hover:border-border-medium focus:border-jk-600 focus:ring-2 focus:ring-jk-600/20 focus:outline-none disabled:bg-surface disabled:text-foreground-disabled aria-[invalid=true]:border-jk-600';

/**
 * Wiring that a `Field` hands down to whichever control sits inside it.
 *
 * A visible `<label htmlFor>` names the control, but it says nothing about the hint
 * or the error sitting beside it — those are just paragraphs a screen reader user
 * never hears while the control has focus. `aria-describedby` is what associates
 * them, and it has to be set on the control, not on the wrapper. Passing it through
 * context means the association cannot be forgotten at a call site: every `Input`,
 * `Textarea` and `Select` inside a `Field` gets it for free.
 */
interface FieldWiring {
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldWiring | null>(null);

interface AriaControlProps {
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'input'>['aria-invalid'];
  required?: boolean;
}

/** Merges the enclosing field's wiring with any props the caller set explicitly. */
function useFieldProps<T extends AriaControlProps>(props: T): T {
  const field = useContext(FieldContext);
  if (!field) return props;

  const describedBy = [field.describedBy, props['aria-describedby']].filter(Boolean).join(' ');

  return {
    ...props,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    required: props.required ?? field.required,
  };
}

/**
 * Label is always rendered and always visible. Placeholder-as-label fails for screen
 * readers, fails on autofill, and fails the moment a user starts typing — it is not
 * used anywhere on this site.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  compact = false,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Tighter label and spacing for forms squeezed into a small card, e.g. a banner's hero form. */
  compact?: boolean;
  children: ReactNode;
}) {
  const uid = useId();
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  // Error first: it is the more urgent of the two when both are present.
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ describedBy, invalid: Boolean(error), required }}>
      <div className={compact ? 'space-y-2 lg:space-y-0.5' : 'space-y-2'}>
        <label
          htmlFor={htmlFor}
          className={cx('block font-semibold text-foreground', compact ? 'text-sm lg:text-xs' : 'text-sm')}
        >
          {label}
          {/*
            The asterisk is decoration — `required` on the control is what actually
            conveys the constraint, so the glyph is hidden rather than read out as
            "star" before every required field.
          */}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-[var(--accent-ink)]">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-foreground-muted">
            {hint}
          </p>
        ) : null}
        {children}
        {error ? (
          <p id={errorId} className="text-sm font-medium text-[var(--accent-ink)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export function Input({
  compact = false,
  ...props
}: ComponentProps<'input'> & { compact?: boolean }) {
  const { className, ...rest } = useFieldProps(props);
  return (
    <input
      className={cx(
        fieldControl,
        compact ? 'h-12 lg:h-10 lg:px-3 lg:text-[11px] lg:placeholder:text-[10px]' : 'h-12',
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea(props: ComponentProps<'textarea'>) {
  const { className, ...rest } = useFieldProps(props);
  return <textarea className={cx(fieldControl, 'min-h-32 py-3', className)} {...rest} />;
}

export function Select({
  compact = false,
  ...props
}: ComponentProps<'select'> & { compact?: boolean }) {
  const { className, children, ...rest } = useFieldProps(props);
  return (
    <select
      className={cx(fieldControl, compact ? 'h-12 pr-10 lg:h-10 lg:pr-9 lg:pl-3 lg:text-[11px]' : 'h-12 pr-10', className)}
      {...rest}
    >
      {children}
    </select>
  );
}
