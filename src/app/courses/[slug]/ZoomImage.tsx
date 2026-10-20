'use client';

import { useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { fill } from '@/lib/content/copy/define';

/**
 * A document specimen that is too detailed to read at card size: shows the image large and opens it
 * full-size in a native modal <dialog> (Esc closes, focus is trapped and restored by the browser).
 * Stays on the page — nothing navigates.
 */
export function ZoomImage({
  src,
  alt,
  caption,
  labels,
  aspect = 'aspect-[3/4]',
}: {
  src: string;
  alt: string;
  caption: string;
  /** Button wording; `enlargeLabel` may use an `{alt}` token. */
  labels: { enlarge: string; enlargeLabel: string; close: string };
  /** Tailwind aspect class for the thumbnail frame. */
  aspect?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-white ring-1 ring-[var(--cp-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cp-red)]"
        aria-label={fill(labels.enlargeLabel, { alt })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local specimen, shown contained at full resolution */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className={`${aspect} w-full object-contain`} />
        <span
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 grid h-9 w-9 place-items-center rounded-full bg-ink-900/78 text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100"
        >
          <ZoomIn className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label={caption}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[92vh] w-[min(92vw,56rem)] rounded-2xl bg-white p-3 backdrop:bg-black/70"
      >
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={labels.close}
          className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-[#111827] text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- local specimen */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="mx-auto max-h-[86vh] w-auto max-w-full object-contain" />
      </dialog>
    </>
  );
}
