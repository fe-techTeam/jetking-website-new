import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Handshake } from 'lucide-react';

export function FranchiseBand() {
  return (
    <section className="py-8 sm:py-10" aria-labelledby="home-franchise-heading">
      <div className="shell">
        <div className="flex flex-col gap-5 rounded-[24px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] p-6 shadow-[var(--dc-shadow)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'var(--theme-ai-tint)', color: 'var(--theme-ai-ink)' }}
            >
              <Handshake className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <h2
                id="home-franchise-heading"
                className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]"
              >
                Run a Jetking centre in your city
              </h2>
              <p className="mt-1.5 max-w-[56ch] text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
                Partner with India&rsquo;s most trusted brand &mdash; 78 years of brand equity, a countrywide network and end-to-end support.
              </p>
            </div>
          </div>
          <Link
            href={'/franchise' as Route}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-[var(--dc-hairline-strong)] px-6 py-3 text-[15px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
          >
            Explore franchise
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
