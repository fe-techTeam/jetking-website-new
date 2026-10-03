'use client';

import { BotTrap, botFields } from '@/components/BotTrap';
import { useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui';
import { QUALIFICATIONS } from '@/lib/enquiry-fields';
import { useEnquiryLocation, type LocatedCentre } from '@/components/useEnquiryLocation';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const fieldClass =
  'h-11 border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] hover:border-[var(--dc-accent-soft)]/50 focus:border-[var(--dc-accent-soft)] focus:ring-[var(--dc-accent)]/20';

export function ExploreEnquiryForm({ centres }: { centres: LocatedCentre[] }) {
  const { classification, visitor, record } = usePersona();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const startedRef = useRef(false);
  const loc = useEnquiryLocation(centres);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus('submitting');
    setError('');

    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      state: loc.state || undefined,
      city: loc.city || undefined,
      centre: loc.centre || undefined,
      qualification: String(data.get('qualification') ?? '') || undefined,
      message: 'Enquiry from the "Just Exploring" landing page form.',
      persona: 'unknown' as const,
      confidence: classification.confidence,
      source: 'explore-landing',
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
      record({ kind: 'form', formId: 'explore-enquiry', status: 'completed' });
      track('enquiry_submitted', { persona: 'unknown', source: 'explore-landing' });
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
    record({ kind: 'form', formId: 'explore-enquiry', status: 'started' });
    track('enquiry_started', { persona: 'unknown', source: 'explore-landing' });
  }

  if (status === 'done') {
    return (
      <div className="rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] p-8 text-center [&_p]:text-[var(--dc-ink-secondary)]">
        <p className="font-display text-xl font-extrabold text-[var(--dc-ink)]">Thank you!</p>
        <p className="mt-3 text-[15px]">
          We&rsquo;ll reach out only if you want us to — no spam, no pressure.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleFocus} className="space-y-5">
<BotTrap />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required htmlFor="exp-name">
          <Input
            id="exp-name"
            name="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your full name"
            className={fieldClass}
          />
        </Field>

        <Field label="Mobile Number" required htmlFor="exp-phone">
          <Input
            id="exp-phone"
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

        <Field label="Email Address" htmlFor="exp-email">
          <Input
            id="exp-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>

        <Field label="State" required htmlFor="exp-state">
          <Select
            id="exp-state"
            value={loc.state}
            required
            onChange={(e) => loc.onState(e.target.value)}
            className={fieldClass}
          >
            <option value="">Select state</option>
            {loc.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="City" required htmlFor="exp-city">
          <Select
            id="exp-city"
            value={loc.city}
            required
            disabled={loc.cities.length === 0}
            onChange={(e) => loc.onCity(e.target.value)}
            className={fieldClass}
          >
            <option value="">{loc.cities.length > 0 ? 'Select city' : 'State first'}</option>
            {loc.cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Centre" required htmlFor="exp-centre">
          <Select
            id="exp-centre"
            value={loc.centre}
            required
            disabled={loc.centres.length === 0}
            onChange={(e) => loc.onCentre(e.target.value)}
            className={fieldClass}
          >
            <option value="">{loc.centres.length > 0 ? 'Select centre' : 'City first'}</option>
            {loc.centres.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Highest qualification" required htmlFor="exp-qualification">
          <Select
            id="exp-qualification"
            name="qualification"
            defaultValue=""
            required
            className={fieldClass}
          >
            <option value="">Qualification</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </Select>
        </Field>
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
        {status === 'submitting' ? 'Submitting…' : 'Send a quick note'}
        <span aria-hidden="true">→</span>
      </button>

      <p className="flex items-center justify-center gap-2 text-sm text-[var(--dc-ink-muted)]">
        <Clock3
          className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        Optional — only fill this in if you&rsquo;d like us to reach out.
      </p>
    </form>
  );
}
