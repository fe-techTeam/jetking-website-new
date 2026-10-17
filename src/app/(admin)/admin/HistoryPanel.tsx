'use client';

import { useEffect, useState, useTransition } from 'react';
import type { CmsCollection } from '@/lib/cms/types';
import { getDeletedRecords, getRecordHistory, getRevisionRecord, type HistoryEntry } from './actions';

type Mode = 'history' | 'trash';

const ACTION_LABEL: Record<HistoryEntry['action'], string> = {
  save: 'Saved',
  restore: 'Restored',
  delete: 'Deleted',
};

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Version history (one record) or the trash (deleted records of the collection). Loading a version
 * puts it in the editor as an unsaved draft — nothing changes on the site until the editor saves it,
 * so a restore can itself be reviewed and undone.
 */
export function HistoryPanel({
  collection,
  idKey,
  recordId,
  mode,
  onLoad,
  onClose,
}: {
  collection: CmsCollection;
  idKey: string;
  recordId: string | undefined;
  mode: Mode;
  /** `asNew` — the record was deleted, so saving it recreates it rather than renaming an existing one. */
  onLoad: (record: Record<string, unknown>, asNew: boolean) => void;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<{ key: string; rows: HistoryEntry[] } | null>(null);
  const key = `${mode}:${collection}:${recordId ?? ''}`;
  const entries = loaded?.key === key ? loaded.rows : null;
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const load =
      mode === 'trash'
        ? getDeletedRecords(collection, idKey)
        : recordId
          ? getRecordHistory(collection, recordId)
          : Promise.resolve([] as HistoryEntry[]);
    load
      .then((rows) => !cancelled && setLoaded({ key, rows }))
      .catch(() => !cancelled && setError('Could not load history.'));
    return () => {
      cancelled = true;
    };
  }, [collection, idKey, recordId, mode, key]);

  function pick(entry: HistoryEntry) {
    start(async () => {
      const result = await getRevisionRecord(collection, entry.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLoad(result.record, mode === 'trash');
    });
  }

  return (
    <div className="adm-card mt-4 overflow-hidden" role="region" aria-label={mode === 'trash' ? 'Deleted records' : 'Version history'}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          {mode === 'trash' ? 'Deleted records' : `Version history${recordId ? ` — ${recordId}` : ''}`}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-foreground"
        >
          Close
        </button>
      </div>
      {error ? (
        <p role="alert" className="px-4 py-3 text-sm text-[var(--color-error-600)]">
          {error}
        </p>
      ) : entries === null ? (
        <p className="px-4 py-5 text-sm text-foreground-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="px-4 py-5 text-sm text-foreground-muted">
          {mode === 'trash'
            ? 'Nothing has been deleted.'
            : 'No saved versions yet. History is recorded from the next save (it needs the database).'}
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-border overflow-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-foreground">
                  {mode === 'trash' ? entry.recordId : ACTION_LABEL[entry.action]}
                </p>
                <p className="text-xs text-foreground-muted">
                  {mode === 'trash' ? 'Deleted' : ''} {when(entry.createdAt)} · {entry.actorName}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => pick(entry)}
                className="min-h-9 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 text-xs font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-45"
              >
                {mode === 'trash' ? 'Restore' : 'Load into editor'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
