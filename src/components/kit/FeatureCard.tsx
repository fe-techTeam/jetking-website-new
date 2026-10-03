import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Icon + title + one or two lines. The default building block for "why us" grids. */
export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="kit kit-card kit-card-lift flex h-full flex-col gap-3 p-5 sm:p-6">
      <span className="kit-iconwell" aria-hidden="true">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <h3 className="text-[17px] leading-snug font-bold text-[var(--k-ink)]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-[var(--k-ink-2)]">{children}</p>
    </article>
  );
}
