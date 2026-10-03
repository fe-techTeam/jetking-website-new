'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, X } from 'lucide-react';
import { useDialog } from '@/components/useDialog';
import { useHydrated } from '@/components/useHydrated';
import { cx } from '@/components/ui';
import type { Leader } from './data';
import { LeaderAvatar } from './LeaderAvatar';

/**
 * "Read more" trigger + the modal it opens, for leadership cards that carry
 * real bio copy. The card face itself never shows bio text — this is the
 * only way to reach it. Same overlay/focus-trap mechanics as the site header's
 * nav drawer (`useDialog`), just centred instead of a side panel.
 *
 * The portaled panel deliberately uses the global `--color-*` tokens
 * (`bg-background`, `text-foreground`, …), not `.dark-canvas`'s `--dc-*` ones —
 * `createPortal` renders to `document.body`, outside the `.dark-canvas`
 * wrapper that scopes `--dc-*`, so those custom properties resolve to nothing
 * out there (transparent panel, invisible text). The trigger button below stays
 * on `--dc-*` since it renders in place, inside the card, inside that scope.
 */
export function LeaderDetailModal({ leader }: { leader: Leader }) {
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useDialog(open, close, panelRef);

  const modal = mounted
    ? createPortal(
        <>
          <div
            aria-hidden="true"
            className={cx(
              'fixed inset-0 z-[90] bg-black/60 backdrop-blur-[2px] transition-opacity duration-200',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            onClick={close}
          />

          <div
            className={cx(
              'fixed inset-0 z-[95] grid place-items-end transition-opacity duration-200 sm:place-items-center sm:p-4',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal={open || undefined}
              aria-label={leader.name}
              inert={!open}
              className={cx(
                'relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left shadow-xl shadow-black/35 transition-transform duration-300 ease-[var(--ease-out-soft)] sm:max-h-[85vh] sm:max-w-lg sm:rounded-[24px] sm:border-b sm:p-8',
                open ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:translate-y-0 sm:scale-95',
              )}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-surface text-foreground-muted transition-colors hover:bg-border hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-border sm:h-28 sm:w-28">
                  <LeaderAvatar leader={leader} />
                </div>
                <h3 className="mt-4 font-display text-[20px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[22px]">
                  {leader.name}
                </h3>
                {leader.role ? (
                  <p className="mt-1 text-[14px] font-bold text-[var(--accent-ink)]">{leader.role}</p>
                ) : null}
              </div>

              {leader.bio ? (
                <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-foreground-secondary sm:text-[14.5px]">
                  {leader.bio.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="tap mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 text-[13px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:text-[var(--dc-ink)]"
      >
        Read more
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      </button>
      {modal}
    </>
  );
}
