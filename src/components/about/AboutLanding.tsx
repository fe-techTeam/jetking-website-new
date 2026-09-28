'use client';

import Image from 'next/image';
import {
  ArrowUpRight,
  Award,
  Building2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import {
  ABOUT_HERO,
  ACHIEVEMENTS,
  DIRECTORS,
  legacyStats,
  MANAGEMENT_TEAM,
  PARTNERSHIPS,
  PURPOSE,
  type Leader,
} from './data';
import { AboutTimeline } from './AboutTimeline';
import { LeaderAvatar } from './LeaderAvatar';
import { LeaderDetailModal } from './LeaderDetailModal';

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about-us' },
];

const STAT_ICONS = [Award, Users, Building2, ShieldCheck] as const;

/** `compact` (no-bio team members): two per row on phones with a smaller avatar, full size from `sm`. */
function LeaderCard({ leader, compact = false }: { leader: Leader; compact?: boolean }) {
  return (
    <li data-reveal>
      <article className="dc-card-shell h-full">
        <div className={`dc-card flex h-full flex-col sm:p-6 ${compact ? 'p-3.5' : 'p-5'}`}>
          <div className={`relative mx-auto shrink-0 overflow-hidden rounded-full bg-[var(--dc-surface)] ring-1 ring-[var(--dc-hairline)] sm:h-32 sm:w-32 ${compact ? 'h-16 w-16' : 'h-28 w-28'}`}>
            <LeaderAvatar leader={leader} />
          </div>
          <div className={`flex flex-1 flex-col text-center sm:mt-5 ${compact ? 'mt-3' : 'mt-5'}`}>
            <h3 className={`font-display font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[20px] ${compact ? 'text-[15px]' : 'text-[18px]'}`}>
              {leader.name}
            </h3>
            <p className={`mt-1 font-bold text-[var(--dc-accent-soft)] sm:text-[13px] ${compact ? 'text-[12px] leading-snug' : 'text-[13px]'}`}>{leader.role}</p>
            {leader.bio ? <LeaderDetailModal leader={leader} /> : null}
          </div>
        </div>
      </article>
    </li>
  );
}

export function AboutLanding() {
  const { ref: awardsRef, edge: awardsEdge, scrollByItem: scrollAwardsBy } = useScrollTrack<HTMLUListElement>();

  return (
    <div className="dark-canvas pb-14 sm:pb-16 lg:pb-20">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
        <Breadcrumbs trail={trail} />

        <div className="relative mt-5 sm:mt-6">
          <div className="dc-banner relative min-h-[min(78vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[32px] lg:min-h-[520px]">
            <Image
              src="/home/journey-explore-v2.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_28%]"
            />
            <div
              aria-hidden="true"
              className="dc-banner-wash pointer-events-none absolute inset-0"
            />

            <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
              <p className="dc-eyebrow label-mono text-[14px]">{ABOUT_HERO.eyebrow}</p>

              <h1 className="dc-heading-glow mt-4 font-display text-[34px] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance text-[var(--dc-ink)] xs:text-[40px] sm:mt-5 sm:text-[48px] md:text-[52px] lg:text-[56px]">
                <span className="dc-accent-glow">{ABOUT_HERO.titleLead}</span>
                <span className="mt-1 block sm:mt-1.5">{ABOUT_HERO.titleAccent}</span>
              </h1>

              <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                {ABOUT_HERO.lede}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Legacy stats ─────────────────────────────────────────────────── */}
      <section className="shell relative mt-8 sm:mt-10" aria-label="Legacy at a glance">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {legacyStats().map((stat, index) => {
            const Icon = STAT_ICONS[index] ?? Award;
            return (
              <div
                key={stat.label}
                className="dc-panel rounded-[20px] px-4 py-5 sm:rounded-[24px] sm:px-5 sm:py-6"
                data-reveal
              >
                <Icon
                  className="h-5 w-5 text-[var(--dc-accent-soft)]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="mt-3 block font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] sm:text-[32px]">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-[13px] font-semibold text-[var(--dc-ink-muted)]">
                    {stat.label}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* ── Purpose & values ─────────────────────────────────────────────── */}
      <section className="shell relative mt-10 sm:mt-12 lg:mt-14" aria-labelledby="about-purpose">
        <p className="dc-eyebrow label-mono">Purpose</p>
        <h2
          id="about-purpose"
          className="dc-heading-glow mt-3 font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] xs:text-[32px] sm:text-[36px] lg:text-[40px]"
        >
          Our purpose &amp;{' '}
          <span className="dc-accent-glow">values</span>
        </h2>
        <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[16px]">
          What we aim for, how we work, and the standards we hold ourselves to.
        </p>

        <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
          {PURPOSE.map((item, index) => (
            <li key={item.title} data-reveal>
              <article className="dc-card-shell h-full">
                <div className="dc-card flex h-full flex-col p-5 sm:p-6 lg:p-7">
                  <span className="numeral text-[13px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[22px]">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
                    {item.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Leadership ───────────────────────────────────────────────────── */}
      <section className="shell relative mt-10 sm:mt-12 lg:mt-14" aria-labelledby="about-leaders">
        <p className="dc-eyebrow label-mono">Leadership</p>
        <h2
          id="about-leaders"
          className="dc-heading-glow mt-3 max-w-[20ch] font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] xs:text-[32px] sm:text-[36px] lg:text-[40px]"
        >
          The leaders who drive our{' '}
          <span className="dc-accent-glow">growth</span>
        </h2>
        <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[16px]">
          Learn from passionate instructors with expertise who believe in practical teaching
          methodologies.
        </p>

        <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {DIRECTORS.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} />
          ))}
        </ul>

        <h3 className="mt-14 font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:mt-16 sm:text-[22px]">
          Management team
        </h3>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {MANAGEMENT_TEAM.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} compact />
          ))}
        </ul>
      </section>

      {/* ── Legacy timeline ──────────────────────────────────────────────── */}
      <section className="shell relative mt-10 sm:mt-12 lg:mt-14" aria-labelledby="about-timeline">
        <p className="dc-eyebrow label-mono">History</p>
        <h2
          id="about-timeline"
          className="dc-heading-glow mt-3 max-w-[22ch] font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] xs:text-[32px] sm:text-[36px] lg:text-[40px]"
        >
          A legacy that we take{' '}
          <span className="dc-accent-glow">pride in</span>
        </h2>
        <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[16px]">
          Over the course of decades, we have achieved some glorious feats. Check out the
          timeline of how our journey unfolded.
        </p>

        {/* Decade tabs — click a range to see that era's milestones (AboutTimeline.tsx). */}
        <AboutTimeline />
      </section>

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      <section className="shell relative mt-10 sm:mt-12 lg:mt-14" aria-labelledby="about-awards">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="dc-eyebrow label-mono">Recognition</p>
            <h2
              id="about-awards"
              className="dc-heading-glow mt-3 font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] xs:text-[32px] sm:text-[36px] lg:text-[40px]"
            >
              Our <span className="dc-accent-glow">achievements</span>
            </h2>
          </div>
          <ScrollNavButtons
            edge={awardsEdge}
            onPrev={() => scrollAwardsBy(-1)}
            onNext={() => scrollAwardsBy(1)}
            label="achievements"
            className="mb-1 shrink-0"
          />
        </div>
        <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[16px]">
          Over the decades, we’ve accomplished remarkable milestones. Explore the timeline that
          showcases how our journey has evolved.
        </p>

        <ul
          ref={awardsRef}
          // Phones: a swipeable row (12 tall cards stacked was a very long scroll). sm+: the grid.
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:mt-12 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-5 [&::-webkit-scrollbar]:hidden"
          aria-label="Awards and achievements"
          tabIndex={0}
        >
          {ACHIEVEMENTS.map((item) => (
            <li key={item.title} data-reveal className="w-[78%] shrink-0 snap-start sm:w-auto sm:shrink">
              <article className="dc-panel flex h-full flex-col rounded-[20px] p-5 sm:rounded-[22px] sm:p-6">
                <div className="relative flex h-36 w-full items-center justify-center sm:h-40 lg:h-44">
                  <Image
                    src={item.imageSrc}
                    alt=""
                    width={320}
                    height={320}
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
                    className="h-full w-full object-contain"
                  />
                </div>
                <h3 className="mt-5 font-display text-[15px] font-extrabold tracking-[-0.015em] text-[var(--dc-ink)] sm:text-[16px]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[13.5px]">
                  {item.body}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Partnerships ─────────────────────────────────────────────────── */}
      <section className="shell relative mt-10 sm:mt-12 lg:mt-14" aria-labelledby="about-partnerships">
        <p className="dc-eyebrow label-mono">Alliances</p>
        <h2
          id="about-partnerships"
          className="dc-heading-glow mt-3 font-display text-[28px] font-extrabold tracking-[-0.03em] text-[var(--dc-ink)] xs:text-[32px] sm:text-[36px] lg:text-[40px]"
        >
          Our <span className="dc-accent-glow">partnerships</span>
        </h2>

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
          {PARTNERSHIPS.map((partner) => (
            <li key={partner.name} data-reveal>
              <article className="dc-card-shell h-full">
                <div className="dc-card flex h-full flex-col p-5 sm:p-6">
                  <div className="relative flex h-28 w-full items-center justify-center sm:h-32">
                    <Image
                      src={partner.logo}
                      alt=""
                      width={200}
                      height={200}
                      sizes="(min-width: 640px) 33vw, 90vw"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h3 className="mt-5 font-display text-[16px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)]">
                    {partner.name}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--dc-ink-secondary)]">
                    {partner.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Toward the Future ───────────────────────────────────────────────
         New venture announcement — deliberately its own section, closing the
         page, so it reads as a forward-looking postscript to the legacy
         story above rather than being folded into it. */}
      <section className="shell relative mt-14 sm:mt-16 lg:mt-20" aria-labelledby="about-future">
        <a
          href="https://www.jetking.org"
          target="_blank"
          rel="noopener noreferrer"
          className="dc-panel group flex flex-col items-start gap-3 rounded-[20px] p-6 transition-colors hover:border-[var(--dc-accent)]/40 sm:flex-row sm:items-center sm:justify-between sm:rounded-[24px] sm:p-8"
        >
          <div>
            <p id="about-future" className="text-[17px] font-extrabold text-[var(--dc-ink)] sm:text-[19px]">
              First Bitcoin Company in India Listed on the Bombay Stock Exchange
            </p>
            <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              Secure your company&rsquo;s future with Bitcoin. Unparalleled transparency, unmatched
              security, and proven value retention. Join the movement!
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[var(--dc-accent)]">
            jetking.org
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </a>
      </section>
    </div>
  );
}
