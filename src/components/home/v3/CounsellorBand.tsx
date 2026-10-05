import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Headphones, Phone } from 'lucide-react';
import { Callout, Section } from '@/components/kit';
import { TrackedAnchor } from '@/components/TrackedAnchor';
import { siteConfig } from '@/lib/site';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * A mid-page prompt for visitors who have seen the courses and the proof but are not ready to pick:
 * talk to a counsellor. Sits after the placements, where intent is highest, so the lead form at the foot
 * of the page is not the only way to ask.
 */
export function CounsellorBand({ copy }: { copy: HomeCopy }) {
  const helplineHref = `tel:${siteConfig.helpline.replace(/[^\d+]/g, '')}`;

  return (
    <Section tone="plain" labelledBy="home-counsellor-heading">
      <h2 id="home-counsellor-heading" className="sr-only">
        {copy['counsellor.srHeading']}
      </h2>
      <Callout
        icon={Headphones}
        title={copy['counsellor.title']}
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={copy['counsellor.cta.href'] as Route}
              className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold"
            >
              {copy['counsellor.cta.label']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
            <TrackedAnchor
              href={helplineHref}
              event="phone_clicked"
              props={{ type: 'home-counsellor' }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-5 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
            >
              <Phone className="h-4 w-4 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
              {siteConfig.helpline}
            </TrackedAnchor>
          </div>
        }
      >
        {copy['counsellor.body']}
      </Callout>
    </Section>
  );
}
