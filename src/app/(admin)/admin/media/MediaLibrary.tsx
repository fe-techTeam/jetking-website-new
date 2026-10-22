'use client';

import { Check, Copy, FileText, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { MediaItem } from '@/lib/media/store';
import { getMediaUsage, getSiteImages, removeMedia, setMediaAlt, uploadMedia, type SiteImage } from './actions';
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
  uploadsEnabled = true,
}: {
  initial: MediaItem[];
  onPick?: (item: MediaItem) => void;
  /** False when there is no database: only the website's own images are available. */
  uploadsEnabled?: boolean;
}) {
  const [tab, setTab] = useState<'uploads' | 'site'>(uploadsEnabled ? 'uploads' : 'site');
  const [site, setSite] = useState<SiteImage[] | null>(null);
  const [folder, setFolder] = useState('all');
  const [sitePage, setSitePage] = useState(1);
  useEffect(() => {
    if (tab === 'site' && site === null) getSiteImages().then(setSite).catch(() => setSite([]));
  }, [tab, site]);
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  /** Places still using the file being deleted; null while we look it up. */
  const [usedIn, setUsedIn] = useState<string[] | null>(null);
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

  const folderOf = (path: string) => path.split('/')[1] ?? '';
  const folders = [...new Set((site ?? []).map((i) => folderOf(i.path)))].sort();
  const siteShown = (site ?? []).filter(
    (i) => (folder === 'all' || folderOf(i.path) === folder) && (!q || i.path.toLowerCase().includes(q)),
  );
  const SITE_PAGE = 60;
  const siteVisible = siteShown.slice(0, sitePage * SITE_PAGE);

  const tabs = (
    <div role="tablist" aria-label="Image source" className="mb-5 flex gap-1 border-b border-border">
      {([
        ['uploads', 'Your uploads', uploadsEnabled],
        ['site', 'Website images', true],
      ] as const)
        .filter(([, , enabled]) => enabled)
        .map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 cursor-pointer border-b-2 px-4 text-sm font-bold ${tab === key ? 'border-[var(--accent)] text-[var(--accent-ink)]' : 'border-transparent text-foreground-muted hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
    </div>
  );

  if (tab === 'site') {
    return (
      <div>
        {tabs}
        <p className="mb-4 text-sm text-foreground-muted">
          Images that already ship with the website. {onPick ? 'Pick one to use it here.' : 'To change one, upload a new image and pick it in the field that shows the old one.'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSitePage(1);
            }}
            placeholder="Search images…"
            aria-label="Search website images"
            className="admin-input h-10 max-w-xs text-sm"
          />
          <select
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
              setSitePage(1);
            }}
            aria-label="Folder"
            className="admin-input h-10 !w-auto text-sm"
          >
            <option value="all">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground-muted">{site === null ? 'Loading…' : `${siteShown.length} images`}</span>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {siteVisible.map((i) => {
            const name = i.path.split('/').pop() ?? i.path;
            const item: MediaItem = { id: i.path, filename: name, mime: 'image/*', size: i.size, alt: '', url: i.path, uploadedBy: null, createdAt: '' };
            return (
              <li key={i.path} className="adm-card overflow-hidden">
                <button
                  type="button"
                  disabled={!onPick}
                  onClick={() => onPick?.(item)}
                  aria-label={onPick ? `Use ${i.path}` : i.path}
                  className={`block aspect-[4/3] w-full bg-surface ${onPick ? 'cursor-pointer hover:opacity-85' : 'cursor-default'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a site asset */}
                  <img src={i.path} alt="" loading="lazy" className="h-full w-full object-contain" />
                </button>
                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-foreground" title={i.path}>{name}</p>
                  <p className="truncate text-[11px] text-foreground-muted" title={i.path}>{folderOf(i.path)} · {kb(i.size)}</p>
                  {!onPick ? (
                    <button type="button" onClick={() => copy(item)} className="mt-2 cursor-pointer text-xs font-semibold text-[var(--accent-ink)] hover:underline">
                      {copied === item.id ? <Check aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />}{copied === item.id ? 'Copied' : 'Copy path'}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {site !== null && siteShown.length === 0 ? <p className="mt-8 text-center text-sm text-foreground-muted">No images match.</p> : null}
        {siteVisible.length < siteShown.length ? (
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setSitePage((n) => n + 1)} className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-5 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)]">
              Show more ({siteShown.length - siteVisible.length} left)
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {tabs}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          aria-label="Search media"
          className="admin-input h-10 max-w-xs text-sm"
        />
        <label className="adm-btn-primary inline-flex min-h-10 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm font-bold">
          <Upload aria-hidden="true" className="mr-2 h-4 w-4" />{pending ? 'Uploading…' : 'Upload files'}
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
                  <span className="grid h-full place-items-center text-sm font-bold text-foreground-muted"><FileText aria-hidden="true" className="h-8 w-8" /><span className="sr-only">PDF</span></span>
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
                        {copied === m.id ? <Check aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />}{copied === m.id ? 'Copied' : 'Copy URL'}
                      </button>
                      <button type="button" onClick={() => {
                          setToDelete(m);
                          setUsedIn(null);
                          void getMediaUsage(m.id).then(setUsedIn);
                        }} className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-[#b42318]">
                        <Trash2 aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />Delete
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
        confirmDisabled={usedIn === null || usedIn.length > 0}
        description={
          usedIn === null ? (
            'Checking where this file is used…'
          ) : usedIn.length > 0 ? (
            <>
              <span className="font-semibold text-foreground">{toDelete?.filename}</span> is still used in:
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {usedIn.slice(0, 8).map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              {usedIn.length > 8 ? <span className="mt-1 block">…and {usedIn.length - 8} more.</span> : null}
              <span className="mt-2 block">Change the image in those places first, then delete it.</span>
            </>
          ) : (
            <>
              Delete <span className="font-semibold text-foreground">{toDelete?.filename}</span>? Nothing on the website uses it. This
              can’t be undone.
            </>
          )
        }
        onConfirm={() => {
          const target = toDelete;
          if (!target) return;
          start(async () => {
            const result = await removeMedia(target.id);
            if (result.ok) setItems((prev) => prev.filter((x) => x.id !== target.id));
            else setUsedIn(result.usedIn);
            if (result.ok) setToDelete(null);
          });
        }}
      />
    </div>
  );
}
