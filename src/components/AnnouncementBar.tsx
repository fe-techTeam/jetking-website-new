'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { Announcement } from '@/lib/content/types';

const TONE_RANK: Record<Announcement['tone'], number> = { alert: 3, promo: 2, info: 1 };

const TONE_CLASS: Record<Announcement['tone'], string> = {
  info: 'bg-ink-950 text-white',
  promo: 'bg-jk-600 text-white',
  alert: 'bg-[#fdb022] text-[#0b111e]',
};

function pickActive(items: Announcement[], now: number): Announcement | null {
  const active = items.filter((a) => {
    const start = a.startsAt ? Date.parse(a.startsAt) : NaN;
    const end = a.endsAt ? Date.parse(a.endsAt) : NaN;
    if (!Number.isNaN(start) && start > now) return false;
    if (!Number.isNaN(end) && end <= now) return false;
    return true;
  });
  active.sort(
    (a, b) =>
      TONE_RANK[b.tone] - TONE_RANK[a.tone] ||
      (Date.parse(b.startsAt) || 0) - (Date.parse(a.startsAt) || 0),
  );
  return active[0] ?? null;
}

const storageKey = (id: string) => `jk-announcement-dismissed:${id}`;

function readDismissed(id: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(id)) === '1';
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
/** Wall clock at minute resolution: stable between renders, differs from the server's only after hydration. */
const clientMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Slim bar above the header. `renderedAt` keeps the first client render identical to the server's. */
export function AnnouncementBar({ items, renderedAt }: { items: Announcement[]; renderedAt: number }) {
  const now = useSyncExternalStore(subscribe, clientMinute, () => renderedAt);
  const active = pickActive(items, now);
  const activeId = active?.id ?? '';
  const dismissed = useSyncExternalStore(
    subscribe,
    () => (activeId ? readDismissed(activeId) : false),
    () => false,
  );

  if (!active || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey(active.id), '1');
    } catch {
      // storage unavailable: the bar simply stays
    }
    listeners.forEach((cb) => cb());
  };

  const hasLink = Boolean(active.linkHref && active.linkLabel);
  const external = /^https?:\/\//.test(active.linkHref);

  return (
    <div
      role="region"
      aria-label="Announcement"
      data-announcement-id={active.id}
      className={`relative z-[55] flex min-h-9 items-center justify-center gap-3 px-12 py-1.5 text-center text-[13px] font-medium leading-snug ${TONE_CLASS[active.tone]}`}
    >
      <p className="min-w-0">
        <span>{active.message}</span>
        {hasLink ? (
          external ? (
            <a
              href={active.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 font-bold underline underline-offset-2"
            >
              {active.linkLabel}
            </a>
          ) : (
            <Link href={active.linkHref as Route} className="ml-2 font-bold underline underline-offset-2">
              {active.linkLabel}
            </Link>
          )
        ) : null}
      </p>
      {active.dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="tap absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-lg leading-none opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-current"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      ) : null}
    </div>
  );
}
