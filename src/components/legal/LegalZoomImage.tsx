'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import { fill } from '@/lib/content/copy/define';

/**
 * Legal-document specimen (forms, tables): shown contained on a white ground, click to open
 * full-size in a native `<dialog>` (Esc closes; focus trapped/restored by the browser).
 */
export function LegalZoomImage({
  src,
  alt,
  width,
  height,
  labels,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  labels: { enlarge: string; enlargeLabel: string; close: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <figure className="mt-5 overflow-hidden rounded-[12px] border border-[var(--dc-hairline-strong)] bg-white p-2 sm:p-3">
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          aria-label={fill(labels.enlargeLabel, { alt })}
          className="group relative flex w-full cursor-zoom-in justify-center rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(min-width: 1280px) 1280px, (min-width: 768px) 90vw, 100vw"
            className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
          />
          <span
            aria-hidden="true"
            className="absolute right-2.5 bottom-2.5 grid h-9 w-9 place-items-center rounded-full bg-ink-900/78 text-white opacity-100 shadow-md transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"
          >
            <ZoomIn className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        </button>
      </figure>

      <dialog
        ref={dialog}
        aria-label={alt}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[92vh] w-[min(96vw,72rem)] rounded-2xl border-0 bg-white p-3 backdrop:bg-scrim/70 open:flex open:flex-col"
      >
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={labels.close}
          className="absolute top-3 right-3 z-[1] grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-tile-dark text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="96vw"
          className="mx-auto h-auto max-h-[86vh] w-auto max-w-full object-contain"
        />
      </dialog>
    </>
  );
}
