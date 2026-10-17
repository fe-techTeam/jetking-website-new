import { requireRole } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { listCollection } from '@/lib/cms/store';
import { COPY_PAGES } from '@/lib/content/copy/registry';
import { UNLISTED_PAGE_IDS } from '../registry';
import { SeoTable, type SeoRow } from './SeoTable';

export const metadata = { title: 'SEO overview | Jetking Admin' };

export default async function SeoOverviewPage() {
  await requireRole(['admin', 'editor']);

  const overrides = (await listCollection('page_copy')) as unknown as Array<{ id: string; entries: Record<string, string>; status: string }>;
  const rows: SeoRow[] = [];

  for (const page of COPY_PAGES.filter((p) => p.path && 'seo.title' in p.defaults && !UNLISTED_PAGE_IDS.includes(p.id))) {
    const o = overrides.find((r) => r.id === page.id && r.status === 'published')?.entries ?? {};
    const pick = (k: string) => (o[k]?.trim() ? o[k]! : (page.defaults[k] ?? ''));
    rows.push({
      kind: 'page',
      collection: 'page_copy',
      id: page.id,
      label: page.label,
      path: page.path!,
      title: pick('seo.title'),
      description: pick('seo.description'),
      canonicalPath: '',
      ogImage: pick('seo.ogImage'),
      noindex: pick('seo.noindex') === 'true',
    });
  }

  const sets = [
    ['courses', (s: string) => `/courses/${s}`],
    ['centres', (s: string) => `/centres/${s}`],
    ['cities', (s: string) => `/centres/${s}`],
    ['posts', (s: string) => `/blog/${s}`],
  ] as const;
  for (const [collection, path] of sets) {
    const list = (await listCollection(collection)) as unknown as Array<{ slug: string; title?: string; name?: string; status: string; seo: { title: string; description: string; canonicalPath?: string; ogImage?: string; noindex?: boolean } }>;
    for (const r of list) {
      rows.push({
        kind: 'record',
        collection,
        id: r.slug,
        label: r.title ?? r.name ?? r.slug,
        path: path(r.slug),
        title: r.seo?.title ?? '',
        description: r.seo?.description ?? '',
        canonicalPath: r.seo?.canonicalPath ?? '',
        ogImage: r.seo?.ogImage ?? '',
        noindex: Boolean(r.seo?.noindex),
        draft: r.status === 'draft',
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="SEO"
        title="SEO overview"
        description="Every page and record that search engines see: its title, description, share image and indexing. Fix problems in place. Site-wide settings (robots.txt, sitemap, verification) are under SEO settings."
      />
      <SeoTable rows={rows} />
    </div>
  );
}
