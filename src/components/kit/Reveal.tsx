'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fades content up as it scrolls into view. Progressive: it renders visible on the server and
 * only hides content that starts below the fold once it has mounted, so no-JS and above-the-fold
 * content are never blank. `prefers-reduced-motion` turns it off in CSS.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it alone
    el.dataset.reveal = 'pre';
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.reveal = 'in';
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}
