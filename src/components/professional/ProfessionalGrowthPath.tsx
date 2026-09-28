'use client';

import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { GROWTH_STEPS } from './data';

function StepNode({
  step,
  index,
  isFinal,
  size = 'md',
}: {
  step: (typeof GROWTH_STEPS)[number];
  index: number;
  isFinal: boolean;
  size?: 'md' | 'lg';
}) {
  const dimension = size === 'lg' ? 'h-14 w-14 xl:h-16 xl:w-16' : 'h-12 w-12';
  const iconSize = size === 'lg' ? 'h-5 w-5 xl:h-6 xl:w-6' : 'h-5 w-5';

  return (
    <span
      aria-hidden="true"
      className={[
        'relative z-10 grid shrink-0 place-items-center rounded-full border-2 bg-[var(--pro-card)]',
        dimension,
        isFinal
          ? 'pro-path-node-final border-[var(--pro-accent-soft)] text-[var(--pro-accent-soft)]'
          : 'border-[var(--pro-hairline)] text-[var(--pro-accent-soft)]',
      ].join(' ')}
    >
      <step.icon className={iconSize} strokeWidth={1.75} />
      <span
        className={[
          'absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full text-[12px] font-extrabold',
          isFinal
            ? 'bg-[var(--pro-accent)] text-white'
            : 'border border-[var(--pro-hairline)] bg-[var(--pro-surface)] text-[var(--pro-ink-muted)]',
        ].join(' ')}
      >
        {index + 1}
      </span>
    </span>
  );
}

function StepCopy({
  step,
  index,
  isFinal,
  align = 'left',
}: {
  step: (typeof GROWTH_STEPS)[number];
  index: number;
  isFinal: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'min-w-0'}>
      <p
        className={[
          'text-[12px] font-bold tracking-[0.06em] uppercase',
          isFinal ? 'text-[var(--pro-accent-soft)]' : 'text-[var(--pro-ink-muted)]',
        ].join(' ')}
      >
        Step {index + 1}
      </p>
      <h3
        className={[
          'mt-1 font-display font-extrabold text-[var(--pro-ink)]',
          align === 'center' ? 'text-[15px] leading-snug sm:text-[16px]' : 'text-[17px] sm:text-[18px]',
        ].join(' ')}
      >
        {step.title}
      </h3>
      <p
        className={[
          'mt-1.5 leading-relaxed text-[var(--pro-ink-secondary)]',
          align === 'center' ? 'text-[13px] sm:text-[14px]' : 'text-[14px]',
        ].join(' ')}
      >
        {step.detail}
      </p>
    </div>
  );
}

export function ProfessionalGrowthPath() {
  const finalIndex = GROWTH_STEPS.length - 1;
  const stepCount = GROWTH_STEPS.length;
  const { ref: trackRef, edge, scrollByItem } = useScrollTrack<HTMLOListElement>();

  return (
    <section
      className="relative z-10 scroll-mt-24 pb-10 pt-8 xs:pb-12 xs:pt-10 sm:pb-14 sm:pt-12"
      aria-labelledby="pro-growth-heading"
    >
      <div className="shell">
        <header className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold tracking-[0.06em] text-[var(--pro-accent-soft)] uppercase">
              Career progression
            </p>
            <h2
              id="pro-growth-heading"
              className="mt-2 font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--pro-ink)] sm:text-[28px]"
            >
              Your Career Growth Path with Jetking
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--pro-ink-secondary)] sm:text-[15px]">
              From your current role to your next promotion — five practical milestones that fit around
              a full-time schedule.
            </p>
          </div>
          <ScrollNavButtons
            edge={edge}
            onPrev={() => scrollByItem(-1)}
            onNext={() => scrollByItem(1)}
            label="milestones"
            className="mb-1 shrink-0 lg:hidden"
          />
        </header>

        <div
          className={[
            'pro-journey-panel mt-8 overflow-hidden rounded-[28px] px-5 py-8 xs:rounded-[32px] xs:px-6 sm:mt-10 sm:px-8 sm:py-10',
            
          ].join(' ')}
        >
          {/* Mobile / tablet — swipeable step cards */}
          <ol
            ref={trackRef}
            aria-label="Career growth milestones"
            tabIndex={0}
            className="pro-path-track -mx-5 flex gap-4 overflow-x-auto px-5 pb-1 lg:hidden"
          >
            {GROWTH_STEPS.map((step, index) => {
              const isFinal = index === finalIndex;

              return (
                <li
                  key={`mobile-${step.title}`}
                  className={[
                    'pro-path-step-card flex w-[min(82vw,300px)] shrink-0 flex-col rounded-[20px] p-5 xs:w-[min(78vw,320px)]',
                    isFinal ? 'pro-path-step-card-final' : '',
                  ].join(' ')}
                >
                  <StepNode step={step} index={index} isFinal={isFinal} />
                  <div className="mt-4">
                    <StepCopy step={step} index={index} isFinal={isFinal} align="left" />
                  </div>
                  <span className="sr-only">
                    {`Step ${index + 1} of ${stepCount}: ${step.title} — ${step.detail}`}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="mt-3 text-center text-[12px] font-semibold tracking-[0.04em] text-[var(--pro-ink-muted)] uppercase lg:hidden">
            Swipe to see all {stepCount} milestones
          </p>

          {/* Desktop — rail sits in the node row (always vertically centered) */}
          <div className="hidden lg:block">
            <div className="relative flex items-center" aria-hidden="true">
              <span className="pro-path-rail absolute inset-x-[10%] top-1/2 z-0 h-px -translate-y-1/2" />
              <span className="pro-path-rail-accent absolute top-1/2 right-[10%] left-[70%] z-0 h-px -translate-y-1/2" />

              <div className="relative z-10 grid w-full grid-cols-5 gap-x-3 xl:gap-x-4">
                {GROWTH_STEPS.map((step, index) => (
                  <div key={`node-${step.title}`} className="flex justify-center">
                    <StepNode step={step} index={index} isFinal={index === finalIndex} size="lg" />
                  </div>
                ))}
              </div>
            </div>

            <ol
              aria-label="Career growth milestones"
              className="mt-4 grid grid-cols-5 gap-x-3 xl:gap-x-4"
            >
              {GROWTH_STEPS.map((step, index) => {
                const isFinal = index === finalIndex;

                return (
                  <li
                    key={`copy-${step.title}`}
                    className={[
                      'flex flex-col items-center px-2 text-center',
                      isFinal ? 'pro-path-step-card-final rounded-[18px] px-3 py-3 xl:px-4' : '',
                    ].join(' ')}
                    aria-current={isFinal ? 'step' : undefined}
                  >
                    <StepCopy step={step} index={index} isFinal={isFinal} align="center" />
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
