'use client';

import { BotTrap, botFields } from '@/components/BotTrap';
import { useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';
import type { ChatUser } from '@/lib/chatbot/types';

export interface LeadFormContext {
  /** Why this form appeared — carried through to `/api/enquiry` as `intent`. */
  intent: string;
  /** Course subject detected from the question, if any (e.g. "Cyber Security"). Prefills and stays editable. */
  course: string | null;
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Inline lead-capture form shown in a chat bubble — e.g. after "book a free
 * demo class". Submits to the same `/api/enquiry` endpoint and schema as
 * every other lead form on the site (QuickEnquiryForm, franchise/explore
 * forms), just with `source: 'jetking-ai-chat'` so it's distinguishable in
 * the CRM, and a free-text `city`/`course` instead of the site-wide
 * state→centre dropdown (the chat doesn't have that centre list to hand).
 */
export function LeadCaptureForm({
  context,
  user,
}: {
  context: LeadFormContext;
  /** Signed-in chatbot visitor, if any — prefills name/phone/email/city. */
  user: ChatUser | null;
}) {
  const { classification, visitor, record } = usePersona();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [course, setCourse] = useState(context.course ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    const form = new FormData(event.currentTarget);
    const phone = String(form.get('phone') ?? '');
    const email = String(form.get('email') ?? '').trim();
    const city = String(form.get('city') ?? '').trim();
    const courseValue = String(form.get('course') ?? '').trim();

    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...botFields(),
          name: String(form.get('name') ?? ''),
          phone,
          email: email || undefined,
          city: city || undefined,
          message: courseValue
            ? `Free demo class request — ${courseValue}`
            : 'Free demo class request',
          persona: classification.persona,
          confidence: classification.confidence,
          source: 'jetking-ai-chat',
          intent: context.intent,
          visitorId: visitor.id || undefined,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus('error');
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('done');
      track('enquiry_submitted', {
        persona: classification.persona,
        source: 'jetking-ai-chat',
        has_centre: false,
        visitor_id: visitor.id,
      });
      record({ kind: 'form', formId: context.intent, status: 'completed' });
      linkVisitorIdentity({ visitorId: visitor.id, phone });
    } catch {
      setStatus('error');
      setError('We could not send that. Please check your connection and try again.');
    }
  }

  if (status === 'done') {
    return (
      <div
        role="status"
        className="jk-msg-in mt-3 rounded-xl border border-line bg-surface-sunken/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink"
      >
        <p className="font-semibold">Thanks — request sent!</p>
        <p className="mt-1 text-ink-muted">
          A Jetking counsellor will reach out shortly to confirm your demo slot.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="jk-msg-in mt-3 flex flex-col gap-3 rounded-xl border border-line bg-surface-sunken/60 p-3.5"
    >
<BotTrap />
      <Field label="Your name" htmlFor="lead-name" required>
        <Input
          id="lead-name"
          name="name"
          defaultValue={user?.name}
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className="h-10 text-[13.5px]"
        />
      </Field>

      <Field label="Mobile number" htmlFor="lead-phone" required>
        <Input
          id="lead-phone"
          name="phone"
          defaultValue={user?.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          pattern="[\d\s+\(\)\-]{10,20}"
          placeholder="+91 98765 43210"
          className="h-10 text-[13.5px]"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" htmlFor="lead-city">
          <Input
            id="lead-city"
            name="city"
            defaultValue={user?.city ?? ''}
            maxLength={120}
            autoComplete="address-level2"
            className="h-10 text-[13.5px]"
          />
        </Field>

        <Field label="Course" htmlFor="lead-course">
          <Input
            id="lead-course"
            name="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            maxLength={120}
            placeholder="Which course?"
            className="h-10 text-[13.5px]"
          />
        </Field>
      </div>

      <Field label="Email (optional)" htmlFor="lead-email">
        <Input
          id="lead-email"
          name="email"
          defaultValue={user?.email}
          type="email"
          autoComplete="email"
          maxLength={200}
          className="h-10 text-[13.5px]"
        />
      </Field>

      {error ? (
        <p role="alert" className="text-[12.5px] font-medium text-brand-text">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Submitting…' : 'Book my free demo'}
      </Button>
    </form>
  );
}
