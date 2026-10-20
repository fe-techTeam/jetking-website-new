/**
 * Brand SVG glyph rendered as a CSS mask so it inherits the surrounding text colour
 * (red in light mode, soft red on dark canvases) — same pattern as placements icons.
 */
export function BrandIconGlyph({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className ?? 'h-5 w-5'}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}
