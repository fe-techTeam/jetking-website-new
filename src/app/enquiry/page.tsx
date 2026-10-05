import { toEnquiryCentres } from '@/lib/enquiry-centres';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Clock3, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import { content } from '@/lib/content';
import { enquiryCopy } from '@/lib/content/copy/pages/enquiry';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
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
  const [courses, cities, centres] = await Promise.all([
    content.listCourses(),
    content.listCities(),
    content.listCentres(),
  ]);

  return (
    <div
      className={[
        'student-page relative overflow-hidden',
        /* Bleed the page's own gradient background up behind the sticky,
           transparent header instead of stopping in a hard line at its
           bottom edge — see the matching fix in home/v2/HomeV2.tsx. Offsets
           must match SiteHeader's height breakpoints (72/80/88/96). */
        '-mt-[72px] pt-[72px]',
        'xs:-mt-[80px] xs:pt-[80px]',
        'sm:-mt-[88px] sm:pt-[88px]',
        '2xl:-mt-[96px] 2xl:pt-[96px]',
      ].join(' ')}
    >
      <section className="shell relative pt-10 pb-8 xs:pt-12 sm:pt-14 sm:pb-10 lg:pt-16">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]">
          {copy['hero.eyebrow']}
        </p>
        <h1 className="page-title-sm mt-4 max-w-xl font-display text-[var(--dc-ink)]">
          {copy['hero.title']}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          {copy['hero.body']}
        </p>
      </section>

      <section className="relative bg-[var(--dc-surface)] pt-10 pb-14 sm:pt-12 sm:pb-16 lg:pb-20">
        <div className="shell">
          <div className="stu-card overflow-hidden rounded-[24px] xs:rounded-[28px] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 xs:p-7 sm:p-8 lg:p-10">
              <Suspense fallback={<p className="text-sm text-[var(--dc-ink-muted)]">{copy['form.loading']}</p>}>
                <EnquiryForm
                  courses={courses.map((c) => ({ slug: c.slug, title: c.shortTitle }))}
                  centres={toEnquiryCentres(centres, cities)}
                  copy={copy}
                />
              </Suspense>
            </div>

            <div className="border-t border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] p-6 xs:p-7 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
              <h2 className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[20px]">
                {copy['next.title']}
              </h2>
              <ol className="mt-6 space-y-5">
                {nextSteps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[var(--dc-accent-soft)] bg-[var(--dc-card)] text-[13px] font-extrabold text-[var(--dc-accent-soft)]"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[14.5px] font-bold text-[var(--dc-ink)]">{step.title}</p>
                      <p className="mt-0.5 text-[14px] leading-snug text-[var(--dc-ink-secondary)]">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-7 flex items-center gap-2 border-t border-[var(--dc-hairline-strong)] pt-6 text-[13.5px] text-[var(--dc-ink-muted)]">
                <Clock3 className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                {copy['next.eta']}
              </div>

              {siteConfig.whatsappNumber ? (
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
                >
                  {copy['next.whatsapp.label']}
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">{copy['next.whatsapp.newTab']}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
