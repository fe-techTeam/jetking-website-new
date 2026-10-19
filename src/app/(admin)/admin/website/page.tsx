import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight, Code2, Database } from 'lucide-react';
import { requireRole } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { COLLECTIONS, SITE_PAGES, collectionByKey } from '../registry';

export const metadata = { title: 'Website map | Jetking Admin' };

export default async function WebsiteMapPage() {
  await requireRole(['admin', 'editor']);

  const fullyCode = SITE_PAGES.filter((p) => p.cms.length === 0).length;
  const mixed = SITE_PAGES.filter((p) => p.cms.length > 0 && p.code).length;
  const fullyCms = SITE_PAGES.length - fullyCode - mixed;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Website map"
        title="What you can edit, page by page"
        description="Every public page, where its content comes from, and a shortcut to the editor. Anything marked “In code” needs a developer — the admin cannot change it."
      />

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Fully editable', value: fullyCms, tone: 'bg-[#12b76a]' },
          { label: 'Partly in code', value: mixed, tone: 'bg-[#f79009]' },
          { label: 'Entirely in code', value: fullyCode, tone: 'bg-[#98a2b3]' },
        ].map((s) => (
          <div key={s.label} className="adm-card p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.tone}`} />
              {s.label}
            </p>
            <p className="numeral mt-3 text-[1.875rem] leading-none font-extrabold tracking-[-0.03em] text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section aria-labelledby="pages-heading" className="mt-6">
        <h2 id="pages-heading" className="text-base font-bold tracking-tight text-foreground">
          Pages
        </h2>
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {SITE_PAGES.map((page) => (
            <li key={page.path} className="adm-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold tracking-tight text-foreground">{page.name}</p>
                  <p className="numeral mt-0.5 truncate text-xs text-foreground-muted">{page.path}</p>
                </div>
                {page.href ? (
                  <a
                    href={page.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${page.name} on the website`}
                    className="tap grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-foreground-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                  >
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : null}
              </div>

              {page.cms.length > 0 ? (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-foreground-muted uppercase">
                    <Database aria-hidden="true" className="h-3.5 w-3.5" />
                    Edit in admin
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {page.cms.map((key) => {
                      const meta = collectionByKey(key);
                      return (
                        <li key={key}>
                          <Link
                            href={`/admin/${meta.route}` as Route}
                            className="inline-flex min-h-11 items-center rounded-full border border-border-medium sm:min-h-9 bg-background px-3.5 text-[13px] font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                          >
                            {meta.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {page.code ? (
                <div className="mt-4 flex gap-2.5 rounded-[12px] bg-surface p-3 text-[13px] leading-snug text-foreground-secondary ring-1 ring-border">
                  <Code2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                  <p>
                    <span className="font-bold text-foreground">In code: </span>
                    {page.code}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="collections-heading" className="mt-8">
        <h2 id="collections-heading" className="text-base font-bold tracking-tight text-foreground">
          Collections that do not reach the website
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          These are editable, but saving them does not change a public page today.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {COLLECTIONS.filter((c) => !c.live).map((c) => (
            <li key={c.key} className="adm-card p-4 sm:p-5">
              <Link
                href={`/admin/${c.route}` as Route}
                className="text-[15px] font-bold tracking-tight text-foreground hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              >
                {c.label}
              </Link>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary">{c.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
