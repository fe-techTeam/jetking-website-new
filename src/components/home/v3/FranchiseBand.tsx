import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Handshake } from 'lucide-react';
import { Callout, Section } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

export function FranchiseBand({ copy }: { copy: HomeCopy }) {
  return (
    <Section tone="plain" labelledBy="home-franchise-heading">
      <h2 id="home-franchise-heading" className="sr-only">
        {copy['franchise.srHeading']}
      </h2>
      <Callout
        icon={Handshake}
        title={copy['franchise.title']}
        action={
          <Link
            href={copy['franchise.cta.href'] as Route}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-6 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
          >
            {copy['franchise.cta.label']}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      >
        {copy['franchise.body']}
      </Callout>
    </Section>
  );
}
