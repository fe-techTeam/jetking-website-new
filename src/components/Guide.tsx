'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Bot, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePersona } from '@/persona/PersonaProvider';
import type { GuideOutcome, HandoffReason } from '@/guide/types';
import type { PersonaId } from '@/persona/types';
import {
  buildHandoffPayload,
  enquiryHandoffHref,
  storeHandoff,
  whatsappHandoffUrl,
  type GuideHandoffPayload,
} from '@/guide/handoff';
import { track } from '@/lib/analytics';
import { Button, cx } from './ui';
import { useDialog } from './useDialog';
import { scrollBehavior } from '@/lib/motion';

/**
 * The AI Guide — the visible proof of the "AI-empowered" repositioning.
 *
 * Design decisions that matter:
 *   • Citations are always shown on a grounded answer.
 *   • A handoff renders as a clear, positive next step, not an apology.
 *   • Structured fees render as a fixed card — never free-text LLM output.
 *   • Counsellor / WhatsApp links carry conversation context (§5.3).
 */

interface FeesPayload {
  courseSlug?: string;
  courseTitle?: string;
  amount?: string;
  basis?: string;
  emiAvailable?: boolean;
  note?: string;
}

interface Turn {
  role: 'user' | 'guide';
  text: string;
  citations?: Array<{ title: string; url: string }>;
  handoff?: boolean;
  handoffReason?: HandoffReason;
  fees?: FeesPayload;
}

const OPENERS: Record<PersonaId, { greeting: string; prompts: string[] }> = {
  student: {
    greeting: "Hi! I'm your AI guide. How can I help you today?",
    prompts: [
      'Which course is best for me?',
      'Course fees and duration',
      'What can I do after 12th?',
      'Online or classroom training?',
    ],
  },
  professional: {
    greeting: "Hi! I'm your AI guide. How can I help you today?",
    prompts: [
      'Which course is best for me?',
      'Course fees and duration',
      'Can I study while working?',
      'Online or classroom training?',
    ],
  },
  parent: {
    greeting: "Hi! I'm your AI guide. How can I help you today?",
    prompts: [
      'Which course is best for me?',
      'Course fees and duration',
      'Placements & career support',
      'What is the eligibility?',
    ],
  },
  franchise: {
    greeting: "Hi! I'm your AI guide. How can I help you today?",
    prompts: [
      'How do I enquire about a franchise?',
      'What does running a centre involve?',
      'Course fees and duration',
      'Where are your centres?',
    ],
  },
  unknown: {
    greeting: "Hi! I'm your AI guide. How can I help you today?",
    prompts: [
      'Which course is best for me?',
      'Course fees and duration',
      'Placements & career support',
      'Online or classroom training?',
    ],
  },
};

const inputClass =
  'h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground transition-colors placeholder:text-foreground-disabled focus:border-jk-600 focus:ring-2 focus:ring-jk-600/20 focus:outline-none';

/**
 * Dispatch on `window` to open the Guide from anywhere: `openGuide('home-rail')`.
 * Pass `question` to open it and ask immediately.
 */
export const GUIDE_OPEN_EVENT = 'jk:guide-open';

export function openGuide(source?: string, question?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GUIDE_OPEN_EVENT, { detail: { source, question } }));
}

export function Guide() {
  const { classification } = usePersona();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /**
   * `ask` closes over `turns` and `pending`, so it is a new function every render.
   * Reaching it through a ref lets the open-request listener below stay bound for
   * the lifetime of the component instead of re-subscribing on every message.
   */
  const askRef = useRef<(question: string) => Promise<void>>(async () => {});
  const opener = OPENERS[classification.persona];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: scrollBehavior() });
  }, [turns, pending]);

  /*
   * External opener. Pages that surface their own "ask the Guide" affordance — the
   * homepage action rail, for one — dispatch `GUIDE_OPEN_EVENT` rather than
   * importing state from here. A DOM event keeps the Guide's transcript state
   * private and means a caller does not have to sit inside a shared provider.
   */
  useEffect(() => {
    function onOpenRequest(event: Event) {
      setOpen(true);
      const detail = (event as CustomEvent<{ source?: string; question?: string }>).detail;
      track('guide_opened', { persona: classification.persona, source: detail?.source ?? 'external' });
      if (detail?.question) void askRef.current(detail.question);
    }

    window.addEventListener(GUIDE_OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(GUIDE_OPEN_EVENT, onOpenRequest);
  }, [classification.persona]);

  function prepareHandoff(reason: HandoffReason | 'user-requested', courseSlug?: string): GuideHandoffPayload {
    const payload = buildHandoffPayload({
      persona: classification.persona,
      reason,
      turns: turns.map((t) => ({ role: t.role, text: t.text })),
      courseSlug,
    });
    storeHandoff(payload);
    return payload;
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setTurns((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setPending(true);
    track('guide_message', { persona: classification.persona, length: trimmed.length });

    try {
      const response = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmed, persona: classification.persona }),
      });

      const data: { outcome?: GuideOutcome } = await response.json();
      const outcome = data.outcome;

      if (!outcome) {
        setTurns((prev) => [
          ...prev,
          { role: 'guide', text: 'Something went wrong. Please try again.', handoff: true },
        ]);
        return;
      }

      if (outcome.kind === 'handoff') {
        track('guide_refused', { persona: classification.persona, reason: outcome.reason });
        prepareHandoff(outcome.reason);
        setTurns((prev) => [
          ...prev,
          { role: 'guide', text: outcome.text, handoff: true, handoffReason: outcome.reason },
        ]);
        return;
      }

      if (outcome.kind === 'structured') {
        const fees = outcome.component === 'fees' ? (outcome.payload as FeesPayload) : undefined;
        if (fees?.courseSlug) prepareHandoff('fee-specific', fees.courseSlug);
        setTurns((prev) => [
          ...prev,
          {
            role: 'guide',
            text: outcome.text,
            fees,
            handoff: outcome.component === 'fees' && !fees?.amount,
          },
        ]);
        return;
      }

      track('guide_cited', { persona: classification.persona, citations: outcome.citations.length });
      setTurns((prev) => [
        ...prev,
        { role: 'guide', text: outcome.text, citations: outcome.citations },
      ]);
    } catch {
      prepareHandoff('unavailable');
      setTurns((prev) => [
        ...prev,
        {
          role: 'guide',
          text: 'I could not reach the assistant. You can leave an enquiry and a counsellor will get back to you.',
          handoff: true,
          handoffReason: 'unavailable',
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  // Ref writes belong in an effect, not in render.
  useEffect(() => {
    askRef.current = ask;
  });

  /*
   * Non-modal dialog: focus moves into the panel on open, Escape closes it, and
   * focus returns to the launcher afterwards — but the page behind stays reachable,
   * because the whole point of a corner assistant is that you keep reading the page
   * it is answering questions about. Previously the panel had none of this: it
   * opened with focus still on the launcher and could only be dismissed by mouse.
   */
  useDialog(open, () => setOpen(false), panelRef, { modal: false });

  return (
    <>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="guide-title"
          aria-describedby="guide-subtitle"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(34rem,80vh)] flex-col overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-background shadow-[var(--shadow-lg)] sm:inset-x-auto sm:right-4 sm:bottom-32 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-jk-600 text-white">
                <Bot className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div>
                <p id="guide-title" className="text-sm font-semibold text-foreground">
                  Jetking AI Guide
                </p>
                <p id="guide-subtitle" className="text-2xs text-foreground-muted">
                  Ask about courses, centres or admissions
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guide"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-foreground-muted transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {/*
            The transcript is a log, not an alert: `role="log"` with `aria-live`
            announces each new turn as it arrives without interrupting, which is the
            only way a screen reader user learns the Guide has answered. Without it
            the reply lands silently and the panel appears not to respond.
          */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversation"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {turns.length === 0 ? (
              <>
                <p className="rounded-[var(--radius-card)] bg-surface p-4 text-sm text-foreground-secondary">
                  {opener.greeting}
                </p>
                <ul className="flex flex-col gap-2">
                  {opener.prompts.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => void ask(prompt)}
                        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-[9px] border border-border bg-surface px-3 py-2.5 text-left text-[12.5px] font-semibold text-foreground transition-colors hover:bg-card"
                      >
                        {prompt}
                        <span aria-hidden="true" className="text-base leading-none">
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {turns.map((turn, index) => {
              const handoffPayload =
                turn.handoff || turn.fees
                  ? buildHandoffPayload({
                      persona: classification.persona,
                      reason: turn.handoffReason ?? (turn.fees ? 'fee-specific' : 'user-requested'),
                      turns: turns
                        .slice(0, index + 1)
                        .map((t) => ({ role: t.role, text: t.text })),
                      courseSlug: turn.fees?.courseSlug,
                    })
                  : null;
              const enquiryHref = handoffPayload
                ? (enquiryHandoffHref(handoffPayload) as Route)
                : ('/enquiry' as Route);
              const waUrl = handoffPayload ? whatsappHandoffUrl(handoffPayload) : null;

              return (
                <div
                  key={index}
                  className={cx('flex', turn.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cx(
                      'max-w-[85%] rounded-[var(--radius-card)] px-3.5 py-2.5 text-sm',
                      turn.role === 'user'
                        ? 'bg-jk-600 text-white'
                        : turn.handoff
                          ? 'border border-signal-600/25 bg-signal-50 text-foreground-secondary'
                          : 'bg-surface text-foreground-secondary',
                    )}
                  >
                    {turn.fees?.amount ? (
                      <FeesCard fees={turn.fees} />
                    ) : (
                      <p className="whitespace-pre-wrap">{turn.text}</p>
                    )}

                    {turn.citations?.length ? (
                      <div className="mt-3 border-t border-border pt-2.5">
                        <p className="label-mono mb-1.5">Sources</p>
                        <ul className="space-y-0.5">
                          {turn.citations.map((citation, citationIndex) => (
                            <li key={`${citation.url}-${citationIndex}`}>
                              {citation.url.startsWith('/') ? (
                                <Link
                                  href={citation.url as Route}
                                  onClick={() => setOpen(false)}
                                  className="text-xs text-[var(--accent-ink)] hover:underline"
                                >
                                  {citation.title}
                                </Link>
                              ) : (
                                <a
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpen(false)}
                                  className="text-xs text-[var(--accent-ink)] hover:underline"
                                >
                                  {citation.title}
                                  <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {turn.handoff || turn.fees ? (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <Link
                          href={enquiryHref}
                          onClick={() => {
                            if (handoffPayload) storeHandoff(handoffPayload);
                            track('guide_handoff', { persona: classification.persona });
                            setOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline"
                        >
                          Talk to a counsellor <span aria-hidden="true">→</span>
                        </Link>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (handoffPayload) storeHandoff(handoffPayload);
                              track('whatsapp_clicked', { persona: classification.persona });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline"
                          >
                            Continue on WhatsApp <span aria-hidden="true">→</span>
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {pending ? (
              <div className="flex justify-start">
                <div className="rounded-[var(--radius-card)] bg-surface px-3.5 py-2.5 text-sm text-foreground-muted">
                  {/*
                    `aria-label` on a plain span is not reliably exposed — it needs a
                    role, or real text. Real text is simpler: the dots are decoration
                    and the status is spoken.
                  */}
                  <span aria-hidden="true" className="inline-flex gap-1">
                    <span className="animate-pulse opacity-40">·</span>
                    <span className="animate-pulse opacity-40 [animation-delay:200ms]">·</span>
                    <span className="animate-pulse opacity-40 [animation-delay:400ms]">·</span>
                  </span>
                  <span className="sr-only">Thinking…</span>
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <label htmlFor="guide-input" className="sr-only">
              Ask the Jetking Guide
            </label>
            <input
              id="guide-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything…"
              maxLength={1000}
              className={inputClass}
            />
            <Button type="submit" size="sm" disabled={pending || !input.trim()}>
              Ask
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}

function FeesCard({ fees }: { fees: FeesPayload }) {
  return (
    <div className="space-y-2">
      <p className="label-mono">Course fee</p>
      {fees.courseTitle ? (
        <p className="font-semibold text-foreground">{fees.courseTitle}</p>
      ) : null}
      {fees.amount ? (
        <p className="numeral font-display text-2xl font-bold tracking-tight text-foreground">
          {fees.amount}
          {fees.basis ? (
            <span className="ml-1 text-sm font-medium text-foreground-muted">{fees.basis}</span>
          ) : null}
        </p>
      ) : null}
      {fees.emiAvailable ? (
        <p className="text-xs text-foreground-secondary">EMI options may be available — confirm with a counsellor.</p>
      ) : null}
      {fees.note ? <p className="text-xs text-foreground-muted">{fees.note}</p> : null}
      <p className="text-xs text-foreground-muted">
        Fees are centre- and intake-specific. A counsellor will confirm the exact figure for you.
      </p>
    </div>
  );
}
