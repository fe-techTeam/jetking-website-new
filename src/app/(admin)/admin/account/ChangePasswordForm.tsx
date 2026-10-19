'use client';

import { useActionState } from 'react';
import { changeOwnPassword, type PasswordChangeState } from './actions';

const INITIAL: PasswordChangeState = { ok: false, error: null };
const field =
  'min-h-11 w-full rounded-[var(--admin-radius)] border border-border-medium bg-background px-3 text-sm text-foreground';

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, INITIAL);
  return (
    <form action={action} className="grid max-w-md gap-4">
      <div>
        <label htmlFor="acct-current" className="mb-1.5 block text-xs font-medium text-foreground-muted">
          Current password
        </label>
        <input id="acct-current" name="current" type="password" autoComplete="current-password" required className={field} />
      </div>
      <div>
        <label htmlFor="acct-next" className="mb-1.5 block text-xs font-medium text-foreground-muted">
          New password (at least 10 characters)
        </label>
        <input id="acct-next" name="next" type="password" autoComplete="new-password" minLength={10} required className={field} />
      </div>
      <div>
        <label htmlFor="acct-confirm" className="mb-1.5 block text-xs font-medium text-foreground-muted">
          Confirm new password
        </label>
        <input id="acct-confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={field} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm font-medium text-[var(--color-success-600,#067647)]">
          Password changed.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 cursor-pointer self-start rounded-[var(--admin-radius)] bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
