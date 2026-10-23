import Image from 'next/image';
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
import { isSectionVisible } from '@/lib/content/copy/sections';

type CitySummary = { slug: string; name: string; state: string; country?: string };
type CentreSummary = {
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  addressLine: string;
  locality: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  geo?: { lat: number; lng: number } | null;
};

function CentresBottomCta({ copy }: { copy: typeof centresCopy.defaults }) {
  return (
    <Section tone="plain" labelledBy="centres-cta">
      <div className="kit-card overflow-hidden md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative h-52 sm:h-64 md:h-auto md:min-h-[22rem]">
          <Image
            src={copy['directoryCta.image']}
            alt=""
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="p-6 sm:p-10">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['directoryCta.eyebrow']}</p>
          <h2 id="centres-cta" className="section-title mt-2.5 text-[var(--k-ink)]">
            {copy['directoryCta.title']}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
            {fill(copy['directoryCta.body'], { brand: siteConfig.name })}
          </p>

          <ul className="mt-5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <li>
              <a
                href={copy['directoryCta.phoneHref']}
                className="tap inline-flex items-center gap-2 py-1 text-[14px] font-semibold text-[var(--k-ink-2)] transition-colors hover:text-[var(--k-ink)]"
              >
                <Phone className="h-4 w-4 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                {copy['directoryCta.phoneLabel']}
              </a>
            </li>
            <li className="flex items-center gap-2 py-1 text-[14px] font-semibold text-[var(--k-ink-2)]">
              <MessageCircle className="h-4 w-4 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
              {copy['directoryCta.point1']}
            </li>
            <li className="flex items-center gap-2 py-1 text-[14px] font-semibold text-[var(--k-ink-2)]">
              <Building2 className="h-4 w-4 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
              {copy['directoryCta.point2']}
            </li>
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <EnquiryLink
              source="centres-cta"
              className="group/enq inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--k-red-fill)] py-3 pr-3 pl-5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
            >
              <span>{copy['directoryCta.enquire']}</span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--k-red)] transition-transform duration-200 group-hover/enq:translate-x-0.5"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </EnquiryLink>
            <Link
              href={copy['directoryCta.browseHref'] as Route}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--k-line-strong)] px-6 py-3 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)] hover:text-[var(--k-red)]"
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
  const show = (id: string) => isSectionVisible(copy, id);
  // The hero's headline figures describe the Indian network; Vietnam is browsed via the Country filter.
  const indiaCentres = centres.filter((c) => (c.country ?? 'India') === 'India');
  const indiaCityCount = cities.filter((c) => (c.country ?? 'India') === 'India').length;
  return (
    <div className="centres-page relative">
      {show('hero') ? (
        <CentresHero
          copy={copy}
          cityCount={indiaCityCount}
          centreCount={indiaCentres.length}
          centres={toEnquiryCentres(centres, cities)}
          nearMeCentres={centres}
          initialQuery={initialQuery}
        />
      ) : null}

      {show('index') ? (
        <CentresIndex cities={cities} centres={centres} initialQuery={initialQuery} copy={copy} />
      ) : null}

      {show('cta') ? <CentresBottomCta copy={copy} /> : null}
    </div>
  );
}
