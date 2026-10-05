import type { ReactNode } from 'react';

/**
 * The one page heading every admin screen shares: crimson eyebrow, display title, a
 * short description, and an optional actions slot that wraps under the text on phones.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="adm-eyebrow">{eyebrow}</p>
        <h1 className="adm-title mt-3">{title}</h1>
        {description ? <p className="adm-lede mt-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
