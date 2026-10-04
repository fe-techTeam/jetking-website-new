'use client';

import { BotTrap, botFields } from '@/components/BotTrap';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Field, Input, Textarea } from '@/components/ui';
import { siteConfig } from '@/lib/site';
import { track } from '@/lib/analytics';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import type { Course } from '@/lib/content/types';
import type { StudentDiscovery } from '@/persona/studentJourney';
import { interestIntent } from '@/persona/studentJourney';

export function CounsellingStep({
  course,
  discovery,
  softName,
  softPhone,
  onComplete,
}: {
  course: Course;
  discovery: StudentDiscovery;
  softName?: string;
  softPhone?: string;
  onComplete: () => void;
}) {
  const { classification, visitor, profile, record } = usePersona();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const startedRef = useRef(false);
  const intent = interestIntent(discovery.interest);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('enquiry_started', {
      persona: 'student',
      source: 'student-journey-counsel',
      slug: course.slug,
    });
    record({ kind: 'form', formId: 'enquiry', status: 'started' });
  }, [course.slug, record]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting' || status === 'done') return;

    const form = new FormData(event.currentTarget);
    setStatus('submitting');
    setError('');

    const message = [
      `Student journey — interested in ${course.title}.`,
      `Education: ${discovery.education}. Career interest: ${intent}.`,
      form.get('message') ? String(form.get('message')) : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...botFields(),
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email') || undefined,
          courseSlug: course.slug,
          message,
          persona: 'student',
          confidence: classification.confidence,
          source: 'student-journey-counsel',
          visitorId: visitor.id || undefined,
          journeyStage: profile.stage,
          intent,
        }),
      });

      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setStatus('error');
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const phone = String(form.get('phone') ?? '');
      const email = String(form.get('email') ?? '');
      linkVisitorIdentity({
        visitorId: visitor.id,
        phone,
        email: email || undefined,
      });
      record({ kind: 'form', formId: 'enquiry', status: 'completed' });
      track('journey_counsel_submitted', {
        visitor_id: visitor.id,
        slug: course.slug,
        intent,
      });
      setStatus('done');
      onComplete();
    } catch {
      setStatus('error');
      setError('We could not send that. Please check your connection and try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="space-y-6 text-center sm:text-left">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] sm:mx-0">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h2 className="section-title font-display text-[var(--dc-ink)]">
            You&rsquo;re booked in
          </h2>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
            A counsellor will reach out about <strong className="text-[var(--dc-ink)]">{course.title}</strong>, usually within one working day.
          </p>
          {siteConfig.whatsappNumber ? (
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-[14px] font-bold text-[var(--dc-accent-soft)] underline-offset-2 hover:underline"
            >
              Prefer WhatsApp? Message us now
              <span aria-hidden="true">→</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="k-eyebrow">
          Step 5 · Book counselling
        </p>
        <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
          Talk to a counsellor about {course.shortTitle}
        </h2>
        <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          Free session — we&rsquo;ll help you confirm the course, nearest centre, and
          next steps. No obligation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="stu-card max-w-lg space-y-5 rounded-[24px] p-6 sm:p-7"
        noValidate
      >
<BotTrap />
        <Field label="Your name" htmlFor="counsel-name" required>
          <Input
            id="counsel-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            defaultValue={softName}
            className="border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)]"
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="counsel-phone"
          required
          hint="A counsellor will call or message you on this number."
        >
          <Input
            id="counsel-phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            pattern="[\d\s+\(\)\-]{10,20}"
            defaultValue={softPhone}
            className="border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)]"
          />
        </Field>

        <Field label="Email" htmlFor="counsel-email" hint="Optional.">
          <Input
            id="counsel-email"
            name="email"
            type="email"
            maxLength={200}
            autoComplete="email"
            className="border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)]"
          />
        </Field>

        <Field label="Anything you would like to ask?" htmlFor="counsel-message">
          <Textarea
            id="counsel-message"
            name="message"
            rows={3}
            maxLength={2000}
            placeholder="e.g. weekend batches, nearest centre in Mumbai…"
            className="border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)]"
          />
        </Field>

        {error ? (
          <p role="alert" className="text-sm font-medium text-[var(--dc-accent-soft)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[var(--dc-navy)] py-3 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 disabled:opacity-60"
        >
          <CalendarDays className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {status === 'submitting' ? 'Sending…' : 'Book free counselling'}
        </button>

        <p className="text-[14px] text-[var(--dc-ink-muted)]">
          We use your details only to arrange this counselling session.
        </p>
      </form>
    </div>
  );
}
