import Link from 'next/link';
import type { Route } from 'next';
import { requireAccess } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { COLLECTIONS } from '../registry';
import { listCollection } from '@/lib/cms/store';

export const metadata = { title: 'Search | Jetking Admin' };

const TITLE_KEYS = ['title', 'name', 'question', 'message', 'headline', 'label', 'id', 'slug'];

function titleOf(record: Record<string, unknown>): string {
  for (const key of TITLE_KEYS) {
    const v = record[key];
    if (typeof v === 'string' && v.trim()) return v.length > 90 ? `${v.slice(0, 90)}…` : v;
  }
  return '(untitled)';
}

/** Content search across every collection the signed-in role may open. */
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireAccess('content', 'view');
  const { q = '' } = await searchParams;
  const query = q.trim().toLowerCase();

  const groups = query.length < 2
    ? []
    : (
        await Promise.all(
          COLLECTIONS.filter((c) => !c.roles || (c.roles as readonly string[]).includes(user.role)).map(async (c) => {
            const rows = (await listCollection(c.key)) as unknown as Record<string, unknown>[];
            const hits = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(query));
            return { collection: c, hits };
          }),
        )
      ).filter((g) => g.hits.length > 0);

  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Search"
        title={query ? `Results for “${q.trim()}”` : 'Search the content'}
        description="Looks inside every record — courses, centres, posts, FAQs, page text and more."
      />
      <form action="/admin/search" className="mt-6 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search records…" aria-label="Search" className="admin-input h-11 flex-1" autoFocus />
        <button type="submit" className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-6 text-sm font-bold">
          Search
        </button>
      </form>

      {query && query.length < 2 ? <p className="mt-6 text-sm text-foreground-muted">Type at least 2 characters.</p> : null}
      {query.length >= 2 ? (
        <p className="mt-6 text-sm text-foreground-muted">
          {total} {total === 1 ? 'match' : 'matches'} in {groups.length} {groups.length === 1 ? 'collection' : 'collections'}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">
        {groups.map(({ collection, hits }) => (
          <section key={collection.key} className="adm-card overflow-hidden">
            <h2 className="border-b border-border bg-surface/70 px-4 py-3 text-sm font-bold text-foreground">
              {collection.label} <span className="font-medium text-foreground-muted">· {hits.length}</span>
            </h2>
            <ul className="divide-y divide-border">
              {hits.slice(0, 8).map((r) => {
                const id = String(r[collection.idKey]);
                return (
                  <li key={id}>
                    <Link
                      href={`/admin/${collection.route}?open=${encodeURIComponent(id)}` as Route}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-surface/70"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground">{titleOf(r)}</span>
                      <span className="shrink-0 text-xs text-foreground-muted">{r.status === 'draft' ? 'Draft' : id}</span>
                    </Link>
                  </li>
                );
              })}
              {hits.length > 8 ? (
                <li className="px-4 py-2 text-xs text-foreground-muted">+ {hits.length - 8} more in {collection.label}</li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
