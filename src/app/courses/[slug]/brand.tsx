import { brandMark } from '@/lib/course-logos';

/** Logo above label — used for the tools / certifications grids. */
export function BrandTile({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <BrandMark name={name} />
      <span className="max-w-[8.5rem] text-[13px] leading-snug font-semibold text-[var(--dc-ink-secondary)]">
        {name}
      </span>
    </div>
  );
}

/** The logo square alone; `small` is the masthead's certification strip. */
export function BrandMark({ name, small = false }: { name: string; small?: boolean }) {
  const mark = brandMark(name);
  const lightMark = mark ? isLightBrandColor(mark.color) : false;
  const initials = name
    .replace(/[^A-Za-z0-9+/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, part.length <= 4 ? part.length : 1).toUpperCase())
    .join('')
    .slice(0, 4);

  return (
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center overflow-hidden border border-[var(--dc-hairline)] ${
          small ? 'h-10 w-10 rounded-xl' : 'h-16 w-16 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]'
        } ${
          mark?.painted
            ? 'bg-transparent p-0'
            : lightMark
              ? 'bg-tile-dark'
              : 'bg-white'
        }`}
      >
        {mark?.painted ? (
          // eslint-disable-next-line @next/next/no-img-element -- local painted SVG badge
          <img src={mark.src} alt="" className="h-full w-full object-cover" />
        ) : mark ? (
          <span
            className={`dc-logo ${small ? '!h-6 !w-6' : '!h-9 !w-9 sm:!h-10 sm:!w-10'}`}
            style={
              {
                '--logo': `url(${mark.src})`,
                color: mark.color,
              } as React.CSSProperties
            }
          />
        ) : (
          <span className={`font-display font-extrabold tracking-tight text-ink-500 ${small ? 'text-[11px]' : 'text-[15px]'}`}>
            {initials || '·'}
          </span>
        )}
      </span>
  );
}

/** True when a brand hex would vanish on a white tile. */
function isLightBrandColor(hex: string): boolean {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return false;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  // Relative luminance — treat near-white / neon yellows as needing a dark pad.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.82;
}
