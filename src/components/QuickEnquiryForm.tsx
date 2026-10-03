'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAccount } from '@/components/account/AccountProvider';
import { Button, Field, Input, Select } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';
import { QUALIFICATIONS } from '@/lib/enquiry-fields';
import { useEnquiryLocation, type LocatedCentre } from '@/components/useEnquiryLocation';

export type EnquiryCentre = LocatedCentre;

export type QuickEnquiryStatus = 'idle' | 'submitting' | 'done' | 'error';

/**
 * The short lead form: name, mobile, State → City → Centre, highest qualification. Shared by the "Enquire now" modal and the
 * card on the centres banner, so both collect the same fields, validate the same way and reach
 * the same `/api/enquiry` — `source` records which surface it came from.
 *
 * The city list follows the chosen state and the centre list follows the chosen city; a choice
 * that no longer belongs to its parent is dropped, so the submitted triple is always consistent.
 * A signed-in visitor's name, phone, state, city and centre are pre-filled from their account.
 */
export function QuickEnquiryForm({
  centres,
  source,
  onStatusChange,
  successAction,
  compact = false,
}: {
  centres: EnquiryCentre[];
  /** Which surface this form is on, e.g. `home-hero-modal` or `centres-hero-form`. */
  source: string;
  /** Lets a host (the modal) swap its own heading when the form is done. */
  onStatusChange?: (status: QuickEnquiryStatus) => void;
  /** Extra control shown under the thank-you message, e.g. the modal's Close button. */
  successAction?: React.ReactNode;
  /**
   * Tighter fields, smaller type and name+mobile / centre+qualification paired into rows —
   * for a form squeezed into a fixed-height card (the banner hero card) rather than the
   * open width of the modal or a page section.
   */
  compact?: boolean;
}) {
  const id = useId();
  const successRef = useRef<HTMLDivElement>(null);
  const { classification, visitor, record } = usePersona();
  const { user } = useAccount();
  const [status, setStatus] = useState<QuickEnquiryStatus>('idle');
  const [error, setError] = useState('');
  const loc = useEnquiryLocation(centres, {
    state: user?.state,
    city: user?.city,
    centre: user?.centre,
  });

  function updateStatus(next: QuickEnquiryStatus) {
    setStatus(next);
    onStatusChange?.(next);
  }

  // The form is replaced by the thank-you panel, so move the reading position onto it.
  useEffect(() => {
    if (status === 'done') successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    const form = new FormData(event.currentTarget);
    const chosen = loc.chosenCentre;
    const phone = String(form.get('phone') ?? '');

    updateStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') ?? ''),
          phone,
          state: loc.state || undefined,
          city: loc.city || undefined,
          centre: chosen?.slug,
          qualification: String(form.get('qualification') ?? '') || undefined,
          persona: classification.persona,
          confidence: classification.confidence,
          source,
          visitorId: visitor.id || undefined,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        updateStatus('error');
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      updateStatus('done');
      track('enquiry_submitted', {
        persona: classification.persona,
        source,
        has_centre: Boolean(chosen),
        visitor_id: visitor.id,
      });
      record({ kind: 'form', formId: source, status: 'completed' });
      linkVisitorIdentity({ visitorId: visitor.id, phone });
    } catch {
      updateStatus('error');
      setError('We could not send that. Please check your connection and try again.');
    }
  }

  if (status === 'done') {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="py-4 text-center focus:outline-none">
        <p className="font-display text-xl font-extrabold text-foreground">Thank you!</p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground-secondary">
          A counsellor from your chosen centre will get in touch, usually within one working day.
        </p>
        {successAction}
      </div>
    );
  }

  const gridGap = compact ? 'gap-3' : 'gap-4';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4 lg:space-y-2' : 'space-y-4'}>
      <div className={`grid ${gridGap} sm:grid-cols-2`}>
        <Field label="Your name" htmlFor={`${id}-name`} required compact={compact}>
          <Input
            id={`${id}-name`}
            name="name"
            key={`name-${user?.id ?? 'guest'}`}
            defaultValue={user?.name}
            minLength={2}
            maxLength={120}
            autoComplete="name"
            compact={compact}
          />
        </Field>

        <Field label="Mobile number" htmlFor={`${id}-phone`} required compact={compact}>
          <Input
            id={`${id}-phone`}
            name="phone"
            key={`phone-${user?.id ?? 'guest'}`}
            defaultValue={user?.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="[\d\s+\(\)\-]{10,20}"
            placeholder="+91 98765 43210"
            compact={compact}
          />
        </Field>
      </div>

      <div className={`grid ${gridGap} sm:grid-cols-2`}>
        <Field label="State" htmlFor={`${id}-state`} required compact={compact}>
          <Select
            id={`${id}-state`}
            value={loc.state}
            required
            onChange={(e) => loc.onState(e.target.value)}
            compact={compact}
          >
            <option value="">Select state</option>
            {loc.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="City" htmlFor={`${id}-city`} required compact={compact}>
          <Select
            id={`${id}-city`}
            value={loc.city}
            required
            onChange={(e) => loc.onCity(e.target.value)}
            disabled={loc.cities.length === 0}
            compact={compact}
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

      <div className={`grid ${gridGap} sm:grid-cols-2`}>
        <Field label="Centre" htmlFor={`${id}-centre`} required compact={compact}>
          <Select
            id={`${id}-centre`}
            value={loc.centre}
            required
            onChange={(e) => loc.onCentre(e.target.value)}
            disabled={loc.centres.length === 0}
            compact={compact}
          >
            <option value="">{loc.centres.length > 0 ? 'Select centre' : 'City first'}</option>
            {loc.centres.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Highest qualification" htmlFor={`${id}-qualification`} required compact={compact}>
          <Select
            id={`${id}-qualification`}
            name="qualification"
            defaultValue=""
            required
            compact={compact}
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
        <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size={compact ? 'sm' : 'md'}
        disabled={status === 'submitting'}
        className={compact ? 'w-full max-lg:min-h-12 max-lg:text-base' : 'w-full'}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit'}
      </Button>

      <p className="text-center text-xs text-foreground-muted">
        We use your details only to respond to this enquiry.
      </p>
    </form>
  );
}
