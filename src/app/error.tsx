'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { sendClientError } from '@/lib/client-error';

/**
 * Shown when a page throws while rendering. The site header and footer stay; only the page area is replaced.
 * The error is reported once (see `lib/client-error`), and the visitor can retry or leave.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    sendClientError(error, 'error-boundary');
  }, [error]);

  return (
    <div className="shell py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-[12px] font-bold tracking-[0.1em] text-[var(--accent-ink)] uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Something went wrong
        </p>
        <h1 className="page-title mt-5 text-balance text-foreground">We hit a problem loading this page</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-foreground-secondary">
          It is on our side, and we have been told. Try again, or head back to the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[var(--theme-accent)] px-7 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--theme-hairline-medium)] px-7 text-[15px] font-bold text-foreground transition-colors hover:border-[var(--accent)]"
          >
            Back to home
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-[13px] text-foreground-muted">Reference: {error.digest}</p> : null}
      </div>
    </div>
  );
}
