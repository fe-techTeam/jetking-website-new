import Image from 'next/image';
import { CardSlider } from './CardSlider';

export interface PlacementItem {
  name: string;
  company: string;
  package?: string;
  photoUrl?: string;
}

/** Recent placements as a card slider (see `CardSlider`). */
export function PlacementSlider({ items, label }: { items: PlacementItem[]; label: string }) {
  return (
    <CardSlider label={label} cols={4}>
      {items.map((p) => (
        <article key={`${p.name}-${p.company}`} className="kit-card flex h-full flex-col items-center gap-3 p-5 text-center sm:p-6">
          <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--k-red-wash)]">
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
          <h3 className="text-[16.5px] leading-snug font-extrabold break-words text-[var(--k-ink)]">{p.name}</h3>
          <p className="line-clamp-2 text-[14px] leading-snug text-[var(--k-ink-3)]">{p.company}</p>
          {p.package && /\d/.test(p.package) ? (
            <span className="numeral mt-auto rounded-full bg-[var(--k-red-wash)] px-3 py-1 text-[12.5px] font-bold text-[var(--k-red)]">
              {p.package}
            </span>
          ) : null}
        </article>
      ))}
    </CardSlider>
  );
}
