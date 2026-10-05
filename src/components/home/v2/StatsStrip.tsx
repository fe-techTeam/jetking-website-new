import { Award, Building2, MapPin, ShieldCheck } from 'lucide-react';
import { legacyStats, type NetworkCounts } from '@/lib/brand-facts';

const ICONS = [Award, Building2, MapPin, ShieldCheck] as const;

/**
 * The proof strip along the foot of the home banner: the founding year and the size of the network, all
 * from `brand-facts` (the year is fixed, the counts come from the content source). Student, placement
 * and recruiter figures are not shown until Jetking confirms them.
 */
export function StatsStrip({ counts }: { counts: NetworkCounts }) {
  const stats = legacyStats(counts);

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[16px] border border-[var(--v2-hairline)] bg-[var(--v2-card)] text-[var(--v2-ink)] shadow-[0_8px_24px_-16px_rgb(16_16_24/0.25)] lg:flex lg:flex-row lg:items-stretch">
      {stats.map((stat, i) => {
        const Icon = ICONS[i] ?? Award;
        return (
          <div
            key={stat.label}
            className="flex min-h-[72px] flex-1 items-center gap-3.5 border-[var(--v2-hairline)] px-4 py-3.5 max-lg:[&:nth-child(n+3)]:border-t max-lg:[&:nth-child(2n)]:border-l lg:justify-center lg:border-l lg:px-5 lg:py-0 lg:first:border-l-0 xl:px-6"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--v2-accent)]/10 text-[var(--v2-accent-soft)]"
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <dd className="numeral order-1 text-[22px] leading-none font-extrabold sm:text-[26px]">{stat.value}</dd>
              <dt className="mt-1 text-[12.5px] leading-snug font-semibold text-[var(--v2-ink-secondary)] sm:text-[13.5px]">
                {stat.label}
              </dt>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
