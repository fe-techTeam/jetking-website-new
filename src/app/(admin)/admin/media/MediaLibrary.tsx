'use client';

import { useRef, useState, useTransition } from 'react';
import type { MediaItem } from '@/lib/media/store';
import { removeMedia, setMediaAlt, uploadMedia } from './actions';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

const isImage = (m: MediaItem) => m.mime.startsWith('image/');
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * The grid shared by the Media page and the picker dialog. `onPick` turns each tile into a
 * "use this file" button (picker); without it the tiles are managed (alt text, copy URL, delete).
 */
export function MediaGrid({
  initial,
  onPick,
}: {
  initial: MediaItem[];
  onPick?: (item: MediaItem) => void;
}) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((m) => m.filename.toLowerCase().includes(q) || m.alt.toLowerCase().includes(q)) : items;

  function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const body = new FormData();
    for (const f of Array.from(files)) body.append('files', f);
    start(async () => {
      const result = await uploadMedia(body);
      setErrors(result.errors);
      if (result.items.length > 0) {
        setItems((prev) => [...result.items, ...prev]);
        if (onPick && result.items.length === 1) onPick(result.items[0]!);
      }
      if (input.current) input.current.value = '';
    });
  }

  function copy(item: MediaItem) {
    void navigator.clipboard?.writeText(item.url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          aria-label="Search media"
          className="admin-input h-10 max-w-xs text-sm"
        />
        <label className="adm-btn-primary inline-flex min-h-10 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm font-bold">
          {pending ? 'Uploading…' : 'Upload files'}
          <input
            ref={input}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf"
            className="sr-only"
            disabled={pending}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
        <span className="text-xs text-foreground-muted">PNG, JPG, WebP, GIF, AVIF or PDF · up to 6 MB each</span>
      </div>
      {errors.length > 0 ? (
        <ul role="alert" className="mt-3 text-sm text-[var(--color-error-600)]">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-8 text-center text-sm text-foreground-muted">
          {items.length === 0 ? 'No files yet — upload your first image.' : 'No files match your search.'}
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id} className="adm-card overflow-hidden">
              <button
                type="button"
                disabled={!onPick}
                onClick={() => onPick?.(m)}
                aria-label={onPick ? `Use ${m.filename}` : m.filename}
                className={`block aspect-[4/3] w-full bg-surface ${onPick ? 'cursor-pointer hover:opacity-85' : 'cursor-default'}`}
              >
                {isImage(m) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary upload
                  <img src={m.url} alt={m.alt} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <span className="grid h-full place-items-center text-sm font-bold text-foreground-muted">PDF</span>
                )}
              </button>
              <div className="p-3">
                <p className="truncate text-xs font-semibold text-foreground" title={m.filename}>
                  {m.filename}
                </p>
                <p className="text-[11px] text-foreground-muted">{kb(m.size)}</p>
                {!onPick ? (
                  <>
                    <input
                      defaultValue={m.alt}
                      placeholder="Alt text"
                      aria-label={`Alt text for ${m.filename}`}
                      onBlur={(e) => {
                        const alt = e.target.value;
                        if (alt !== m.alt) {
                          setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, alt } : x)));
                          void setMediaAlt(m.id, alt);
                        }
                      }}
                      className="admin-input mt-2 h-8 text-xs"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button type="button" onClick={() => copy(m)} className="cursor-pointer text-xs font-semibold text-[var(--accent-ink)] hover:underline">
                        {copied === m.id ? 'Copied' : 'Copy URL'}
                      </button>
                      <button type="button" onClick={() => setToDelete(m)} className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-[#b42318]">
                        Delete
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete file"
        description={
          <>
            Delete <span className="font-semibold text-foreground">{toDelete?.filename}</span>? Any page still pointing at it
            will show a broken image.
          </>
        }
        onConfirm={() => {
          const target = toDelete;
          if (!target) return;
          start(async () => {
            await removeMedia(target.id);
            setItems((prev) => prev.filter((x) => x.id !== target.id));
            setToDelete(null);
          });
        }}
      />
    </div>
  );
}
