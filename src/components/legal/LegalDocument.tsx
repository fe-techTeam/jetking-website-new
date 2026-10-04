import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { LEGAL_LINKS, type LegalBlock, type LegalDoc } from '@/lib/legal';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** `**bold**`, `[text](url)` and bare URLs — the only inline markup the copied text uses. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i} className="font-bold text-[var(--dc-ink)]">{bold[1]}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        const href = link ? link[2] : /^https?:\/\//.test(part) ? part : null;
        if (href) {
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold break-words text-[var(--dc-accent-soft)] underline-offset-2 hover:underline"
            >
              {link ? link[1] : part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

function Block({ block, id }: { block: LegalBlock; id?: string }) {
  switch (block.t) {
    case 'h2':
      return (
        <h2
          id={id}
          className="subsection-title mt-10 scroll-mt-28 font-display leading-snug text-[var(--dc-ink)] first:mt-0"
        >
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-7 font-display text-[17px] leading-snug font-bold text-[var(--dc-ink)] sm:text-[18px]">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p className="mt-4 text-[15px] leading-[1.75] text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
          <Inline text={block.text} />
        </p>
      );
    case 'ul':
      return (
        <ul className="mt-4 space-y-2.5 text-[15px] leading-[1.7] text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
          {block.items.map((item, i) => (
            <li key={i} className="relative pl-5">
              <span aria-hidden="true" className="absolute top-[0.72em] left-0.5 h-1.5 w-1.5 rounded-full bg-[var(--dc-accent-soft)]" />
              <Inline text={item.text} />
            </li>
          ))}
        </ul>
      );
    case 'ol':
      // The source's own numbering ("a.", "3.") is kept as text, so cross-references
      // such as "clause 3.1(b)" still read the way the document says.
      return (
        <ol role="list" className="mt-4 space-y-2.5 text-[15px] leading-[1.7] text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
          {block.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-1">
              <span aria-hidden="true" className="font-semibold text-[var(--dc-ink-muted)] tabular-nums">
                {item.m}
              </span>
              <span>
                <Inline text={item.text} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div
          role="region"
          aria-label={block.caption || 'Table'}
          tabIndex={0}
          className="mt-5 overflow-x-auto rounded-[12px] border border-[var(--dc-hairline-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
        >
          <table className="w-full min-w-[28rem] border-collapse text-left text-[14px] text-[var(--dc-ink-secondary)]">
            {block.caption ? (
              <caption className="border-b border-[var(--dc-hairline)] bg-[var(--dc-surface)] px-4 py-2.5 text-left text-[12.5px] font-bold tracking-wide text-[var(--dc-ink)] uppercase">
                {block.caption}
              </caption>
            ) : null}
            <thead>
              <tr className="bg-[var(--dc-accent-tint)]">
                {block.head.map((h) => (
                  <th key={h} scope="col" className="border-b border-[var(--dc-hairline-strong)] px-4 py-2.5 font-bold text-[var(--dc-ink)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => {
                const total = row[0] === 'Total';
                return (
                  <tr key={r} className={total ? 'bg-[var(--dc-surface)] font-bold text-[var(--dc-ink)]' : undefined}>
                    {row.map((cell, c) => (
                      <td key={c} className="border-t border-[var(--dc-hairline)] px-4 py-2.5 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    case 'img':
      return (
        // Screenshots of forms and tables drawn on white: keep a white ground in dark mode too.
        <figure className="mt-5 flex justify-center rounded-[12px] border border-[var(--dc-hairline-strong)] bg-white p-2 sm:p-3">
          <Image
            src={block.src}
            alt={block.alt}
            width={block.w}
            height={block.h}
            sizes="(min-width: 900px) 800px, 100vw"
            className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
          />
        </figure>
      );
  }
}

/**
 * Long-form legal text in the dark-canvas language of /faq and /investors.
 * Server component: the whole document is in the HTML.
 */
export function LegalDocument({
  doc,
  trail,
  intro,
  path,
}: {
  doc: LegalDoc;
  trail: Crumb[];
  intro: string;
  path: string;
}) {
  const seen = new Map<string, number>();
  const idFor = (text: string) => {
    const base = slugify(text) || 'section';
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
  const ids = doc.blocks.map((b) => (b.t === 'h2' ? idFor(b.text) : undefined));
  const others = LEGAL_LINKS.filter((l) => l.href !== path);

  return (
    <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
      <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
        <Breadcrumbs trail={trail} />
        <div className="mt-6 sm:mt-8">
          <p className="k-hero-eyebrow">Legal</p>
          <h1 className="page-title mt-3 font-display text-balance text-[var(--dc-ink)]">
            {doc.title}
          </h1>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.7] text-[var(--dc-ink-secondary)] sm:text-[16px]">{intro}</p>
        </div>
      </section>

      <div className="shell relative mt-8 space-y-6 sm:mt-10">
        <article className="dc-panel rounded-[24px] px-5 py-8 xs:rounded-[28px] sm:px-10 sm:py-11">
          {doc.blocks.map((block, i) => (
            <Block key={i} block={block} id={ids[i]} />
          ))}
        </article>

        <nav aria-label="Other legal pages" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
          <span className="dc-eyebrow label-mono">Also read</span>
          {others.map((l) => (
            <Link key={l.href} href={l.href as Route} className="tap font-semibold text-[var(--dc-accent-soft)] hover:underline">
              {l.label}
            </Link>
          ))}
          <Link href={'/enquiry' as Route} className="tap font-semibold text-[var(--dc-ink-secondary)] hover:underline sm:ml-auto">
            Questions? Talk to a counsellor
          </Link>
        </nav>
      </div>
    </div>
  );
}
