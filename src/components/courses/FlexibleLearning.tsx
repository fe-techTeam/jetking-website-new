import { CalendarDays, MonitorPlay, RefreshCw, Sunset, type LucideIcon } from 'lucide-react';
import { Section, SectionHeader } from '@/components/kit';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';

const ICONS: LucideIcon[] = [CalendarDays, Sunset, MonitorPlay, RefreshCw];

/**
 * How a course can fit around a job: the batch formats the Professional page used to list, now that it is no
 * longer listed. The wording stays in that page's copy, so it is still edited in one place.
 */
export function FlexibleLearning({ copy }: { copy: typeof professionalCopy.defaults }) {
  const options = ICONS.map((icon, i) => ({
    icon,
    label: copy[`flex.${i}.label` as keyof typeof copy],
  }));

  return (
    <Section tone="tint" labelledBy="courses-flex">
      <SectionHeader id="courses-flex" title={copy['flex.title']} lede={copy['flex.lede']} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {options.map(({ icon: Icon, label }) => (
          <li key={label} className="kit kit-card flex items-center gap-3.5 p-4 sm:p-5">
            <span className="kit-iconwell shrink-0" aria-hidden="true">
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <p className="text-[15px] leading-snug font-bold text-[var(--k-ink)]">{label}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
