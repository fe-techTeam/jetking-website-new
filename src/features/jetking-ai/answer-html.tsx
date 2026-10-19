'use client';

import type { ReactNode } from 'react';

import type { ContentBlock } from './answer-schema';
import { structureAnswerText } from './structure-answer';

/**
 * Frontend-owned styling per callout variant — the model only ever picks the
 * variant name. Reuses the site's existing status triad (globals.css's
 * "Support (status only)" tokens) rather than inventing new colors: trust
 * (blue) for info, signal (amber) for warning. "tip" stays neutral, matching
 * the softer aside style the legacy free-text pipeline already used.
 */
const CALLOUT_VARIANT_CLASSES: Record<'info' | 'tip' | 'warning', string> = {
  info: 'border-trust-600/25 bg-trust-50 text-trust-600',
  tip: 'border-line bg-surface-sunken text-ink-subtle border-dashed',
  warning: 'border-signal-600/25 bg-signal-50 text-signal-600',
};

type AnswerBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ol'; items: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'facts'; items: { label: string; value: string }[] }
  | { kind: 'note'; text: string };

/** Only ever render a link whose scheme we generated ourselves — never an arbitrary/LLM-authored URI. */
function isSafeHref(href: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(href).protocol);
  } catch {
    return false;
  }
}

/** Inline **bold**, *italic*, `code`, and [text](url) links → React nodes. */
function richInline(text: string): ReactNode[] {
  const parts = text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g)
    .filter(Boolean);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {bold[1]}
        </strong>
      );
    }
    const italic = part.match(/^\*([^*]+)\*$/);
    if (italic) {
      return (
        <em key={i} className="italic">
          {italic[1]}
        </em>
      );
    }
    const code = part.match(/^`([^`]+)`$/);
    if (code) {
      return (
        <code
          key={i}
          className="bg-surface-sunken rounded px-1 py-0.5 text-[12.5px] font-medium"
        >
          {code[1]}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link && isSafeHref(link[2]!)) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-text font-medium hover:underline"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Parse structured markdown into semantic HTML blocks.
 */
export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  let listKind: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];
  let factItems: { label: string; value: string }[] = [];

  const flushList = () => {
    if (listKind && listItems.length) {
      blocks.push({ kind: listKind, items: [...listItems] });
    }
    listKind = null;
    listItems = [];
  };

  const flushFacts = () => {
    if (factItems.length) {
      blocks.push({ kind: 'facts', items: [...factItems] });
      factItems = [];
    }
  };

  const flushAll = () => {
    flushList();
    flushFacts();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }

    const note = line.match(/^_(.+)_$/) || line.match(/^\*(.+)\*$/);
    if (note && !line.startsWith('**')) {
      flushAll();
      blocks.push({ kind: 'note', text: note[1]!.trim() });
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushAll();
      blocks.push({ kind: 'h2', text: h2[1]!.trim() });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushAll();
      blocks.push({ kind: 'h3', text: h3[1]!.trim() });
      continue;
    }
    // Treat single # as section heading too
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      flushAll();
      blocks.push({ kind: 'h2', text: h1[1]!.trim() });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      const item = bullet[1]!.trim();
      const factBullet =
        item.match(/^\*\*(.+?)\*\*:\s*(.+)$/) || item.match(/^([^:]{2,40}):\s+(.+)$/);
      if (factBullet && listKind !== 'ol') {
        // Keep accumulating fact rows; only close an open bullet list first.
        if (listKind === 'ul' && listItems.length) flushList();
        factItems.push({
          label: factBullet[1]!.replace(/\*\*/g, '').trim(),
          value: factBullet[2]!.trim(),
        });
        continue;
      }
      flushFacts();
      if (listKind && listKind !== 'ul') flushList();
      listKind = 'ul';
      listItems.push(item);
      continue;
    }

    const numbered = line.match(/^\d{1,2}[.)]\s+(.+)$/);
    if (numbered) {
      flushFacts();
      if (listKind && listKind !== 'ol') flushList();
      listKind = 'ol';
      listItems.push(numbered[1]!.trim());
      continue;
    }

    const fact =
      line.match(/^\*\*(.+?)\*\*:\s*(.+)$/) ||
      line.match(/^([A-Z][A-Za-z /&]{1,28}):\s+(.+)$/);
    if (fact && fact[2]!.length < 160) {
      flushList();
      factItems.push({
        label: fact[1]!.replace(/\*\*/g, '').trim(),
        value: fact[2]!.trim(),
      });
      continue;
    }

    flushAll();

    const marked = line.replace(/(?:^|\s+)(\d{1,2})[.)]\s+/g, '␟');
    if ((marked.match(/␟/g) || []).length >= 2) {
      const segs = marked.split('␟').map((s) => s.trim());
      const lead = segs.shift()?.replace(/[:\-–—]\s*$/, '').trim();
      if (lead) blocks.push({ kind: 'p', text: lead });
      blocks.push({ kind: 'ol', items: segs.filter(Boolean) });
      continue;
    }

    if ((line.match(/\s·\s/g) || []).length >= 2) {
      blocks.push({
        kind: 'ul',
        items: line
          .split(/\s·\s/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
      continue;
    }

    blocks.push({ kind: 'p', text: line });
  }

  flushAll();
  return blocks;
}

/**
 * Renders one model-authored ContentBlock (see answer-schema.ts). This is the
 * "UI layer" half of the architecture: the block only ever names *what* it
 * is — heading/list/callout/etc — never a color, size, or margin. Every
 * visual decision (which text size an h2 gets, what a "warning" callout
 * looks like) lives here, not in the prompt.
 */
function renderContentBlock(b: ContentBlock, i: number) {
  switch (b.type) {
    case 'heading':
      return b.level === 2 ? (
        <header key={i} className="border-line border-b pb-2">
          <h3 className="font-display text-ink text-[16px] leading-snug font-bold tracking-tight">
            {richInline(b.text)}
          </h3>
        </header>
      ) : (
        <h4
          key={i}
          className="text-ink-subtle mt-1 text-[12px] font-bold tracking-[0.08em] uppercase"
        >
          {richInline(b.text)}
        </h4>
      );
    case 'facts':
      return (
        <dl key={i} className="border-line divide-line overflow-hidden rounded-xl border divide-y">
          {b.items.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="bg-surface-sunken/60 flex flex-col gap-0.5 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <dt className="text-ink shrink-0 text-[13px] font-semibold">{item.label}</dt>
              <dd className="text-ink-muted text-[13px] sm:text-right">{richInline(item.value)}</dd>
            </div>
          ))}
        </dl>
      );
    case 'callout':
      return (
        <aside
          key={i}
          className={`rounded-lg border px-3 py-2 text-[12.5px] leading-relaxed ${CALLOUT_VARIANT_CLASSES[b.variant]}`}
        >
          {richInline(b.text)}
        </aside>
      );
    case 'numbered_list':
      return (
        <ol
          key={i}
          className="text-ink marker:text-brand-text flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-relaxed marker:font-semibold"
        >
          {b.items.map((it, j) => (
            <li key={j} className="pl-1">
              {richInline(it)}
            </li>
          ))}
        </ol>
      );
    case 'bullet_list':
      return (
        <ul
          key={i}
          className="text-ink marker:text-brand-text flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-relaxed"
        >
          {b.items.map((it, j) => (
            <li key={j} className="pl-1">
              {richInline(it)}
            </li>
          ))}
        </ul>
      );
    case 'paragraph':
      return (
        <p key={i} className="text-ink-muted text-[14px] leading-relaxed">
          {richInline(b.text)}
        </p>
      );
  }
}

/**
 * Renders an answer. Prefers `blocks` — the model's own structured JSON,
 * validated server-side (see answer-schema.ts) — and only falls back to
 * regex-guessing block boundaries out of free text for paths that never went
 * through the LLM's structured contract (deterministic KB passages, centre
 * listings, small talk).
 */
export function AnswerBody({
  text,
  title,
  blocks,
}: {
  text: string;
  title?: string;
  blocks?: ContentBlock[];
}) {
  if (blocks?.length) {
    return (
      <article className="jk-answer flex flex-col gap-3.5" aria-label="Answer">
        {blocks.map((b, i) => renderContentBlock(b, i))}
      </article>
    );
  }

  const structured = structureAnswerText(text, title);
  const legacyBlocks = parseAnswer(structured);

  return (
    <article className="jk-answer flex flex-col gap-3.5" aria-label="Answer">
      {legacyBlocks.map((b, i) => {
        if (b.kind === 'h2') {
          return (
            <header key={i} className="border-line border-b pb-2">
              <h3 className="font-display text-ink text-[16px] leading-snug font-bold tracking-tight">
                {richInline(b.text)}
              </h3>
            </header>
          );
        }
        if (b.kind === 'h3') {
          return (
            <h4
              key={i}
              className="text-ink-subtle mt-1 text-[12px] font-bold tracking-[0.08em] uppercase"
            >
              {richInline(b.text)}
            </h4>
          );
        }
        if (b.kind === 'facts') {
          return (
            <dl
              key={i}
              className="border-line divide-line overflow-hidden rounded-xl border divide-y"
            >
              {b.items.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="bg-surface-sunken/60 flex flex-col gap-0.5 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt className="text-ink shrink-0 text-[13px] font-semibold">
                    {item.label}
                  </dt>
                  <dd className="text-ink-muted text-[13px] sm:text-right">
                    {richInline(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          );
        }
        if (b.kind === 'note') {
          return (
            <aside
              key={i}
              className="border-line bg-surface-sunken text-ink-subtle rounded-lg border border-dashed px-3 py-2 text-[12.5px] leading-relaxed"
            >
              {richInline(b.text)}
            </aside>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol
              key={i}
              className="text-ink marker:text-brand-text flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-relaxed marker:font-semibold"
            >
              {b.items.map((it, j) => (
                <li key={j} className="pl-1">
                  {richInline(it)}
                </li>
              ))}
            </ol>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul
              key={i}
              className="text-ink marker:text-brand-text flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-relaxed"
            >
              {b.items.map((it, j) => (
                <li key={j} className="pl-1">
                  {richInline(it)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-ink-muted text-[14px] leading-relaxed">
            {richInline(b.text)}
          </p>
        );
      })}
    </article>
  );
}
