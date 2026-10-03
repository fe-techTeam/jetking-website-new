'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import { track } from '@/lib/analytics';
import { usePersona } from '@/persona/PersonaProvider';
import { AdaptiveList } from '@/persona/AdaptiveSlot';
import { BLOG_PAGE_SIZE, PostCard, blogIndexHref, categoryHref } from './BlogCards';
import { subscribeBlogSearch } from './BlogHeroSearch';

function matchesQuery(post: Post, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    post.title,
    post.excerpt,
    post.category,
    post.author,
    ...(post.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function buildPageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | 'gap'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('gap');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('gap');
  items.push(total);
  return items;
}

/**
 * Blog index — category dropdown + search + AdaptiveList + pagination.
 *
 * Search filters the in-memory category list, then pagination shows
 * {@link BLOG_PAGE_SIZE} cards per page. Query / page sync to the URL via
 * replaceState without a full navigation.
 */
export function BlogIndex({
  posts,
  categories,
  activeCategory,
  latestSlug,
  initialQuery = '',
  initialPage = 1,
}: {
  posts: Post[];
  categories: string[];
  activeCategory: string | null;
  latestSlug: string | null;
  initialQuery?: string;
  initialPage?: number;
}) {
  const inputId = useId();
  const categoryId = useId();
  const router = useRouter();
  const { classification, hydrated } = usePersona();
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const trackedRef = useRef('');

  const needle = query.trim().toLowerCase();
  const matchedPosts = useMemo(
    () => posts.filter((p) => matchesQuery(p, needle)),
    [posts, needle],
  );
  const totalPages = Math.max(1, Math.ceil(matchedPosts.length / BLOG_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (currentPage - 1) * BLOG_PAGE_SIZE;
  const pagePosts = matchedPosts.slice(pageStart, pageStart + BLOG_PAGE_SIZE);
  const visibleCount = matchedPosts.length;

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    if (activeCategory) params.set('category', activeCategory);
    else params.delete('category');
    if (currentPage > 1) params.set('page', String(currentPage));
    else params.delete('page');
    const qs = params.toString();
    const hash = window.location.hash;
    const next = qs
      ? `${window.location.pathname}?${qs}${hash}`
      : `${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', next);
  }, [query, activeCategory, currentPage, hydrated]);

  useEffect(() => {
    return subscribeBlogSearch((next) => {
      setQuery(next);
      setPage(1);
    });
  }, []);

  function onSearchChange(value: string) {
    setQuery(value);
    setPage(1);
    const trimmed = value.trim();
    if (trimmed.length >= 2 && trimmed !== trackedRef.current) {
      trackedRef.current = trimmed;
      track('blog_searched', {
        query: trimmed,
        persona: classification.persona,
        category: activeCategory ?? undefined,
      });
    }
  }

  function goToPage(nextPage: number) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPage(clamped);
    document.getElementById('blog-index')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const rangeFrom = visibleCount === 0 ? 0 : pageStart + 1;
  const rangeTo = Math.min(pageStart + BLOG_PAGE_SIZE, visibleCount);
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <section
      id="blog-index"
      className="shell scroll-mt-24 pt-4 pb-14 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20"
      aria-labelledby="blog-index-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-ink-muted)] uppercase">
            Index
          </p>
          <h2
            id="blog-index-heading"
            className="section-title mt-2 font-display text-[var(--dc-ink)]"
          >
            {activeCategory ?? 'All writing'}
          </h2>
        </div>
        <p
          aria-live="polite"
          className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--dc-ink-muted)] uppercase"
        >
          {needle
            ? `${visibleCount} of ${posts.length} ${posts.length === 1 ? 'article' : 'articles'}`
            : totalPages > 1
              ? `${rangeFrom}–${rangeTo} of ${posts.length}`
              : `${posts.length} ${posts.length === 1 ? 'article' : 'articles'}`}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <label htmlFor={inputId} className="relative block w-full max-w-md">
          <span className="sr-only">Search articles</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles, topics, keywords…"
            autoComplete="off"
            className="blog-search-input w-full rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] py-3 pr-11 pl-11 text-[14.5px] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] transition-[border-color,box-shadow] duration-200 outline-none hover:border-[var(--dc-accent-soft)]/50 focus:border-[var(--dc-accent-soft)] focus:ring-3 focus:ring-[var(--dc-accent-soft)]/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--dc-ink-muted)] transition-colors hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-accent-soft)]"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </label>

        {categories.length > 1 ? (
          <nav aria-label="Topics" className="-mx-[var(--gutter)] lg:hidden">
            <ul className="scrollbar-none flex snap-x scroll-px-[var(--gutter)] gap-2 overflow-x-auto px-[var(--gutter)] pb-1">
              {[null, ...categories].map((category) => {
                const active = (activeCategory ?? null) === category;
                return (
                  <li key={category ?? 'all'} className="shrink-0 snap-start">
                    <Link
                      href={categoryHref(category, query)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[13.5px] font-bold whitespace-nowrap transition-colors ${
                        active
                          ? 'border-[var(--dc-accent)] bg-[var(--dc-accent)] text-white'
                          : 'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink-secondary)] hover:border-[var(--dc-accent-soft)]/50'
                      }`}
                    >
                      {category ?? 'All topics'}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {categories.length > 1 ? (
          <div className="relative hidden w-full lg:block lg:w-64 lg:shrink-0">
            <label htmlFor={categoryId} className="sr-only">
              Filter by topic
            </label>
            <select
              id={categoryId}
              value={activeCategory ?? ''}
              onChange={(e) => router.push(categoryHref(e.target.value || null, query))}
              className="w-full cursor-pointer appearance-none rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] py-3 pr-11 pl-5 text-[14.5px] font-semibold text-[var(--dc-ink)] transition-[border-color,box-shadow] duration-200 outline-none hover:border-[var(--dc-accent-soft)]/50 focus:border-[var(--dc-accent-soft)] focus:ring-3 focus:ring-[var(--dc-accent-soft)]/20"
            >
              <option value="">All topics</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-[15px] text-[var(--dc-ink-secondary)]">
          No articles in this topic yet.{' '}
          <Link
            href="/blog"
            className="font-semibold text-[var(--dc-accent-soft)] underline-offset-2 hover:underline"
          >
            View all writing
          </Link>
          .
        </p>
      ) : (
        <>
          {needle && visibleCount === 0 ? (
            <p className="mt-10 text-[15px] text-[var(--dc-ink-secondary)]">
              No articles match &ldquo;{query.trim()}&rdquo;.{' '}
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="font-semibold text-[var(--dc-accent-soft)] underline-offset-2 hover:underline"
              >
                Clear search
              </button>
            </p>
          ) : null}

          {pagePosts.length > 0 ? (
            <AdaptiveList
              id="blog-list"
              as="ul"
              className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
              items={pagePosts.map((post) => ({
                key: post.slug,
                relevance: post.personaRelevance,
                node: (
                  <PostCard
                    post={post}
                    badge={post.slug === latestSlug ? 'latest' : undefined}
                  />
                ),
              }))}
            />
          ) : null}

          {totalPages > 1 ? (
            <nav
              aria-label="Blog pages"
              className="mt-10 flex flex-col items-center gap-4 sm:mt-12 sm:flex-row sm:justify-between"
            >
              <p className="numeral text-[14px] font-semibold text-[var(--dc-ink-muted)]">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={blogIndexHref({
                      category: activeCategory,
                      searchQuery: query,
                      page: currentPage - 1,
                    })}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(currentPage - 1);
                    }}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]/50 hover:text-[var(--dc-accent-soft)]"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    Prev
                  </Link>
                ) : (
                  <span role="link" aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center gap-1 rounded-full border border-[var(--dc-hairline-strong)]/40 px-3.5 py-2 text-[12.5px] font-bold text-[var(--dc-ink-muted)]/50">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    Prev
                  </span>
                )}

                <ul className="flex flex-wrap items-center gap-1.5">
                  {pageItems.map((item, index) =>
                    item === 'gap' ? (
                      <li
                        key={`gap-${index}`}
                        aria-hidden="true"
                        className="px-1 text-[14px] font-bold text-[var(--dc-ink-muted)]"
                      >
                        …
                      </li>
                    ) : (
                      <li key={item}>
                        <Link
                          href={blogIndexHref({
                            category: activeCategory,
                            searchQuery: query,
                            page: item,
                          })}
                          aria-label={`Page ${item}`}
                          aria-current={item === currentPage ? 'page' : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            goToPage(item);
                          }}
                          className={
                            item === currentPage
                              ? 'grid h-11 min-w-11 place-items-center rounded-full bg-[var(--dc-accent)] px-3 text-[12.5px] font-bold text-white'
                              : 'grid h-11 min-w-11 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-3 text-[12.5px] font-bold text-[var(--dc-ink-muted)] transition-colors hover:border-[var(--dc-accent-soft)]/50 hover:text-[var(--dc-ink)]'
                          }
                        >
                          {item}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>

                {currentPage < totalPages ? (
                  <Link
                    href={blogIndexHref({
                      category: activeCategory,
                      searchQuery: query,
                      page: currentPage + 1,
                    })}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(currentPage + 1);
                    }}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]/50 hover:text-[var(--dc-accent-soft)]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  </Link>
                ) : (
                  <span role="link" aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center gap-1 rounded-full border border-[var(--dc-hairline-strong)]/40 px-3.5 py-2 text-[12.5px] font-bold text-[var(--dc-ink-muted)]/50">
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                )}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
