import type { Metadata } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { EnquiryLink } from '@/components/EnquirySheet';

/**
 * Jetking ABC Labs — the ABC of the digital future: AI, Blockchain & Cybersecurity.
 *
 * The AI and Blockchain sections are the headlines and bullet lists from Jetking's own sites (jetking.ai,
 * jetking.org, jetking.finance), kept to their wording. Those sites have no cybersecurity counterpart, so
 * there is no cybersecurity section yet.
 *
 * Kept out of search (`noindex`) until the copy has been reviewed — remove it then. The text lives here, not
 * in the CMS, so changing it needs a code change.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: 'Jetking ABC Labs — AI, Blockchain & Cybersecurity | Jetking',
      description: 'Building future-ready skills to power the next generation of digital innovation.',
      noindex: true,
    },
    '/jetking-abc-labs',
  );
}

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Jetking ABC Labs', path: '/jetking-abc-labs' },
];

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** The three sister sites. The note under each is that site's own subject, nothing more. */
const SITES = [
  { host: 'Jetking.ai', href: 'https://www.jetking.ai', note: 'AI & Humanoid Robotics' },
  { host: 'Jetking.org', href: 'https://www.jetking.org', note: 'Bitcoin treasury' },
  { host: 'Jetking.finance', href: 'https://www.jetking.finance', note: 'Asset tokenization' },
] as const;

const AI_BENEFITS = [
  'Master 29 humanoid robotics-related subjects',
  'Build your own human-size humanoid robot',
  'Practice with simulated humanoid robots',
  'Practice with a real industrial humanoid robot',
  '1-on-1 tutoring sessions every month',
  'Dedicated technical mentor support',
  'Industry-recognised completion certificate',
];

const AI_PHASES = [
  'Mechanical Design & Simulation',
  'Electronics of Humanoid Robots',
  'Control Systems',
  'AI Algorithm Systems',
];

const AI_CAREERS = ['Robotics Engineer', 'AI Engineer', 'Automation Engineer', 'R&D Specialist'];

const BITCOIN_FEATURES = ['Decentralized Collaboration', 'Lightning-Fast Innovation', 'Secure Asset Management'];

const FINANCE_SOLUTIONS = [
  'Tokenization as a Service',
  'Fund Administration',
  'Regulatory Compliance',
  'Multi-Chain Infrastructure',
  'Secondary Trading',
  'Institutional Custody',
];

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
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--k-red)]" strokeWidth={2.5} aria-hidden="true" />
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
      className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-[14.5px] font-bold text-[var(--k-red)] hover:underline sm:text-[15.5px]"
    >
      {children}
      <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
    </a>
  );
}

export default function JetkingAbcLabsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[300px] overflow-hidden rounded-[24px] xs:min-h-[320px] xs:rounded-[28px] sm:min-h-[360px] sm:rounded-[28px] lg:min-h-[400px]">
              <Image
                src="/home/why-labs.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_40%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-center px-6 py-10 xs:px-8 sm:px-10 sm:py-12 lg:max-w-[68%] lg:px-12 xl:px-14">
                <p className="k-hero-eyebrow">Jetking ABC Labs</p>
                <h1 className="page-title mt-3 font-display text-balance text-[var(--dc-ink)] sm:mt-4">
                  Jetking is working on the ABC of the Digital Future:{' '}
                  <span className="dc-accent-glow">AI, Blockchain &amp; Cybersecurity</span>
                </h1>
                <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-4 sm:text-[16px]">
                  Building future-ready skills to power the next generation of digital innovation.
                </p>
                <div className="mt-6 sm:mt-7">
                  <EnquiryLink
                    source="abc-labs-hero"
                    className="dc-cta inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:px-7 sm:text-base"
                  >
                    Enquire Now
                  </EnquiryLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Our sites ─────────────────────────────────────────────────── */}
        <section className="shell mt-5 sm:mt-6" aria-label="Jetking websites">
          <ul className="dc-panel grid divide-y divide-[var(--dc-hairline)] overflow-hidden rounded-[20px] md:grid-cols-3 md:divide-x md:divide-y-0">
            {SITES.map((site) => (
              <li key={site.host}>
                <a
                  href={site.href}
                  {...external}
                  className="group flex min-h-[72px] items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-[var(--dc-accent-soft)] md:px-4 lg:gap-3 lg:px-6"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-[18px] leading-tight font-extrabold break-words text-[var(--dc-ink)] lg:text-[20px]">
                      {site.host}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-[var(--dc-ink-secondary)] sm:text-[13.5px]">{site.note}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--theme-accent)] text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ── A · AI & Robotics ─────────────────────────────────────────── */}
        <section id="ai" className="shell mt-12 scroll-mt-24 sm:mt-14 lg:mt-16" aria-labelledby="abc-ai">
          <Eyebrow>AI &amp; Robotics Lab</Eyebrow>
          <h2 id="abc-ai" className="section-title mt-4 max-w-[28ch] font-display text-balance text-[var(--dc-ink)]">
            Build the Future with Humanoid Robotics &amp; AI
          </h2>
          <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
            India’s first masterclass that turns beginners into job-ready Humanoid Robotics Engineers.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="dc-panel rounded-[20px] p-6 sm:p-7">
              <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">
                What you get
              </h3>
              <Bullets items={AI_BENEFITS} />
            </div>
            <div className="dc-panel rounded-[20px] p-6 sm:p-7">
              <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">
                4 phases to truly understand how humanoid robots work
              </h3>
              <ol className="mt-4 space-y-2.5">
                {AI_PHASES.map((phase, i) => (
                  <li key={phase} className="flex gap-3 text-[14.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                    <span
                      aria-hidden="true"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--theme-accent)] text-[12px] font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span>{phase}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="dc-panel rounded-[20px] p-6 sm:p-7">
              <h3 className="font-display text-[19px] font-extrabold text-[var(--dc-ink)] sm:text-[21px]">
                High-paying roles in the robotics economy
              </h3>
              <Bullets items={AI_CAREERS} />
            </div>
          </div>

          <SiteLink href="https://www.jetking.ai">Visit jetking.ai</SiteLink>
        </section>

        {/* ── B · Blockchain ────────────────────────────────────────────── */}
        <section id="blockchain" className="shell mt-12 scroll-mt-24 sm:mt-14 lg:mt-16" aria-labelledby="abc-blockchain">
          <Eyebrow>Blockchain</Eyebrow>
          <h2 id="abc-blockchain" className="section-title mt-4 max-w-[28ch] font-display text-balance text-[var(--dc-ink)]">
            Blockchain at Jetking
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="dc-panel flex flex-col rounded-[20px] p-6 sm:p-7">
              <p className="label-mono text-[12px] font-bold tracking-[0.1em] text-[var(--k-red)] uppercase">jetking.org</p>
              <h3 className="mt-2 font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
                India’s First Bitcoin Treasury Company
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                Our Mission: India’s Path to Financial Sovereignty.
              </p>
              <Bullets items={BITCOIN_FEATURES} />
              <SiteLink href="https://www.jetking.org">Visit jetking.org</SiteLink>
            </div>

            <div className="dc-panel flex flex-col rounded-[20px] p-6 sm:p-7">
              <p className="label-mono text-[12px] font-bold tracking-[0.1em] text-[var(--k-red)] uppercase">jetking.finance</p>
              <h3 className="mt-2 font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
                Tokenize the World.
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                A real-world asset tokenization platform that bridges traditional finance and DeFi. Built for Enterprise:
              </p>
              <Bullets items={FINANCE_SOLUTIONS} />
              <SiteLink href="https://www.jetking.finance">Visit jetking.finance</SiteLink>
            </div>
          </div>
        </section>

        {/* ── Enquiry ───────────────────────────────────────────────────── */}
        <section className="shell mt-12 sm:mt-14 lg:mt-16">
          <div className="dc-panel flex flex-col items-start gap-5 rounded-[20px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-[40ch] font-display text-[22px] leading-tight font-extrabold text-[var(--dc-ink)] sm:text-[26px]">
              Want to know more about Jetking ABC Labs?
            </p>
            <EnquiryLink
              source="abc-labs-footer"
              className="dc-cta inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:px-7 sm:text-base"
            >
              Enquire Now
            </EnquiryLink>
          </div>
        </section>
      </div>
    </>
  );
}
