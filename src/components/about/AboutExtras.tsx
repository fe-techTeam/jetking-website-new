import Image from 'next/image';
import { Award, Cpu, Headphones, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { IconSlot } from '@/components/kit/IconSlot';
import { Reveal, Section, SectionHeader } from '@/components/kit';
import { REASONS } from '@/components/explore/content';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import { fill } from '@/lib/content/copy/define';
import { siteConfig } from '@/lib/site';
import type { exploreCopy } from '@/lib/content/copy/pages/explore';
import type { parentCopy } from '@/lib/content/copy/pages/parent';

const FAMILY_ICONS: LucideIcon[] = [ShieldCheck, Users, Cpu, Headphones, Award];

/**
 * What the audience pages (Explore, Parent) used to carry that belongs on the About page now that those
 * pages are no longer listed. `why` (all ten reasons to choose Jetking, and what families value) follows the
 * purpose and values; `affiliations` follows the partnerships. The wording stays in those pages' copy, so it is
 * still edited in one place.
 */
export function AboutExtras({
  part,
  explore,
  parent,
}: {
  part: 'why' | 'affiliations';
  explore: typeof exploreCopy.defaults;
  parent: typeof parentCopy.defaults;
}) {
  const reasons = REASONS.map((reason, i) => ({
    icon: reason.icon,
    title: explore[`reasons.${i}.title` as keyof typeof explore],
    detail: explore[`reasons.${i}.detail` as keyof typeof explore],
  }));
  const family = [0, 1, 2, 3, 4].map((i) => ({
    icon: FAMILY_ICONS[i] ?? Award,
    label: fill(parent[`loves.${i}.label` as keyof typeof parent], { since: SINCE_FOUNDED }),
  }));
  const affiliations = [0, 1, 2, 3].map((i) => ({
    name: explore[`affiliation.${i}.name` as keyof typeof explore],
    image: explore[`affiliation.${i}.image` as keyof typeof explore],
  }));

  if (part === 'affiliations') {
    return (
      <Section tone="plain" labelledBy="about-affiliations">
        <SectionHeader id="about-affiliations" title={explore['affiliation.title']} />
        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {affiliations.map(({ name, image }) => (
              <li key={name} className="kit kit-card flex h-28 items-center justify-center p-4 sm:h-32">
                <Image src={image} alt={name} width={180} height={90} className="h-full w-full object-contain" />
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
    );
  }

  return (
    <>
      <Section tone="plain" labelledBy="about-reasons">
        <SectionHeader
          id="about-reasons"
          eyebrow="Why Jetking"
          title={fill(explore['reasons.title'], { brand: siteConfig.name })}
        />
        <Reveal>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div className="relative isolate min-h-[220px] overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] shadow-[var(--k-shadow)] sm:min-h-[280px] lg:min-h-full">
              <Image
                src="/home/why-labs.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="-z-10 object-cover object-[center_35%]"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-scrim/90 via-scrim/35 to-transparent" />
              <div className="flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8">
                <p className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-white sm:text-[28px]">
                  {reasons[1]?.title}
                </p>
                <p className="mt-2 max-w-[36ch] text-[14.5px] leading-relaxed text-white/80">{reasons[1]?.detail}</p>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {reasons.map(({ icon, title, detail }, i) =>
                i === 1 ? null : (
                  <li
                    key={title}
                    className={`kit kit-card flex items-start gap-4 p-4 sm:p-5 ${i === reasons.length - 1 ? 'sm:col-span-2' : ''}`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--k-red-wash)] text-[var(--k-red)] ring-1 ring-[var(--k-line)]">
                      <IconSlot icon={icon} className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15.5px] leading-snug font-extrabold text-[var(--k-ink)]">{title}</h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-[var(--k-ink-2)]">{detail}</p>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>
        </Reveal>
      </Section>

      <Section tone="tint" labelledBy="about-families">
        <SectionHeader
          id="about-families"
          eyebrow="For families"
          title={fill(parent['loves.title'], { siteName: siteConfig.name })}
        />
        <Reveal>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
            {family.map(({ icon, label }) => (
              <li key={label} className="kit kit-card kit-card-lift flex items-center gap-4 p-4 sm:flex-col sm:items-start sm:gap-5 sm:p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
                  <IconSlot icon={icon} className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <p className="text-[15px] leading-snug font-bold text-[var(--k-ink)]">{label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
    </>
  );
}