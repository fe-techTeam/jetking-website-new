import Image from 'next/image';
import { CardSlider } from './CardSlider';

export interface PlacementItem {
  name: string;
  company: string;
  package?: string;
  photoUrl?: string;
  /** A stand-in shown until the centre's real placements are entered. */
  placeholder?: boolean;
  placeholderBadge?: string;
}

/** Recent placements as a card slider (see `CardSlider`). */
export function PlacementSlider({ items, label }: { items: PlacementItem[]; label: string }) {
  return (
    <CardSlider label={label} cols={4}>
      {items.map((p, index) => (
        <article key={`${p.name}-${p.company}-${index}`} className={`kit-card flex h-full flex-col items-center gap-3 !border-2 p-5 text-center sm:p-6 ${p.placeholder ? '!border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)]' : '!border-[var(--k-red)]'}`}>
          <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--k-red-wash)] ring-4 ring-[var(--k-red)]">
            {p.photoUrl ? (
              <Image src={p.photoUrl} alt={p.name} fill sizes="80px" className="object-cover object-top" />
            ) : (
              <span className="text-[20px] font-extrabold text-[var(--k-red)]">
                {p.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </span>
          {p.placeholder && p.placeholderBadge ? (
            <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{p.placeholderBadge}</span>
          ) : null}
          <h3 className="text-[16.5px] leading-snug font-extrabold break-words text-[var(--k-ink)]">{p.name}</h3>
          <p className="line-clamp-2 text-[14px] leading-snug text-[var(--k-ink-3)]">{p.company}</p>
          {p.package && (p.placeholder || /\d/.test(p.package)) ? (
            <span className="numeral mt-auto rounded-full bg-[var(--k-red-fill)] px-3.5 py-1 text-[12.5px] font-bold text-white">
              {p.package}
            </span>
          ) : null}
        </article>
      ))}
    </CardSlider>
  );
}
