'use server';

import { requireAccess } from '../actions';
import { recordAudit } from '@/lib/audit/log';
import siteImages from '@/content/site-images.json';
import { COLLECTIONS } from '../registry';
import { deleteMedia, findMediaUsage, listMedia, saveMedia, updateMediaAlt, type MediaItem } from '@/lib/media/store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILES_PER_UPLOAD = 20;

export async function uploadMedia(formData: FormData): Promise<{ items: MediaItem[]; errors: string[] }> {
  const user = await requireAccess('media', 'edit');
  const items: MediaItem[] = [];
  const errors: string[] = [];
  const entries = formData.getAll('files');
  if (entries.length > MAX_FILES_PER_UPLOAD) {
    return { items, errors: [`Upload up to ${MAX_FILES_PER_UPLOAD} files at a time.`] };
  }
  for (const entry of entries) {
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
  await requireAccess('media', 'view');
  return listMedia();
}

export async function setMediaAlt(id: string, alt: string): Promise<void> {
  await requireAccess('media', 'edit');
  if (!UUID.test(id)) return;
  await updateMediaAlt(id, alt);
}

/** Where a file is in use, as readable names — empty when nothing points at it. */
export async function getMediaUsage(id: string): Promise<string[]> {
  await requireAccess('media', 'view');
  if (!UUID.test(id)) return [];
  const labels = new Map<string, string>(COLLECTIONS.map((c) => [c.key, c.label]));
  const places = (await findMediaUsage(id)).map(
    (u) => `${labels.get(u.collection) ?? u.collection}: ${u.recordId}`,
  );
  return [...new Set(places)];
}

export async function removeMedia(id: string): Promise<{ ok: true } | { ok: false; usedIn: string[] }> {
  const user = await requireAccess('media', 'edit');
  if (!UUID.test(id)) return { ok: true };
  const usedIn = await getMediaUsage(id);
  if (usedIn.length > 0) return { ok: false, usedIn };
  await deleteMedia(id);
  void recordAudit(user, 'media.delete', 'media', id, 'Deleted a media file');
  return { ok: true };
}

export interface SiteImage {
  path: string;
  size: number;
}

/** The images that ship with the website (public/), listed so editors can reuse them in any image field. */
export async function getSiteImages(): Promise<SiteImage[]> {
  await requireAccess('media', 'view');
  return siteImages as SiteImage[];
}
