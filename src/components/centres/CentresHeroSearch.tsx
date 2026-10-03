'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { track } from '@/lib/analytics';
import { usePersona } from '@/persona/PersonaProvider';

const EVENT = 'centres:search';

/** Dispatch so CentresIndex can sync without a full navigation. */
function dispatchCentresSearch(query: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { query } }));
}

export function subscribeCentresSearch(handler: (query: string) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ query: string }>).detail;
    handler(detail?.query ?? '');
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/**
 * Hero search — primary find path on the centres index.
 * On submit: syncs ?q=, scrolls to #centres-index, notifies CentresIndex.
 */
export function CentresHeroSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const inputId = useId();
  const { classification } = usePersona();
  const [value, setValue] = useState(initialQuery);
  const trackedRef = useRef('');

  function applySearch(next: string, scroll: boolean) {
    const trimmed = next.trim();
    const params = new URLSearchParams(window.location.search);
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    const hash = scroll ? '#centres-index' : window.location.hash;
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}${hash}`
      : `${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', nextUrl);
    dispatchCentresSearch(next);

    if (trimmed.length >= 2 && trimmed !== trackedRef.current) {
      trackedRef.current = trimmed;
      track('centre_searched', {
        query: trimmed,
        persona: classification.persona,
      });
    }

    if (scroll) {
      document.getElementById('centres-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applySearch(value, true);
  }

  return (
    <form onSubmit={onSubmit} className="centres-hero-search relative w-full max-w-md" role="search">
      <label htmlFor={inputId} className="sr-only">
        Search cities
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search cities, states, localities..."
        autoComplete="off"
        className="centres-hero-search-input w-full rounded-full border border-white/12 bg-scrim/72 py-3.5 pr-14 pl-5 text-[14.5px] text-white shadow-[inset_3px_0_0_0_var(--dc-accent)] backdrop-blur-md placeholder:text-white/50 transition-[border-color,box-shadow] duration-200 outline-none hover:border-[var(--dc-accent-soft)]/45 focus:border-[var(--dc-accent-soft)]/70 focus:ring-3 focus:ring-[var(--dc-accent-soft)]/20"
      />
      <button
        type="submit"
        aria-label="Search centres"
        className="absolute top-1/2 right-1.5 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-white transition-colors hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-accent-soft)]"
      >
        <Search className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </form>
  );
}
