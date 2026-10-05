'use client';

import Image from 'next/image';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Eye,
  Heart,
  Landmark,
  MapPin,
  Target,
} from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { CardRail, FeatureCard, Reveal, Section, SectionHeader, StatBadges } from '@/components/kit';
import type { AboutPageContent, Leader } from '@/lib/content/types';
import { legacyStats, type NetworkCounts } from '@/lib/brand-facts';
import type { aboutCopy } from '@/lib/content/copy/pages/about';
import type { exploreCopy } from '@/lib/content/copy/pages/explore';
import type { parentCopy } from '@/lib/content/copy/pages/parent';
import { AboutExtras } from './AboutExtras';
import { AboutTimeline } from './AboutTimeline';
import { LeaderAvatar } from './LeaderAvatar';
import { LeaderDetailModal } from './LeaderDetailModal';

const STAT_LABEL_KEYS = [
  'legacy.stats.0.label',
  'legacy.stats.1.label',
  'legacy.stats.2.label',
  'legacy.stats.3.label',
] as const;
const STAT_ICONS = [Landmark, Building2, MapPin, BookOpen] as const;
const PURPOSE_ICONS = [Eye, Target, Heart] as const;

/** `compact` (no-bio team members): two per row on phones with a smaller avatar, full size from `sm`. */
function LeaderCard({
  leader,
  compact = false,
  copy,
}: {
  leader: Leader;
  compact?: boolean;
  copy: typeof aboutCopy.defaults;
}) {
  return (
    <li
      data-reveal
      className="w-[calc(50%-6px)] sm:w-[calc(50%-10px)] lg:w-[calc(25%-18px)]"
    >
      <article className="kit kit-card h-full">
        <div className={`flex h-full flex-col sm:p-6 ${compact ? 'p-3.5' : 'p-4'}`}>
          <div className={`relative mx-auto shrink-0 overflow-hidden rounded-full bg-[var(--dc-surface)] ring-1 ring-[var(--dc-hairline)] sm:h-32 sm:w-32 ${compact ? 'h-16 w-16' : 'h-20 w-20'}`}>
            <LeaderAvatar leader={leader} />
          </div>
          <div className={`flex flex-1 flex-col text-center sm:mt-5 ${compact ? 'mt-3' : 'mt-4'}`}>
            <h3 className={`font-display font-extrabold tracking-[-0.02em] text-balance text-[var(--dc-ink)] sm:text-[20px] ${compact ? 'text-[15px]' : 'text-[16px]'}`}>
              {leader.name}
            </h3>
            {leader.role ? (
              <p className={`mt-1 font-bold text-[var(--k-red)] sm:text-[13px] ${compact ? 'text-[12px] leading-snug' : 'text-[13px]'}`}>{leader.role}</p>
            ) : null}
            {leader.bio ? <LeaderDetailModal leader={leader} copy={copy} /> : null}
          </div>
        </div>
      </article>
    </li>
  );
}

export function AboutLanding({
  counts,
  about,
  copy,
  explore,
  parent,
}: {
  counts: NetworkCounts;
  about: AboutPageContent;
  copy: typeof aboutCopy.defaults;
  explore: typeof exploreCopy.defaults;
  parent: typeof parentCopy.defaults;
}) {
  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.about'], path: '/about-us' },
  ];
  const { hero: ABOUT_HERO, purpose: PURPOSE, directors: DIRECTORS, managementTeam: MANAGEMENT_TEAM } = about;
  const { achievements: ACHIEVEMENTS, partnerships: PARTNERSHIPS } = about;
  return (
    <div className="dark-canvas">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
        <Breadcrumbs trail={trail} />

        <div className="relative mt-5 sm:mt-6">
          <div className="dc-banner relative min-h-[min(78vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[28px] lg:min-h-[520px]">
            <Image
              src={copy['hero.image']}
              alt=""
              fill
              priority
              sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
              className="object-cover object-[center_28%]"
            />
            <div
              aria-hidden="true"
              className="dc-banner-wash pointer-events-none absolute inset-0"
            />

            <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 xs:py-12 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[68%] lg:px-12 lg:py-16 xl:px-14">
              <p className="k-hero-eyebrow">{ABOUT_HERO.eyebrow}</p>

              <h1 className="page-title-hero mt-4 font-display text-balance text-[var(--dc-ink)] sm:mt-5">
                <span className="dc-accent-glow">{ABOUT_HERO.titleLead}</span>
                <span className="mt-1 block sm:mt-1.5">{ABOUT_HERO.titleAccent}</span>
              </h1>

              <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
                {ABOUT_HERO.lede}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Legacy stats ─────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="about-legacy">
        <h2 id="about-legacy" className="sr-only">
          {copy['legacy.heading']}
        </h2>
        <Reveal>
          <StatBadges
            stats={legacyStats(counts).map((stat, index) => ({
              value: stat.value,
              label: copy[STAT_LABEL_KEYS[index] ?? STAT_LABEL_KEYS[0]],
              icon: STAT_ICONS[index] ?? Landmark,
            }))}
          />
        </Reveal>
      </Section>

      {/* ── Purpose & values ─────────────────────────────────────────────── */}
      <Section tone="tint" deco="grid" labelledBy="about-purpose">
        <SectionHeader
          id="about-purpose"
          eyebrow={copy['purpose.eyebrow']}
          title={
            <>
              {copy['purpose.titleLead']}{' '}
              <span className="text-[var(--k-red)]">{copy['purpose.titleAccent']}</span>
            </>
          }
          lede={copy['purpose.lede']}
        />
        <Reveal>
          <CardRail label={copy['purpose.railLabel']} cols={3}>
            {PURPOSE.map((item, index) => (
              <FeatureCard key={item.title} icon={PURPOSE_ICONS[index % PURPOSE_ICONS.length]} title={item.title} badge={String(index + 1).padStart(2, '0')}>
                {item.body}
              </FeatureCard>
            ))}
          </CardRail>
        </Reveal>
      </Section>

      {/* ── Reasons and what families value, carried over from the Explore and Parent pages ── */}
      <AboutExtras part="why" explore={explore} parent={parent} />

      {/* ── Leadership ───────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="about-leaders">
        <SectionHeader
          id="about-leaders"
          eyebrow={copy['leaders.eyebrow']}
          title={
            <>
              {copy['leaders.titleLead']}{' '}
              <span className="text-[var(--k-red)]">{copy['leaders.titleAccent']}</span>
            </>
          }
          lede={copy['leaders.lede']}
        />

        {/* Cards set their own widths (LeaderCard); a short last row centres instead of hugging the left. */}
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:gap-6">
          {DIRECTORS.filter((leader) => leader.name).map((leader) => (
            <LeaderCard key={leader.name} leader={leader} copy={copy} />
          ))}
        </ul>

        <h3 className="mt-14 text-[20px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:mt-16 sm:text-[22px]">
          {copy['leaders.managementHeading']}
        </h3>
        <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-9 sm:gap-5 lg:gap-6">
          {MANAGEMENT_TEAM.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} compact copy={copy} />
          ))}
        </ul>
      </Section>

      {/* ── Legacy timeline ──────────────────────────────────────────────── */}
      <Section tone="tint" labelledBy="about-timeline">
        <SectionHeader
          id="about-timeline"
          eyebrow={copy['timeline.eyebrow']}
          title={
            <>
              {copy['timeline.titleLead']}{' '}
              <span className="text-[var(--k-red)]">{copy['timeline.titleAccent']}</span>
            </>
          }
          lede={copy['timeline.lede']}
        />
        {/* Decade tabs — click a range to see that era's milestones (AboutTimeline.tsx). */}
        <AboutTimeline timeline={about.timeline} copy={copy} />
      </Section>

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      <Section tone="plain" labelledBy="about-awards">
        <SectionHeader
          id="about-awards"
          eyebrow={copy['achievements.eyebrow']}
          title={
            <>
              {copy['achievements.titleLead']}{' '}
              <span className="text-[var(--k-red)]">{copy['achievements.titleAccent']}</span>
            </>
          }
          lede={copy['achievements.lede']}
        />
        <Reveal>
          <CardRail label={copy['achievements.railLabel']} cols={4} colsMd={2}>
            {ACHIEVEMENTS.map((item) => (
              <article key={item.title} className="kit kit-card kit-card-lift flex h-full flex-col p-5 sm:p-6">
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
                <h3 className="mt-5 text-[16px] font-extrabold text-[var(--k-ink)]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--k-ink-2)]">{item.body}</p>
              </article>
            ))}
          </CardRail>
        </Reveal>
      </Section>

      {/* ── Partnerships ─────────────────────────────────────────────────── */}
      <Section tone="tint" labelledBy="about-partnerships">
        <SectionHeader
          id="about-partnerships"
          eyebrow={copy['partnerships.eyebrow']}
          title={
            <>
              {copy['partnerships.titleLead']}{' '}
              <span className="text-[var(--k-red)]">{copy['partnerships.titleAccent']}</span>
            </>
          }
        />
        <Reveal>
          <CardRail label={copy['partnerships.railLabel']} cols={3}>
            {PARTNERSHIPS.map((partner) => (
              <article key={partner.name} className="kit kit-card flex h-full flex-col p-5 sm:p-6">
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
                <h3 className="mt-5 text-[17px] font-extrabold text-[var(--k-ink)]">{partner.name}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">{partner.body}</p>
              </article>
            ))}
          </CardRail>
        </Reveal>
      </Section>

      {/* ── Affiliations, carried over from the Explore page ── */}
      <AboutExtras part="affiliations" explore={explore} parent={parent} />

      {/* ── Toward the Future ───────────────────────────────────────────────
         New venture announcement — deliberately its own section, closing the
         page, so it reads as a forward-looking postscript to the legacy
         story above rather than being folded into it. */}
      <Section tone="tint" labelledBy="about-future">
        <a
          href={copy['future.href']}
          target="_blank"
          rel="noopener noreferrer"
          className="kit kit-card kit-card-lift group flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p id="about-future" className="text-[18px] font-extrabold text-[var(--k-ink)] sm:text-[20px]">
              {copy['future.title']}
            </p>
            <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[var(--k-ink-2)]">
              {copy['future.body']}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[var(--k-red)]">
            {copy['future.linkLabel']}
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </a>
      </Section>
    </div>
  );
}
