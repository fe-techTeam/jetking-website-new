import type { ReactNode } from 'react';

export interface Step {
  title: string;
  body: ReactNode;
}

/**
 * Numbered steps: a vertical rail on phones, a horizontal row on desktop. Numbers come from a CSS
 * counter, so the markup stays an ordinary ordered list for screen readers.
 */
export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="kit kit-steps relative grid gap-7 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] lg:gap-6" style={{ '--n': steps.length } as React.CSSProperties}>
      {steps.map((s, i) => (
        <li key={s.title} className="kit-step relative flex gap-4 lg:flex-col lg:gap-5">
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-10 bottom-[-1.75rem] left-5 w-px -translate-x-1/2 bg-[var(--k-line-strong)] lg:top-5 lg:right-[-1.5rem] lg:bottom-auto lg:left-10 lg:h-px lg:w-auto lg:translate-x-0"
            />
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-[var(--k-ink)]">{s.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--k-ink-2)]">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
