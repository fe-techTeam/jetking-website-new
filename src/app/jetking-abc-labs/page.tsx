import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { EnquiryLink } from '@/components/EnquirySheet';
import { abcLabsCopy } from '@/lib/content/copy/pages/abc-labs';
import { loadCopy } from '@/lib/content/copy/load';
import { seoFromCopy } from '@/lib/content/copy/seo';
import { isSectionVisible } from '@/lib/content/copy/sections';

/**
 * Jetking ABC Labs — the ABC of the digital future: AI, Blockchain & Cybersecurity.
 *
 * Copy and section visibility live in Page text (`abc-labs`). Kept out of search (`noindex`)
 * until the copy has been reviewed — clear `seo.noindex` then.
 */
export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(abcLabsCopy);
  return buildMetadata(seoFromCopy(copy), '/jetking-abc-labs');
}

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="dc-eyebrow label-mono inline-flex items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 py-1.5">
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]" strokeWidth={2.5} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SiteLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      {...external}
      className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-[14.5px] font-bold text-[var(--dc-accent-soft)] hover:underline sm:text-[15.5px]"
    >
      {children}
      <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
    </a>
  );
}

export default async function JetkingAbcLabsPage() {
  const copy = await loadCopy(abcLabsCopy);
  const show = (id: string) => isSectionVisible(copy, id);
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/jetking-abc-labs' },
  ];

  const sites = [0, 1, 2].map((i) => ({
    host: copy[`sites.${i}.host` as keyof typeof copy],
    href: copy[`sites.${i}.href` as keyof typeof copy],
    note: copy[`sites.${i}.note` as keyof typeof copy],
  }));
  const aiBenefits = [0, 1, 2, 3, 4, 5, 6].map((i) => copy[`ai.benefits.${i}` as keyof typeof copy]);
  const aiPhases = [0, 1, 2, 3].map((i) => copy[`ai.phases.${i}` as keyof typeof copy]);
  const aiCareers = [0, 1, 2, 3].map((i) => copy[`ai.careers.${i}` as keyof typeof copy]);
  const bitcoinFeatures = [0, 1, 2].map((i) => copy[`blockchain.bitcoin.${i}` as keyof typeof copy]);
  const financeSolutions = [0, 1, 2, 3, 4, 5].map((i) => copy[`blockchain.finance.${i}` as keyof typeof copy]);

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        {show('hero') ? (
          <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
            <Breadcrumbs trail={trail} />

            <div className="relative mt-5 sm:mt-6">
              <div className="dc-banner relative min-h-[300px] overflow-hidden rounded-[24px] xs:min-h-[320px] xs:rounded-[28px] sm:min-h-[360px] sm:rounded-[28px] lg:min-h-[400px] 3xl:min-h-[480px] 4xl:min-h-[540px]">
                <Image
                  src={copy['hero.image']}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                  className="object-cover object-[center_40%]"
                />
                <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

                <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-center px-6 py-10 xs:px-8 sm:px-10 sm:py-12 lg:max-w-[68%] lg:px-12 xl:px-14">
                  <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>
                  <h1 className="page-title mt-3 font-display text-balance text-[var(--dc-ink)] sm:mt-4">
                    {copy['hero.titleLead']} <span className="dc-accent-glow">{copy['hero.titleAccent']}</span>
                  </h1>
                  <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-4 sm:text-[16px]">
                    {copy['hero.body']}
                  </p>
                  <div className="mt-6 sm:mt-7">
                    <EnquiryLink
                      source="abc-labs-hero"
                      className="dc-cta inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:px-7 sm:text-base"
                    >
                      {copy['hero.cta']}
                    </EnquiryLink>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {show('sites') ? (
          <section className="shell mt-5 sm:mt-6" aria-label="Jetking websites">
            <ul className="dc-panel grid divide-y divide-[var(--dc-hairline)] overflow-hidden rounded-[20px] md:grid-cols-3 md:divide-x md:divide-y-0">
              {sites.map((site) => (
                <li key={site.host}>
                  <a
                    href={site.href}
                    {...external}
                    className="group flex min-h-[72px] items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--dc-accent)_8%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--dc-accent)_8%,transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] md:px-4 lg:gap-3 lg:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-[18px] leading-tight font-extrabold break-words text-[var(--dc-ink)] lg:text-[20px]">
                        {site.host}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-[var(--dc-ink-secondary)] sm:text-[13.5px]">{site.note}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--dc-accent)] text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    >
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {show('ai') ? (
          <section id="ai" className="shell mt-12 scroll-mt-24 sm:mt-14 lg:mt-16" aria-labelledby="abc-ai">
            <Eyebrow>{copy['ai.eyebrow']}</Eyebrow>
            <h2 id="abc-ai" className="section-title mt-4 max-w-[28ch] font-display text-balance text-[var(--dc-ink)]">
              {copy['ai.title']}
            </h2>
            <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
              {copy['ai.body']}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
              <div className="dc-panel rounded-[20px] p-6 sm:p-7">
                <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">{copy['ai.benefitsTitle']}</h3>
                <Bullets items={aiBenefits} />
              </div>
              <div className="dc-panel rounded-[20px] p-6 sm:p-7">
                <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">{copy['ai.phasesTitle']}</h3>
                <ol className="mt-4 space-y-2.5">
                  {aiPhases.map((phase, i) => (
                    <li key={phase} className="flex gap-3 text-[14.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                      <span
                        aria-hidden="true"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--dc-accent)] text-[12px] font-bold text-white"
                      >
                        {i + 1}
                      </span>
                      <span>{phase}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="dc-panel rounded-[20px] p-6 sm:p-7">
                <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">{copy['ai.careersTitle']}</h3>
                <Bullets items={aiCareers} />
              </div>
            </div>

            <SiteLink href={copy['ai.linkHref']}>{copy['ai.linkLabel']}</SiteLink>
          </section>
        ) : null}

        {show('blockchain') ? (
          <section id="blockchain" className="shell mt-12 scroll-mt-24 sm:mt-14 lg:mt-16" aria-labelledby="abc-blockchain">
            <Eyebrow>{copy['blockchain.eyebrow']}</Eyebrow>
            <h2 id="abc-blockchain" className="section-title mt-4 max-w-[28ch] font-display text-balance text-[var(--dc-ink)]">
              {copy['blockchain.title']}
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
              <div className="dc-panel flex flex-col rounded-[20px] p-6 sm:p-7">
                <p className="label-mono text-[12px] font-bold tracking-[0.1em] text-[var(--dc-accent-soft)] uppercase">
                  {copy['blockchain.bitcoin.label']}
                </p>
                <h3 className="mt-2 font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
                  {copy['blockchain.bitcoin.title']}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                  {copy['blockchain.bitcoin.body']}
                </p>
                <Bullets items={bitcoinFeatures} />
                <SiteLink href={copy['blockchain.bitcoin.linkHref']}>{copy['blockchain.bitcoin.linkLabel']}</SiteLink>
              </div>

              <div className="dc-panel flex flex-col rounded-[20px] p-6 sm:p-7">
                <p className="label-mono text-[12px] font-bold tracking-[0.1em] text-[var(--dc-accent-soft)] uppercase">
                  {copy['blockchain.finance.label']}
                </p>
                <h3 className="mt-2 font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
                  {copy['blockchain.finance.title']}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                  {copy['blockchain.finance.body']}
                </p>
                <Bullets items={financeSolutions} />
                <SiteLink href={copy['blockchain.finance.linkHref']}>{copy['blockchain.finance.linkLabel']}</SiteLink>
              </div>
            </div>
          </section>
        ) : null}

        {show('enquire') ? (
          <section className="shell mt-12 sm:mt-14 lg:mt-16">
            <div className="dc-panel flex flex-col items-start gap-5 rounded-[20px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <p className="max-w-[40ch] font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
                {copy['enquire.title']}
              </p>
              <EnquiryLink
                source="abc-labs-footer"
                className="dc-cta inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:px-7 sm:text-base"
              >
                {copy['enquire.cta']}
              </EnquiryLink>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
