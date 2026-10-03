import type { Metadata, Route } from 'next';
import { EnquiryLink } from '@/components/EnquirySheet';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
  MessageCircle,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata, faqSchema } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Frequently Asked Questions | Jetking',
    description:
      'Answers about Jetking admissions, eligibility, fees policy, course durations, centres and placement support.',
  },
  '/faq',
);

const TOPIC_LABELS: Record<string, string> = {
  admissions: 'Admissions',
  courses: 'Courses',
  fees: 'Fees',
  placement: 'Placement',
  centres: 'Centres',
  franchise: 'Franchise',
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  admissions: GraduationCap,
  courses: BookOpen,
  fees: Wallet,
  placement: Briefcase,
  centres: MapPin,
  franchise: Building2,
};

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'FAQ', path: '/faq' },
];

/**
 * FAQ — built on the same dark-canvas language as /placements, /investors and /about-us:
 * a photo banner, then rounded panels with accent-tinted rows.
 *
 * Answers are revealed on interaction but never conditionally rendered. Each row is a
 * native <details>, so the full Q&A is in the server-rendered HTML (it still backs the
 * FAQPage structured data emitted below), works without JavaScript, and is hidden — not
 * absent — while collapsed.
 */
export default async function FaqPage() {
  const faqs = await content.listFaqs();
  const topics = [...new Set(faqs.map((f) => f.topic))];

  return (
    <>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema(trail)]} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[260px] overflow-hidden rounded-[24px] xs:min-h-[280px] xs:rounded-[28px] sm:min-h-[320px] sm:rounded-[28px] lg:min-h-[360px]">
              <Image
                src="/home/journey-explore-v2.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
                <p className="dc-eyebrow label-mono text-[14px]">FAQ</p>
                <h1 className="page-title mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                  Questions people <span className="dc-accent-glow">ask us most</span>
                </h1>
                <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                  These answers are also what the Jetking Guide draws on — it answers from this
                  content, not from general knowledge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Topic jump links ──────────────────────────────────────────── */}
        <nav aria-label="FAQ topics" className="shell relative mt-8 sm:mt-10">
          <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {topics.map((topic) => {
              const Icon = TOPIC_ICONS[topic] ?? MessageCircle;
              const count = faqs.filter((f) => f.topic === topic).length;
              return (
                <li key={topic}>
                  <a
                    href={`#faq-${topic}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[13.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--dc-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                    {TOPIC_LABELS[topic] ?? topic}
                    <span className="numeral text-[12px] font-semibold text-[var(--dc-ink-muted)]">{count}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Questions by topic ────────────────────────────────────────── */}
        <div className="shell relative mt-10 space-y-6 sm:mt-12 sm:space-y-8">
          {topics.map((topic) => {
            const topicFaqs = faqs.filter((f) => f.topic === topic);
            const Icon = TOPIC_ICONS[topic] ?? MessageCircle;
            const label = TOPIC_LABELS[topic] ?? topic;
            return (
              <section
                key={topic}
                id={`faq-${topic}`}
                aria-labelledby={`faq-${topic}-heading`}
                className="dc-panel scroll-mt-28 rounded-[24px] px-5 py-7 xs:rounded-[28px] sm:px-8 sm:py-9"
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h2
                      id={`faq-${topic}-heading`}
                      className="section-title font-display text-[var(--dc-ink)]"
                    >
                      {label}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {topicFaqs.map((faq) => (
                    <details
                      key={faq.id}
                      className="group rounded-[12px] border border-[var(--dc-hairline)] bg-[var(--dc-surface)] transition-colors hover:border-[var(--dc-hairline-strong)] open:border-[var(--dc-accent-soft)]/50 open:bg-[var(--dc-accent-tint)]"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[12px] px-4 py-4 text-left marker:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] sm:px-5 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1 text-[15px] leading-snug font-bold text-[var(--dc-ink)] sm:text-[16px]">
                          {faq.question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--dc-hairline-strong)] text-[var(--dc-accent-soft)] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                      </summary>
                      <p className="px-4 pb-5 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:px-5 sm:text-[15px]">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Still have a question ─────────────────────────────────────── */}
        <section className="shell relative mt-10 sm:mt-12" aria-labelledby="faq-more">
          <div className="dc-panel flex flex-col gap-6 rounded-[24px] px-6 py-8 xs:rounded-[28px] sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
            <div>
              <p className="dc-eyebrow label-mono">Need more help?</p>
              <h2
                id="faq-more"
                className="section-title mt-2 font-display text-[var(--dc-ink)]"
              >
                Still have a <span className="dc-accent-glow">question?</span>
              </h2>
              <p className="mt-2 max-w-[44ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)]">
                A counsellor can answer what depends on your background and nearest centre.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <EnquiryLink
                source="faq"
                className="dc-cta inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-bold"
              >
                Talk to a counsellor
              </EnquiryLink>
              <Link
                href={'/chatbot' as Route}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-6 text-sm font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
              >
                Ask Jetking AI
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
