'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '@/components/useDialog';
import { Button, Field, Input, Select, cx } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';
import type { ChatAccount } from '@/features/jetking-ai/account/use-chat-account';
import { useLocationPicker, useLocations } from '@/features/jetking-ai/account/use-locations';

export type AuthMode = 'login' | 'signup';

/**
 * Log in / Sign up for the main website. Same account as the Jetking AI chatbot —
 * one sign-in covers both, and the chatbot's saved chats appear under /account.
 * Styled with the site kit (the chatbot has its own dialog, on its own tokens).
 *
 * Signing in also links this browser's anonymous visitor id to the person's phone and
 * email, which is what lets the persona engine carry their browsing history across
 * devices — the same link the enquiry form makes on submit.
 */
export function SiteAuthDialog({
  mode,
  onModeChange,
  onClose,
  account,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  account: Pick<ChatAccount, 'login' | 'signup'>;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { visitor } = usePersona();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const isLogin = mode === 'login';
  // State/city/centre lists are only needed on the Sign up tab, so they load lazily.
  const loc = useLocationPicker(useLocations(!isLogin));

  useDialog(true, onClose, dialogRef, { modal: true });

  function switchMode(next: AuthMode) {
    setError('');
    onModeChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    setPending(true);
    setError('');
    const result = isLogin
      ? await account.login(email, password)
      : await account.signup({
          name: String(form.get('name') ?? ''),
          phone: String(form.get('phone') ?? ''),
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
    track(isLogin ? 'account_login' : 'account_signup', { visitor_id: visitor.id });
    linkVisitorIdentity({
      visitorId: visitor.id,
      phone: result.user.phone,
      email: result.user.email,
      name: result.user.name,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="sheet-up relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[440px] sm:rounded-[20px] sm:border-b sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 grid h-11 w-11 cursor-pointer place-items-center rounded-full sm:top-3 sm:right-3 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <p id={`${id}-title`} className="pr-8 font-display text-[22px] font-extrabold text-foreground sm:text-[24px]">
          {isLogin ? 'Welcome back' : 'Create your Jetking account'}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-secondary">
          {isLogin
            ? 'Log in to see your saved chats and skip re-typing your details.'
            : 'One account for the website and Jetking AI. Your details pre-fill enquiries, and your chats are saved.'}
        </p>

        <div
          role="tablist"
          aria-label="Account"
          className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1"
        >
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cx(
                'h-10 cursor-pointer rounded-full text-sm font-bold transition-colors',
                mode === m ? 'bg-jk-600 text-white' : 'text-foreground-secondary hover:text-foreground',
              )}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Keyed by mode so switching tabs gives a clean form rather than carrying half-typed values across. */}
        <form key={mode} onSubmit={handleSubmit} className="mt-5 space-y-4">
          {!isLogin ? (
            <>
              <Field label="Your name" htmlFor={`${id}-name`} required>
                <Input id={`${id}-name`} name="name" minLength={2} maxLength={80} autoComplete="name" />
              </Field>
              <Field
                label="Mobile number"
                htmlFor={`${id}-phone`}
                required
                hint="A counsellor may call or message you on this."
              >
                <Input
                  id={`${id}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[\d\s+\(\)\-]{10,20}"
                  placeholder="+91 98765 43210"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="State" htmlFor={`${id}-state`} required>
                  <Select id={`${id}-state`} value={loc.state} onChange={(e) => loc.setState(e.target.value)}>
                    <option value="">{loc.loading ? 'Loading…' : 'Select state'}</option>
                    {loc.states.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="City" htmlFor={`${id}-city`} required>
                  <Select
                    id={`${id}-city`}
                    value={loc.city}
                    onChange={(e) => loc.setCity(e.target.value)}
                    disabled={loc.cities.length === 0}
                  >
                    <option value="">{loc.cities.length > 0 ? 'Select city' : 'State first'}</option>
                    {loc.cities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field
                label="Preferred centre"
                htmlFor={`${id}-centre`}
                hint="Optional. We'll use it to pre-fill your enquiries."
              >
                <Select
                  id={`${id}-centre`}
                  value={loc.centre}
                  onChange={(e) => loc.setCentre(e.target.value)}
                  disabled={loc.centres.length === 0}
                >
                  <option value="">{loc.centres.length > 0 ? 'No preference' : 'City first'}</option>
                  {loc.centres.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}

          <Field label="Email" htmlFor={`${id}-email`} required>
            <Input id={`${id}-email`} name="email" type="email" maxLength={200} autoComplete="email" />
          </Field>

          <Field
            label="Password"
            htmlFor={`${id}-password`}
            required
            hint={isLogin ? undefined : 'At least 8 characters.'}
          >
            <Input
              id={`${id}-password`}
              name="password"
              type="password"
              maxLength={200}
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </Field>

          {error ? (
            <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="md" disabled={pending} className="w-full">
            {pending ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
