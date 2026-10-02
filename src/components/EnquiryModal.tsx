'use client';

import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialog } from '@/components/useDialog';
import { Button } from '@/components/ui';
import { QuickEnquiryForm, type EnquiryCentre, type QuickEnquiryStatus } from '@/components/QuickEnquiryForm';

export type { EnquiryCentre };

/**
 * Quick enquiry in a modal: name, mobile, state, centre. The short form for a visitor who just
 * wants a counsellor to call — the full /enquiry form stays for people with more to say. The
 * form itself is `QuickEnquiryForm`, shared with the centres banner; `source` says which button
 * opened the modal.
 *
 * The form unmounts when the modal closes, so each opening starts fresh (no stale thank-you).
 */
export function EnquiryModal({
  open,
  onClose,
  centres,
  source,
}: {
  open: boolean;
  onClose: () => void;
  centres: EnquiryCentre[];
  /** Which surface opened the modal, e.g. `home-hero-modal`. */
  source: string;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<QuickEnquiryStatus>('idle');
  const done = status === 'done';

  function handleClose() {
    onClose();
    setStatus('idle');
  }

  useDialog(open, handleClose, dialogRef, { modal: true });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/55" onClick={handleClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="sheet-up relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[440px] sm:rounded-[20px] sm:border-b sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 grid h-11 w-11 cursor-pointer place-items-center rounded-full sm:top-3 sm:right-3 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Names the dialog; the thank-you panel supplies the visible heading once the form is done. */}
        <p
          id={`${id}-title`}
          className={
            done ? 'sr-only' : 'pr-8 font-display text-[22px] font-extrabold text-foreground sm:text-[24px]'
          }
        >
          Enquire now
        </p>
        {done ? null : (
          <p className="mt-2 mb-5 text-[15px] leading-relaxed text-foreground-secondary">
            Tell us where you are and a Jetking counsellor from your nearest centre will call you.
          </p>
        )}

        <QuickEnquiryForm
          centres={centres}
          source={source}
          onStatusChange={setStatus}
          successAction={
            <Button className="mt-6" onClick={handleClose}>
              Close
            </Button>
          }
        />
      </div>
    </div>,
    document.body,
  );
}
