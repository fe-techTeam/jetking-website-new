'use client';

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cx } from './ui';

/**
 * The site's one carousel.
 *
 * There were four copies of this component — student testimonials, professional
 * success stories, and two franchise variants — each with the same four
 * accessibility defects. Consolidating them means the fixes below exist once:
 *
 *   • 2.2.2 Pause, Stop, Hide — a rotation that starts automatically and runs
 *     longer than five seconds needs a real pause control. Pausing on hover and
 *     focus (which the old copies did) is not a mechanism a keyboard or screen
 *     reader user can find, so there is now an explicit Pause/Play button.
 *   • 2.3.3 / user preference — `prefers-reduced-motion: reduce` disables autoplay
 *     outright and drops the slide transition, rather than merely shortening it.
 *   • 4.1.2 Name, Role, Value — the dots used `role="tab"` without any
 *     `tabpanel`, `aria-controls`, or arrow-key handling, which is an invalid
 *     tab pattern. They are now plain buttons carrying `aria-current`, and the
 *     region uses the carousel roledescription pattern from the ARIA APG.
 *   • 2.5.8 Target Size (Minimum) — the dots were 8×8 CSS px. The visual dot is
 *     unchanged; each one now sits inside a 24×24 transparent hit area.
 *
 * Off-screen slides are `inert`, not merely `aria-hidden`, so a link inside a
 * slide the user cannot see is also a link they cannot tab into.
 */

export interface CarouselProps<T> {
  /** `readonly` so `as const` data tables can be passed without a copy. */
  items: readonly T[];
  /** Stable key per item — used for React keys and the dot controls. */
  itemKey: (item: T, index: number) => string;
  /** Announced as the slide's accessible name, e.g. the speaker's name. */
  itemLabel: (item: T, index: number) => string;
  children: (item: T, index: number) => ReactNode;
  /** Accessible name for the whole carousel region. */
  label: string;
  /** Rotation interval in ms. `0` disables autoplay. */
  interval?: number;
  /** Show the per-slide dot buttons. Prev/Next (and Pause) stay either way. Defaults to `true`. */
  dots?: boolean;
  className?: string;
  /** Styling hook for the control row — the dark and light skins differ here. */
  classNames?: {
    viewport?: string;
    controls?: string;
    dotActive?: string;
    dotIdle?: string;
    button?: string;
  };
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Live media-query subscription — a preference toggled mid-session takes effect
 * without a reload. `useSyncExternalStore` reads it in-render on the client and
 * falls back to "no preference" on the server, so autoplay is never assumed off
 * during SSR and never flashes on after hydration.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function Carousel<T>({
  items,
  itemKey,
  itemLabel,
  children,
  label,
  interval = 7000,
  dots = true,
  className,
  classNames,
}: CarouselProps<T>) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const viewportId = useId();

  const count = items.length;
  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  const autoplayable = count > 1 && interval > 0 && !reducedMotion;
  const running = autoplayable && !userPaused && !hoverPaused;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(timer);
  }, [running, go, interval]);

  // Clamp when the item list shrinks under the current index.
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  if (count === 0) return null;

  return (
    <div
      className={cx('relative min-w-0', className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
    >
      <div id={viewportId} className={cx('overflow-x-clip', classNames?.viewport)}>
        <div
          className={cx(
            'flex items-stretch',
            reducedMotion
              ? ''
              : 'transition-transform duration-500 ease-[var(--ease-out-soft,cubic-bezier(0.22,1,0.36,1))]',
          )}
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <div
              key={itemKey(item, i)}
              className="flex w-full shrink-0 flex-col"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${itemLabel(item, i)}`}
              inert={i !== safeIndex}
            >
              {children(item, i)}
            </div>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <div
          className={cx(
            'mt-4 flex items-center gap-3',
            dots ? 'justify-between' : 'justify-end',
            classNames?.controls,
          )}
        >
          {dots ? (
            <div className="flex items-center gap-0.5">
              {items.map((item, i) => (
                <button
                  key={itemKey(item, i)}
                  type="button"
                  aria-label={`Go to slide ${i + 1} of ${count}: ${itemLabel(item, i)}`}
                  aria-current={i === safeIndex ? 'true' : undefined}
                  aria-controls={viewportId}
                  onClick={() => setIndex(i)}
                  /* The button is the touch target (44×44 on phones, 24×24 from sm); the visible dot is the span. */
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-full sm:h-6 sm:w-6"
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none',
                      i === safeIndex
                        ? cx('w-6', classNames?.dotActive ?? 'bg-white')
                        : cx('w-2', classNames?.dotIdle ?? 'bg-white/35'),
                    )}
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            {autoplayable ? (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? `Resume ${label} rotation` : `Pause ${label} rotation`}
                className={cx(
                  'grid h-11 w-11 cursor-pointer place-items-center rounded-full border',
                  classNames?.button ??
                    'border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20',
                )}
              >
                {userPaused ? (
                  <Play className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <Pause className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                )}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Previous slide"
              aria-controls={viewportId}
              onClick={() => go(-1)}
              className={cx(
                'grid h-11 w-11 cursor-pointer place-items-center rounded-full border',
                classNames?.button ??
                  'border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20',
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              aria-controls={viewportId}
              onClick={() => go(1)}
              className={cx(
                'grid h-11 w-11 cursor-pointer place-items-center rounded-full border',
                classNames?.button ??
                  'border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20',
              )}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {/*
        One live region for the whole carousel, outside the slide track. The old
        copies wrapped the track itself in `aria-live` with `aria-atomic`, which
        re-read every slide — including the hidden ones — on each rotation.

        Per the ARIA APG carousel pattern this is `off` while the carousel is
        rotating on its own and `polite` once it is paused or driven by hand: a
        region that interrupts every seven seconds unprompted is worse than none.
      */}
      <p aria-live={running ? 'off' : 'polite'} className="sr-only">
        {`Slide ${safeIndex + 1} of ${count}: ${itemLabel(items[safeIndex]!, safeIndex)}`}
      </p>
    </div>
  );
}
