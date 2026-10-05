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
import type { exploreCopy } from '@/lib/content/copy/pages/explore';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const fieldClass =
  'h-11 border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)] hover:border-[var(--dc-accent-soft)]/50 focus:border-[var(--dc-accent-soft)] focus:ring-[var(--dc-accent)]/20';

export function ExploreEnquiryForm({
  centres,
  copy,
}: {
  centres: LocatedCentre[];
  copy: typeof exploreCopy.defaults;
}) {
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
        throw new Error(body.error ?? copy['form.error']);
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
      setError(err instanceof Error ? err.message : copy['form.error']);
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
        <p className="font-display text-xl font-extrabold text-[var(--dc-ink)]">{copy['form.thanks.title']}</p>
        <p className="mt-3 text-[15px]">
          {copy['form.thanks.body']}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleFocus} className="space-y-5">
<BotTrap />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy['form.name.label']} required htmlFor="exp-name">
          <Input
            id="exp-name"
            name="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            placeholder={copy['form.name.placeholder']}
            className={fieldClass}
          />
        </Field>

        <Field label={copy['form.phone.label']} required htmlFor="exp-phone">
          <Input
            id="exp-phone"
            name="phone"
            type="tel"
            required
            minLength={10}
            autoComplete="tel"
            inputMode="tel"
            placeholder={copy['form.phone.placeholder']}
            className={fieldClass}
          />
        </Field>

        <Field label={copy['form.email.label']} htmlFor="exp-email">
          <Input
            id="exp-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={copy['form.email.placeholder']}
            className={fieldClass}
          />
        </Field>

        <Field label={copy['form.state.label']} required htmlFor="exp-state">
          <Select
            id="exp-state"
            value={loc.state}
            required
            onChange={(e) => loc.onState(e.target.value)}
            className={fieldClass}
          >
            <option value="">{copy['form.state.placeholder']}</option>
            {loc.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={copy['form.city.label']} required htmlFor="exp-city">
          <Select
            id="exp-city"
            value={loc.city}
            required
            disabled={loc.cities.length === 0}
            onChange={(e) => loc.onCity(e.target.value)}
            className={fieldClass}
          >
            <option value="">{loc.cities.length > 0 ? copy['form.city.placeholder'] : copy['form.city.stateFirst']}</option>
            {loc.cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={copy['form.centre.label']} required htmlFor="exp-centre">
          <Select
            id="exp-centre"
            value={loc.centre}
            required
            disabled={loc.centres.length === 0}
            onChange={(e) => loc.onCentre(e.target.value)}
            className={fieldClass}
          >
            <option value="">{loc.centres.length > 0 ? copy['form.centre.placeholder'] : copy['form.centre.cityFirst']}</option>
            {loc.centres.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={copy['form.qualification.label']} required htmlFor="exp-qualification">
          <Select
            id="exp-qualification"
            name="qualification"
            defaultValue=""
            required
            className={fieldClass}
          >
            <option value="">{copy['form.qualification.placeholder']}</option>
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
        {status === 'submitting' ? copy['form.submitting'] : copy['form.submit']}
        <span aria-hidden="true">→</span>
      </button>

      <p className="flex items-center justify-center gap-2 text-sm text-[var(--dc-ink-muted)]">
        <Clock3
          className="h-4 w-4 shrink-0 text-[var(--dc-accent-soft)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        {copy['form.optional']}
      </p>
    </form>
  );
}
