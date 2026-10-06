import { toEnquiryCentres } from '@/lib/enquiry-centres';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { Clock3, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import { content } from '@/lib/content';
import { enquiryCopy } from '@/lib/content/copy/pages/enquiry';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { Section } from '@/components/kit';
import { siteConfig } from '@/lib/site';
import { EnquiryForm } from './EnquiryForm';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(enquiryCopy, '/enquiry');
}

export default async function EnquiryPage() {
  const copy = await loadCopy(enquiryCopy);
  const nextSteps = [
    { icon: MessageCircle, title: copy['next.0.title'], detail: copy['next.0.detail'] },
    { icon: PhoneCall, title: copy['next.1.title'], detail: copy['next.1.detail'] },
    { icon: ShieldCheck, title: copy['next.2.title'], detail: copy['next.2.detail'] },
  ];
  const [courses, cities, centres] = await Promise.all([content.listCourses(), content.listCities(), content.listCentres()]);

  return (
    <>
      <Section tone="plain" labelledBy="enq-title" className="!pb-0">
        <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['hero.eyebrow']}</p>
        <h1 id="enq-title" className="page-title-sm mt-2.5 max-w-xl font-display text-[var(--k-ink)]">
          {copy['hero.title']}
        </h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">{copy['hero.body']}</p>
      </Section>

      <Section tone="plain" labelledBy="enq-form-title">
        <div className="kit-card overflow-hidden lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <Suspense fallback={<p className="text-sm text-[var(--k-ink-2)]">{copy['form.loading']}</p>}>
              <EnquiryForm
                courses={courses.map((c) => ({ slug: c.slug, title: c.shortTitle }))}
                centres={toEnquiryCentres(centres, cities)}
                copy={copy}
              />
            </Suspense>
          </div>

          <div className="border-t border-[var(--k-line-strong)] bg-[var(--k-tint)] p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
            <div className="lg:sticky lg:top-28">
              <div className="relative mb-7 h-44 overflow-hidden rounded-[var(--k-r)] sm:h-56 lg:h-64">
                <Image
                  src="/home/counsellor.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
              <h2 id="enq-form-title" className="subsection-title text-[var(--k-ink)]">
                {copy['next.title']}
              </h2>
              <ol className="mt-6 space-y-5">
                {nextSteps.map((step) => (
                  <li key={step.title} className="flex items-start gap-3.5">
                    <span aria-hidden="true" className="kit-iconwell !h-10 !w-10 shrink-0">
                      <step.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[15px] font-bold text-[var(--k-ink)]">{step.title}</p>
                      <p className="mt-0.5 text-[14px] leading-snug text-[var(--k-ink-2)]">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-7 flex items-center gap-2 border-t border-[var(--k-line-strong)] pt-6 text-[14px] text-[var(--k-ink-2)]">
                <Clock3 className="h-4 w-4 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                {copy['next.eta']}
              </div>

              {siteConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap mt-4 inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-[var(--k-red)] hover:underline"
                >
                  {copy['next.whatsapp.label']}
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">{copy['next.whatsapp.newTab']}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
