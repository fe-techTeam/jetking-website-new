import Image from 'next/image';

export interface LogoItem {
  name: string;
  src?: string;
}

/**
 * Equal-size logo tiles in a tidy grid (3-up phone, 6-up desktop). A tile with no image falls
 * back to the name as text, so a missing logo never leaves a hole.
 */
export function LogoStrip({
  label,
  logos,
  size = 'md',
  showNames = false,
}: {
  label: string;
  logos: LogoItem[];
  /** `lg` for a handful of logos (4 or fewer) that should read at a glance. */
  size?: 'md' | 'lg';
  /** Print each name under its logo. */
  showNames?: boolean;
}) {
  const lg = size === 'lg';
  return (
    <ul aria-label={label} className={`kit grid gap-2.5 sm:gap-3 ${lg ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'}`}>
      {logos.map((l) => (
        <li
          key={l.name}
          className={`flex flex-col items-center justify-center gap-2 rounded-[var(--k-r-sm)] border border-[var(--k-line)] bg-white px-3 py-3 text-center ${showNames ? 'min-h-32' : lg ? 'h-24 sm:h-28' : 'h-16 sm:h-20'}`}
        >
          {l.src ? (
            <Image
              src={l.src}
              alt={showNames ? '' : l.name}
              width={160}
              height={64}
              className={`h-auto w-auto max-w-full object-contain ${lg ? 'max-h-14 sm:max-h-16' : 'max-h-8 sm:max-h-10'}`}
            />
          ) : null}
          {!l.src || showNames ? <span className="text-[12.5px] leading-snug font-semibold text-[#374151]">{l.name}</span> : null}
        </li>
      ))}
    </ul>
  );
}
