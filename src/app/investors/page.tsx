import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, FileText, TrendingUp } from 'lucide-react';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { Breadcrumbs, JsonLd, cx, type Crumb } from '@/components/ui';
import { siteConfig } from '@/lib/site';
import { COMPANY, GRIEVANCE_OFFICER, KMP, KMP_CONTACT, REGISTRAR } from '@/lib/investors/contacts';
import { disclosures, linkLabel, type DisclosureSection } from '@/lib/investors/disclosures';

export const metadata: Metadata = buildMetadata(
  {
    title: `Investor Information | ${siteConfig.name}`,
    description: `Disclosures under Regulation 46 and 62 of SEBI (LODR) Regulations by ${siteConfig.legalName}: financial results, shareholding pattern, annual reports, policies, notices and investor contacts.`,
  },
  '/investors',
);

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Investors', path: '/investors' },
];

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
export default function InvestorsPage() {
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
                src="/home/journey-franchise-v2.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-center px-6 py-10 xs:px-8 sm:px-10 sm:py-12 lg:max-w-[68%] lg:px-12 xl:px-14">
                <p className="dc-eyebrow label-mono text-[14px]">Investors</p>
                <h1 className="page-title mt-3 font-display text-balance text-[var(--dc-ink)] sm:mt-4">
                  Investor <span className="dc-accent-glow">Information</span>
                </h1>
                <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-4 sm:text-[16px]">
                  Disclosure under Regulation 46 and 62 of SEBI (LODR) Regulations —
                  financial information and updates for the shareholders of{' '}
                  {siteConfig.legalName}.
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
              Financial documents
            </p>
            <h2
              id="investors-reports"
              className="section-title mt-4 font-display text-[var(--dc-ink)]"
            >
              Access our <span className="dc-accent-glow">reports</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
              Financial reports, quarterly results and governance documents.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-[56rem] space-y-3 sm:mt-10">
            <Accordion title="Company Details" defaultOpen>
              <CompanyDetails stockLive={disclosures.links.stockLive} latestNews={disclosures.links.latestNews} />
            </Accordion>

            {sections.map((section) => (
              <SectionAccordions
                key={section.id}
                section={section}
                withContacts={section.id === contactsAfter}
              />
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-[56rem] text-center text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
            Documents open in a new tab and are hosted by {siteConfig.legalName} on external
            file storage. Source: jetking.com/investors, last updated{' '}
            {formatDate(disclosures.syncedAt)}. Questions about a disclosure? Write to{' '}
            <a
              href={`mailto:${COMPANY.email}`}
              className="font-bold text-[var(--dc-accent-soft)] hover:underline"
            >
              {COMPANY.email}
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
}: {
  section: DisclosureSection;
  withContacts: boolean;
}) {
  if (section.items.length === 0) return null;
  const scroll = section.items.length > SCROLL_AFTER;

  return (
    <>
      <Accordion title={section.title} count={section.items.length}>
        <ul
          // A long list scrolls in place; make that region reachable and named for keyboard and
          // screen-reader users, who otherwise cannot scroll it.
          {...(scroll ? { tabIndex: 0, 'aria-label': `${section.title} — ${section.items.length} documents` } : {})}
          className={cx('space-y-2', scroll && 'dc-filter-scroll max-h-[28rem] overflow-y-auto pr-1')}
        >
          {section.items.map((item, index) => (
            <li key={`${index}-${item.href}`}>
              <DocumentRow label={item.label} href={item.href} />
            </li>
          ))}
        </ul>
      </Accordion>

      {withContacts ? (
        <Accordion title="Investor Contact Details">
          <InvestorContacts />
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
function DocumentRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--dc-hairline)] bg-[var(--dc-surface)] px-3.5 py-3 sm:flex-nowrap sm:px-4">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
      >
        <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 text-[14px] leading-snug font-semibold text-[var(--dc-ink)] sm:text-[14.5px]">
        {label}
      </span>
      <a
        href={href}
        {...(href.startsWith('/') ? {} : externalLink)}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] px-3.5 text-[12.5px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)]"
      >
        {linkLabel(href)}
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        <span className="sr-only">
          : {label}{href.startsWith('/') ? '' : ' (opens in a new tab)'}
        </span>
      </a>
    </div>
  );
}

function CompanyDetails({ stockLive, latestNews }: { stockLive?: string; latestNews?: string }) {
  const rows: Array<[string, ReactNode]> = [
    ['Company', siteConfig.legalName],
    ['Listed at', COMPANY.listedAt],
    ['BSE scrip code', COMPANY.scripCode],
    ['Trading symbol', COMPANY.tradingSymbol],
    ['Registered office', COMPANY.registeredOffice],
    [
      'Investor line',
      <a key="tel" href={`tel:${COMPANY.phone}`} className={contactLink}>
        {COMPANY.phone}
      </a>,
    ],
    [
      'Email',
      <a key="mail" href={`mailto:${COMPANY.email}`} className={contactLink}>
        {COMPANY.email}
      </a>,
    ],
  ];

  return (
    <div>
      <h3 className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-ink-muted)] uppercase">
        Listing information
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
              Stock live on BSE
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
          {latestNews ? (
            <a
              href={latestNews}
              {...externalLink}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] px-5 text-sm font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
            >
              Latest corporate announcements
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
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
function InvestorContacts() {
  return (
    <div className="space-y-3">
      <ContactBlock heading="Grievance redressal (designated person)">
        <p className="font-semibold text-[var(--dc-ink)]">{GRIEVANCE_OFFICER.name}</p>
        <p>
          Tel:{' '}
          <a href={`tel:${GRIEVANCE_OFFICER.phone.replace(/\s/g, '')}`} className={contactLink}>
            {GRIEVANCE_OFFICER.phone}
          </a>
        </p>
        <p>
          Email:{' '}
          <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className={contactLink}>
            {GRIEVANCE_OFFICER.email}
          </a>
        </p>
      </ContactBlock>

      <ContactBlock heading="Registrar and share transfer agent">
        <p className="font-semibold text-[var(--dc-ink)]">{REGISTRAR.name}</p>
        <p>{REGISTRAR.address}</p>
        <p>
          Tel:{' '}
          <a href={`tel:${REGISTRAR.phone.replace(/\s/g, '')}`} className={contactLink}>
            {REGISTRAR.phone}
          </a>{' '}
          · Fax: {REGISTRAR.fax}
        </p>
        <p>
          Email:{' '}
          <a href={`mailto:${REGISTRAR.email}`} className={contactLink}>
            {REGISTRAR.email}
          </a>
        </p>
        <p>
          Website:{' '}
          <a href={REGISTRAR.website} {...externalLink} className={contactLink}>
            {REGISTRAR.website}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </ContactBlock>

      <ContactBlock heading="Key Managerial Personnel authorised to determine the materiality of an event or information">
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">Key Managerial Personnel and their contact details</caption>
            <thead>
              <tr className="border-b border-[var(--dc-hairline-strong)] text-[12px] tracking-[0.08em] text-[var(--dc-ink-muted)] uppercase">
                <th scope="col" className="py-2 pr-4 font-bold">Name of the KMP</th>
                <th scope="col" className="py-2 pr-4 font-bold">Designation</th>
                <th scope="col" className="py-2 pr-4 font-bold">Phone number</th>
                <th scope="col" className="py-2 font-bold">Email id</th>
              </tr>
            </thead>
            <tbody>
              {KMP.map((person) => (
                <tr key={person.name} className="border-b border-[var(--dc-hairline)] last:border-0">
                  <th scope="row" className="py-2.5 pr-4 font-semibold text-[var(--dc-ink)]">{person.name}</th>
                  <td className="py-2.5 pr-4">{person.designation}</td>
                  <td className="py-2.5 pr-4">
                    <a href={`tel:${KMP_CONTACT.phone}`} className={contactLink}>{KMP_CONTACT.phone}</a>
                  </td>
                  <td className="py-2.5">
                    <a href={`mailto:${KMP_CONTACT.email}`} className={contactLink}>{KMP_CONTACT.email}</a>
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
