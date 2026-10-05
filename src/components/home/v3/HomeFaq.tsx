import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Faq } from '@/lib/content/types';
import { FOUNDED_YEAR } from '@/lib/brand-facts';
import { fill } from '@/lib/content/copy/define';
import { Section, SectionHeader } from '@/components/kit';
import { JsonLd } from '@/components/ui';
import { faqSchema } from '@/lib/seo';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * A short FAQ near the foot of the home page: the questions a visitor still has after the courses and the
 * proof (eligibility, fees and EMI, placement, centres). The same questions go out as FAQ structured data.
 */
export function HomeFaq({
  faqs: stored,
  counts,
  copy,
}: {
  faqs: Faq[];
  counts: { centres: number; cities: number };
  copy: HomeCopy;
}) {
  // Families ask this one before anything else, and it used to be answered on the Parent page.
  const faqs: Faq[] = [
    ...stored,
    {
      id: 'faq-parent-trust',
      question: copy['faq.parent.question'],
      answer: fill(copy['faq.parent.answer'], { year: FOUNDED_YEAR, centres: counts.centres, cities: counts.cities }),
      topic: 'admissions',
      personaRelevance: {},
    },
  ];

  return (
    <Section tone="plain" labelledBy="home-faq-heading">
      <JsonLd data={faqSchema(faqs)} />
      <SectionHeader
        id="home-faq-heading"
        eyebrow={copy['faq.eyebrow']}
        title={copy['faq.title']}
        action={
          <Link
            href={copy['faq.cta.href'] as Route}
            className="tap inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {copy['faq.cta.label']}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      <div className="kit kit-card divide-y divide-[var(--k-line)] px-5 sm:px-7">
        {faqs.map((faq) => (
          <details key={faq.id} className="group">
            <summary className="cursor-pointer list-none py-4 text-[16px] font-bold text-[var(--k-ink)] marker:content-none sm:py-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="centres-faq-toggle mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--k-line-strong)] bg-[var(--k-red-wash)] text-[var(--k-red)]"
                >
                  <span className="centres-faq-toggle-icon" />
                </span>
              </span>
            </summary>
            <p className="-mt-1 max-w-[70ch] pb-4 text-[15px] leading-relaxed text-[var(--k-ink-2)] sm:pb-5">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
