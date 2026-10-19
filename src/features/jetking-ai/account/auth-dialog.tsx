'use client';

import { Loader2 } from 'lucide-react';
import { useId, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import type { ChatAccount } from './use-chat-account';
import { useLocationPicker, useLocations } from './use-locations';

type Mode = 'login' | 'signup';

const fieldClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-jk-300 focus:border-jk-500 focus:ring-3 focus:ring-jk-500/15';

/**
 * Log in / Sign up for the optional chatbot account. The whole point of the account
 * is keeping chat history, so the copy says exactly that — and closing the dialog
 * costs the visitor nothing.
 */
export function AuthDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Pick<ChatAccount, 'login' | 'signup'>;
}) {
  const id = useId();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  // The location lists are only needed on the Sign up tab, so they load lazily.
  const loc = useLocationPicker(useLocations(open && mode === 'signup'));

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPassword('');
      setError('');
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const result =
      mode === 'login'
        ? await account.login(email, password)
        : await account.signup({
            name,
            phone,
            email,
            password,
            state: loc.state,
            city: loc.city,
            centre: loc.centre,
          });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword('');
    onOpenChange(false);
  }

  const isLogin = mode === 'login';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] font-extrabold">
            {isLogin ? 'Log in to Jetking AI' : 'Create your account'}
          </DialogTitle>
          <DialogDescription>
            {isLogin
              ? 'Log in to save your chats and pick them up later.'
              : 'Save your chats with Jetking AI and continue them any time.'}
          </DialogDescription>
        </DialogHeader>

        <div role="tablist" aria-label="Account" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-sunken p-1">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                'rounded-lg py-2 text-[13px] font-bold transition-colors',
                mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              )}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin ? (
            <div className="space-y-1.5">
              <label htmlFor={`${id}-name`} className="block text-[13px] font-semibold text-ink">
                Your name
              </label>
              <input
                id={`${id}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className={fieldClass}
              />
            </div>
          ) : null}

          {!isLogin ? (
            <div className="space-y-1.5">
              <label htmlFor={`${id}-phone`} className="block text-[13px] font-semibold text-ink">
                Mobile number
              </label>
              <input
                id={`${id}-phone`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                autoComplete="tel"
                pattern="[\d\s+\(\)\-]{10,20}"
                placeholder="e.g. 98765 43210"
                aria-describedby={`${id}-phone-hint`}
                className={fieldClass}
              />
              <p id={`${id}-phone-hint`} className="text-[12px] text-ink-subtle">
                A Jetking counsellor may call or message you on this.
              </p>
            </div>
          ) : null}

          {!isLogin ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-state`} className="block text-[13px] font-semibold text-ink">
                    State
                  </label>
                  <select
                    id={`${id}-state`}
                    value={loc.state}
                    onChange={(e) => loc.setState(e.target.value)}
                    required
                    className={fieldClass}
                  >
                    <option value="">{loc.loading ? 'Loading…' : 'Select state'}</option>
                    {loc.states.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-city`} className="block text-[13px] font-semibold text-ink">
                    City
                  </label>
                  <select
                    id={`${id}-city`}
                    value={loc.city}
                    onChange={(e) => loc.setCity(e.target.value)}
                    required
                    disabled={loc.cities.length === 0}
                    className={fieldClass}
                  >
                    <option value="">{loc.cities.length > 0 ? 'Select city' : 'State first'}</option>
                    {loc.cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`${id}-centre`} className="block text-[13px] font-semibold text-ink">
                  Preferred centre <span className="font-normal text-ink-subtle">(optional)</span>
                </label>
                <select
                  id={`${id}-centre`}
                  value={loc.centre}
                  onChange={(e) => loc.setCentre(e.target.value)}
                  disabled={loc.centres.length === 0}
                  className={fieldClass}
                >
                  <option value="">{loc.centres.length > 0 ? 'No preference' : 'City first'}</option>
                  {loc.centres.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor={`${id}-email`} className="block text-[13px] font-semibold text-ink">
              Email
            </label>
            <input
              id={`${id}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
              autoComplete="email"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${id}-password`} className="block text-[13px] font-semibold text-ink">
              Password
            </label>
            <input
              id={`${id}-password`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
              maxLength={200}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              aria-describedby={isLogin ? undefined : `${id}-password-hint`}
              className={fieldClass}
            />
            {!isLogin ? (
              <p id={`${id}-password-hint`} className="text-[12px] text-ink-subtle">
                At least 8 characters.
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[14px] font-bold tracking-wide text-white shadow-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="mt-3 w-full rounded-lg py-2 text-center text-[13px] font-semibold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Continue without an account
        </button>
      </DialogContent>
    </Dialog>
  );
}
