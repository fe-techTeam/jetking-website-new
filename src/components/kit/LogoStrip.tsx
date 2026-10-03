import Image from 'next/image';

export interface LogoItem {
  name: string;
  src?: string;
}

/**
 * Equal-size logo tiles in a tidy grid (3-up phone, 6-up desktop). A tile with no image falls
 * back to the name as text, so a missing logo never leaves a hole.
 */
export function LogoStrip({ label, logos }: { label: string; logos: LogoItem[] }) {
  return (
    <ul aria-label={label} className="kit grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
      {logos.map((l) => (
        <li
          key={l.name}
          className="grid h-16 place-items-center rounded-[var(--k-r-sm)] border border-[var(--k-line)] bg-white px-3 sm:h-20"
        >
          {l.src ? (
            <Image src={l.src} alt={l.name} width={120} height={48} className="max-h-8 w-auto max-w-full object-contain sm:max-h-10" />
          ) : (
            <span className="text-center text-[13px] font-bold text-[#374151]">{l.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
