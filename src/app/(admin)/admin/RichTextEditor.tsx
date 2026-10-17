'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { MediaPickerButton } from './MediaPicker';

/**
 * The article editor: a WYSIWYG surface (headings, bold/italic/underline/strike, lists, quotes, links,
 * images from the media library, tables, alignment, undo/redo, plus an HTML view for pasting). It
 * produces HTML; the server sanitises it on save and again when the page renders.
 */

function Btn({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-9 min-w-9 cursor-pointer place-items-center rounded-md px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'text-foreground-secondary hover:bg-surface'
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;

function Toolbar({ editor, compact }: { editor: Editor; compact: boolean }) {
  // Re-render the toolbar on every selection/content change so active states stay correct.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      p: e.isActive('paragraph'),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      ul: e.isActive('bulletList'),
      ol: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      table: e.isActive('table'),
      code: e.isActive('code'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function setLink() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (https://… or /page). Leave empty to remove.', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  const c = () => editor.chain().focus();
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface/70 p-1.5" role="toolbar" aria-label="Formatting">
      {compact ? null : (
      <>
      <select
        aria-label="Text style"
        value={s.h2 ? 'h2' : s.h3 ? 'h3' : 'p'}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') c().setParagraph().run();
          else c().setHeading({ level: v === 'h2' ? 2 : 3 }).run();
        }}
        className="admin-input h-9 w-auto py-0 text-sm"
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>
      <Sep />
      </>
      )}
      <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><b>B</b></Btn>
      <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
      <Btn label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}><u>U</u></Btn>
      {compact ? null : <Btn label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()}><s>S</s></Btn>}
      <Sep />
      <Btn label="Bulleted list" active={s.ul} onClick={() => c().toggleBulletList().run()}>• List</Btn>
      <Btn label="Numbered list" active={s.ol} onClick={() => c().toggleOrderedList().run()}>1. List</Btn>
      {compact ? null : <Btn label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>“ ”</Btn>}
      <Sep />
      <Btn label="Link" active={s.link} onClick={setLink}>Link</Btn>
      {compact ? null : (
      <>
      <MediaPickerButton label="Image" onPick={(m) => editor.chain().focus().setImage({ src: m.url, alt: m.alt || '' }).run()} />
      <Btn label="Insert table" active={s.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</Btn>
      {s.table ? (
        <>
          <Btn label="Add row" onClick={() => c().addRowAfter().run()}>+ Row</Btn>
          <Btn label="Add column" onClick={() => c().addColumnAfter().run()}>+ Col</Btn>
          <Btn label="Delete row" onClick={() => c().deleteRow().run()}>− Row</Btn>
          <Btn label="Delete column" onClick={() => c().deleteColumn().run()}>− Col</Btn>
          <Btn label="Delete table" onClick={() => c().deleteTable().run()}>✕ Table</Btn>
        </>
      ) : null}
      <Sep />
      <Btn label="Align left" onClick={() => c().setTextAlign('left').run()}>⇤</Btn>
      <Btn label="Align centre" onClick={() => c().setTextAlign('center').run()}>↔</Btn>
      <Btn label="Divider line" onClick={() => c().setHorizontalRule().run()}>—</Btn>
      </>
      )}
      <Btn label="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}>Tx</Btn>
      <Sep />
      <Btn label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}>↶</Btn>
      <Btn label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}>↷</Btn>
    </div>
  );
}

export function RichTextEditor({
  value,
  fallbackHtml,
  onChange,
  compact = false,
}: {
  /** A shorter surface with only the formatting a paragraph or two needs (bold, italic, lists, links). */
  compact?: boolean;
  /** Saved HTML. Empty means "not edited with this editor yet" — the editor then starts from `fallbackHtml`. */
  value: string;
  fallbackHtml: string;
  onChange: (html: string) => void;
}) {
  const [source, setSource] = useState(false);
  const [sourceText, setSourceText] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: compact ? 'Write here…' : 'Write the article here…' }),
    ],
    content: value || fallbackHtml,
    editorProps: { attributes: { class: compact ? 'rich-editor-surface rich-editor-compact' : 'rich-editor-surface', 'aria-label': compact ? 'Text' : 'Article body' } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Keep the surface in step when a different record or an earlier version is loaded into the form.
  useEffect(() => {
    if (!editor) return;
    const next = value || fallbackHtml;
    if (next !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(next, { emitUpdate: false });
  }, [value, fallbackHtml, editor]);

  if (!editor) return <div className="admin-input h-48 animate-pulse bg-surface" aria-busy="true" />;

  return (
    <div className="overflow-hidden rounded-[var(--admin-radius)] border border-border bg-background">
      {source ? null : <Toolbar editor={editor} compact={compact} />}
      {source ? (
        <textarea
          aria-label="HTML source"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={16}
          spellCheck={false}
          className="block w-full resize-y bg-background p-3 font-mono text-xs outline-none"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
      <div className="flex items-center justify-between border-t border-border bg-surface/70 px-3 py-1.5 text-xs text-foreground-muted">
        <span>{source ? 'Editing the HTML. Scripts and unsafe tags are removed when you save.' : `${editor.getText().trim().split(/\s+/).filter(Boolean).length} words`}</span>
        <button
          type="button"
          onClick={() => {
            if (source) {
              editor.commands.setContent(sourceText, { emitUpdate: true });
              setSource(false);
            } else {
              setSourceText(editor.getHTML());
              setSource(true);
            }
          }}
          className="cursor-pointer font-semibold text-[var(--accent-ink)] hover:underline"
        >
          {source ? 'Back to editor' : 'View HTML'}
        </button>
      </div>
    </div>
  );
}
