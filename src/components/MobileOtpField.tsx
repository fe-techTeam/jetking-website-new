'use client';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Check, Loader2, Pencil } from 'lucide-react';
import { Field, Input } from '@/components/ui';
import { useSiteCopy } from '@/components/providers/site-copy';
import { fill } from '@/lib/content/copy/define';
import { normalizeMobile } from '@/lib/phone';
import { OTP_CODE_LENGTH } from '@/lib/otp/config';

/**
 * Whether the forms ask visitors to verify their mobile number by OTP. Set `NEXT_PUBLIC_OTP_ENABLED=true`
 * together with the server's `OTP_ENABLED=true` (the server is what actually refuses unverified enquiries;
 * this only decides whether the forms show the verification step).
 */
export const OTP_ENABLED = process.env.NEXT_PUBLIC_OTP_ENABLED === 'true';

/** Shown by a form that refuses to submit before the number is verified. */
export const OTP_REQUIRED_FALLBACK = 'Please verify your mobile number to continue.';

type Phase = 'edit' | 'sending' | 'code' | 'verifying' | 'verified';

/**
 * The mobile-number field of an enquiry form, with optional OTP verification built in.
 *
 *   enter number → [Verify] → "we sent a code to +91 ••••• 62205" → type 6 digits (auto-confirms) → ✓ verified
 *
 * It renders the same labelled field the forms always had (`name="phone"`, so `FormData` still reads it), then
 * layers the steps under it only when OTP is enabled. The parent gets the proof of verification through
 * `onTokenChange` and sends it as `otpToken`; editing the number afterwards revokes it, so the token always
 * matches the number that is actually submitted.
 *
 * `defaultValue` is read once: pass a `key` that changes when it does (e.g. the signed-in user's id), as the
 * forms did for their plain phone input, so a number that arrives after sign-in is picked up.
 *
 * Mobile-first: full-width stacked controls, 44px+ targets, a numeric keypad, and `one-time-code`
 * autocomplete so the phone offers the SMS code straight from the notification.
 */
export function MobileOtpField({
  label,
  placeholder,
  defaultValue,
  compact = false,
  source,
  inputClassName,
  hint,
  required = true,
  onTokenChange,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  compact?: boolean;
  /** Which form this is, for the server's logs. */
  source?: string;
  /** Extra classes for the number input, for forms that restyle their fields. */
  inputClassName?: string;
  hint?: string;
  required?: boolean;
  onTokenChange?: (token: string | null) => void;
}) {
  const id = useId();
  const copy = useSiteCopy();
  const [phase, setPhase] = useState<Phase>('edit');
  const [phone, setPhone] = useState(defaultValue ?? '');
  const [code, setCode] = useState('');
  const [masked, setMasked] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [devCode, setDevCode] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  const setToken = useCallback((token: string | null) => onTokenChange?.(token), [onTokenChange]);

  // Resend countdown.
  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  // Hand the keyboard to the code box as soon as it appears.
  useEffect(() => {
    if (phase === 'code') codeRef.current?.focus();
  }, [phase]);

  const digits = normalizeMobile(phone);

  function onPhoneChange(event: ChangeEvent<HTMLInputElement>) {
    setPhone(event.target.value);
    // Any edit invalidates a code that was sent or a number that was verified for the old value.
    if (phase !== 'edit') {
      setPhase('edit');
      setToken(null);
    }
    setCode('');
    setError('');
  }

  async function sendCode() {
    if (!digits) {
      setError(copy['otp.invalidPhone']);
      return;
    }
    setError('');
    setPhase('sending');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, source }),
      });
      const data: { ok?: boolean; error?: string; maskedPhone?: string; resendIn?: number; retryAfter?: number; devCode?: string } =
        await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error ?? copy['otp.sendFailed']);
        if (data.retryAfter && data.retryAfter < 600) setSeconds(data.retryAfter);
        // A throttled resend keeps an open code box usable; a first-send failure returns to the number.
        setPhase(code || phase === 'code' ? 'code' : 'edit');
        return;
      }
      setMasked(data.maskedPhone ?? '');
      setSeconds(data.resendIn ?? 30);
      setDevCode(data.devCode ?? '');
      setCode('');
      setPhase('code');
    } catch {
      setError(copy['otp.networkError']);
      setPhase('edit');
    }
  }

  async function confirm(value: string) {
    if (phase === 'verifying' || value.length !== OTP_CODE_LENGTH) return;
    setError('');
    setPhase('verifying');
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, code: value }),
      });
      const data: { ok?: boolean; error?: string; token?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.token) {
        setError(data.error ?? copy['otp.verifyFailed']);
        setCode('');
        setPhase('code');
        codeRef.current?.focus();
        return;
      }
      setPhase('verified');
      setToken(data.token);
    } catch {
      setError(copy['otp.networkError']);
      setPhase('code');
    }
  }

  function onCodeChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH);
    setCode(next);
    setError('');
    // Confirm automatically on the last digit — one less tap, and autofilled codes just work.
    if (next.length === OTP_CODE_LENGTH) void confirm(next);
  }

  function changeNumber() {
    setPhase('edit');
    setCode('');
    setError('');
    setToken(null);
  }

  // Plain field: the forms behave exactly as they did before OTP existed.
  if (!OTP_ENABLED) {
    return (
      <Field label={label} htmlFor={`${id}-phone`} required={required} hint={hint} compact={compact}>
        <Input
          id={`${id}-phone`}
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          pattern="[\d\s+\(\)\-]{10,20}"
          placeholder={placeholder}
          compact={compact}
          required={required}
          className={inputClassName}
        />
      </Field>
    );
  }

  const verified = phase === 'verified';
  const busy = phase === 'sending' || phase === 'verifying';
  const showCode = phase === 'code' || phase === 'verifying';

  return (
    // Full row when it sits in a two-column form grid: the Verify button and the code box need the width.
    <div className="min-w-0 sm:col-span-2">
      <Field
        label={label}
        htmlFor={`${id}-phone`}
        required={required}
        hint={hint}
        compact={compact}
        error={phase === 'edit' || phase === 'sending' ? error || undefined : undefined}
      >
        <div className="flex items-stretch gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              id={`${id}-phone`}
              name="phone"
              value={phone}
              onChange={onPhoneChange}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              pattern="[\d\s+\(\)\-]{10,20}"
              placeholder={placeholder}
              compact={compact}
              readOnly={verified}
              className={[inputClassName, verified ? 'pr-10' : ''].filter(Boolean).join(' ') || undefined}
            />
            {verified ? (
              <Check
                className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-emerald-600"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            ) : null}
          </div>

          {verified ? (
            <button
              type="button"
              onClick={changeNumber}
              className="inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--accent-ink)] hover:underline lg:min-h-10"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {copy['otp.change']}
            </button>
          ) : phase === 'edit' || phase === 'sending' ? (
            <button
              type="button"
              onClick={sendCode}
              disabled={busy || !digits}
              className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-jk-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-jk-500 active:bg-jk-700 disabled:cursor-not-allowed disabled:opacity-45 lg:min-h-10 lg:px-4"
            >
              {phase === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {phase === 'sending' ? copy['otp.sending'] : copy['otp.verifyButton']}
            </button>
          ) : null}
        </div>
      </Field>

      {showCode ? (
        <div className="mt-3 min-w-0 rounded-[var(--radius-input)] border border-border bg-surface p-3 sm:p-4" role="group" aria-labelledby={`${id}-code-label`}>
          <p id={`${id}-code-label`} className="text-sm text-foreground-secondary">
            {fill(copy['otp.sentTo'], { phone: masked || phone })}
          </p>
          <div className="mt-3 flex items-stretch gap-2">
            <input
              ref={codeRef}
              value={code}
              onChange={onCodeChange}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={OTP_CODE_LENGTH}
              placeholder="••••••"
              aria-label={copy['otp.codeLabel']}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-code-error` : undefined}
              disabled={phase === 'verifying'}
              className="h-12 min-w-0 flex-1 rounded-[var(--radius-input)] border border-border bg-background px-4 text-center font-display text-xl font-bold tracking-[0.5em] text-foreground placeholder:tracking-[0.35em] placeholder:text-foreground-disabled focus:border-jk-600 focus:ring-2 focus:ring-jk-600/20 focus:outline-none disabled:bg-surface aria-[invalid=true]:border-jk-600 lg:h-10 lg:text-base"
            />
            <button
              type="button"
              onClick={() => void confirm(code)}
              disabled={code.length !== OTP_CODE_LENGTH || phase === 'verifying'}
              className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-jk-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-jk-500 active:bg-jk-700 disabled:cursor-not-allowed disabled:opacity-45 lg:min-h-10 lg:px-4"
            >
              {phase === 'verifying' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {phase === 'verifying' ? copy['otp.verifying'] : copy['otp.confirm']}
            </button>
          </div>

          {error ? (
            <p id={`${id}-code-error`} role="alert" className="mt-2 text-sm font-medium text-[var(--accent-ink)]">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {seconds > 0 ? (
              <span className="text-foreground-muted" aria-live="off">
                {fill(copy['otp.resendIn'], { seconds: String(seconds) })}
              </span>
            ) : (
              <button
                type="button"
                onClick={sendCode}
                disabled={busy}
                className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-[var(--accent-ink)] hover:underline disabled:opacity-45 sm:min-h-8"
              >
                {copy['otp.resend']}
              </button>
            )}
            <button
              type="button"
              onClick={changeNumber}
              className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-foreground-secondary hover:underline sm:min-h-8"
            >
              {copy['otp.change']}
            </button>
          </div>

          {devCode ? (
            <p className="mt-1 rounded bg-background px-2 py-1 text-xs text-foreground-muted">
              Dev only — code: <span className="font-mono font-bold">{devCode}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Announced politely to screen readers; the visible tick and "Change" button carry the state for everyone else. */}
      <p className="sr-only" role="status" aria-live="polite">
        {verified ? copy['otp.verified'] : ''}
      </p>
      {verified ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-secondary" aria-hidden="true">
          <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
          {copy['otp.verified']}
        </p>
      ) : null}
    </div>
  );
}
