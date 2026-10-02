import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';

export interface OrbitItem {
  label: string;
  detail: string;
  icon: LucideIcon;
  /** Absolute placement around the portrait, applied from `sm` up. */
  className: string;
}

function OrbitCard({ item, className }: { item: OrbitItem; className: string }) {
  return (
    <div className={`stu-float items-start gap-2.5 rounded-2xl p-3 sm:p-3.5 ${className}`}>
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--stu-accent-tint)] text-[var(--stu-accent-soft)]"
      >
        <item.icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[13px] font-extrabold text-[var(--stu-ink)]">{item.label}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--stu-ink-secondary)]">{item.detail}</span>
      </span>
    </div>
  );
}

/**
 * Circular hero portrait with four benefit cards around it. On phones the
 * portrait is too narrow for cards to float beside it without covering the
 * face, so they drop into a 2×2 grid underneath.
 */
export function HeroOrbit({
  src,
  alt,
  items,
  imageClassName = 'object-cover object-center',
}: {
  src: string;
  alt: string;
  items: readonly OrbitItem[];
  imageClassName?: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
      <div className="relative mx-auto aspect-square w-[min(100%,280px)] sm:w-[min(100%,440px)] lg:w-full lg:max-w-[500px]">
        <div aria-hidden="true" className="stu-orbit-ring absolute inset-[3%] rounded-full sm:inset-[10%]" />
        <div
          aria-hidden="true"
          className="absolute inset-[8%] rounded-full border border-dashed border-[var(--stu-accent)]/28 sm:inset-[16%]"
        />

        <div className="absolute inset-[12%] overflow-hidden sm:inset-[20%] rounded-full bg-[linear-gradient(160deg,var(--card),var(--surface-sunken),var(--card))] shadow-media">
          <Image src={src} alt={alt} fill priority sizes="(min-width: 1024px) 380px, 75vw" className={imageClassName} />
        </div>

        {items.map((item) => (
          <OrbitCard
            key={item.label}
            item={item}
            className={`absolute z-10 hidden max-w-[172px] sm:flex ${item.className}`}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
        {items.map((item) => (
          <OrbitCard key={item.label} item={item} className="flex" />
        ))}
      </div>
    </div>
  );
}
