import { BrandIconGlyph, Section, SectionHeader } from '@/components/kit';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';

const FLEX_ICON_KEYS = [
  'flex.0.icon',
  'flex.1.icon',
  'flex.2.icon',
  'flex.3.icon',
] as const;

/**
 * How a course can fit around a job: the batch formats the Professional page used to list, now that it is no
 * longer listed. The wording stays in that page's copy, so it is still edited in one place.
 */
export function FlexibleLearning({ copy }: { copy: typeof professionalCopy.defaults }) {
  const options = FLEX_ICON_KEYS.map((iconKey, i) => ({
    icon: copy[iconKey],
    label: copy[`flex.${i}.label` as keyof typeof copy],
  }));

  return (
    <Section tone="tint" labelledBy="courses-flex">
      <SectionHeader id="courses-flex" title={copy['flex.title']} lede={copy['flex.lede']} />
      <ul className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 md:grid-cols-4">
        {options.map(({ icon, label }) => (
          <li key={label} className="kit kit-card flex items-center gap-3.5 p-4 sm:p-5">
            <span className="kit-iconwell shrink-0 text-[var(--k-red)]" aria-hidden="true">
              <BrandIconGlyph src={icon} className="h-5 w-5" />
            </span>
            <p className="text-[15px] leading-snug font-bold text-[var(--k-ink)]">{label}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
