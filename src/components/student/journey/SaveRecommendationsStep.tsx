'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Field, Input } from '@/components/ui';
import { track } from '@/lib/analytics';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import type { StudentDiscovery } from '@/persona/studentJourney';
import { interestIntent } from '@/persona/studentJourney';

export function SaveRecommendationsStep({
  discovery,
  recommendedSlugs,
  selectedCourseSlug,
  onSaved,
  onSkip,
}: {
  discovery: StudentDiscovery;
  recommendedSlugs: string[];
  selectedCourseSlug?: string;
  onSaved: (phone: string, name?: string) => void;
  onSkip: () => void;
}) {
  const { visitor, setIntent, record } = usePersona();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');
  const intent = interestIntent(discovery.interest);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = new FormData(event.currentTarget);
    const phone = String(form.get('phone') ?? '').trim();
    const name = String(form.get('name') ?? '').trim();

    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/journey/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: name || undefined,
          visitorId: visitor.id || undefined,
          persona: 'student',
          intent,
          education: discovery.education,
          recommendedSlugs,
          selectedCourseSlug,
          source: 'student-journey-soft-save',
        }),
      });

      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setStatus('error');
        setError(data.error ?? 'Could not save. Please try again.');
        return;
      }

      linkVisitorIdentity({ visitorId: visitor.id, phone, name: name || undefined });
      setIntent(intent, discovery.interest);
      record({ kind: 'form', formId: 'journey-soft-save', status: 'completed' });
      track('journey_soft_save', {
        visitor_id: visitor.id,
        intent,
        has_name: Boolean(name),
      });
      onSaved(phone, name || undefined);
    } catch {
      setStatus('error');
      setError('Connection issue — please try again.');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="k-eyebrow">
          Step 3 · Save your path
        </p>
        <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
          Save your {intent} recommendations
        </h2>
        <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          We&rsquo;ll text or WhatsApp your matched courses and career roadmap. No
          spam — just your saved path.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="stu-card max-w-lg space-y-5 rounded-[24px] p-6 sm:p-7">
        <Field
          label="Mobile number"
          htmlFor="journey-phone"
          required
          hint="We'll send your recommendations here."
        >
          <Input
            id="journey-phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            pattern="[\d\s+\(\)\-]{10,20}"
            className="border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] text-[var(--dc-ink)]"
          />
        </Field>

        <Field label="First name" htmlFor="journey-name" hint="Optional — personalises your roadmap.">
          <Input
            id="journey-name"
            name="name"
            type="text"
            maxLength={120}
            autoComplete="given-name"
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
          className="group/save inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[var(--dc-accent)] py-3 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 disabled:opacity-60"
        >
          <Bookmark className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {status === 'submitting' ? 'Saving…' : 'Save my recommendations'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          track('journey_soft_save_skipped', { intent });
          onSkip();
        }}
        className="-my-2 inline-block cursor-pointer py-2 text-[14px] font-semibold text-[var(--dc-ink-muted)] underline-offset-2 hover:text-[var(--dc-ink-secondary)] hover:underline"
      >
        Skip for now — show my roadmap
      </button>
    </div>
  );
}
