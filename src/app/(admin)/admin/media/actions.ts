'use server';

import { requireRole } from '../actions';
import { recordAudit } from '@/lib/audit/log';
import { deleteMedia, listMedia, saveMedia, updateMediaAlt, type MediaItem } from '@/lib/media/store';

const ROLES = ['admin', 'editor'] as const;

export async function uploadMedia(formData: FormData): Promise<{ items: MediaItem[]; errors: string[] }> {
  const user = await requireRole([...ROLES]);
  const items: MediaItem[] = [];
  const errors: string[] = [];
  for (const entry of formData.getAll('files')) {
    if (!(entry instanceof File)) continue;
    const result = await saveMedia({ name: entry.name, bytes: Buffer.from(await entry.arrayBuffer()) }, user.name);
    if (result.ok) {
      items.push(result.item);
      void recordAudit(user, 'media.upload', 'media', result.item.id, `Uploaded ${result.item.filename}`);
    } else errors.push(result.error);
  }
  return { items, errors };
}

export async function getMediaLibrary(): Promise<MediaItem[]> {
  await requireRole([...ROLES]);
  return listMedia();
}

export async function setMediaAlt(id: string, alt: string): Promise<void> {
  await requireRole([...ROLES]);
  await updateMediaAlt(id, alt);
}

export async function removeMedia(id: string): Promise<void> {
  const user = await requireRole([...ROLES]);
  await deleteMedia(id);
  void recordAudit(user, 'media.delete', 'media', id, 'Deleted a media file');
}
