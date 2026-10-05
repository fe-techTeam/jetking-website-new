'use client';

import { useActionState, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { LoginState } from '../actions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({
  action,
  multiUser,
}: {
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>;
  multiUser: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [attempted, setAttempted] = useState(false);

  const emailInvalid = multiUser && !EMAIL_RE.test(email.trim());
  const passwordInvalid = password.length === 0;
  const showEmailError = (touched.email || attempted) && emailInvalid;
  const showPasswordError = (touched.password || attempted) && passwordInvalid;

  // Client-side gate in front of the server action: calling preventDefault()
  // here stops React from invoking `formAction` at all (same event, checked
  // before the action runs), so an obviously-incomplete submit never makes a
  // round trip — it just reveals whichever inline errors are still hidden.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (emailInvalid || passwordInvalid) {
      e.preventDefault();
      setAttempted(true);
    }
  }

  // Belt-and-suspenders for Enter-to-submit: a form with more than one text
  // field relies on the browser's own "implicit submission" default action,
  // which isn't reliable in every environment (some embedded/automated
  // WebViews and CDP-driven browsers never fire it). Explicitly requesting
  // submission here guarantees the behavior everywhere; `preventDefault`
  // stops the native default action too, so a real browser that *would* have
  // submitted natively doesn't also double-fire this.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--admin-radius)] border border-[var(--color-error-200)] bg-[var(--color-error-50)] px-4 py-3 text-sm font-medium text-[var(--color-error-600)]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {multiUser ? (
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            />
            <input
              id="email"
              type="email"
              name="email"
              autoFocus
              autoComplete="username"
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onKeyDown={handleKeyDown}
              aria-invalid={showEmailError || undefined}
              aria-describedby={showEmailError ? 'email-error' : undefined}
              className={`h-12 w-full rounded-[12px] border bg-background pr-4 pl-10 text-base text-foreground transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                showEmailError
                  ? 'border-[var(--color-error-600)] focus:border-[var(--color-error-600)] focus:ring-2 focus:ring-[var(--color-error-600)]/20'
                  : 'border-border hover:border-border-medium focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25'
              }`}
            />
          </div>
          {showEmailError ? (
            <p id="email-error" className="text-xs font-medium text-[var(--color-error-600)]">
              Enter a valid email address.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoFocus={!multiUser}
            autoComplete="current-password"
            disabled={pending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onKeyDown={handleKeyDown}
            aria-invalid={showPasswordError || undefined}
            aria-describedby={showPasswordError ? 'password-error' : undefined}
            className={`h-12 w-full rounded-[12px] border bg-background pr-11 pl-10 text-base text-foreground transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
              showPasswordError
                ? 'border-[var(--color-error-600)] focus:border-[var(--color-error-600)] focus:ring-2 focus:ring-[var(--color-error-600)]/20'
                : 'border-border hover:border-border-medium focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-foreground-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        {showPasswordError ? (
          <p id="password-error" className="text-xs font-medium text-[var(--color-error-600)]">
            Password is required.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="adm-btn-primary inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-[12px] px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-foreground-muted">
        {multiUser ? 'Secure staff access — need access? Ask an admin to invite you.' : 'Secure staff access.'}
      </p>
    </form>
  );
}
