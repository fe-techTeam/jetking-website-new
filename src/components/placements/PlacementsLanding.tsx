import Image from 'next/image';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { EnquiryLink } from '@/components/EnquirySheet';
import { Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import { OfferLetterSlider } from './OfferLetterSlider';
import { PlacementsTestimonialSlider } from './PlacementsTestimonialSlider';
import { RecruiterMarquee } from './RecruiterMarquee';
import type { PlacementsPageContent } from '@/lib/content/types';
import { fill } from '@/lib/content/copy/define';
import type { placementsCopy } from '@/lib/content/copy/pages/placements';

/**
 * Icon glyphs from the Placements source-asset pack (kept as plain <img>,
 * not next/image — local decorative SVGs, and the image optimizer refuses
 * SVG sources unless `dangerouslyAllowSVG` is set project-wide, which
 * nothing else here asks for).
 */
function IconGlyph({ src, className }: { src: string; className?: string }) {
  // A mask, not an <img>, so the glyph takes the surrounding text colour (red in light, soft red in dark)
  // exactly like the Lucide icons used on every other page.
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className ?? 'h-5 w-5'}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
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
  { labelKey: 'cta.features.0', icon: ICONS.personalisedGuidance },
  { labelKey: 'cta.features.1', icon: ICONS.centreInformation },
  { labelKey: 'cta.features.2', icon: ICONS.quickResponse },
] as const;

/**
 * Qualitative only — no headline counts here. A specific figure like "500+
 * hiring partners" would need a real, sourced number; nothing in this
 * codebase's content backs one, so these stay descriptive.
 */
const HERO_HIGHLIGHTS = [
  { labelKey: 'hero.highlights.0', icon: ICONS.hiringPartners },
  { labelKey: 'hero.highlights.1', icon: ICONS.realworldPreparation },
  { labelKey: 'hero.highlights.2', icon: ICONS.placementSupport },
] as const;

const HERO_CHECKLIST_KEYS = ['hero.checklist.0', 'hero.checklist.1', 'hero.checklist.2'] as const;

export function PlacementsLanding({ placements, copy }: { placements: PlacementsPageContent; copy: typeof placementsCopy.defaults }) {
  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.placements'], path: '/placements' },
  ];
  const {
    hero: PLACEMENTS_HERO,
    offerLetters: OFFER_LETTER_SAMPLES,
    disclaimer: PLACEMENT_DISCLAIMER,
    processSteps: PROCESS_STEPS,
    recruiters: RECRUITERS,
    recruitersDisclaimer: RECRUITERS_DISCLAIMER,
    studentBenefits: STUDENT_BENEFITS,
    testimonials: TESTIMONIALS,
    contact: PLACEMENTS_CONTACT,
  } = placements;

  return (
    <div className="dark-canvas">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
        <Breadcrumbs trail={trail} />

        <div className="relative mt-5 sm:mt-6">
          <div className="dc-banner relative min-h-[min(78vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[28px] lg:min-h-[520px]">
            <div className="absolute inset-x-0 top-0 h-52 xs:h-60 sm:inset-0 sm:h-auto">
            <Image
              src={copy['hero.image']}
              alt=""
              fill
              priority
              sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
              className="object-cover object-[center_22%]"
            />
            </div>
            <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0 hidden sm:block" />

            <div className="relative z-[1] flex h-full min-h-[inherit] max-w-full flex-col justify-end px-6 pt-60 pb-8 xs:px-8 xs:pt-72 xs:pb-10 sm:max-w-[68%] sm:justify-center sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-14">
              <p className="k-hero-eyebrow">{PLACEMENTS_HERO.eyebrow}</p>

              <h1 className="page-title-hero mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                {PLACEMENTS_HERO.titleLead} <span className="dc-accent-glow">{PLACEMENTS_HERO.titleAccent}</span>
              </h1>

              <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                {PLACEMENTS_HERO.lede}
              </p>

              <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                <EnquiryLink
                  source="placements-hero"
                  className="dc-cta inline-flex h-11 grow items-center justify-center rounded-full px-4 text-[13px] font-bold whitespace-nowrap sm:h-14 sm:grow-0 sm:px-5 sm:text-base lg:px-7"
                >
                  {copy['hero.cta.label']}
                </EnquiryLink>
                <a
                  href={PLACEMENTS_CONTACT.tel}
                  aria-label={fill(copy['hero.call.ariaLabel'], {
                    phone: PLACEMENTS_CONTACT.phone,
                  })}
                  className="inline-flex h-11 grow items-center justify-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[13px] font-bold whitespace-nowrap text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] sm:h-14 sm:grow-0 sm:px-5 sm:text-base lg:px-7"
                >
                  <Phone className="h-4 w-4 text-[var(--dc-accent-soft)] lg:hidden" aria-hidden="true" />
                  <span className="lg:hidden">{copy['hero.call.shortLabel']}</span>
                  <span className="hidden lg:inline">
                    {fill(copy['hero.call.longLabel'], {
                      phone: PLACEMENTS_CONTACT.phone,
                    })}
                  </span>
                </a>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {HERO_CHECKLIST_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]">
                    <Check className="h-3.5 w-3.5 text-[var(--dc-accent-soft)]" strokeWidth={2.5} aria-hidden="true" />
                    {copy[key]}
                  </li>
                ))}
              </ul>
            </div>

            {/* Floating highlight cards — qualitative value props, no invented figures */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[36%] flex-col justify-center gap-3 p-6 lg:flex xl:w-[32%] xl:gap-4 xl:p-8">
              {HERO_HIGHLIGHTS.map((item) => (
                <div key={item.labelKey} className="dc-panel pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3.5">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                  >
                    <IconGlyph src={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[13px] leading-tight font-bold text-[var(--dc-ink)]">{copy[item.labelKey]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Honest disclaimer — load-bearing, not decorative ─────────────── */}
      <section className="shell relative mt-8 pb-12 sm:mt-10 sm:pb-14 lg:pb-16">
        <div className="kit kit-card px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[14.5px]">{PLACEMENT_DISCLAIMER}</p>
        </div>
      </section>

      {/* ── Recruiters ────────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="placements-recruiters">
        <SectionHeader
          id="placements-recruiters"
          align="center"
          eyebrow={copy['recruiters.eyebrow']}
          title={
            <>
              {copy['recruiters.titleLead']} <span className="text-[var(--k-red)]">{copy['recruiters.titleAccent']}</span>
            </>
          }
        />
        <RecruiterMarquee items={RECRUITERS} copy={copy} />
        <p className="mx-auto mt-6 max-w-[48rem] text-center text-[14px] leading-relaxed text-[var(--k-ink-3)]">{RECRUITERS_DISCLAIMER}</p>
      </Section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <Section tone="tint" labelledBy="placements-testimonials">
        <SectionHeader
          id="placements-testimonials"
          eyebrow={copy['testimonials.eyebrow']}
          title={
            <>
              {copy['testimonials.titleLead']} <span className="text-[var(--k-red)]">{copy['testimonials.titleAccent']}</span>
            </>
          }
        />
        <PlacementsTestimonialSlider testimonials={TESTIMONIALS} copy={copy} />
      </Section>

      {/* ── Process ───────────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="placements-process">
        <SectionHeader
          id="placements-process"
          eyebrow={copy['process.eyebrow']}
          title={
            <>
              {copy['process.titleLead']} <span className="text-[var(--k-red)]">{copy['process.titleAccent']}</span>
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

      {/* ── Student benefits ─────────────────────────────────────────────── */}
      <Section tone="tint" labelledBy="placements-benefits">
        <SectionHeader
          id="placements-benefits"
          eyebrow={copy['benefits.eyebrow']}
          title={copy['benefits.title']}
          lede={copy['benefits.lede']}
        />
        <Reveal>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative isolate min-h-[240px] overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] shadow-[var(--k-shadow)] sm:min-h-[300px] lg:min-h-full">
              <Image
                src="/home/counsellor.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="-z-10 object-cover object-center"
              />
            </div>
            <ul aria-label={copy['benefits.railLabel']} className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {STUDENT_BENEFITS.map((benefit, index) => (
                <li
                  key={benefit.title}
                  className="kit kit-card kit-card-lift flex items-start gap-3.5 p-4 sm:last:odd:col-span-2"
                >
                  <span className="kit-iconwell">
                    <IconGlyph src={BENEFIT_ICON_SRCS[index] ?? ICONS.learnPractically} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[17px] leading-snug font-extrabold text-[var(--k-ink)]">{benefit.title}</h3>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--k-ink-2)]">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      {/* ── Sample offer letters ──────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="placements-offers">
        <SectionHeader
          id="placements-offers"
          eyebrow={copy['offers.eyebrow']}
          title={
            <>
              {copy['offers.titleLead']} <span className="text-[var(--k-red)]">{copy['offers.titleAccent']}</span>
            </>
          }
          lede={copy['offers.lede']}
        />
        <OfferLetterSlider items={OFFER_LETTER_SAMPLES} label={copy['offers.carouselLabel']} copy={copy} />
      </Section>

      {/* ── Close CTA ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="placements-cta" className="kit bg-[var(--k-bg)]">
        <div className="shell py-10 sm:py-14">
          <div className="relative grid overflow-hidden rounded-[28px] bg-jk-600 text-white lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full border border-white/15"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-4 h-48 w-48 rounded-full border border-white/20"
            />
            <div className="relative order-2 p-6 sm:p-10 lg:order-1">
              <p className="text-[13px] font-bold tracking-[0.12em] text-white/80 uppercase">{copy['cta.eyebrow']}</p>
              <h2
                id="placements-cta"
                className="mt-2.5 font-display text-[28px] leading-[1.1] font-extrabold tracking-[-0.025em] !text-white sm:text-[36px]"
              >
                {copy['cta.titleLead']} {copy['cta.titleAccent']}
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-white/85">{copy['cta.body']}</p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {CTA_FEATURES.map((feature) => (
                  <li key={feature.labelKey} className="flex items-center gap-2 text-[14px] font-semibold text-white/90">
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    {copy[feature.labelKey]}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${PLACEMENTS_CONTACT.email}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-white/60 px-6 text-[14.5px] font-bold text-white transition-colors hover:bg-white/10"
                >
                  {PLACEMENTS_CONTACT.email}
                </a>
                <EnquiryLink
                  source="placements-cta"
                  className="group/cta inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white py-3 pr-3 pl-7 text-[15px] font-bold text-jk-700 transition-colors hover:bg-white/90"
                >
                  {copy['cta.primary.label']}
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 place-items-center rounded-full bg-jk-600 text-white transition-transform duration-200 group-hover/cta:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </EnquiryLink>
              </div>
            </div>
            <div className="relative order-1 min-h-[180px] lg:order-2 lg:min-h-full">
              <Image src="/home/centre-exterior.jpg" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent to-jk-600/60 lg:bg-gradient-to-r lg:from-jk-600 lg:to-transparent"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
