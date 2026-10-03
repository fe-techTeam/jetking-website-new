'use client';

import { BotTrap, botFields } from '@/components/BotTrap';
import { useRef, useState } from 'react';
import { ChevronDown, Clock3 } from 'lucide-react';
import { Field, Input } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const fieldClass =
  'h-11 border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] hover:border-[var(--dc-accent-soft)]/50 focus:border-[var(--dc-accent-soft)] focus:ring-[var(--dc-accent)]/20';

export function FranchiseEnquiryFormLight() {
  const { classification, visitor, record } = usePersona();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus('submitting');
    setError('');

    const investmentCapacity = String(data.get('investmentCapacity') ?? '').trim();
    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      city: String(data.get('city') ?? ''),
      message: investmentCapacity
        ? `Franchise enquiry from landing page form. Investment Capacity: ${investmentCapacity}.`
        : 'Franchise enquiry from landing page form.',
      persona: 'franchise' as const,
      confidence: classification.confidence,
      source: 'franchise-landing',
      visitorId: visitor.id || undefined,
    };

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...botFields() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }

      setStatus('done');
      form.reset();
      record({ kind: 'form', formId: 'franchise-enquiry', status: 'completed' });
      track('enquiry_submitted', { persona: 'franchise', source: 'franchise-landing' });
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

  function handleFocus() {
    if (startedRef.current) return;
    startedRef.current = true;
    record({ kind: 'form', formId: 'franchise-enquiry', status: 'started' });
    track('enquiry_started', { persona: 'franchise', source: 'franchise-landing' });
  }

  if (status === 'done') {
    return (
      <div className="rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] p-8 text-center [&_p]:text-[var(--dc-ink-secondary)]">
        <p className="font-display text-xl font-extrabold text-[var(--dc-ink)]">Thank you!</p>
        <p className="mt-3 text-[15px]">
          Our franchise team will get in touch with you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleFocus} className="space-y-5">
<BotTrap />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required htmlFor="fra-name">
          <Input
            id="fra-name"
            name="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your full name"
            className={fieldClass}
          />
        </Field>

        <Field label="Mobile Number" required htmlFor="fra-phone">
          <Input
            id="fra-phone"
            name="phone"
            type="tel"
            required
            minLength={10}
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
            className={fieldClass}
          />
        </Field>

        <Field label="Email Address" htmlFor="fra-email">
          <Input
            id="fra-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>

        <Field label="Preferred Location" htmlFor="fra-city">
          <Input
            id="fra-city"
            name="city"
            type="text"
            placeholder="City or territory"
            className={fieldClass}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Investment Capacity" required htmlFor="fra-investment">
            <div className="relative">
              <select
                id="fra-investment"
                name="investmentCapacity"
                required
                defaultValue=""
                className={`w-full appearance-none rounded-[var(--radius-input)] border px-3 pr-11 text-sm ${fieldClass}`}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="UPTO 50 L">UPTO 50 L</option>
                <option value="UPTO 1 CR">UPTO 1 CR</option>
                <option value="UPTO 3 CR">UPTO 3 CR</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[var(--dc-ink-muted)]"
                strokeWidth={2}
              />
            </div>
          </Field>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--dc-accent-soft)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group/submit inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[var(--dc-accent)] py-3 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting…' : 'Get Franchise Details'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="flex items-center justify-center gap-2 text-sm text-[var(--dc-ink-muted)]">
        <Clock3
          className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        Our team will get in touch with you within 24 hours!
      </p>
    </form>
  );
}
