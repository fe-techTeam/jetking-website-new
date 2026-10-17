import { content } from '@/lib/content';
import { AnnouncementBar } from './AnnouncementBar';

/**
 * Reads published announcements through the shared `content` source (so the page stays static and is
 * refreshed by publishContent()'s layout revalidation) and hands the still-relevant ones to the client
 * bar. Expired ones are dropped here; the client re-checks the window with the real clock because an
 * ISR page can outlive an announcement's start/end.
 */
const currentTime = () => Date.now();

export async function AnnouncementBarServer() {
  const all = await content.listAnnouncements();
  const now = currentTime();
  const candidates = all.filter((a) => !a.endsAt || !(Date.parse(a.endsAt) <= now));
  if (candidates.length === 0) return null;
  return <AnnouncementBar items={candidates} renderedAt={now} />;
}
