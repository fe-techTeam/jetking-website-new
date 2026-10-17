'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import type { MediaItem } from '@/lib/media/store';
import { getMediaLibrary } from './media/actions';
import { MediaGrid } from './media/MediaLibrary';

/** "Choose from library" for any image-path field: opens the library, returns the picked file's URL. */
export function MediaPickerButton({ onPick, label = 'Choose image' }: { onPick: (item: MediaItem) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);

  function show(next: boolean) {
    setOpen(next);
    if (next) getMediaLibrary().then(setItems).catch(() => setItems([]));
  }

  return (
    <Dialog.Root open={open} onOpenChange={show}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3.5 text-xs font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
        >
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#090c15]/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] border border-border bg-card p-6 shadow-[0_28px_70px_-20px_rgb(9_12_21/0.45)] focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-extrabold tracking-[-0.02em] text-foreground">Media library</Dialog.Title>
            <Dialog.Close className="cursor-pointer text-sm font-semibold text-foreground-muted hover:text-foreground">Close</Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Pick an uploaded file or upload a new one.</Dialog.Description>
          {items === null ? (
            <p className="text-sm text-foreground-muted">Loading…</p>
          ) : (
            <MediaGrid
              initial={items}
              onPick={(item) => {
                onPick(item);
                setOpen(false);
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
