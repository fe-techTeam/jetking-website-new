'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import type { ComponentProps, MouseEvent } from 'react';

/**
 * A Link that morphs instead of replacing.
 *
 * ── Why this exists, and what it deliberately does NOT do ──────────────────
 * The brief asks for content that reorganises rather than navigating away. Taken
 * literally that means an SPA with no real URLs — which would destroy the ~180
 * indexable pages this entire project exists to protect.
 *
 * So the resolution is: keep real routes, real URLs and real server-rendered
 * documents, and make the *transition between them* continuous. A crawler still
 * sees separate documents. A visitor sees one surface rearranging itself.
 *
 * Mechanism: `document.startViewTransition` wraps the client-side navigation, so
 * elements sharing a `view-transition-name` morph between routes rather than
 * cutting. Where the API is missing (Firefox, Safari at time of writing) this is a
 * plain Link — the navigation still happens, just without the morph.
 */

/**
 * `href` is widened to `string` and cast at the boundary. Inheriting Link's generic
 * through a spread collapses it to `RouteImpl<unknown>`, which rejects every
 * template-literal route (`/courses/${slug}`) at every call site. The cast is
 * contained here rather than repeated across the app.
 */
type TransitionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function TransitionLink({ href, onClick, children, ...props }: TransitionLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Let the browser own modified clicks — new tab, download, etc.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    const startViewTransition = (
      document as Document & {
        startViewTransition?: (callback: () => void) => {
          ready: Promise<void>;
          updateCallbackDone: Promise<void>;
          finished: Promise<void>;
        };
      }
    ).startViewTransition;

    if (typeof startViewTransition !== 'function') return; // plain navigation

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    event.preventDefault();
    const transition = startViewTransition.call(document, () => {
      router.push(href as Route);
    });

    // A transition is legitimately skipped — and its promises reject with
    // `AbortError: Transition was skipped` — whenever it is superseded before
    // it can run, e.g. a second TransitionLink clicked while the first is
    // still animating, or the tab going hidden mid-transition. That's normal
    // browser behaviour, not an app error; left uncaught it surfaces as an
    // "Uncaught (in promise) AbortError" in the console/error overlay.
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  }

  return (
    <Link href={href as Route} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
