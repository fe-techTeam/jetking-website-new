'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  EDUCATION_OPTIONS,
  INTEREST_OPTIONS,
  type StudentDiscovery,
  type StudentEducation,
  type StudentInterest,
} from '@/persona/studentJourney';
import { track } from '@/lib/analytics';

export function DiscoveryStep({
  initial,
  onComplete,
}: {
  initial?: StudentDiscovery;
  onComplete: (discovery: StudentDiscovery) => void;
}) {
  const [education, setEducation] = useState<StudentEducation | null>(initial?.education ?? null);
  const [interest, setInterest] = useState<StudentInterest | null>(initial?.interest ?? null);

  const ready = education !== null && interest !== null;

  function submit() {
    if (!ready) return;
    const discovery = { education, interest };
    track('journey_discovery_completed', {
      education,
      interest,
    });
    onComplete(discovery);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="k-eyebrow">
          Step 1 · Discover
        </p>
        <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
          Let&rsquo;s find your tech career path
        </h2>
        <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          Two quick questions — no login needed. We&rsquo;ll recommend courses that fit
          your background and goals.
        </p>
      </div>

      <fieldset>
        <legend className="text-[15px] font-bold text-[var(--dc-ink)]">
          Where are you in your education?
        </legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {EDUCATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              /*
               * Which option is chosen was conveyed by border and fill colour only —
               * invisible to a screen reader (4.1.2) and to anyone who cannot
               * distinguish the two states by hue (1.4.1). `aria-pressed` puts the
               * state in the accessible name, matching the Chip pattern in
               * CourseExplorer.
               */
              aria-pressed={education === opt.id}
              onClick={() => setEducation(opt.id)}
              className={[
                'cursor-pointer rounded-2xl border p-4 text-left transition-colors',
                education === opt.id
                  ? 'border-[var(--dc-accent-soft)] bg-[var(--dc-accent-tint)]'
                  : 'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] hover:border-[var(--dc-accent-soft)]/50',
              ].join(' ')}
            >
              <span className="block text-[15px] font-extrabold text-[var(--dc-ink)]">
                {opt.label}
              </span>
              <span className="mt-1 block text-[13px] text-[var(--dc-ink-muted)]">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[15px] font-bold text-[var(--dc-ink)]">
          Which career path interests you?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={interest === opt.id}
              onClick={() => setInterest(opt.id)}
              className={[
                'cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold transition-colors',
                interest === opt.id
                  ? 'border-[var(--dc-accent-soft)] bg-[var(--dc-accent)] text-white'
                  : 'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink-secondary)] hover:border-[var(--dc-accent-soft)]/50',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!ready}
        onClick={submit}
        className="group/next inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        See my recommendations
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-enabled/next:group-hover/next:translate-x-0.5"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  );
}
