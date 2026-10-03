import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Handshake } from 'lucide-react';
import { Callout, Section } from '@/components/kit';

export function FranchiseBand() {
  return (
    <Section tone="plain" labelledBy="home-franchise-heading">
      <h2 id="home-franchise-heading" className="sr-only">
        Franchise opportunities
      </h2>
      <Callout
        icon={Handshake}
        title="Run a Jetking centre in your city"
        action={
          <Link
            href={'/franchise' as Route}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-6 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
          >
            Explore franchise
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      >
        Partner with India&rsquo;s most trusted brand &mdash; 78 years of brand equity, a countrywide network and end-to-end support.
      </Callout>
    </Section>
  );
}
