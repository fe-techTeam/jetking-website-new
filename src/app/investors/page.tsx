import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, FileText, TrendingUp } from 'lucide-react';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { Breadcrumbs, JsonLd, cx, type Crumb } from '@/components/ui';
import { siteConfig } from '@/lib/site';
import { disclosures, linkKind, type DisclosureSection } from '@/lib/investors/disclosures';
import { investorsCopy } from '@/lib/content/copy/pages/investors';
import { fill } from '@/lib/content/copy/define';
import { loadCopy } from '@/lib/content/copy/load';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(investorsCopy);
  const live = { brand: siteConfig.name, legalName: siteConfig.legalName };
  return buildMetadata(
    {
      title: fill(copy['seo.title'], live),
      description: fill(copy['seo.description'], live),
    },
    '/investors',
  );
}

type Copy = typeof investorsCopy.defaults;

/** Lists longer than this scroll inside their panel instead of stretching the page. */
const SCROLL_AFTER = 12;

const externalLink = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * Investor Information — disclosures under Regulation 46 and 62 of SEBI (LODR).
 *
 * Laid out like NIIT's Regulation 46 disclosures page: a banner, then one accordion of
 * disclosure headings, each opening onto a list of "label + download" rows. Every heading
 * and document comes from jetking.com/investors (see `npm run sync:investors`), so this
 * page never invents a filing. Built on native <details>, so it is server-rendered,
 * works without JavaScript and keeps every document in the DOM for search engines.
 */
export default async function InvestorsPage() {
  const copy = await loadCopy(investorsCopy);
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/investors' },
  ];
  const live = { brand: siteConfig.name, legalName: siteConfig.legalName };
  const sections = disclosures.sections;
  // The contacts accordion follows the policies, where NIIT's page places it.
  const contactsAfter = 'code-of-conduct-policies';

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[240px] overflow-hidden rounded-[24px] xs:min-h-[260px] xs:rounded-[28px] sm:min-h-[300px] sm:rounded-[28px] lg:min-h-[320px]">
              <Image
                src={copy['hero.image']}
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-center px-6 py-10 xs:px-8 sm:px-10 sm:py-12 lg:max-w-[68%] lg:px-12 xl:px-14">
                <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>
                <h1 className="page-title mt-3 font-display text-balance text-[var(--dc-ink)] sm:mt-4">
                  {copy['hero.titleLead']} <span className="dc-accent-glow">{copy['hero.titleAccent']}</span>
                </h1>
                <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-4 sm:text-[16px]">
                  {fill(copy['hero.body'], live)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reports accordion ─────────────────────────────────────────── */}
        <section
          className="shell relative mt-10 sm:mt-12 lg:mt-14"
          aria-labelledby="investors-reports"
        >
          <div className="text-center">
            <p className="dc-eyebrow label-mono inline-flex items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {copy['reports.eyebrow']}
            </p>
            <h2
              id="investors-reports"
              className="section-title mt-4 font-display text-[var(--dc-ink)]"
            >
              {copy['reports.titleLead']} <span className="dc-accent-glow">{copy['reports.titleAccent']}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
              {copy['reports.body']}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-[56rem] space-y-3 sm:mt-10">
            <Accordion title={copy['company.accordion']} defaultOpen>
              <CompanyDetails copy={copy} stockLive={disclosures.links.stockLive} latestNews={disclosures.links.latestNews} />
            </Accordion>

            {sections.map((section) => (
              <SectionAccordions
                key={section.id}
                section={section}
                copy={copy}
                withContacts={section.id === contactsAfter}
              />
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-[56rem] text-center text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
            {fill(copy['reports.note'], { ...live, date: formatDate(disclosures.syncedAt) })}{' '}
            <a
              href={`mailto:${copy['company.email']}`}
              className="font-bold text-[var(--dc-accent-soft)] hover:underline"
            >
              {copy['company.email']}
            </a>
            .
          </p>
        </section>
      </div>

    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** One disclosure heading, plus the contacts accordion right after the section it follows. */
function SectionAccordions({
  section,
  withContacts,
  copy,
}: {
  section: DisclosureSection;
  withContacts: boolean;
  copy: Copy;
}) {
  if (section.items.length === 0) return null;
  // The heading is editable per section id; a section the sync adds later keeps its synced title.
  const title = (copy as Record<string, string>)[`sections.${section.id}.title`] ?? section.title;
  const scroll = section.items.length > SCROLL_AFTER;

  return (
    <>
      <Accordion title={title} count={section.items.length}>
        <ul
          // A long list scrolls in place; make that region reachable and named for keyboard and
          // screen-reader users, who otherwise cannot scroll it.
          {...(scroll ? { tabIndex: 0, 'aria-label': fill(copy['docs.scrollLabel'], { title, count: section.items.length }) } : {})}
          className={cx('space-y-2', scroll && 'dc-filter-scroll max-h-[28rem] overflow-y-auto pr-1')}
        >
          {section.items.map((item, index) => (
            <li key={`${index}-${item.href}`}>
              <DocumentRow copy={copy} label={item.label} href={item.href} />
            </li>
          ))}
        </ul>
      </Accordion>

      {withContacts ? (
        <Accordion title={copy['contacts.accordion']}>
          <InvestorContacts copy={copy} />
        </Accordion>
      ) : null}
    </>
  );
}

function Accordion({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-[16px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)]"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3.5 text-left text-[var(--dc-ink)] transition-colors marker:hidden group-open:border-b group-open:border-[var(--dc-hairline)] group-open:bg-[var(--dc-accent-tint)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--dc-accent-soft)] sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 font-display text-[15px] leading-snug font-extrabold tracking-[-0.01em] sm:text-[17px]">
          {title}
        </span>
        {count ? (
          <span className="shrink-0 rounded-full border border-[var(--dc-accent-soft)]/30 bg-[var(--dc-accent-tint)] px-2.5 py-0.5 text-[12px] font-bold text-[var(--dc-accent-soft)] tabular-nums">
            {count}
          </span>
        ) : null}
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[var(--dc-accent-soft)] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </summary>
      <div className="p-4 sm:p-5">{children}</div>
    </details>
  );
}

/** File icon + label on the left, the download/view button on the right. */
function DocumentRow({ label, href, copy }: { label: string; href: string; copy: Copy }) {
  const linkText = { page: copy['docs.link.page'], pdf: copy['docs.link.pdf'], drive: copy['docs.link.drive'], other: copy['docs.link.other'] }[linkKind(href)];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--dc-hairline)] bg-[var(--dc-surface)] px-3.5 py-3 sm:flex-nowrap sm:px-4">
      <span
        aria-hidden="true"
        className="kit-iconwell !h-10 !w-10"
      >
        <FileText className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 text-[14px] leading-snug font-semibold text-[var(--dc-ink)] sm:text-[14.5px]">
        {label}
      </span>
      <a
        href={href}
        {...(href.startsWith('/') ? {} : externalLink)}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] px-3.5 text-[12.5px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)]"
      >
        {linkText}
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        <span className="sr-only">
          : {label}{href.startsWith('/') ? '' : ` ${copy['common.newTab']}`}
        </span>
      </a>
    </div>
  );
}

function CompanyDetails({ stockLive, latestNews, copy }: { stockLive?: string; latestNews?: string; copy: Copy }) {
  const rows: Array<[string, ReactNode]> = [
    [copy['company.label.company'], siteConfig.legalName],
    [copy['company.label.listedAt'], copy['company.listedAt']],
    [copy['company.label.scripCode'], copy['company.scripCode']],
    [copy['company.label.tradingSymbol'], copy['company.tradingSymbol']],
    [copy['company.label.registeredOffice'], copy['company.registeredOffice']],
    [
      copy['company.label.phone'],
      <a key="tel" href={`tel:${copy['company.phone']}`} className={contactLink}>
        {copy['company.phone']}
      </a>,
    ],
    [
      copy['company.label.email'],
      <a key="mail" href={`mailto:${copy['company.email']}`} className={contactLink}>
        {copy['company.email']}
      </a>,
    ],
  ];

  return (
    <div>
      <h3 className="k-eyebrow">
        {copy['company.heading']}
      </h3>
      <dl className="mt-3 divide-y divide-[var(--dc-hairline)]">
        {rows.map(([term, value]) => (
          <div key={term} className="grid gap-1 py-3 sm:grid-cols-[190px_1fr] sm:gap-4">
            <dt className="text-[13px] font-semibold text-[var(--dc-ink-muted)]">{term}</dt>
            <dd className="text-[14px] leading-relaxed font-semibold text-[var(--dc-ink)]">{value}</dd>
          </div>
        ))}
      </dl>

      {stockLive || latestNews ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {stockLive ? (
            <a
              href={stockLive}
              {...externalLink}
              className="dc-cta inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold"
            >
              {copy['company.stock.label']}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">{copy['common.newTab']}</span>
            </a>
          ) : null}
          {latestNews ? (
            <a
              href={latestNews}
              {...externalLink}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] px-5 text-sm font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
            >
              {copy['company.news.label']}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">{copy['common.newTab']}</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ContactBlock({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="rounded-[12px] border border-[var(--dc-hairline)] bg-[var(--dc-surface)] p-4 sm:p-5">
      <h3 className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-[var(--dc-ink)]">
        {heading}
      </h3>
      <div className="mt-2 space-y-1 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">{children}</div>
    </section>
  );
}

const contactLink =
  'inline-flex min-h-11 items-center font-bold [overflow-wrap:anywhere] text-[var(--dc-accent-soft)] hover:underline';

/** Grievance redressal, the registrar and transfer agent, and the KMP authorised on materiality. */
function InvestorContacts({ copy }: { copy: Copy }) {
  const byKey: Record<string, string> = copy;
  const kmp = Array.from({ length: 4 }, (_, i) => ({
    name: byKey[`kmp.${i}.name`] ?? '',
    designation: byKey[`kmp.${i}.designation`] ?? '',
  }));

  return (
    <div className="space-y-3">
      <ContactBlock heading={copy['grievance.heading']}>
        <p className="font-semibold text-[var(--dc-ink)]">{copy['grievance.name']}</p>
        <p>
          {copy['contacts.tel']}{' '}
          <a href={`tel:${copy['grievance.phone'].replace(/\s/g, '')}`} className={contactLink}>
            {copy['grievance.phone']}
          </a>
        </p>
        <p>
          {copy['contacts.email']}{' '}
          <a href={`mailto:${copy['grievance.email']}`} className={contactLink}>
            {copy['grievance.email']}
          </a>
        </p>
      </ContactBlock>

      <ContactBlock heading={copy['registrar.heading']}>
        <p className="font-semibold text-[var(--dc-ink)]">{copy['registrar.name']}</p>
        <p>{copy['registrar.address']}</p>
        <p>
          {copy['contacts.tel']}{' '}
          <a href={`tel:${copy['registrar.phone'].replace(/\s/g, '')}`} className={contactLink}>
            {copy['registrar.phone']}
          </a>{' '}
          · {copy['contacts.fax']} {copy['registrar.fax']}
        </p>
        <p>
          {copy['contacts.email']}{' '}
          <a href={`mailto:${copy['registrar.email']}`} className={contactLink}>
            {copy['registrar.email']}
          </a>
        </p>
        <p>
          {copy['contacts.website']}{' '}
          <a href={copy['registrar.website']} {...externalLink} className={contactLink}>
            {copy['registrar.website']}
            <span className="sr-only"> {copy['common.newTab']}</span>
          </a>
        </p>
      </ContactBlock>

      <ContactBlock heading={copy['kmp.heading']}>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">{copy['kmp.caption']}</caption>
            <thead>
              <tr className="border-b border-[var(--dc-hairline-strong)] text-[12px] tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
                <th scope="col" className="py-2 pr-4 font-bold">{copy['kmp.col.name']}</th>
                <th scope="col" className="py-2 pr-4 font-bold">{copy['kmp.col.designation']}</th>
                <th scope="col" className="py-2 pr-4 font-bold">{copy['kmp.col.phone']}</th>
                <th scope="col" className="py-2 font-bold">{copy['kmp.col.email']}</th>
              </tr>
            </thead>
            <tbody>
              {kmp.map((person, i) => (
                <tr key={i} className="border-b border-[var(--dc-hairline)] last:border-0">
                  <th scope="row" className="py-2.5 pr-4 font-semibold text-[var(--dc-ink)]">{person.name}</th>
                  <td className="py-2.5 pr-4">{person.designation}</td>
                  <td className="py-2.5 pr-4">
                    <a href={`tel:${copy['kmp.phone']}`} className={contactLink}>{copy['kmp.phone']}</a>
                  </td>
                  <td className="py-2.5">
                    <a href={`mailto:${copy['kmp.email']}`} className={contactLink}>{copy['kmp.email']}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContactBlock>
    </div>
  );
}
