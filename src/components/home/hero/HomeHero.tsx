import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Briefcase, FlaskConical, GraduationCap } from 'lucide-react';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import type { NetworkCounts } from '@/lib/brand-facts';
import { HeroEnquireCta } from './HeroEnquireCta';
import { HeroEnquiryCard } from '@/components/HeroEnquiryCard';
import type { EnquiryCentre } from '@/components/EnquiryModal';

/**
 * The homepage — "Future-Ready".
 *
 * The lead is a full-width photo banner, like /courses and the centre pages: copy on the left and the enquiry
 * card on the right (desktop). The audience chooser (student /
 * professional / browsing) is no longer shown here; the audience pages stay reachable from the menus.
 *
 * Ask Jetking lives on the global Guide launcher. There is no floating quick-action
 * rail here (Find Center / Call / Book Counselling) — the Professional page still uses it.
 */
export function HomeHero({
  enquiryCentres,
  copy,
}: {
  /** Centres offered in the hero's quick-enquiry modal (state → centre). */
  enquiryCentres: EnquiryCentre[];
  /** Network size — no longer shown in the banner; kept so the caller is unchanged. */
  counts?: NetworkCounts;
  /** The headline outcome ("3586 / Learners placed in 2025"), from the placements content. */
  placed?: { value: string; label: string };
  copy: HomeCopy;
}) {
  return (
    <section
      className={[
        'home-v2 home-v2-themeable relative flex flex-col overflow-hidden',
        /* A little air between the header and the banner photo. */
        'pt-3 sm:pt-5',
      ].join(' ')}
    >
      {/* ── Banner: full-width photo, copy left, enquiry card right, numbers strip along the bottom ── */}
      <div className="centres-detail-hero relative !rounded-none !border-0 !shadow-none">
        <Image
          src={copy['hero.image']}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_30%] lg:object-[center_30%]"
        />
        <div aria-hidden="true" className="centres-detail-wash pointer-events-none absolute inset-0" />

        <div className="shell relative z-[1] flex flex-col">
          <div className="flex min-h-[min(110vw,560px)] flex-col min-[880px]:min-h-[540px] min-[880px]:flex-row min-[880px]:items-center min-[880px]:justify-between min-[880px]:gap-6 lg:gap-8">
            <div className="flex flex-1 flex-col justify-center py-9 xs:py-11 sm:py-12 min-[880px]:max-w-[58%] min-[880px]:py-12">
              <h1 className="page-title-hero text-[var(--dc-ink)]">
                {copy['hero.title.line1']}
                <br />
                {copy['hero.title.line2']} <span className="text-[var(--dc-accent-soft)]">{copy['hero.title.accent']}</span>
              </h1>

              <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:text-[16px] lg:text-[17px] 3xl:text-[18px]">
                {copy['hero.sub.line1']}
                <br className="hidden sm:inline" /> {copy['hero.sub.line2']}
              </p>

              <div className="mt-6 flex flex-row flex-wrap items-center gap-2.5 xs:mt-7 xs:gap-3 sm:mt-8 sm:gap-x-4 sm:gap-y-5 lg:mt-8">
                <Link
                  href={copy['hero.cta.href'] as Route}
                  className="v2-cta-glow group/explore inline-flex min-h-11 items-center gap-2 rounded-full py-2.5 pr-3.5 pl-4 text-[13px] font-bold text-white transition-[background-color,box-shadow] duration-200 sm:min-h-12 sm:gap-6 sm:py-4 sm:pr-5.5 sm:pl-7 sm:text-[16px]"
                >
                  {copy['hero.cta.label']}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/explore:translate-x-0.5 sm:h-5 sm:w-5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
                <HeroEnquireCta centres={enquiryCentres} label={copy['hero.enquire.label']} />
              </div>

            </div>

            <HeroEnquiryCard
              centres={enquiryCentres}
              source="home-hero-form"
              tone="dc"
              titleId="home-hero-form-title"
              earlyShow
            />
          </div>

          {/* The Power of Three, as a dark strip along the foot of the banner. */}
          <div className="pb-5 sm:pb-6">
          <div
            className="relative isolate overflow-hidden rounded-2xl p-2  text-white shadow-[0_24px_50px_-28px_rgb(11_31_74/0.7)]"
            style={{ background: 'linear-gradient(135deg, #0b1f4a 0%, #0f2b63 60%, #12326f 100%)' }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgb(216 31 38 / 0.3) 0%, transparent 70%)' }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.1) 1.2px, transparent 1.4px)', backgroundSize: '22px 22px', maskImage: 'linear-gradient(to bottom left, #000, transparent 60%)', WebkitMaskImage: 'linear-gradient(to bottom left, #000, transparent 60%)' }} />
            </div>
            <ul aria-label={copy['hero.headline.accent']} className="grid gap-2 sm:grid-cols-3">
              {[
                { text: copy['hero.pillar1'], Icon: GraduationCap },
                { text: copy['hero.pillar2'], Icon: FlaskConical },
                { text: copy['hero.pillar3'], Icon: Briefcase },
              ].map(({ text, Icon }) => (
                <li key={text} className="flex items-center justify-start gap-3 rounded-xl sm:justify-center border border-white/15 bg-white/10 px-3 py-2.5">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--v2-accent)] text-white">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-[14px] leading-snug font-semibold sm:text-[15px]">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
