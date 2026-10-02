/**
 * Motion preference, for the places CSS cannot reach.
 *
 * `globals.css` already neutralises CSS animation and `scroll-behavior` under
 * `prefers-reduced-motion: reduce`, but a programmatic `scrollTo`/`scrollIntoView`
 * carries its own `behavior` and ignores that rule entirely. Four call sites on
 * this site animated scroll from JS regardless of the preference; they all route
 * through here now.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** `'auto'` when the visitor has asked for reduced motion, `'smooth'` otherwise. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}
