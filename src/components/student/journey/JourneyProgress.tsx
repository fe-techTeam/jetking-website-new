'use client';

import type { StudentJourneyStep } from '@/persona/studentJourney';
import { PROGRESS_STEP_LABELS, PROGRESS_STEPS, stepIndex } from '@/persona/studentJourney';
import { Check } from 'lucide-react';
import { fill } from '@/lib/content/copy/define';
import type { StudentCopy } from '@/lib/content/copy/pages/student';

/**
 * Journey progress bar.
 *
 * The visible label is hidden below the `xs` breakpoint to keep five steps on a
 * narrow phone, so each step also carries an `sr-only` name and status. Without
 * it a screen-reader user on a small viewport hears "1 2 3 4 5" and nothing else.
 */
export function JourneyProgress({ current, copy }: { current: StudentJourneyStep; copy: StudentCopy }) {
  const currentIdx = stepIndex(current);

  return (
    <nav aria-label={copy['progress.ariaLabel']} className="w-full">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {PROGRESS_STEPS.map((step, i) => {
          const idx = stepIndex(step);
          const done = currentIdx > idx || current === 'complete';
          const active = current === step;
          const label = PROGRESS_STEP_LABELS[step];

          return (
            <li
              key={step}
              className="flex min-w-0 flex-1 items-center"
              aria-current={active ? 'step' : undefined}
            >
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <span
                  aria-hidden="true"
                  className={[
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-colors sm:h-9 sm:w-9',
                    done
                      ? 'bg-[var(--dc-accent)] text-white'
                      : active
                        ? 'border-2 border-[var(--dc-accent-soft)] bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]'
                        : 'border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink-muted)]',
                  ].join(' ')}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    'hidden text-[12px] font-semibold tracking-wide uppercase xs:block sm:text-[12px]',
                    active ? 'text-[var(--dc-accent-soft)]' : 'text-[var(--dc-ink-muted)]',
                  ].join(' ')}
                >
                  {label}
                </span>
                <span className="sr-only">
                  {fill(copy['progress.step'], {
                    n: i + 1,
                    total: PROGRESS_STEPS.length,
                    label,
                    status: done ? copy['progress.done'] : active ? copy['progress.current'] : copy['progress.pending'],
                  })}
                </span>
              </div>
              {i < PROGRESS_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={[
                    'mx-0.5 h-px flex-1 sm:mx-1',
                    done ? 'bg-[var(--dc-accent-soft)]/60' : 'bg-[var(--dc-hairline-strong)]/40',
                  ].join(' ')}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
