'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useDialog } from './useDialog';
import { Field, Input } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';

const SESSION_KEY = 'jk_exit_intent_shown';
/** Pages where a "before you go" enquiry popup is redundant or the wrong context —
 *  /admin and /chatbot are already excluded by the `SiteChrome` wrapper this
 *  mounts inside; /enquiry is excluded here because the visitor is already
 *  looking at the full enquiry form. */
const EXCLUDED_PREFIXES = ['/enquiry'];
/** `mouseleave` at the viewport edge never fires on a touch device, so mobile
 *  gets a dwell-time fallback instead — long enough that it doesn't fire on
 *  someone who arrived, glanced, and left within a few seconds. */
const MOBILE_DWELL_MS = 45_000;

type Status = 'idle' | 'submitting' | 'done' | 'error';

export function ExitIntentPopup() {
  const pathname = usePathname();
  const { classification, visitor, record } = usePersona();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const shownRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const excluded = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  useEffect(() => {
    if (excluded) return;
    if (typeof window === 'undefined') return;

    function reveal(source: string) {
      if (shownRef.current) return;
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      shownRef.current = true;
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      setOpen(true);
      track('exit_intent_shown', { source, path: pathname ?? '' });
    }

    function onMouseLeave(event: MouseEvent) {
      if (event.clientY <= 0) reveal('mouseleave');
    }

    document.addEventListener('mouseleave', onMouseLeave);

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const dwellTimer = isTouch ? window.setTimeout(() => reveal('dwell'), MOBILE_DWELL_MS) : undefined;

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      if (dwellTimer) window.clearTimeout(dwellTimer);
    };
  }, [excluded, pathname]);

  function close() {
    setOpen(false);
  }

  useDialog(open, close, dialogRef, { modal: true });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus('submitting');
    setError('');

    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      message: 'Enquiry from the exit-intent popup.',
      persona: classification.persona,
      confidence: classification.confidence,
      source: 'exit-intent-popup',
      visitorId: visitor.id || undefined,
    };

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }

      setStatus('done');
      form.reset();
      record({ kind: 'form', formId: 'exit-intent-popup', status: 'completed' });
      track('enquiry_submitted', { persona: classification.persona, source: 'exit-intent-popup' });
      linkVisitorIdentity({
        visitorId: visitor.id,
        phone: payload.phone,
        email: payload.email || undefined,
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (excluded || !open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={close} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="sheet-up relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[440px] sm:rounded-[20px] sm:border-b sm:p-8"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 grid h-11 w-11 cursor-pointer place-items-center rounded-full sm:top-3 sm:right-3 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {status === 'done' ? (
          <div className="py-4 text-center">
            <p className="font-display text-xl font-extrabold text-foreground">Thank you!</p>
            <p className="mt-3 text-[15px] text-foreground-secondary">
              We&rsquo;ll reach out only if you want us to — no spam, no pressure.
            </p>
          </div>
        ) : (
          <>
            <p
              id="exit-intent-title"
              className="font-display text-[22px] font-extrabold text-foreground sm:text-[24px]"
            >
              Before you go —
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground-secondary">
              Leave your number and a Jetking counsellor will help you pick the right course. No
              spam, no pressure.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field label="Name" required htmlFor="exit-name">
                <Input
                  id="exit-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </Field>

              <Field label="Mobile Number" required htmlFor="exit-phone">
                <Input
                  id="exit-phone"
                  name="phone"
                  type="tel"
                  required
                  minLength={10}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Email Address" htmlFor="exit-email">
                <Input id="exit-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
              </Field>

              {error ? (
                <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-jk-600 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 disabled:opacity-60"
              >
                {status === 'submitting' ? 'Submitting…' : 'Talk to a counsellor'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
