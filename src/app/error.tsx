'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { sendClientError } from '@/lib/client-error';
import { fill } from '@/lib/content/copy/define';
import { useSiteCopy } from '@/components/providers/site-copy';

/**
 * Shown when a page throws while rendering. The site header and footer stay; only the page area is replaced.
 * The error is reported once (see `lib/client-error`), and the visitor can retry or leave.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const copy = useSiteCopy();

  useEffect(() => {
    sendClientError(error, 'error-boundary');
  }, [error]);

  return (
    <div className="shell py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-[12px] font-bold tracking-[0.1em] text-[var(--accent-ink)] uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {copy['errors.route.eyebrow']}
        </p>
        <h1 className="page-title mt-5 text-balance text-foreground">{copy['errors.route.title']}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-foreground-secondary">
          {copy['errors.route.body']}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[var(--theme-accent)] px-7 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
          >
            {copy['errors.route.retryLabel']}
          </button>
          <Link
            href={copy['errors.route.homeHref'] as Route}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--theme-hairline-medium)] px-7 text-[15px] font-bold text-foreground transition-colors hover:border-[var(--accent)]"
          >
            {copy['errors.route.homeLabel']}
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-[13px] text-foreground-muted">{fill(copy['errors.route.reference'], { digest: error.digest })}</p> : null}
      </div>
    </div>
  );
}
