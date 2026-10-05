import Link from 'next/link';
import { EnquiryLink } from '@/components/EnquirySheet';
import { Section } from '@/components/kit';
import type { Route } from 'next';
import { ArrowRight, Building2, MessageCircle, Phone } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { fill } from '@/lib/content/copy/define';
import type { centresCopy } from '@/lib/content/copy/pages/centres';
import { CentresHero } from './CentresHero';
import { CentresIndex } from './CentresIndex';

type CitySummary = { slug: string; name: string; state: string };
type CentreSummary = {
  slug: string;
  name: string;
  citySlug: string;
  addressLine: string;
  locality: string;
  state: string;
  pincode: string;
  phone?: string;
};

function CentresBottomCta({ copy }: { copy: typeof centresCopy.defaults }) {
  return (
    <Section tone="wash" deco="glow" labelledBy="centres-cta">
        <div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-12">
            <div>
              <p className="k-eyebrow">
                {copy['directoryCta.eyebrow']}
              </p>
              <h2
                id="centres-cta"
                className="section-title mt-3 font-display text-[var(--dc-ink)]"
              >
                {copy['directoryCta.title']}
              </h2>
              <p className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                {fill(copy['directoryCta.body'], { brand: siteConfig.name })}
              </p>
              <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
                <li>
                  <a
                    href={copy['directoryCta.phoneHref']}
                    className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[var(--dc-ink-secondary)] transition-colors hover:text-[var(--dc-ink)]"
                  >
                    <Phone
                      className="h-4 w-4 text-[var(--dc-accent-soft)]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {copy['directoryCta.phoneLabel']}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                  <MessageCircle
                    className="h-4 w-4 text-[var(--dc-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {copy['directoryCta.point1']}
                </li>
                <li className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                  <Building2
                    className="h-4 w-4 text-[var(--dc-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {copy['directoryCta.point2']}
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <EnquiryLink
                source="centres-cta"
                className="group/enq inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 xs:text-[15px]"
              >
                <span>{copy['directoryCta.enquire']}</span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/enq:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </EnquiryLink>
              <Link
                href={copy['directoryCta.browseHref'] as Route}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--dc-hairline-strong)] px-6 py-3 text-[14.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]/60 hover:bg-[var(--dc-accent-tint)] xs:text-[15px]"
              >
                {copy['directoryCta.browse']}
              </Link>
            </div>
          </div>
        </div>
      </Section>
  );
}

export function CentresLanding({
  cities,
  centres,
  initialQuery = '',
  copy,
}: {
  copy: typeof centresCopy.defaults;
  cities: CitySummary[];
  centres: CentreSummary[];
  initialQuery?: string;
}) {
  return (
    <div className="centres-page relative">
      <CentresHero
        copy={copy}
        cityCount={cities.length}
        centreCount={centres.length}
        centres={toEnquiryCentres(centres, cities)}
        initialQuery={initialQuery}
      />

      <CentresIndex cities={cities} centres={centres} initialQuery={initialQuery} copy={copy} />

      <CentresBottomCta copy={copy} />
    </div>
  );
}
