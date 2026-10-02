'use client';

import { STORAGE_KEYS } from '@/lib/constants/storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * The persisted theme preference, modelled as an external store.
 *
 * `useSyncExternalStore` is the right shape here: the source of truth is
 * `localStorage`, which lives outside React and can change in another tab.
 * Reading it in an effect would mean an extra render on every mount and a
 * flash of the wrong toggle state.
 */

const listeners = new Set<() => void>();

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  // `storage` fires only in *other* tabs, which is exactly the case local
  // notification cannot cover.
  window.addEventListener('storage', onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Returns a primitive, so identity-based snapshot comparison is safe. */
export function getThemeSnapshot(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
    return isThemePreference(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function getThemeServerSnapshot(): ThemePreference {
  return 'light';
}

export function writeThemePreference(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // Storage may be unavailable in private mode; the in-memory notify below
    // still updates this tab for the rest of the session.
  }
  emit();
}

export function subscribeToSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_MEDIA_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function getSystemThemeSnapshot(): ResolvedTheme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function getSystemThemeServerSnapshot(): ResolvedTheme {
  return 'light';
}
