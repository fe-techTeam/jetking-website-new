'use client';

import { Bot, MessageSquare, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { askTestQuestion, getBuild, getChatTranscript, rebuildKnowledge, type ChatSummary, type TestAnswer } from './actions';
import type { BuildState } from '@/lib/chatbot/ops';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

export function ChatbotConsole({
  build: initialBuild,
  needsRebuild,
  builtLabel,
  embedModel,
  breakdown,
  chats,
}: {
  build: BuildState;
  needsRebuild: boolean;
  builtLabel: string;
  embedModel: string;
  /** Pre-formatted on the server so Node vs browser `toLocaleString` cannot hydrate-mismatch. */
  breakdown: Array<[string, string]>;
  chats: ChatSummary[];
  canReadChats?: boolean;
}) {
  const [build, setBuild] = useState(initialBuild);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<TestAnswer | null>(null);
  const [asking, startAsk] = useTransition();

  const [open, setOpen] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }> | null>(null);

  // While a rebuild runs, poll its log every few seconds.
  useEffect(() => {
    if (!build.running) return;
    const id = setInterval(() => getBuild().then(setBuild).catch(() => {}), 3000);
    return () => clearInterval(id);
  }, [build.running]);

  function rebuild() {
    setError(null);
    start(async () => {
      const result = await rebuildKnowledge();
      if (!result.ok) setError(result.error);
      setBuild(await getBuild());
    });
  }

  function ask() {
    startAsk(async () => setAnswer(await askTestQuestion(question)));
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* ── Knowledge ───────────────────────────────────────────── */}
      <section className="adm-card p-5 sm:p-6" aria-labelledby="knowledge-h">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="knowledge-h" className="flex items-center gap-2 text-base font-bold text-foreground"><Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />Knowledge</h2>
            <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
              Everything published on the website is gathered into the assistant’s knowledge. After you edit courses, centres, FAQs, pages or Custom answers, rebuild so the assistant learns the changes.
              Last rebuilt <strong className="text-foreground">{builtLabel}</strong> · {embedModel}.
            </p>
          </div>
          <button
            type="button"
            disabled={pending || build.running || !build.canRun}
            onClick={() => setConfirm(true)}
            className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw aria-hidden="true" className={`mr-2 inline h-4 w-4 ${build.running ? 'animate-spin' : ''}`} />{build.running ? 'Rebuilding…' : 'Rebuild knowledge'}
          </button>
        </div>
        {needsRebuild ? (
          <p className="mt-3 rounded-[var(--admin-radius)] bg-[var(--color-signal-50)] px-3 py-2 text-sm font-medium text-[#b54708]">
            Content has changed since the last rebuild — the assistant does not know about those edits yet.
          </p>
        ) : null}
        {!build.canRun ? <p className="mt-3 text-sm text-foreground-muted">{build.reason}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm font-medium text-[var(--color-error-600)]">{error}</p> : null}
        {build.log ? (
          <pre className="mt-4 max-h-56 overflow-auto rounded-[var(--admin-radius)] bg-[#0e1424] p-3 text-xs leading-relaxed whitespace-pre-wrap text-white/85" aria-label="Rebuild log">
            {build.log}
          </pre>
        ) : null}
        {breakdown.length > 0 ? (
          <ul className="mt-5 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {breakdown.map(([label, countLabel]) => (
              <li key={label} className="flex items-center justify-between gap-3 border-b border-border py-1.5">
                <span className="text-foreground-secondary">{label}</span>
                <span className="numeral font-bold text-foreground">{countLabel}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* ── Test ────────────────────────────────────────────────── */}
      <section className="adm-card p-5 sm:p-6" aria-labelledby="test-h">
        <h2 id="test-h" className="flex items-center gap-2 text-base font-bold text-foreground"><Bot aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />Try the assistant</h2>
        <p className="mt-1 text-sm text-foreground-muted">Ask exactly what a visitor would. Nothing is saved.</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What is the eligibility for the BCA course?" aria-label="Test question" className="admin-input h-11 min-w-0 flex-1" />
          <button type="submit" disabled={asking || !question.trim()} className="adm-btn-primary min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45">
            <Send aria-hidden="true" className="mr-2 inline h-4 w-4" />{asking ? 'Asking…' : 'Ask'}
          </button>
        </form>
        {answer ? (
          <div className="mt-4 rounded-[var(--admin-radius)] border border-border bg-surface/60 p-4">
            <p className="text-xs font-bold tracking-wide text-foreground-muted uppercase">
              {answer.gated ? 'No verified answer — the visitor would see this' : answer.source === 'kb' ? 'Answered from website content' : 'Reply'}
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{answer.text}</p>
            {answer.reasoning.length > 0 ? (
              <ul className="mt-3 list-disc pl-5 text-xs text-foreground-muted">
                {answer.reasoning.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ── Recent chats ────────────────────────────────────────── */}
      <section className="adm-card overflow-hidden" aria-labelledby="chats-h">
        <h2 id="chats-h" className="flex items-center gap-2 border-b border-border bg-surface/70 px-5 py-3.5 text-sm font-bold text-foreground"><MessageSquare aria-hidden="true" className="h-4 w-4" />Recent saved chats</h2>
        {chats.length === 0 ? (
          <p className="px-5 py-6 text-sm text-foreground-muted">No saved chats yet. Chats are saved only for visitors who sign in.</p>
        ) : (
          <ul className="divide-y divide-border">
            {chats.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    if (open === c.id) {
                      setOpen(null);
                      return;
                    }
                    setOpen(c.id);
                    setTranscript(null);
                    getChatTranscript(c.id).then(setTranscript).catch(() => setTranscript([]));
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{c.title}</span>
                    <span className="block text-xs text-foreground-muted">
                      {c.who} · {c.messages} messages · {new Date(c.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent-ink)]">{open === c.id ? 'Hide' : 'Read'}</span>
                </button>
                {open === c.id ? (
                  <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-auto rounded-[var(--admin-radius)] bg-surface/60 p-3 text-sm">
                    {transcript === null ? <p className="text-foreground-muted">Loading…</p> : transcript.length === 0 ? <p className="text-foreground-muted">Only admins can read chat transcripts.</p> : null}
                    {(transcript ?? []).map((m, i) => (
                      <p key={i} className={m.role === 'user' ? 'font-semibold text-foreground' : 'whitespace-pre-wrap text-foreground-secondary'}>
                        <span className="mr-2 text-[11px] font-bold tracking-wide text-foreground-muted uppercase">{m.role === 'user' ? 'Visitor' : 'Assistant'}</span>
                        {m.text}
                      </p>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdminConfirmDialog
        open={confirm}
        onOpenChange={(o) => !pending && setConfirm(o)}
        title="Rebuild the assistant’s knowledge?"
        description="It re-reads all published website content and re-indexes it. This takes about a minute and the assistant keeps answering from the current knowledge until it finishes."
        confirmLabel="Rebuild"
        pendingLabel="Starting…"
        tone="default"
        pending={pending}
        onConfirm={() => {
          setConfirm(false);
          rebuild();
        }}
      />
    </div>
  );
}
