'use client';

import { useEffect, useRef, useState } from 'react';

export interface JumpItem {
  id: string;
  label: string;
}

/**
 * Phone/tablet "on this page" bar for the long course page: a horizontally scrolling strip of
 * section links that sticks under the site header, highlights the section in view, and keeps the
 * active tab on screen. Hidden from lg up, where the page is read in one wide view.
 */
export function JumpNav({ items }: { items: JumpItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const stripRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // The current section is the last one whose top has passed just under the sticky header + bar.
      const line = window.innerHeight * 0.3;
      let current = targets[0]!.id;
      for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !tab) return;
    const target = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [active]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[72px] z-30 border-b border-[var(--cp-line)] bg-[var(--cp-bg)]/95 backdrop-blur-md xs:top-[80px] sm:top-[88px] lg:hidden 2xl:top-[96px]"
    >
      <ul
        ref={stripRef}
        className="flex snap-x overflow-x-auto px-[var(--gutter,1rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="shrink-0 snap-start">
              <a
                href={`#${item.id}`}
                aria-current={on ? 'true' : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-3.5 text-[14px] font-bold whitespace-nowrap transition-colors ${
                  on
                    ? 'border-[var(--cp-red)] text-[var(--cp-red)]'
                    : 'border-transparent text-[var(--cp-ink-2)] hover:text-[var(--cp-ink)]'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
