'use client';

import { BotTrap, botFields } from '@/components/BotTrap';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';
import { siteConfig } from '@/lib/site';
import { useAccount } from '@/components/account/AccountProvider';
import { Button, Field, Input, Notice, Select, Textarea } from '@/components/ui';
import { QUALIFICATIONS } from '@/lib/enquiry-fields';
import { useEnquiryLocation, type LocatedCentre } from '@/components/useEnquiryLocation';
import { fill } from '@/lib/content/copy/define';
import type { enquiryCopy } from '@/lib/content/copy/pages/enquiry';

/**
 * Enquiry form.
 *
 * Persona context is attached to the submission so the counsellor sees how the lead
 * arrived and what it was reading — that context is the practical payoff of the
 * whole persona engine, and it is what "the AI warms the lead" means in the proposal.
 *
 * `/enquiry?course=…&city=…` preselects those fields.
 */

interface Option {
  slug: string;
  title?: string;
  name?: string;
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Matches the field styling used across the student/parent/professional/
 * franchise pages. Background/text are plain Tailwind utilities (those
 * don't collide with anything); border/focus are the `.stu-field` class in
 * student.css instead of more Tailwind classes, because the shared
 * `fieldControl` base (src/components/form.tsx) already sets its own
 * border/focus-ring via Tailwind classes, and `cx()` is a plain string join
 * with no Tailwind-merge dedup — an *additional* utility class doesn't
 * reliably win the cascade there, only real CSS specificity does. Measured
 * live: `fieldControl`'s own focus ring never painted at all (computed
 * `box-shadow: none` while focused — no visible indicator at all, WCAG
 * 2.4.7), and its resting border measured ~1.2:1 against the card, under
 * the 3:1 WCAG 1.4.11 needs for a field boundary.
 */
const fieldClass =
  'stu-field bg-[var(--dc-card)] text-[var(--dc-ink)] placeholder:text-[var(--dc-ink-muted)]';

export function EnquiryForm({
  courses,
  centres,
  copy,
}: {
  courses: Option[];
  centres: LocatedCentre[];
  copy: typeof enquiryCopy.defaults;
}) {
  const INTRO: Record<string, string> = {
    student: copy['form.intro.student'],
    professional: copy['form.intro.professional'],
    parent: copy['form.intro.parent'],
    unknown: copy['form.intro.unknown'],
  };
  const { classification, visitor, profile, record } = usePersona();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const startedRef = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const prefill = useMemo(
    () => ({ course: searchParams.get('course') ?? '', city: searchParams.get('city') ?? '' }),
    [searchParams],
  );
  const account = useAccount();
  const accountUser = account.user;

  // State → City → Centre. Defaults, in order: the URL prefill, then the signed-in
  // account's saved location; once the visitor picks, their choice wins.
  const loc = useEnquiryLocation(centres, {
    state: accountUser?.state,
    city: prefill.city || accountUser?.city,
    centre: accountUser?.centre,
  });

  // Move the reading position onto whichever outcome panel just appeared.
  useEffect(() => {
    if (status === 'done') successRef.current?.focus();
    if (status === 'error') errorRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('enquiry_started', { persona: classification.persona });
    record({ kind: 'form', formId: 'enquiry', status: 'started' });
  }, [classification.persona, record]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = new FormData(event.currentTarget);
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...botFields(),
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email') || undefined,
          state: loc.state || undefined,
          city: loc.city || undefined,
          centre: loc.centre || undefined,
          qualification: form.get('qualification') || undefined,
          courseSlug: form.get('courseSlug') || undefined,
          message: form.get('message') || undefined,
          persona: classification.persona,
          confidence: classification.confidence,
          source: window.location.pathname,
          visitorId: visitor.id || undefined,
          // Rich profile context for CRM / counsellor routing.
          journeyStage: profile.stage,
          intent: profile.intent,
        }),
      });

      const data: { ok?: boolean; error?: string } = await response.json();

      if (!response.ok || !data.ok) {
        setStatus('error');
        setError(data.error ?? copy['form.error']);
        return;
      }

      const phone = String(form.get('phone') ?? '');
      const email = String(form.get('email') ?? '');
      const linked = linkVisitorIdentity({
        visitorId: visitor.id,
        phone,
        email: email || undefined,
      });
      if (linked) {
        track('identity_linked', {
          visitor_id: linked.visitorId,
          has_phone: Boolean(linked.phone),
          has_email: Boolean(linked.email),
        });
      }

      setStatus('done');
      track('enquiry_submitted', {
        persona: classification.persona,
        confidence: classification.confidence,
        has_course: Boolean(form.get('courseSlug')),
        has_centre: Boolean(form.get('centre')),
        visitor_id: visitor.id,
        stage: profile.stage,
        intent: profile.intent ?? '',
      });
      record({ kind: 'form', formId: 'enquiry', status: 'completed' });
    } catch {
      setStatus('error');
      setError(copy['form.errorNetwork']);
    }
  }

  if (status === 'done') {
    return (
      /*
       * The form is replaced by this panel, so focus would otherwise fall back to
       * <body> and a screen reader user would hear nothing at all — the submission
       * appears to have done nothing. `tabIndex={-1}` plus the focus effect below
       * moves the reading position onto the confirmation, and `role="status"`
       * announces it (WCAG 3.3.1, 4.1.3).
       */
      <div ref={successRef} tabIndex={-1} role="status" className="focus:outline-none">
        <Notice tone="success" title={copy['form.thanks.title']}>
          <p>
            {copy['form.thanks.body']}
          </p>
          {siteConfig.whatsappNumber ? (
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_clicked', { persona: classification.persona })}
              className="link-underline mt-4 inline-flex items-center gap-1.5 font-semibold text-[var(--accent-ink)]"
            >
              {copy['form.thanks.whatsapp']}
              <span aria-hidden="true">→</span>
              <span className="sr-only">{copy['form.thanks.newTab']}</span>
            </a>
          ) : null}
        </Notice>
      </div>
    );
  }

  return (
    /*
     * `noValidate` was suppressing native constraint validation while nothing
     * replaced it — every `required` and `pattern` on the fields below was inert,
     * so an empty form went to the server and came back as one generic banner with
     * no indication of which field was at fault. There is no custom validator here,
     * so letting the browser do it restores per-field, per-locale, assistive-tech
     * -aware errors for free (WCAG 3.3.1, 3.3.3).
     */
    <form onSubmit={handleSubmit} className="space-y-7">
<BotTrap />
      <p className="text-base text-[var(--dc-ink-secondary)]">
        {classification.persona === 'franchise' ? (
          <>
            {copy['form.intro.franchise.lead']}{' '}
            <Link href={copy['form.intro.franchise.href'] as Route} className="font-semibold text-[var(--accent-ink)] underline underline-offset-4">
              {copy['form.intro.franchise.link']}
            </Link>
            .
          </>
        ) : (
          (INTRO[classification.persona] ?? INTRO.unknown)
        )}
      </p>

      {account.ready ? (
        accountUser ? (
          <p className="text-sm text-[var(--dc-ink-muted)]">
            {fill(copy['form.signedIn'], { name: accountUser.name })}
          </p>
        ) : (
          <p className="text-sm text-[var(--dc-ink-muted)]">
            {copy['form.login.lead']}{' '}
            <button
              type="button"
              onClick={() => account.openAuth('login')}
              className="tap cursor-pointer font-semibold text-[var(--accent-ink)] underline underline-offset-2"
            >
              {copy['form.login.button']}
            </button>{' '}
            {copy['form.login.trail']}
          </p>
        )
      ) : null}

      <Field label={copy['form.name.label']} htmlFor="name" required>
        <Input
          id="name"
          name="name"
          key={`name-${accountUser?.id ?? 'guest'}`}
          defaultValue={accountUser?.name}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className={fieldClass}
        />
      </Field>

      <Field
        label={copy['form.phone.label']}
        htmlFor="phone"
        required
        hint={copy['form.phone.hint']}
      >
        <Input
          id="phone"
          name="phone"
          key={`phone-${accountUser?.id ?? 'guest'}`}
          defaultValue={accountUser?.phone}
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          pattern="[\d\s+\(\)\-]{10,20}"
          className={fieldClass}
        />
      </Field>

      <Field label={copy['form.email.label']} htmlFor="email" hint={copy['form.email.hint']}>
        <Input
          id="email"
          name="email"
          key={`email-${accountUser?.id ?? 'guest'}`}
          defaultValue={accountUser?.email}
          type="email"
          maxLength={200}
          autoComplete="email"
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label={copy['form.state.label']} htmlFor="state" required>
          <Select
            id="state"
            name="state"
            value={loc.state}
            required
            onChange={(event) => loc.onState(event.target.value)}
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

        <Field label={copy['form.city.label']} htmlFor="city" required>
          <Select
            id="city"
            name="city"
            value={loc.city}
            required
            onChange={(event) => loc.onCity(event.target.value)}
            disabled={loc.cities.length === 0}
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
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label={copy['form.centre.label']} htmlFor="centre" required>
          <Select
            id="centre"
            name="centre"
            value={loc.centre}
            required
            onChange={(event) => loc.onCentre(event.target.value)}
            disabled={loc.centres.length === 0}
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

        <Field label={copy['form.qualification.label']} htmlFor="qualification" required>
          <Select
            id="qualification"
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

      <Field label={copy['form.course.label']} htmlFor="courseSlug">
        <Select
          id="courseSlug"
          name="courseSlug"
          defaultValue={prefill.course}
          className={fieldClass}
        >
          <option value="">{copy['form.course.none']}</option>
          {courses.map((course) => (
            <option key={course.slug} value={course.slug}>
              {course.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={copy['form.message.label']} htmlFor="message">
        <Textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className={fieldClass}
        />
      </Field>

      {error ? (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-[var(--radius-input)] border border-jk-200 bg-jk-50 px-4 py-3 text-sm font-medium text-jk-700 focus:outline-none"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={status === 'submitting'}
        className="w-full bg-[var(--dc-accent)] hover:bg-jk-700"
      >
        {status === 'submitting' ? copy['form.submitting'] : copy['form.submit']}
      </Button>

      <p className="text-sm text-[var(--dc-ink-muted)]">
        {copy['form.privacy']}
      </p>
    </form>
  );
}
