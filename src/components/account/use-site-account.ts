'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SiteUser } from '@/lib/users/types';

type AuthResult = { ok: true; user: SiteUser } | { ok: false; error: string };

interface AuthResponse {
  ok?: boolean;
  error?: string;
  user?: SiteUser;
}

export interface SiteSignupInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  state: string;
  city: string;
  centre?: string;
}

const NETWORK_ERROR = 'We could not reach the server. Please check your connection and try again.';

/** Mirrors `HINT_COOKIE` in `src/lib/users/session.ts`: present only while a session probably exists. */
function hasSessionHint(): boolean {
  return document.cookie.split('; ').includes('jk_user_hint=1');
}

interface SiteAccountOptions {
  /** `false` makes the hook inert (no requests) — for routes where the account UI isn't shown. */
  enabled?: boolean;
}

/**
 * Client side of the website's own account — independent of /chatbot's
 * (`use-chat-account.ts`), see the `users` table's doc comment in
 * `src/lib/db/schema.ts`. Guests get `user: null` and everything else is inert.
 */
export function useSiteAccount({ enabled = true }: SiteAccountOptions = {}) {
  const [user, setUser] = useState<SiteUser | null>(null);
  /** False until the first "who am I" answer lands, so the UI doesn't flash a Log in button at a signed-in user. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // No hint cookie means no session, so an anonymous visitor makes no request at all.
    const lookup: Promise<{ user?: SiteUser | null }> =
      enabled && hasSessionHint()
        ? fetch('/api/users/auth').then((r) => r.json())
        : Promise.resolve({ user: null });
    lookup
      .then((data) => {
        if (cancelled) return;
        setUser(data.user ?? null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const authenticate = useCallback(async (body: Record<string, string>): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/users/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: AuthResponse = await res.json();
      if (!res.ok || !data.ok || !data.user) {
        return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' };
      }
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) => authenticate({ action: 'login', email, password }),
    [authenticate],
  );

  const signup = useCallback(
    (input: SiteSignupInput) =>
      authenticate({
        action: 'signup',
        name: input.name,
        phone: input.phone,
        email: input.email,
        password: input.password,
        state: input.state,
        city: input.city,
        // Optional: an empty string means "no preference" and is simply not sent.
        ...(input.centre ? { centre: input.centre } : {}),
      }),
    [authenticate],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/users/auth', { method: 'DELETE' });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, ready, login, signup, logout };
}

export type SiteAccount = ReturnType<typeof useSiteAccount>;
