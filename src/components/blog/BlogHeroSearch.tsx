'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { track } from '@/lib/analytics';
import { usePersona } from '@/persona/PersonaProvider';

const EVENT = 'blog:search';

/** Dispatch so BlogIndex can sync without a full navigation. */
function dispatchBlogSearch(query: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { query } }));
}

export function subscribeBlogSearch(handler: (query: string) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ query: string }>).detail;
    handler(detail?.query ?? '');
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/**
 * Hero search — primary find path on the blog index.
 * On submit: syncs ?q=, scrolls to #blog-index, notifies BlogIndex.
 */
export function BlogHeroSearch({
  initialQuery = '',
  activeCategory = null,
}: {
  initialQuery?: string;
  activeCategory?: string | null;
}) {
  const inputId = useId();
  const { classification } = usePersona();
  const [value, setValue] = useState(initialQuery);
  const trackedRef = useRef('');

  function applySearch(next: string, scroll: boolean) {
    const trimmed = next.trim();
    const params = new URLSearchParams(window.location.search);
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    if (activeCategory) params.set('category', activeCategory);
    else params.delete('category');
    params.delete('page');
    const qs = params.toString();
    const hash = scroll ? '#blog-index' : window.location.hash;
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}${hash}`
      : `${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', nextUrl);
    dispatchBlogSearch(next);

    if (trimmed.length >= 2 && trimmed !== trackedRef.current) {
      trackedRef.current = trimmed;
      track('blog_searched', {
        query: trimmed,
        persona: classification.persona,
        category: activeCategory ?? undefined,
      });
    }

    if (scroll) {
      document.getElementById('blog-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applySearch(value, true);
  }

  return (
    <form onSubmit={onSubmit} className="blog-hero-search relative w-full max-w-md" role="search">
      <label htmlFor={inputId} className="sr-only">
        Search articles
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles, topics, skills..."
        autoComplete="off"
        className="blog-hero-search-input w-full rounded-full border border-white/12 bg-scrim/72 py-3.5 pr-14 pl-5 text-[14.5px] text-white shadow-[inset_3px_0_0_0_var(--blog-accent)] backdrop-blur-md placeholder:text-white/50 transition-[border-color,box-shadow] duration-200 outline-none hover:border-[var(--blog-accent-soft)]/45 focus:border-[var(--blog-accent-soft)]/70 focus:ring-3 focus:ring-[var(--blog-accent-soft)]/20"
      />
      <button
        type="submit"
        aria-label="Search articles"
        className="absolute top-1/2 right-1.5 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-white transition-colors hover:bg-[var(--blog-accent-tint)] hover:text-[var(--blog-accent-soft)]"
      >
        <Search className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </form>
  );
}
