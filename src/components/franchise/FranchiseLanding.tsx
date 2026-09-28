import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  Download,
  FileText,
  Globe,
  Handshake,
  Headphones,
  LineChart,
  Mail,
  Megaphone,
  Rocket,
  Shield,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';
import type { Faq, Testimonial } from '@/lib/content/types';
import { siteConfig } from '@/lib/site';
import { FranchiseTestimonialSlider } from './FranchiseTestimonialSlider';
import { FranchiseEnquiryForm } from './FranchiseEnquiryForm';
import { Disclosure } from '@/components/Disclosure';

const HERO_HIGHLIGHTS = [
  { icon: Award, label: "India's Most Trusted Brand" },
  { icon: TrendingUp, label: 'High Growth Industry' },
  { icon: Handshake, label: 'End-to-End Support' },
  { icon: LineChart, label: 'Attractive ROI & Quick Break-even' },
] as const;

const WHY_CARDS = [
  {
    icon: Shield,
    title: 'Established Brand',
    body: '78 Years of Brand Equity · Most Awarded Franchise Support System',
  },
  {
    icon: LineChart,
    title: 'Job Ready Courses',
    body: 'Job Ready Courses',
  },
  {
    icon: Megaphone,
    title: 'World Class Training for Employees',
    body: 'World Class Training for Employees',
  },
  {
    icon: TrendingUp,
    title: 'Placements Partnerships',
    body: '5000+ Companies Tie up for Placements',
  },
  {
    icon: UsersRound,
    title: 'Countrywide Network',
    body: 'Countrywide Network',
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: 1,
    icon: FileText,
    title: 'Pre-launch',
    body: 'Location identification, interior design & construction; recruitment & training; pre-launch sales, marketing & branding; standards & quality management; technical infrastructure development support.',
  },
  {
    step: 2,
    icon: Users,
    title: 'Launch',
    body: 'Kick Starter Plan; training for staff (marketing, education delivery, placement & business training); promotions for launch event; media coverage.',
  },
  {
    step: 3,
    icon: Handshake,
    title: 'Training',
    body: 'Tech training & exam support; quality management; online training courses; courseware & other technical assistance.',
  },
  {
    step: 4,
    icon: Building2,
    title: 'Ongoing',
    body: 'Daily sales & marketing support; ERP & LMS on web, app & mobile; recruitment & training; annual meet; online and social media marketing.',
  },
  {
    step: 5,
    icon: Rocket,
    title: 'Franchise Support',
    body: 'Award-winning franchise system with a dedicated cluster team for day-to-day operations & management, plus ERP & LMS support across platforms.',
  },
] as const;

const BENEFITS = [
  'Award-winning franchise system',
  '100+ successful Entrepreneurs',
  '60 Days Kick Starter Plan',
  'Pre-Launch Standards & Quality Management',
  'Dedicated Cluster Team for day-to-day operations & Management',
  'ERP & LMS on web, tab & mobile',
] as const;

const STATS_BAR = [
  { icon: Users, value: '100+', label: 'Successful Entrepreneurs' },
  { icon: UsersRound, value: '11+ Lakh', label: 'Students Trained' },
  { icon: Award, value: '78+', label: 'Years of Brand Legacy' },
] as const;

const HERO_STATS = [
  { value: '100+', label: 'Successful Entrepreneurs' },
  { value: '11+ Lakh', label: 'Students Trained' },
  { value: '78+', label: 'Years of Brand Legacy' },
] as const;

const DEMAND_SUPPLY = [
  '3.5 MILLION shortage of Cloud & cyber security professionals by 2025 globally',
  '59% organizations are at extreme or moderate risk due to cybersecurity staff shortage',
  '40 million jobs will be available in Blockchain by 2026',
  'Metaverse market expected to rise USD 936 Billion by 2030',
  '65 lakh people graduate every year in India and 80% of them are not employable',
] as const;

const COURSES = [
  {
    title: 'Career Course',
    lines: ['Diploma In Cloud Computing, Cyber Security, Metaverse Design'],
  },
  {
    title: 'Graduation Course',
    lines: ['Bachelor of Computer Applications in Cloud Computing, Cyber Security, Blockchain'],
  },
  {
    title: 'Certification Course',
    lines: ['Ethical Hacking, CCNA, Linux etc.'],
  },
] as const;

const SKILL_DEVELOPMENT = [
  '53% of employers found entry-level employees with a shortage of right skills',
  '70% of students take more than 6 months to find a relevant job',
  '50% of students prefer vocational training more appealing than formal education',
  '70% of students said vocational training is most helpful for getting a job',
  '82% of employers would pay on an average',
] as const;

export function FranchiseLanding({
  testimonials,
  faqs,
}: {
  testimonials?: Testimonial[];
  faqs?: Faq[];
}) {
  const phone = siteConfig.phone || '8422055373';
  const telPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  return (
    <div
      className={[
        'home-v2 surface-inverse franchise-page relative flex flex-col overflow-hidden',
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
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="v2-eyebrow-glow text-[12px] font-bold tracking-[0.16em] text-[var(--v2-eyebrow)] uppercase sm:text-[12px]">
                Become A Franchise Partner
              </p>

              <h1 className="v2-heading-glow mt-4 font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--v2-ink)] sm:text-[40px] lg:text-[46px]">
                Transform the youth with a Jetking Franchise in your{' '}
                <span className="v2-accent-glow text-[var(--v2-franchise-ink)]">
                  City!
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--v2-ink-secondary)] sm:text-[17px]">
                Since the past 34 years, Jetking has been paving the way for inclusive education.
                The IT sector offers a vast opportunity landscape — and your centre can be where
                that opportunity becomes real careers.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {HERO_HIGHLIGHTS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--v2-ink-secondary)] sm:text-[14px]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[rgb(255_176_122/0.35)] bg-[var(--v2-franchise-tint)] text-[var(--v2-franchise-ink)]">
                      <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#enquire"
                  className="v2-cta-glow group/cta inline-flex min-h-12 items-center gap-3 rounded-full py-3 pr-3 pl-6 text-[15px] font-bold text-white"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  Enquire Now
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </Link>
                <Link
                  href="/franchise"
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-[rgb(232_36_43/0.45)] bg-transparent px-5 py-3 text-[15px] font-bold text-[var(--v2-ink)] transition-colors hover:bg-[rgb(232_36_43/0.12)]"
                >
                  <Download className="h-4 w-4 text-[var(--v2-franchise-ink)]" strokeWidth={2.25} aria-hidden="true" />
                  Download Franchise Brochure
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="v2-card relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
                <Image
                  src="/franchise/hero-building.png"
                  alt="Modern Jetking training centre building"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>

              <div className="v2-bar-glow absolute right-4 bottom-4 left-4 grid grid-cols-3 gap-2 rounded-xl border border-[rgb(232_36_43/0.28)] bg-[var(--v2-ink-bar)] px-4 py-3 sm:right-6 sm:bottom-6 sm:left-6 sm:gap-4 sm:px-6 sm:py-4">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-[15px] font-extrabold text-white sm:text-[17px]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-tight text-[var(--v2-ink-bar-muted)] sm:text-[12px]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Franchise ────────────────────────────────────────────────── */}
      <section id="why-jetking" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <h2 className="v2-heading-glow text-center font-display text-[28px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[34px]">
            Why Franchise with{' '}
            <span className="v2-accent-glow text-[var(--v2-franchise-ink)]">Jetking</span>?
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {WHY_CARDS.map((card) => (
              <article key={card.title} className="v2-card rounded-[var(--radius-card)] p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[rgb(255_176_122/0.35)] bg-[var(--v2-franchise-tint)] text-[var(--v2-franchise-ink)]">
                  <card.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[16px] font-bold text-[var(--v2-ink)]">{card.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--v2-ink-secondary)]">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Franchising ───────────────────────────────────────────── */}
      <section id="why-franchising" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
                Why Franchising Is The Better Way To Start Your Business
              </h2>
              <p className="mt-5 max-w-[70ch] text-[15.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
                If you are looking to set up your own business then franchising is a great
                way to start. Franchising has many benefits that don’t come with starting
                your own business — and it helps you avoid many of the hardships and
                struggles that start-up businesses tend to face.
              </p>

              <div className="mt-6 v2-card rounded-[var(--radius-card)] p-6 sm:p-7">
                <ul className="space-y-3 text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
                  <li className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--v2-franchise-ink)]" />
                    <span>Established system and brand support</span>
                  </li>
                  <li className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--v2-franchise-ink)]" />
                    <span>A-Z guidance for operations and growth</span>
                  </li>
                  <li className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--v2-franchise-ink)]" />
                    <span>Faster path to building a stable centre</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <Link
                href="#enquire"
                className="v2-cta-glow inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold text-white"
              >
                Enquire Now <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>
              <p className="mt-4 text-sm text-[var(--v2-ink-muted)]">
                Get a dedicated franchise discussion about your territory and launch plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Jump start your entrepreneurial dreams ───────────────────── */}
      <section id="jump-start" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
            Jump start your entrepreneurial dreams with us
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Manpower Support',
                body:
                  'You never have to worry about anyone leaving. Regular training courses keep everyone engaged and constantly motivated to learn and grow more — everyday.',
              },
              {
                title: '100% Hassle Free Operations',
                body:
                  'Support mechanism and online systems ensure A-Z of centre management — you stay updated on what is happening and what needs attention.',
              },
              {
                title: 'Advertising & Marketing',
                body:
                  'Our franchise support system helps you spread strong awareness in your locality through Advertising & Local Marketing, PR and Online Marketing.',
              },
              {
                title: 'Start Up',
                body:
                  'We help you identify the best location, support the design and construction of your centre, and help recruit and train the right team for peak performance.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="v2-card rounded-[var(--radius-card)] p-6 sm:p-7"
              >
                <h3 className="font-display text-[16px] font-extrabold text-[var(--v2-ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journey Timeline ───────────────────────────────────────────────── */}
      <section id="journey" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="max-w-2xl">
            <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
              Launch Plan
            </h2>
            <span className="mt-3 block h-1 w-16 rounded-full bg-[var(--v2-accent)] shadow-[0_0_12px_rgb(232_36_43/0.65)]" />
          </div>

          <div className="mt-12 hidden lg:block">
            <div className="relative">
              <div className="fra-timeline-line absolute top-7 right-[10%] left-[10%]" aria-hidden="true" />
              <ol className="relative grid grid-cols-5 gap-4">
                {JOURNEY_STEPS.map((step) => (
                  <li key={step.step} className="text-center">
                    <div className="mx-auto flex flex-col items-center">
                      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(255_176_122/0.35)] bg-[var(--v2-franchise-tint)] text-[var(--v2-franchise-ink)]">
                        <step.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                      </span>
                      <span className="fra-step-circle">{step.step}</span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-bold text-[var(--v2-ink)]">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--v2-ink-secondary)]">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ol className="mt-10 space-y-6 lg:hidden">
            {JOURNEY_STEPS.map((step) => (
              <li key={step.step} className="flex gap-4">
                <span className="fra-step-circle shrink-0 text-[16px]">{step.step}</span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--v2-ink)]">{step.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--v2-ink-secondary)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Demand & Supply ───────────────────────────────────────────── */}
      <section id="demand-supply" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
            Demand &amp; Supply
          </h2>
          <div className="mt-8 v2-card rounded-[var(--radius-card)] p-6 sm:p-7">
            <ul className="space-y-3 text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
              {DEMAND_SUPPLY.map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--v2-franchise-ink)]"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Courses ───────────────────────────────────────────────────── */}
      <section id="courses" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
            Courses
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course) => (
              <article
                key={course.title}
                className="v2-card rounded-[var(--radius-card)] p-6 sm:p-7"
              >
                <h3 className="font-display text-[18px] font-extrabold text-[var(--v2-ink)]">
                  {course.title}
                </h3>
                <ul className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
                  {course.lines.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--v2-franchise-ink)]"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skill Development ────────────────────────────────────────── */}
      <section id="skill-development" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
            Skill Development
          </h2>
          <div className="mt-8 v2-card rounded-[var(--radius-card)] p-6 sm:p-7">
            <ul className="space-y-3 text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
              {SKILL_DEVELOPMENT.map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--v2-franchise-ink)]"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Benefits + Investment + Testimonials ───────────────────────────── */}
      <section className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-8 xl:gap-12">
            <div>
              <h2 className="v2-heading-glow font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[26px]">
                Franchise Support
              </h2>
              <ul className="mt-6 space-y-4">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="fra-check-item">
                    <span className="fra-check-icon">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] font-medium text-[var(--v2-ink)]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="v2-cta-glow mx-auto w-full max-w-[300px] rounded-[var(--radius-card)] bg-[var(--v2-accent)] p-7 text-center text-white lg:mx-0">
              <p className="text-[14px] font-medium text-white/90">Investment Capacity</p>
              <p className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.02em] leading-tight sm:text-[24px]">
                UPTO 50 L · UPTO 1 CR · UPTO 3 CR*
              </p>
              <div className="mt-6 space-y-3 text-left text-[14px] text-white/90">
                <p>
                  <span className="font-semibold text-white">Note:</span> Final investment requirements vary by territory and centre format.
                </p>
              </div>
              <Link
                href="#enquire"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white px-5 text-[15px] font-bold text-[var(--v2-accent)] transition-colors hover:bg-white/95"
              >
                Calculate Your ROI
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>
              <p className="mt-4 text-[12px] text-white/70">*Indicative figures. Subject to territory.</p>
            </div>

            <div id="testimonials">
              <h2 className="v2-heading-glow font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[26px]">
                Our reputation says it all
              </h2>
              <div className="mt-6">
                <FranchiseTestimonialSlider testimonials={testimonials} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Frequently Asked Questions ────────────────────────────────── */}
      {faqs?.length ? (
        <section id="faqs" className="py-14 sm:py-16 lg:py-20">
          <div className="shell">
            <h2 className="v2-heading-glow font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[32px]">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <Disclosure key={faq.id} summary={faq.question}>
                  <p className="text-[14.5px] leading-relaxed text-[var(--v2-ink-secondary)]">
                    {faq.answer}
                  </p>
                </Disclosure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10" aria-label="Key statistics">
        <div className="shell">
          <div className="v2-bar-glow overflow-hidden rounded-[12px] border border-[rgb(232_36_43/0.28)] bg-[var(--v2-ink-bar)] px-4 py-8 sm:px-8 sm:py-10">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              {STATS_BAR.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon
                    className="v2-icon-glow mx-auto h-6 w-6 text-[var(--v2-franchise-ink)]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="mt-2 block font-display text-[22px] font-extrabold text-white sm:text-[24px]">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-[12.5px] text-[var(--v2-ink-bar-muted)]">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Lead form ──────────────────────────────────────────────────────── */}
      <section id="enquire" className="py-14 sm:py-16 lg:py-20">
        <div className="shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
              <div className="v2-card relative h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-image)] sm:h-32 sm:w-32">
                <Image
                  src="/franchise/building-sm.jpg"
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <p className="v2-heading-glow font-display text-[24px] font-extrabold leading-snug tracking-[-0.02em] text-[var(--v2-ink)] sm:text-[28px]">
                So what are you waiting for? Be your own boss and start building your own wealth!
              </p>
            </div>
            <FranchiseEnquiryForm />
          </div>
        </div>
      </section>

      {/* ── Contact bar ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(232_36_43/0.2)] bg-[var(--v2-ink-bar)] py-5">
        <div className="shell">
          <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:flex-wrap sm:gap-8">
            <a
              href={`tel:${telPhone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/90 transition-colors hover:text-[var(--v2-franchise-ink)]"
            >
              <Headphones className="v2-icon-glow h-4 w-4 text-[var(--v2-franchise-ink)]" strokeWidth={2} aria-hidden="true" />
              Speak to Franchise Manager: +91 {phone}
            </a>
            <a
              href="mailto:franchise@jetking.com"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/90 transition-colors hover:text-[var(--v2-franchise-ink)]"
            >
              <Mail className="v2-icon-glow h-4 w-4 text-[var(--v2-franchise-ink)]" strokeWidth={2} aria-hidden="true" />
              franchise@jetking.com
            </a>
            <Link
              href={'/franchise' as Route}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white/90 transition-colors hover:text-[var(--v2-franchise-ink)]"
            >
              <Globe className="v2-icon-glow h-4 w-4 text-[var(--v2-franchise-ink)]" strokeWidth={2} aria-hidden="true" />
              www.jetking.com/franchise
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
