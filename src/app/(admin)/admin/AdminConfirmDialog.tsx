'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

/**
 * Replaces the browser's native `window.confirm()` for destructive actions
 * (record/lead delete) — same tokens as the rest of the admin, not the
 * generic `components/ui/dialog.tsx` (that one targets a different,
 * unused-here token set: `border-line`, `text-ink`, etc.).
 */
export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  pendingLabel,
  cancelLabel = 'Cancel',
  /** 'destructive' (default) is the red delete/disable/discard treatment used
   *  everywhere so far; 'default' is the brand-accent treatment for a
   *  confirm step that isn't inherently destructive (e.g. a role change,
   *  which could just as easily be a promotion). */
  tone = 'destructive',
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  tone?: 'destructive' | 'default';
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#090c15]/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-border bg-card p-6 shadow-[0_28px_70px_-20px_rgb(9_12_21/0.45)] focus:outline-none sm:p-7">
          <Dialog.Title className="text-lg font-extrabold tracking-[-0.02em] text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border-medium px-5 text-sm font-semibold text-foreground-secondary transition-colors hover:border-border-strong hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1424]"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className={`min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgb(199_20_28/0.6)] transition-[filter,transform] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c7141c] disabled:opacity-45 ${
                tone === 'default'
                  ? 'bg-gradient-to-b from-[#ea1c24] to-[#c7141c]'
                  : 'bg-gradient-to-b from-[#ea1c24] to-[#c7141c]'
              }`}
            >
              {pending ? (pendingLabel ?? (tone === 'default' ? 'Saving…' : 'Deleting…')) : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
