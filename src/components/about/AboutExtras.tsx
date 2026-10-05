import Image from 'next/image';
import { Award, Cpu, Headphones, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
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
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {reasons.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="kit kit-card flex gap-4 p-5 sm:p-6">
                <span className="kit-iconwell shrink-0" aria-hidden="true">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-extrabold text-[var(--k-ink)]">{title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section tone="tint" labelledBy="about-families">
        <SectionHeader
          id="about-families"
          eyebrow="For families"
          title={fill(parent['loves.title'], { siteName: siteConfig.name })}
        />
        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {family.map(({ icon: Icon, label }) => (
              <li key={label} className="kit kit-card flex flex-col items-start gap-3 p-4 sm:p-5">
                <span className="kit-iconwell" aria-hidden="true">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <p className="text-[14.5px] leading-snug font-bold text-[var(--k-ink)]">{label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
    </>
  );
}
