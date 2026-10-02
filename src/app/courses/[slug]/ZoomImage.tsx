'use client';

import { useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * A document specimen that is too detailed to read at card size: shows the image large and opens it
 * full-size in a native modal <dialog> (Esc closes, focus is trapped and restored by the browser).
 * Stays on the page — nothing navigates.
 */
export function ZoomImage({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-white ring-1 ring-[var(--cp-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cp-red)]"
        aria-label={`Enlarge: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local specimen, shown contained at full resolution */}
        <img src={src} alt={alt} className="aspect-[3/4] w-full object-contain" />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1.5 text-[12.5px] font-bold text-white shadow-md">
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
          Enlarge
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
          aria-label="Close"
          className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-[#111827] text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- local specimen */}
        <img src={src} alt={alt} className="mx-auto max-h-[86vh] w-auto max-w-full object-contain" />
      </dialog>
    </>
  );
}
