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
  Rocket,
  Target,
} from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { IconSlot } from '@/components/kit/IconSlot';
import { CardRail, Reveal, Section, SectionHeader, StatBadges } from '@/components/kit';
import { isSectionVisible } from '@/lib/content/copy/sections';
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

/**
 * Leadership cards.
 * - Default (directors): portrait stack; 1 col on phones, 2 from `sm`, 4 from `lg`.
 * - `compact` (management): photo + name/role row; full-width on phones (long titles need room),
 *   2 from `sm`, 3 from `lg`.
 */
function LeaderCard({
  leader,
  compact = false,
  copy,
}: {
  leader: Leader;
  compact?: boolean;
  copy: typeof aboutCopy.defaults;
}) {
  if (compact) {
    return (
      <li data-reveal className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-16px)]">
        <article className="kit kit-card flex h-full min-h-24 items-stretch overflow-hidden sm:min-h-0">
          <div className="relative w-24 shrink-0 self-stretch bg-[var(--k-red-wash)] sm:w-28">
            <LeaderAvatar leader={leader} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 sm:p-4">
            <h3 className="font-display text-[16px] leading-snug font-extrabold text-[var(--k-ink)] sm:text-[16px]">
              {leader.name}
            </h3>
            {leader.role ? (
              <p className="text-[13px] leading-snug font-bold text-pretty text-[var(--k-red)] sm:text-[12.5px]">
                {leader.role}
              </p>
            ) : null}
            {leader.bio ? <LeaderDetailModal leader={leader} copy={copy} /> : null}
          </div>
        </article>
      </li>
    );
  }

  return (
    <li data-reveal className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-18px)]">
      <article className="kit kit-card kit-card-lift h-full">
        <div className="flex h-full flex-col items-center gap-4 p-5 text-center sm:gap-5 sm:p-7 lg:p-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-[var(--k-red-wash)] ring-1 ring-[var(--k-line)] sm:h-32 sm:w-32 lg:h-28 lg:w-28 xl:h-32 xl:w-32">
            <LeaderAvatar leader={leader} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <h3 className="font-display text-[18px] leading-snug font-extrabold tracking-[-0.02em] text-balance text-[var(--k-ink)] sm:text-[20px] lg:text-[18px] xl:text-[20px]">
              {leader.name}
            </h3>
            {leader.role ? (
              <p className="mt-1 text-[13px] font-bold text-pretty text-[var(--k-red)] sm:text-[14px]">{leader.role}</p>
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
  const show = (id: string) => isSectionVisible(copy, id);
  return (
    <div className="dark-canvas">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {show('hero') ? (
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[min(78vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[28px] lg:min-h-[520px] 3xl:min-h-[600px] 4xl:min-h-[680px]">
              <Image
                src={copy['hero.image']}
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_35%]"
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
      ) : (
        <div className="shell relative pt-6 sm:pt-8">
          <Breadcrumbs trail={trail} />
        </div>
      )}

      {/* ── Legacy stats ─────────────────────────────────────────────────── */}
      {show('legacy') ? (
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
      ) : null}

      {/* ── Purpose & values ─────────────────────────────────────────────── */}
      {show('purpose') ? (
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
          <div className="grid gap-4 sm:gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative isolate min-h-[260px] overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] shadow-[var(--k-shadow)] sm:min-h-[340px] lg:min-h-full">
              <Image
                src={copy['purpose.image']}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="-z-10 object-cover object-center"
              />
            </div>
            <ul aria-label={copy['purpose.railLabel']} className="grid gap-4 sm:gap-5">
              {PURPOSE.map((item, index) => {
                const Icon = PURPOSE_ICONS[index % PURPOSE_ICONS.length];
                return (
                  <li key={item.title} className="kit kit-card kit-card-lift flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
                      <IconSlot icon={Icon} className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-[18px] leading-snug font-extrabold text-[var(--k-ink)]">{item.title}</h3>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

        <Reveal>
          <h3 className="mt-12 text-[20px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:mt-14 sm:text-[22px]">
            {copy['essence.title']}
          </h3>
          <ol aria-label={copy['essence.railLabel']} className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="kit kit-card p-5 sm:p-6">
                <span className="numeral text-[13px] font-extrabold tracking-[0.12em] text-[var(--k-red)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 className="mt-2 font-display text-[18px] leading-snug font-extrabold text-[var(--k-ink)]">
                  {copy[`essence.${i}.title` as keyof typeof copy]}
                </h4>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">
                  {copy[`essence.${i}.body` as keyof typeof copy]}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>
      ) : null}

      {/* ── Reasons and what families value, carried over from the Explore and Parent pages ── */}
      {show('why') || show('families') ? (
        <AboutExtras
          part="why"
          explore={explore}
          parent={parent}
          showReasons={show('why')}
          showFamilies={show('families')}
        />
      ) : null}

      {/* ── Leadership ───────────────────────────────────────────────────── */}
      {show('leaders') ? (
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
        <ul className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-7 sm:gap-5 lg:gap-6">
          {MANAGEMENT_TEAM.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} compact copy={copy} />
          ))}
        </ul>
      </Section>
      ) : null}

      {/* ── Legacy timeline ──────────────────────────────────────────────── */}
      {show('timeline') ? (
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
      ) : null}

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      {show('achievements') ? (
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
                    className="max-h-full max-w-[11rem] object-contain sm:max-w-[12.5rem]"
                  />
                </div>
                <h3 className="mt-5 text-[16px] font-extrabold text-[var(--k-ink)]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--k-ink-2)]">{item.body}</p>
              </article>
            ))}
          </CardRail>
        </Reveal>
      </Section>
      ) : null}

      {/* ── Partnerships ─────────────────────────────────────────────────── */}
      {show('partnerships') ? (
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
                    className="max-h-full max-w-[10rem] object-contain"
                  />
                </div>
                <h3 className="mt-5 text-[17px] font-extrabold text-[var(--k-ink)]">{partner.name}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">{partner.body}</p>
              </article>
            ))}
          </CardRail>
        </Reveal>
      </Section>
      ) : null}

      {/* ── Affiliations, carried over from the Explore page ── */}
      {show('affiliations') ? <AboutExtras part="affiliations" explore={explore} parent={parent} /> : null}

      {/* ── Toward the Future ───────────────────────────────────────────────
         New venture announcement — deliberately its own section, closing the
         page, so it reads as a forward-looking postscript to the legacy
         story above rather than being folded into it. */}
      {show('future') ? (
      <section aria-labelledby="about-future" className="kit bg-[var(--k-bg)]">
        <div className="shell py-10 sm:py-14">
          <a
            href={copy['future.href']}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-[28px] bg-jk-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-10"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full border border-white/15" />
            <span aria-hidden="true" className="pointer-events-none absolute -top-12 -right-4 h-48 w-48 rounded-full border border-white/20" />
            <div className="relative flex items-start gap-4 sm:items-center sm:gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
                <Rocket className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <p id="about-future" className="font-display text-[22px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[28px]">
                  {copy['future.title']}
                </p>
                <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-white/85">
                  {copy['future.body']}
                </p>
              </div>
            </div>
            <span className="relative inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-bold text-jk-700">
              {copy['future.linkLabel']}
              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </span>
          </a>
        </div>
      </section>
      ) : null}
    </div>
  );
}
