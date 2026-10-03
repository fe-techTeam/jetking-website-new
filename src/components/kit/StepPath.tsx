import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface PathStep {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
}

/**
 * A journey in steps: a large icon disc per step with a number badge, joined by arrows on desktop
 * and a vertical rail on phones. The markup is an ordinary ordered list; the arrows and rail are
 * decorative.
 */
export function StepPath({ steps }: { steps: PathStep[] }) {
  return (
    <ol
      className="kit grid gap-9 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))] lg:gap-x-14"
      style={{ '--n': steps.length } as React.CSSProperties}
    >
      {steps.map(({ icon: Icon, title, body }, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={title} className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-6 lg:text-center">
            <div className="relative shrink-0">
              <span
                aria-hidden="true"
                className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border border-[color-mix(in_srgb,var(--k-red-fill)_22%,transparent)] bg-[var(--k-red-wash)] text-[var(--k-red)] shadow-[0_8px_20px_-10px_color-mix(in_srgb,var(--k-red-fill)_55%,transparent)] lg:h-24 lg:w-24"
              >
                <Icon className="h-8 w-8 lg:h-10 lg:w-10" strokeWidth={1.6} />
              </span>
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--k-red-fill)] text-[13px] font-extrabold text-white ring-4 ring-[var(--k-bg)]"
              >
                {i + 1}
              </span>
            </div>

            <div className="min-w-0 pt-1 lg:pt-0">
              <h3 className="text-[16px] font-extrabold tracking-[0.06em] text-[var(--k-ink)] uppercase lg:text-[17px]">{title}</h3>
              <div className="mt-2 text-[15px] leading-relaxed text-[var(--k-ink-2)] lg:mx-auto lg:w-fit lg:text-left">{body}</div>
            </div>

            {!last ? (
              <>
                {/* phone: rail down to the next disc */}
                <span
                  aria-hidden="true"
                  className="absolute top-[4.9rem] bottom-[-2.3rem] left-9 w-px -translate-x-1/2 bg-[var(--k-line-strong)] lg:hidden"
                />
                {/* desktop: arrow in the gap */}
                <span
                  aria-hidden="true"
                  className="absolute top-12 -right-[2.1rem] z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--k-red)] lg:grid"
                >
                  <ArrowRight className="h-6 w-6" strokeWidth={2.25} />
                </span>
              </>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
