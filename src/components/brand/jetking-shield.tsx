import { cn } from '@/lib/utils';

interface JetkingShieldProps {
  className?: string;
  style?: React.CSSProperties;
  /** Retained for API compatibility with older call sites. */
  id?: string;
  /**
   * `mark` — official shield PNG (flat).
   * `solid` — isometric 3D token with float (sidebar reactor).
   * `draw` — stroke SVG for loader construct phase.
   */
  variant?: 'mark' | 'solid' | 'draw';
}

/** How many plates stack into the isometric extrusion. */
const EXTRUDE_LAYERS = 18;
/** Screen-space offset per plate (px) — creates readable depth. */
const EXTRUDE_OFFSET = 1.8;

/**
 * Jetking shield emblem.
 *
 * `mark` uses the official artwork. `solid` builds an isometric extruded
 * token (readable 3D even when still) with a soft float. `draw` is a stroke
 * reconstruction for animated loaders.
 */
export function JetkingShield({ className, style, id, variant = 'mark' }: JetkingShieldProps) {
  if (variant === 'draw') {
    return <JetkingShieldDraw className={className} id={id} />;
  }

  if (variant === 'solid') {
    return <JetkingShieldSolid className={className} style={style} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller
    <img
      src="/brand/jetking-shield.png"
      alt=""
      aria-hidden
      draggable={false}
      className={cn('h-full w-auto select-none object-contain', className)}
      style={style}
    />
  );
}

/** Filled shield plate for the extrusion body. */
function ShieldPlate({ gradId, className }: { gradId: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 66" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="18%" y1="0%" x2="82%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--color-jk-500)' }} />
          <stop offset="40%" style={{ stopColor: 'var(--color-jk-600)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-jk-900)' }} />
        </linearGradient>
      </defs>
      <path
        d="M13 3.4 H67 C69.4 3.4 71 5 71 7.2 V38.5 C71 50.2 57.8 59.5 40 63 C22.2 59.5 9 50.2 9 38.5 V7.2 C9 5 10.6 3.4 13 3.4 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

/**
 * Isometric CSS-3D shield — stacked plates offset in screen space create a
 * solid block of depth; the official mark sits on the top face.
 */
function JetkingShieldSolid({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const depthPx = (EXTRUDE_LAYERS - 1) * EXTRUDE_OFFSET;

  return (
    <span
      className={cn('jk-shield-3d relative block', className)}
      aria-hidden
      style={{ ...style, marginBottom: depthPx, marginRight: depthPx }}
    >
      <span className="jk-shield-3d-shadow" style={{ width: `calc(100% + ${depthPx}px)` }} />

      <span className="jk-shield-3d-scene">
        {/* Extrusion body — darkest plate furthest SE, face at origin */}
        {Array.from({ length: EXTRUDE_LAYERS }, (_, i) => {
          // i=0 is the back (most offset), i=last is under the face
          const fromFront = EXTRUDE_LAYERS - 1 - i;
          // Keep sides in the deep-red range so they read as metal thickness, not a cast shadow
          const t = i / (EXTRUDE_LAYERS - 1);
          const brightness = 0.42 + t * 0.45;

          return (
            <span
              key={i}
              className="jk-shield-3d-plate"
              style={{
                transform: `translate(${fromFront * EXTRUDE_OFFSET}px, ${fromFront * EXTRUDE_OFFSET}px)`,
                zIndex: i,
                filter: `brightness(${brightness})`,
              }}
            >
              <ShieldPlate gradId={`jk-iso-${i}`} />
            </span>
          );
        })}

        {/* Official line-art on the front face (no offset) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/jetking-shield.png"
          alt=""
          draggable={false}
          className="jk-shield-3d-face select-none object-contain"
          style={{ zIndex: EXTRUDE_LAYERS + 2 }}
        />

        {/* Specular sweep on the front face */}
        <span className="jk-shield-3d-shine" style={{ zIndex: EXTRUDE_LAYERS + 3 }} />
      </span>
    </span>
  );
}

function JetkingShieldDraw({ className, id }: { className?: string; id?: string }) {
  const gid = id ?? 'jk-shield';

  return (
    <svg
      viewBox="0 0 80 66"
      className={cn('h-full w-auto', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.1"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      <path
        id={`${gid}-outline`}
        className="jk-draw-path"
        pathLength={1}
        d="M13 3.4 H67 C69.4 3.4 71 5 71 7.2 V38.5 C71 50.2 57.8 59.5 40 63 C22.2 59.5 9 50.2 9 38.5 V7.2 C9 5 10.6 3.4 13 3.4 Z"
      />
      <path className="jk-draw-path" pathLength={1} d="M21.4 7.6 V34" style={{ animationDelay: '0.12s' }} />
      <path className="jk-draw-path" pathLength={1} d="M29.2 7.6 V34" style={{ animationDelay: '0.18s' }} />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M21.4 34 L32 44.5 L40 52"
        style={{ animationDelay: '0.28s' }}
      />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M29.2 34 L36.5 41.2 L40 44.5"
        style={{ animationDelay: '0.34s' }}
      />
      <path className="jk-draw-path" pathLength={1} d="M38.4 7.6 V36.5" style={{ animationDelay: '0.22s' }} />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M38.4 18.2 L54.5 8.2"
        style={{ animationDelay: '0.4s' }}
      />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M38.4 23.5 L54.5 13.5"
        style={{ animationDelay: '0.46s' }}
      />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M38.4 24.8 L54.5 40.5"
        style={{ animationDelay: '0.52s' }}
      />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M38.4 30 L54.5 45.5"
        style={{ animationDelay: '0.58s' }}
      />
      <path
        className="jk-draw-path"
        pathLength={1}
        d="M54.5 40.5 L40 52"
        style={{ animationDelay: '0.64s' }}
      />
    </svg>
  );
}
