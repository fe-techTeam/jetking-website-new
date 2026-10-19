'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  getSystemThemeServerSnapshot,
  getSystemThemeSnapshot,
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeToSystemTheme,
  subscribeToTheme,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@/components/providers/theme-store';

export type {  ThemePreference };

interface ThemeContextValue {
  /** What the user chose, including "follow the OS". */
  theme: ThemePreference;
  /** What is actually painted right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot);
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  // Sync React's view of the theme onto the document — an external system,
  // which is exactly what effects are for.
  useEffect(() => {
    const root = document.documentElement;
    const hadDarkClass = root.classList.contains('dark');
    const previousColorScheme = root.style.colorScheme;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
    return () => {
      root.classList.toggle('dark', hadDarkClass);
      root.style.colorScheme = previousColorScheme;
    };
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    writeThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    writeThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return context;
}
