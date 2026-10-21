import { requireAccess } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { listCollection } from '@/lib/cms/store';
import { COPY_PAGES } from '@/lib/content/copy/registry';
import { UNLISTED_PAGE_IDS } from '../registry';
import { SeoTable, type SeoRow } from './SeoTable';

export const metadata = { title: 'SEO overview | Jetking Admin' };

const LEGAL_DOCS: Array<{ prefix: string; label: string; path: string }> = [
  { prefix: 'privacy.seo', label: 'Privacy Policy', path: '/privacy-policy' },
  { prefix: 'terms.seo', label: 'Terms & Conditions', path: '/terms-conditions' },
  { prefix: 'enrollment.seo', label: 'Enrollment Terms', path: '/enrollment-terms-and-conditions' },
];

export default async function SeoOverviewPage() {
  await requireAccess('seo', 'view');

  const overrides = (await listCollection('page_copy')) as unknown as Array<{
    id: string;
    entries: Record<string, string>;
    status: string;
  }>;
  const rows: SeoRow[] = [];

  for (const page of COPY_PAGES.filter(
    (p) => p.path && 'seo.title' in p.defaults && !UNLISTED_PAGE_IDS.includes(p.id),
  )) {
    const o = overrides.find((r) => r.id === page.id && r.status === 'published')?.entries ?? {};
    const pick = (k: string) => (o[k]?.trim() ? o[k]! : (page.defaults[k] ?? ''));
    rows.push({
      kind: 'page',
      collection: 'page_copy',
      id: page.id,
      label: page.label,
      path: page.path!,
      fieldPrefix: 'seo',
      title: pick('seo.title'),
      description: pick('seo.description'),
      canonicalPath: pick('seo.canonicalPath'),
      ogImage: pick('seo.ogImage'),
      noindex: pick('seo.noindex') === 'true',
    });
  }

  // Legal is one page_copy document with three SEO namespaces — list each live URL.
  const legal = COPY_PAGES.find((p) => p.id === 'legal');
  if (legal) {
    const o = overrides.find((r) => r.id === 'legal' && r.status === 'published')?.entries ?? {};
    const pick = (k: string) => (o[k]?.trim() ? o[k]! : (legal.defaults[k] ?? ''));
    for (const doc of LEGAL_DOCS) {
      rows.push({
        kind: 'page',
        collection: 'page_copy',
        id: 'legal',
        label: doc.label,
        path: doc.path,
        fieldPrefix: doc.prefix,
        title: pick(`${doc.prefix}.title`),
        description: pick(`${doc.prefix}.description`),
        canonicalPath: pick(`${doc.prefix}.canonicalPath`),
        ogImage: pick(`${doc.prefix}.ogImage`),
        noindex: pick(`${doc.prefix}.noindex`) === 'true',
      });
    }
  }

  const sets = [
    ['courses', (s: string) => `/courses/${s}`, undefined],
    ['centres', (s: string) => `/centres/${s}`, undefined],
    [
      'cities',
      (s: string) => `/centres/${s}`,
      'City URLs redirect to the centres directory filter — this SEO is unused until city landings exist.',
    ],
    ['posts', (s: string) => `/blog/${s}`, undefined],
  ] as const;

  for (const [collection, path, note] of sets) {
    const list = (await listCollection(collection)) as unknown as Array<{
      slug: string;
      title?: string;
      name?: string;
      status: string;
      hasDetailPage?: boolean;
      seo: {
        title: string;
        description: string;
        canonicalPath?: string;
        ogImage?: string;
        noindex?: boolean;
      };
    }>;
    for (const r of list) {
      // Catalogue-only courses have no /courses/[slug] page to index.
      if (collection === 'courses' && r.hasDetailPage === false) continue;
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
        note,
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="SEO"
        title="SEO overview"
        description="Every page and record that search engines see: its title, description, share image, canonical and indexing. Fix problems in place. Site-wide settings (robots.txt, sitemap, verification) are under SEO settings."
      />
      <SeoTable rows={rows} />
    </div>
  );
}
