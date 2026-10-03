import Image from 'next/image';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { EnquiryLink } from '@/components/EnquirySheet';
import { CardRail, FeatureCard, Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
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
    <div className="dark-canvas">
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

            <div className="relative z-[1] flex h-full min-h-[inherit] max-w-full flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:max-w-[68%] sm:justify-center sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-14">
              <p className="dc-eyebrow label-mono text-[14px]">{PLACEMENTS_HERO.eyebrow}</p>

              <h1 className="page-title-hero mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                {PLACEMENTS_HERO.titleLead}{' '}
                <span className="dc-accent-glow">{PLACEMENTS_HERO.titleAccent}</span>
              </h1>

              <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                {PLACEMENTS_HERO.lede}
              </p>

              <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                <EnquiryLink
                  source="placements-hero"
                  className="dc-cta inline-flex h-11 grow items-center justify-center rounded-full px-4 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:grow-0 sm:px-5 sm:text-base lg:px-7"
                >
                  Talk to a counsellor
                </EnquiryLink>
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
                    className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]"
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
      <section className="shell relative mt-8 pb-12 sm:mt-10 sm:pb-14 lg:pb-16">
        <div className="dc-panel rounded-[16px] px-5 py-5 sm:rounded-[20px] sm:px-6 sm:py-6">
          <p className="text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[14.5px]">
            {PLACEMENT_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────────────────────── */}
      <Section tone="tint" deco="grid" labelledBy="placements-process">
        <SectionHeader
          id="placements-process"
          eyebrow="How it works"
          title={
            <>
              Five steps from <span className="text-[var(--k-red)]">classroom to offer</span>
            </>
          }
        />
        <Reveal>
          <StepPath
            steps={PROCESS_STEPS.map((item, index) => ({
              icon: <IconGlyph src={PROCESS_STEP_ICONS[index] ?? ICONS.completeTraining} className="h-8 w-8 lg:h-10 lg:w-10" />,
              title: item.title,
              label: String(item.step),
              body: <p className="lg:max-w-[12rem]">{item.description}</p>,
            }))}
          />
        </Reveal>
      </Section>

      {/* ── Recruiters ────────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="placements-recruiters">
        <SectionHeader
          id="placements-recruiters"
          align="center"
          eyebrow="Our recruiters"
          title={
            <>
              Brands that are our <span className="text-[var(--k-red)]">placement partners</span>
            </>
          }
        />
        <RecruiterMarquee items={RECRUITERS} />
        <p className="mx-auto mt-6 max-w-[48rem] text-center text-[14px] leading-relaxed text-[var(--k-ink-3)]">
          {RECRUITERS_DISCLAIMER}
        </p>
      </Section>

      {/* ── Student benefits ─────────────────────────────────────────────── */}
      <Section tone="tint" labelledBy="placements-benefits">
        <SectionHeader
          id="placements-benefits"
          eyebrow="What you build"
          title="What placement preparation covers"
          lede="More than training — a complete career readiness course."
        />
        <Reveal>
          <CardRail label="What placement preparation covers" cols={4} colsMd={2}>
            {STUDENT_BENEFITS.map((benefit, index) => (
              <FeatureCard
                key={benefit.title}
                icon={<IconGlyph src={BENEFIT_ICON_SRCS[index] ?? ICONS.learnPractically} className="h-5 w-5" />}
                title={benefit.title}
              >
                {benefit.description}
              </FeatureCard>
            ))}
          </CardRail>
        </Reveal>
      </Section>

      {/* ── Sample offer letters ──────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="placements-offers">
        <SectionHeader
          id="placements-offers"
          eyebrow="What an offer looks like"
          title={
            <>
              Sample <span className="text-[var(--k-red)]">offer letters</span>
            </>
          }
          lede="Illustrative samples across sectors and roles. They show the shape of a typical offer — not a promise of any employer, role or package."
        />
        <OfferLetterSlider items={OFFER_LETTER_SAMPLES} label="Offer letter samples, carousel" />
      </Section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <Section tone="wash" labelledBy="placements-testimonials">
        <SectionHeader
          id="placements-testimonials"
          eyebrow="In their words"
          title={
            <>
              What placed learners <span className="text-[var(--k-red)]">say</span>
            </>
          }
        />
        <PlacementsTestimonialSlider testimonials={TESTIMONIALS} />
      </Section>

      {/* ── Close CTA ─────────────────────────────────────────────────────── */}
      <Section tone="tint" deco="glow" labelledBy="placements-cta">
        <div className="kit-card flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">Next step</p>
            <h2 id="placements-cta" className="section-title mt-2.5 text-[var(--k-ink)]">
              Ask about a <span className="text-[var(--k-red)]">specific centre</span>
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)]">
              A counsellor can tell you what your nearest centre has actually achieved — not a sitewide average.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {CTA_FEATURES.map((feature) => (
                <li key={feature.label} className="flex items-center gap-2 text-[14px] font-semibold text-[var(--k-ink-2)]">
                  <IconGlyph src={feature.icon} className="h-4 w-4" />
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${PLACEMENTS_CONTACT.email}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--k-line-strong)] px-6 text-[14.5px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
            >
              {PLACEMENTS_CONTACT.email}
            </a>
            <EnquiryLink
              source="placements-cta"
              className="group/cta inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[var(--k-red-fill)] py-3 pr-3 pl-7 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
            >
              Talk to a counsellor
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--k-red)] transition-transform duration-200 group-hover/cta:translate-x-0.5"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </EnquiryLink>
          </div>
        </div>
      </Section>
    </div>
  );
}
