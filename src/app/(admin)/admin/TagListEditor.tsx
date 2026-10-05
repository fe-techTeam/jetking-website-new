'use client';

import { useState } from 'react';

export function TagListEditor({
  value,
  onChange,
  placeholder = 'Add…',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft('');
  }

  return (
    <div className="rounded-[var(--admin-radius)] border border-border p-2">
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3 text-xs font-medium text-foreground ring-1 ring-border"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${tag}`}
                className="tap grid h-6 w-6 cursor-pointer place-items-center rounded-full text-base leading-none text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="admin-input flex-1 py-0 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border-medium bg-background px-4 text-sm font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
        >
          Add
        </button>
      </div>
    </div>
  );
}
