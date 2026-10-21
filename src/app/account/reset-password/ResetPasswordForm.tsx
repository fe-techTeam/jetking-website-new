'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { useSiteAccount } from '@/components/account/use-site-account';

/** The page the emailed reset link opens: pick a new password, and you are signed in with it. */
export function ResetPasswordForm({ token }: { token: string }) {
  const id = useId();
  const account = useSiteAccount({ enabled: false });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="mt-6 max-w-md space-y-4">
        <p className="text-[15px] leading-relaxed text-foreground-secondary">
          This page needs the link from your reset email. Open the link in that email, or request a new one.
        </p>
        <Link href="/" className="inline-block text-sm font-semibold text-[var(--accent-ink)] underline underline-offset-2">
          Back to the home page
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-6 max-w-md space-y-4" role="status">
        <p className="text-[15px] leading-relaxed text-foreground-secondary">
          Your password has been changed and you are signed in.
        </p>
        <Link href="/account" className="inline-block text-sm font-semibold text-[var(--accent-ink)] underline underline-offset-2">
          Go to your account
        </Link>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setPending(true);
    setError('');
    const result = await account.resetEmailConfirm({ token, newPassword: password });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-md space-y-4">
      <Field label="New password" htmlFor={`${id}-pw`} required hint="At least 8 characters.">
        <Input
          id={`${id}-pw`}
          type="password"
          minLength={8}
          maxLength={200}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirm new password" htmlFor={`${id}-pw2`} required>
        <Input
          id={`${id}-pw2`}
          type="password"
          minLength={8}
          maxLength={200}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="md" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Save password & sign in'}
      </Button>
    </form>
  );
}
