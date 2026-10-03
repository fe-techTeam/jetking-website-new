import type { LucideIcon } from 'lucide-react';

export interface Stat {
  value: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Big-number proof points. Two-up on phones, four-up on desktop. Only pass figures we can source.
 */
export function StatBadges({ stats }: { stats: Stat[] }) {
  return (
    <dl
      className="kit grid grid-cols-2 gap-3 sm:gap-4 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ '--n': Math.min(stats.length, 4) } as React.CSSProperties}
    >
      {stats.map(({ value, label, icon: Icon }) => (
        <div key={label} className="kit-card flex flex-col gap-1 p-4 sm:p-6">
          {Icon ? (
            <span className="kit-iconwell mb-2" aria-hidden="true">
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
          ) : null}
          <dd className="numeral order-1 text-[1.875rem] leading-none font-extrabold text-[var(--k-ink)] sm:text-[2.5rem]">
            {value}
          </dd>
          <dt className="order-2 text-[13.5px] leading-snug font-semibold text-[var(--k-ink-3)] sm:text-[15px]">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
