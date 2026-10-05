'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Phone } from 'lucide-react';
import { BotTrap, botFields } from '@/components/BotTrap';
import { TrackedAnchor } from '@/components/TrackedAnchor';
import { useSiteCopy } from '@/components/providers/site-copy';
import { Button, Field, Input, Select } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export interface CentreFormCopy {
  title: string;
  sub: string;
  email: string;
  emailPlaceholder: string;
  programme: string;
  programmePlaceholder: string;
  consent: string;
  submit: string;
  callPrefix: string;
}

/**
 * The enquiry form on a centre banner. The centre is fixed by the page, so the visitor is only asked
 * for name, mobile, optional email and the programme they are interested in, and ticks consent to be
 * called. It posts to the same `/api/enquiry` as the other lead forms, tagged with this centre.
 */
export function CentreHeroForm({
  centreSlug,
  phone,
  phoneHref,
  programmes,
  copy,
  titleId,
}: {
  centreSlug: string;
  phone?: string;
  phoneHref: string | null;
  programmes: { slug: string; title: string }[];
  copy: CentreFormCopy;
  titleId: string;
}) {
  const id = useId();
  const site = useSiteCopy();
  const successRef = useRef<HTMLDivElement>(null);
  const { classification, visitor, record } = usePersona();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'done') successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    const form = new FormData(event.currentTarget);
    const phoneValue = String(form.get('phone') ?? '');
    const source = 'centre-hero-form';

    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...botFields(),
          name: String(form.get('name') ?? ''),
          phone: phoneValue,
          email: String(form.get('email') ?? '').trim(),
          centre: centreSlug,
          courseSlug: String(form.get('programme') ?? '') || undefined,
          persona: classification.persona,
          confidence: classification.confidence,
          source,
          visitorId: visitor.id || undefined,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus('error');
        setError(data.error ?? site['enquiry.error.generic']);
        return;
      }
      setStatus('done');
      track('enquiry_submitted', {
        persona: classification.persona,
        source,
        has_centre: true,
        visitor_id: visitor.id,
      });
      record({ kind: 'form', formId: source, status: 'completed' });
      linkVisitorIdentity({ visitorId: visitor.id, phone: phoneValue });
    } catch {
      setStatus('error');
      setError(site['enquiry.error.network']);
    }
  }

  return (
    <aside
      id="centre-hero-cta"
      aria-labelledby={titleId}
      className="w-full px-5 pb-8 xs:px-8 sm:px-10 lg:w-[400px] lg:shrink-0 lg:px-0 lg:py-7 lg:pr-8 xl:w-[440px] xl:pr-10"
    >
      <div className="rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-4 shadow-[var(--dc-shadow)]">
        {status === 'done' ? (
          <div ref={successRef} tabIndex={-1} role="status" className="py-4 text-center focus:outline-none">
            <p id={titleId} className="font-display text-xl font-extrabold text-foreground">
              {site['enquiry.success.title']}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground-secondary">{site['enquiry.success.body']}</p>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="k-hero-eyebrow">
              {copy.title}
            </h2>
            <p className="mt-1 mb-3 text-[13.5px] text-foreground-secondary">{copy.sub}</p>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-2">
              <BotTrap />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={site['enquiry.form.name.label']} htmlFor={`${id}-name`} required compact>
                  <Input id={`${id}-name`} name="name" minLength={2} maxLength={120} autoComplete="name" compact />
                </Field>
                <Field label={site['enquiry.form.mobile.label']} htmlFor={`${id}-phone`} required compact>
                  <Input
                    id={`${id}-phone`}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="[\d\s+\(\)\-]{10,20}"
                    placeholder={site['enquiry.form.mobile.placeholder']}
                    compact
                  />
                </Field>
              </div>
              <Field label={copy.email} htmlFor={`${id}-email`} compact>
                <Input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  placeholder={copy.emailPlaceholder}
                  compact
                />
              </Field>
              {programmes.length ? (
                <Field label={copy.programme} htmlFor={`${id}-programme`} compact>
                  <Select id={`${id}-programme`} name="programme" defaultValue="" compact>
                    <option value="">{copy.programmePlaceholder}</option>
                    {programmes.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}

              <label className="flex min-h-11 items-center gap-3 text-sm text-foreground-secondary lg:min-h-0 lg:text-xs">
                <input type="checkbox" name="consent" required className="h-5 w-5 shrink-0 accent-[var(--accent-ink)] lg:h-4 lg:w-4" />
                <span>{copy.consent}</span>
              </label>

              {error ? (
                <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="sm"
                disabled={status === 'submitting'}
                className="w-full max-lg:min-h-12 max-lg:text-base"
              >
                {status === 'submitting' ? site['enquiry.form.submitting'] : copy.submit}
              </Button>
            </form>

            {phone && phoneHref ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-foreground-muted">
                <Phone className="h-4 w-4 text-[var(--accent-ink)]" strokeWidth={2} aria-hidden="true" />
                <span>{copy.callPrefix}</span>
                <TrackedAnchor
                  href={phoneHref}
                  event="phone_clicked"
                  props={{ centre_slug: centreSlug, type: 'hero' }}
                  className="tap font-bold text-foreground hover:text-[var(--accent-ink)]"
                >
                  {phone}
                </TrackedAnchor>
              </p>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
