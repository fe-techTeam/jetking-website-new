'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { listUnanswered, resolveUnanswered, type UnansweredGroup } from '../chatbot/actions';

export function QuestionsList({ initial }: { initial: UnansweredGroup[] }) {
  const [items, setItems] = useState(initial);
  const [showResolved, setShowResolved] = useState(false);
  const [query, setQuery] = useState('');
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.question.toLowerCase().includes(q)) : items;

  function reload(resolved: boolean) {
    setShowResolved(resolved);
    start(async () => setItems(await listUnanswered(resolved)));
  }

  function dismiss(question: string, resolved: boolean) {
    start(async () => {
      await resolveUnanswered(question, resolved);
      setItems(await listUnanswered(showResolved));
    });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions…" aria-label="Search questions" className="admin-input h-11 w-full text-sm sm:max-w-sm" />
        <label className="flex items-center gap-2 text-sm text-foreground-secondary">
          <input type="checkbox" checked={showResolved} onChange={(e) => reload(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Include dismissed
        </label>
        <span className="text-xs text-foreground-muted">{shown.length} question{shown.length === 1 ? '' : 's'}</span>
      </div>

      <ul className="adm-card mt-4 divide-y divide-border overflow-hidden">
        {shown.length === 0 ? <li className="px-5 py-10 text-center text-sm text-foreground-muted">{items.length === 0 ? 'Nothing unanswered — the assistant has been able to answer every question so far.' : 'No question matches.'}</li> : null}
        {shown.map((g) => (
          <li key={g.question} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-foreground">{g.question}</p>
              <p className="text-xs text-foreground-muted">
                Asked {g.count} time{g.count === 1 ? '' : 's'} · last {new Date(g.lastAsked).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} ·{' '}
                {g.reason === 'no-centre-match' ? 'no centre found' : 'no close match on the site'}
                {g.avgScore !== null ? ` (best match ${Math.round(g.avgScore * 100)}%)` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/admin/chatbot-knowledge?question=${encodeURIComponent(g.question)}` as Route}
                className="inline-flex min-h-10 items-center rounded-[var(--admin-radius)] border border-border px-3.5 text-xs font-bold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
              >
                Write answer
              </Link>
              <button type="button" disabled={pending} onClick={() => dismiss(g.question, !showResolved)} className="min-h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 text-xs font-semibold text-foreground-muted hover:text-foreground disabled:opacity-45">
                {showResolved ? 'Reopen' : 'Dismiss'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
