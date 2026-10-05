import { getAdminCollection, requireRole } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { COPY_PAGES } from '@/lib/content/copy/registry';
import { PageCopyEditor, type EditablePage } from './PageCopyEditor';

export const metadata = { title: 'Page text | Jetking Admin' };

export default async function AdminPageTextPage() {
  await requireRole(['admin', 'editor']);
  // `getAdminCollection` returns a union over every collection; for 'page_copy' each row is exactly this.
  const records = (await getAdminCollection('page_copy')) as unknown as Array<{ id: string; entries: Record<string, string> }>;

  const pages: EditablePage[] = COPY_PAGES.map((p) => ({
    id: p.id,
    label: p.label,
    path: p.path,
    group: p.group,
    description: p.description,
    defaults: p.defaults,
  }));

  // Only keys a page still declares are shown or kept — a field removed from code can't linger as a stale override.
  const initialOverrides: Record<string, Record<string, string>> = {};
  for (const record of records) {
    const page = COPY_PAGES.find((p) => p.id === record.id);
    if (!page) continue;
    const kept = Object.fromEntries(Object.entries(record.entries).filter(([key]) => key in page.defaults));
    if (Object.keys(kept).length > 0) initialOverrides[record.id] = kept;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Page text"
        title="Edit the words on every page"
        description="Headings, descriptions, button labels, links and search titles for each page. Everything starts as the wording the site ships with; only what you change is saved, and “Reset page” puts it all back."
      />
      <PageCopyEditor pages={pages} initialOverrides={initialOverrides} />
    </div>
  );
}
