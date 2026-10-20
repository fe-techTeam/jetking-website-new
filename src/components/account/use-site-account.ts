'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SiteUser } from '@/lib/users/types';

type AuthResult = { ok: true; user: SiteUser } | { ok: false; error: string };

export type OtpSendResult =
  | { ok: true; phone: string | null; sent: boolean; resendIn: number; devCode?: string }
  | { ok: false; error: string; needsEmail?: boolean; retryAfter?: number };

interface AuthResponse {
  ok?: boolean;
  error?: string;
  user?: SiteUser;
  phone?: string | null;
  sent?: boolean;
  resendIn?: number;
  devCode?: string;
  needsEmail?: boolean;
  retryAfter?: number;
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

async function postAuth(body: Record<string, string>): Promise<{ res: Response; data: AuthResponse }> {
  const res = await fetch('/api/users/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: AuthResponse = await res.json().catch(() => ({}));
  return { res, data };
}

interface SiteAccountOptions {
  /** `false` makes the hook inert (no requests) — for routes where the account UI isn't shown. */
  enabled?: boolean;
}

/**
 * Client side of the shared visitor account (website + /chatbot). Guests get
 * `user: null` and everything else is inert. /chatbot uses the same session via
 * `use-chat-account.ts`.
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
      const { res, data } = await postAuth(body);
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

  const loginOtpSend = useCallback(async (phone: string, email?: string): Promise<OtpSendResult> => {
    try {
      const { res, data } = await postAuth({
        action: 'login_otp_send',
        phone,
        ...(email ? { email } : {}),
      });
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error ?? 'Something went wrong. Please try again.',
          needsEmail: data.needsEmail,
          retryAfter: data.retryAfter,
        };
      }
      return {
        ok: true,
        phone: data.phone ?? null,
        sent: Boolean(data.sent),
        resendIn: data.resendIn ?? 30,
        ...(data.devCode ? { devCode: data.devCode } : {}),
      };
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
  }, []);

  const loginOtpVerify = useCallback(
    (input: { phone: string; otpToken?: string; code?: string; email?: string }) =>
      authenticate({
        action: 'login_otp_verify',
        phone: input.phone,
        ...(input.otpToken ? { otpToken: input.otpToken } : {}),
        ...(input.code ? { code: input.code } : {}),
        ...(input.email ? { email: input.email } : {}),
      }),
    [authenticate],
  );

  const resetSend = useCallback(async (input: { email?: string; phone?: string }): Promise<OtpSendResult> => {
    try {
      const { res, data } = await postAuth({
        action: 'reset_send',
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
      });
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error ?? 'Something went wrong. Please try again.',
          needsEmail: data.needsEmail,
          retryAfter: data.retryAfter,
        };
      }
      return {
        ok: true,
        phone: data.phone ?? null,
        sent: Boolean(data.sent),
        resendIn: data.resendIn ?? 30,
        ...(data.devCode ? { devCode: data.devCode } : {}),
      };
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }
  }, []);

  const resetVerify = useCallback(
    (input: { phone: string; newPassword: string; otpToken?: string; code?: string; email?: string }) =>
      authenticate({
        action: 'reset_verify',
        phone: input.phone,
        newPassword: input.newPassword,
        ...(input.otpToken ? { otpToken: input.otpToken } : {}),
        ...(input.code ? { code: input.code } : {}),
        ...(input.email ? { email: input.email } : {}),
      }),
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

  return {
    user,
    ready,
    login,
    loginOtpSend,
    loginOtpVerify,
    resetSend,
    resetVerify,
    signup,
    logout,
  };
}

export type SiteAccount = ReturnType<typeof useSiteAccount>;
