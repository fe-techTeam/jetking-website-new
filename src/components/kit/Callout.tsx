import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * A band that carries one message and one action (a counsellor call-back, a brochure). Light
 * red wash with a left accent edge: loud enough to notice, never a dark block.
 */
export function Callout({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action: ReactNode;
}) {
  return (
    <aside className="kit relative flex flex-col gap-5 overflow-hidden rounded-[var(--k-r)] border border-[color-mix(in_srgb,var(--k-red-fill)_16%,transparent)] bg-[var(--k-red-wash)] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--k-red-fill)]" />
      <div className="flex min-w-0 items-start gap-4">
        <span className="kit-iconwell bg-[var(--k-bg)]" aria-hidden="true">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[18px] leading-snug font-bold text-[var(--k-ink)] sm:text-[20px]">{title}</p>
          {children ? <p className="mt-1 text-[15px] leading-relaxed text-[var(--k-ink-2)]">{children}</p> : null}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </aside>
  );
}
