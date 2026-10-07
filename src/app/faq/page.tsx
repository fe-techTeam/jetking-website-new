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
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { content } from '@/lib/content';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';
import { faqCopy } from '@/lib/content/copy/pages/faq';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { FaqList, Section, SectionHeader } from '@/components/kit';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(faqCopy, '/faq');
}

const TOPIC_ICONS: Record<string, LucideIcon> = {
  admissions: GraduationCap,
  courses: BookOpen,
  fees: Wallet,
  placement: Briefcase,
  centres: MapPin,
  franchise: Building2,
};

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
  const copy = await loadCopy(faqCopy);
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/faq' },
  ];
  const TOPIC_LABELS: Record<string, string> = {
    admissions: copy['topics.admissions'],
    courses: copy['topics.courses'],
    fees: copy['topics.fees'],
    placement: copy['topics.placement'],
    centres: copy['topics.centres'],
    franchise: copy['topics.franchise'],
  };
  // Franchise questions are answered on the Franchise page; this page is for students and families.
  const faqs = (await content.listFaqs()).filter((f) => f.topic !== 'franchise');
  const topics = [...new Set(faqs.map((f) => f.topic))];

  return (
    <>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema(trail)]} />

      <div className="dark-canvas">
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[260px] overflow-hidden rounded-[24px] xs:min-h-[280px] xs:rounded-[28px] sm:min-h-[320px] sm:rounded-[28px] lg:min-h-[360px]">
              <Image
                src={copy['hero.image']}
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
                <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>
                <h1 className="page-title mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                  {copy['hero.titleLead']} <span className="dc-accent-glow">{copy['hero.titleAccent']}</span>
                </h1>
                <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                  {copy['hero.body']}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Topic jump links ──────────────────────────────────────────── */}
        <nav aria-label={copy['topics.navLabel']} className="shell relative mt-8 sm:mt-10">
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

        {/* ── Questions by topic: one section per topic, tones alternating ─ */}
        <div className="mt-10 sm:mt-12">
          {topics.map((topic, i) => {
            const topicFaqs = faqs.filter((f) => f.topic === topic);
            const label = TOPIC_LABELS[topic] ?? topic;
            return (
              <Section
                key={topic}
                tone={i % 2 === 0 ? 'plain' : 'tint'}
                id={`faq-${topic}`}
                labelledBy={`faq-${topic}-heading`}
                className="scroll-mt-28"
              >
                <SectionHeader id={`faq-${topic}-heading`} title={label} />
                <FaqList items={topicFaqs} />
              </Section>
            );
          })}
        </div>

        {/* ── Still have a question ─────────────────────────────────────── */}
        <Section tone="plain" labelledBy="faq-more">
          <div className="kit-card overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="p-6 sm:p-10 lg:p-12">
              <p className="k-eyebrow">{copy['more.eyebrow']}</p>
              <h2 id="faq-more" className="section-title mt-2.5 font-display text-[var(--k-ink)]">
                {copy['more.title']}
              </h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
                {copy['more.body']}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <EnquiryLink
                  source="faq"
                  className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]"
                >
                  {copy['more.cta.label']}
                </EnquiryLink>
                <Link
                  href={copy['more.chat.href'] as Route}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-6 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
                >
                  {copy['more.chat.label']}
                </Link>
              </div>
            </div>
            <div className="relative h-52 sm:h-64 lg:h-auto lg:min-h-[18rem]">
              <Image src="/home/counsellor.jpg" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover object-center" />
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
