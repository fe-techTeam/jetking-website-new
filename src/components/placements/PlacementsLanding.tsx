import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { OfferLetterSlider } from './OfferLetterSlider';
import { PlacementsTestimonialSlider } from './PlacementsTestimonialSlider';
import { RecruiterMarquee } from './RecruiterMarquee';
import {
  PLACEMENTS_HERO,
  OFFER_LETTER_SAMPLES,
  PLACEMENT_DISCLAIMER,
  PROCESS_STEPS,
  RECRUITERS,
  RECRUITERS_DISCLAIMER,
  STUDENT_BENEFITS,
  TESTIMONIALS,
  PLACEMENTS_CONTACT,
} from './data';

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Placements', path: '/placements' },
];

/**
 * Icon glyphs from the Placements source-asset pack (kept as plain <img>,
 * not next/image — local decorative SVGs, and the image optimizer refuses
 * SVG sources unless `dangerouslyAllowSVG` is set project-wide, which
 * nothing else here asks for).
 */
function IconGlyph({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG icon, not optimized
    <img src={src} alt="" aria-hidden="true" className={className ?? 'h-5 w-5'} />
  );
}

const ICONS = {
  hiringPartners: '/placements/icons/01_hiring_partners.svg',
  placementSupport: '/placements/icons/02_placement_support.svg',
  realworldPreparation: '/placements/icons/03_realworld_preparation.svg',
  completeTraining: '/placements/icons/04_complete_training.svg',
  biodataPreparation: '/placements/icons/05_biodata_preparation.svg',
  mockInterviews: '/placements/icons/06_mock_interviews.svg',
  studentInterviews: '/placements/icons/07_student_interviews.svg',
  appointmentLetter: '/placements/icons/08_appointment_letter.svg',
  learnPractically: '/placements/icons/09_learn_practically.svg',
  englishSpeaking: '/placements/icons/10_english_speaking.svg',
  interviewSkills: '/placements/icons/11_interview_skills.svg',
  getJobs: '/placements/icons/12_get_jobs.svg',
  mockInterviewsFeature: '/placements/icons/13_mock_interviews_feature.svg',
  aiBotInterviews: '/placements/icons/14_ai_bot_interviews.svg',
  presentation: '/placements/icons/15_presentation.svg',
  personalisedGuidance: '/placements/icons/16_personalised_guidance.svg',
  centreInformation: '/placements/icons/17_centre_information.svg',
  quickResponse: '/placements/icons/18_quick_response.svg',
  processArrow: '/placements/icons/25_process_arrow.svg',
} as const;

const PROCESS_STEP_ICONS = [
  ICONS.completeTraining,
  ICONS.biodataPreparation,
  ICONS.mockInterviews,
  ICONS.studentInterviews,
  ICONS.appointmentLetter,
];

const BENEFIT_ICON_SRCS = [
  ICONS.learnPractically,
  ICONS.englishSpeaking,
  ICONS.interviewSkills,
  ICONS.getJobs,
  ICONS.mockInterviewsFeature,
  ICONS.aiBotInterviews,
  ICONS.presentation,
];

const CTA_FEATURES = [
  { label: 'Personalised guidance', icon: ICONS.personalisedGuidance },
  { label: 'Centre-wise information', icon: ICONS.centreInformation },
  { label: 'Quick response', icon: ICONS.quickResponse },
];

/**
 * Qualitative only — no headline counts here. A specific figure like "500+
 * hiring partners" would need a real, sourced number; nothing in this
 * codebase's content backs one, so these stay descriptive.
 */
const HERO_HIGHLIGHTS = [
  { label: 'Hiring partner network', icon: ICONS.hiringPartners },
  { label: 'Real-world interview prep', icon: ICONS.realworldPreparation },
  { label: 'Dedicated placement support', icon: ICONS.placementSupport },
];

const HERO_CHECKLIST = ['Industry connected', 'Personalised support', 'Real career opportunities'];

export function PlacementsLanding() {
  return (
    <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
        <Breadcrumbs trail={trail} />

        <div className="relative mt-5 sm:mt-6">
          <div className="dc-banner relative min-h-[min(78vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[28px] lg:min-h-[520px]">
            <Image
              src="/placements/photos/hero-male.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_22%]"
            />
            <div
              aria-hidden="true"
              className="dc-banner-wash pointer-events-none absolute inset-0"
            />

            <div className="relative z-[1] flex h-full min-h-[inherit] max-w-full flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:max-w-[62%] sm:justify-center sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-14">
              <p className="dc-eyebrow label-mono text-[14px]">{PLACEMENTS_HERO.eyebrow}</p>

              <h1 className="page-title mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                {PLACEMENTS_HERO.titleLead}{' '}
                <span className="dc-accent-glow">{PLACEMENTS_HERO.titleAccent}</span>
              </h1>

              <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                {PLACEMENTS_HERO.lede}
              </p>

              <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                <Link
                  href={'/enquiry' as Route}
                  className="dc-cta inline-flex h-11 grow items-center justify-center rounded-full px-4 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:grow-0 sm:px-5 sm:text-base lg:px-7"
                >
                  Talk to a counsellor
                </Link>
                <a
                  href={PLACEMENTS_CONTACT.tel}
                  aria-label={`Call ${PLACEMENTS_CONTACT.phone}`}
                  className="inline-flex h-11 grow items-center justify-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[13px] font-bold whitespace-nowrap text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] sm:h-14 sm:grow-0 sm:px-5 sm:text-base lg:px-7"
                >
                  <Phone className="h-4 w-4 text-[var(--dc-accent-soft)] lg:hidden" aria-hidden="true" />
                  <span className="lg:hidden">Call now</span>
                  <span className="hidden lg:inline">Call {PLACEMENTS_CONTACT.phone}</span>
                </a>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {HERO_CHECKLIST.map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--dc-ink-secondary)]"
                  >
                    <Check className="h-3.5 w-3.5 text-[var(--dc-accent-soft)]" strokeWidth={2.5} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>

            </div>

            {/* Floating highlight cards — qualitative value props, no invented figures */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[36%] flex-col justify-center gap-3 p-6 lg:flex xl:w-[32%] xl:gap-4 xl:p-8">
              {HERO_HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className="dc-panel pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                  >
                    <IconGlyph src={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[13px] leading-tight font-bold text-[var(--dc-ink)]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Honest disclaimer — load-bearing, not decorative ─────────────── */}
      <section className="shell relative mt-8 sm:mt-10">
        <div className="dc-panel rounded-[16px] px-5 py-5 sm:rounded-[20px] sm:px-6 sm:py-6">
          <p className="text-[13.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[14.5px]">
            {PLACEMENT_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-process">
        <p className="dc-eyebrow label-mono">How it works</p>
        <h2
          id="placements-process"
          className="section-title mt-3 font-display text-[var(--dc-ink)]"
        >
          Five steps from <span className="dc-accent-glow">classroom to offer</span>
        </h2>

        {/* Below lg: a left-aligned timeline joined by a rule; from lg: one row joined by arrows. */}
        <ol className="mt-8 flex flex-col sm:mt-12 sm:items-center lg:flex-row lg:items-start lg:justify-center">
          {PROCESS_STEPS.map((item, index) => {
            const isLast = index === PROCESS_STEPS.length - 1;
            return (
              <Fragment key={item.step}>
                <li
                  className={`relative flex items-start gap-4 max-lg:w-full max-lg:max-w-md lg:w-[172px] lg:shrink-0 lg:flex-col lg:items-center lg:gap-0 lg:text-center ${
                    isLast
                      ? ''
                      : 'max-lg:pb-5 max-lg:before:absolute max-lg:before:top-[3.75rem] max-lg:before:bottom-1 max-lg:before:left-7 max-lg:before:w-px max-lg:before:bg-[var(--dc-accent-border)]'
                  }`}
                >
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--dc-accent-tint)] lg:h-16 lg:w-16">
                    <IconGlyph src={PROCESS_STEP_ICONS[index] ?? ICONS.completeTraining} className="h-7 w-7" />
                    {/* Darkened a touch from the raw accent token — white text at 11px needs
                        4.5:1 for WCAG AA and the plain accent red only clears ~4.48:1. */}
                    <span className="absolute -top-1.5 -left-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--dc-canvas)] bg-[color-mix(in_srgb,var(--dc-accent)_88%,black)] font-display text-[12px] font-extrabold text-white">
                      {item.step}
                    </span>
                  </span>
                  <div className="min-w-0 pt-2 lg:pt-0">
                    <h3 className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-[var(--dc-ink)] lg:mt-3 lg:max-w-[9rem] lg:text-[14.5px]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-snug text-[var(--dc-ink-muted)] lg:mt-1.5 lg:max-w-[10rem] lg:text-[12.5px]">
                      {item.description}
                    </p>
                  </div>
                </li>
                {!isLast ? (
                  <li aria-hidden="true" className="hidden shrink-0 items-center justify-center lg:flex lg:h-16 lg:w-10">
                    <IconGlyph src={ICONS.processArrow} className="h-6 w-6" />
                  </li>
                ) : null}
              </Fragment>
            );
          })}
        </ol>
      </section>

      {/* ── Recruiters ────────────────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-recruiters">
        <div className="text-center">
          <p className="dc-eyebrow label-mono">Our recruiters</p>
          <h2
            id="placements-recruiters"
            className="section-title mt-3 font-display text-[var(--dc-ink)]"
          >
            Brands that are our <span className="dc-accent-glow">placement partners</span>
          </h2>
        </div>

        <RecruiterMarquee items={RECRUITERS} />

        <p className="mx-auto mt-6 max-w-[48rem] text-center text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[13px]">
          {RECRUITERS_DISCLAIMER}
        </p>
      </section>

      {/* ── Student benefits ─────────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-benefits">
        <div className="dc-panel relative overflow-hidden rounded-[24px] px-5 py-9 xs:rounded-[28px] xs:px-6 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dc-eyebrow label-mono">What you build</p>
              <h2
                id="placements-benefits"
                className="section-title mt-3 font-display text-[var(--dc-ink)]"
              >
                What placement preparation covers
              </h2>
            </div>
            <p className="text-[13.5px] font-semibold text-[var(--dc-ink-muted)]">
              More than training — a complete career readiness course.
            </p>
          </div>

          {/* Wraps and stretches each row, so an odd item count never leaves a lone card. */}
          <ul className="relative mt-7 flex flex-wrap gap-3 sm:mt-10 sm:gap-4 lg:gap-5">
            {STUDENT_BENEFITS.map((benefit, index) => (
              <li
                key={benefit.title}
                className="min-w-0 grow basis-[140px] rounded-[16px] lg:basis-[calc(25%-15px)] border border-[var(--dc-hairline)] bg-[var(--dc-surface)] p-3.5 xs:p-4 sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--dc-accent-tint)] sm:h-11 sm:w-11"
                >
                  <IconGlyph src={BENEFIT_ICON_SRCS[index] ?? ICONS.learnPractically} className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[14px] font-extrabold text-[var(--dc-ink)]">{benefit.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Sample offer letters ──────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-offers">
        <p className="dc-eyebrow label-mono">What an offer looks like</p>
        <h2
          id="placements-offers"
          className="section-title mt-3 font-display text-[var(--dc-ink)]"
        >
          Sample <span className="dc-accent-glow">offer letters</span>
        </h2>
        <p className="mt-3 max-w-[42rem] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          Illustrative samples across sectors and roles. They show the shape of a typical offer —
          not a promise of any employer, role or package.
        </p>

        <div className="mt-6">
          <OfferLetterSlider items={OFFER_LETTER_SAMPLES} label="Offer letter samples, carousel" />
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-testimonials">
        <div className="dc-panel overflow-hidden rounded-[24px] px-6 py-10 xs:rounded-[28px] sm:px-10 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dc-eyebrow label-mono">In their words</p>
              <h2
                id="placements-testimonials"
                className="section-title mt-3 font-display text-[var(--dc-ink)]"
              >
                What placed learners <span className="dc-accent-glow">say</span>
              </h2>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <PlacementsTestimonialSlider testimonials={TESTIMONIALS} />
          </div>
        </div>
      </section>

      {/* ── Close CTA ─────────────────────────────────────────────────────── */}
      <section className="shell relative mt-16 sm:mt-20 lg:mt-24" aria-labelledby="placements-cta">
        <div className="dc-panel overflow-hidden rounded-[24px] xs:rounded-[28px] sm:rounded-[28px]">
          <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10 xl:px-12">
            <div className="max-w-2xl">
              <p className="dc-eyebrow label-mono">Next step</p>
              <h2
                id="placements-cta"
                className="section-title mt-3 font-display text-[var(--dc-ink)]"
              >
                Ask about a <span className="dc-accent-glow">specific centre</span>
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
                A counsellor can tell you what your nearest centre has actually achieved — not a
                sitewide average.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {CTA_FEATURES.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2 text-[13px] font-semibold text-[var(--dc-ink-muted)]"
                  >
                    <IconGlyph src={feature.icon} className="h-4 w-4" />
                    {feature.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${PLACEMENTS_CONTACT.email}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--dc-hairline-strong)] px-6 text-sm font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
              >
                {PLACEMENTS_CONTACT.email}
              </a>
              <Link
                href={'/enquiry' as Route}
                className="group/cta dc-cta inline-flex min-h-12 items-center justify-center gap-3 rounded-full py-3.5 pr-3 pl-7 text-[15px] font-bold sm:text-[16px]"
              >
                Talk to a counsellor
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
