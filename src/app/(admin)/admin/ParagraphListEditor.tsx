'use client';

/**
 * A list of paragraphs — one textarea each — for string-array fields that hold prose (a leader's
 * bio) where `TagListEditor`'s single-line chips would be unusable.
 */
export function ParagraphListEditor({
  value,
  onChange,
  addLabel = '+ Add paragraph',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {value.map((paragraph, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            value={paragraph}
            onChange={(e) => {
              const copy = [...value];
              copy[i] = e.target.value;
              onChange(copy);
            }}
            rows={4}
            aria-label={`Paragraph ${i + 1}`}
            className="admin-input min-w-0 flex-1 resize-y"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label={`Remove paragraph ${i + 1}`}
            className="min-h-11 shrink-0 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ''])}
        className="min-h-11 cursor-pointer self-start rounded-[var(--admin-radius)] border border-dashed border-border-medium bg-background px-4 text-sm font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
      >
        {addLabel}
      </button>
    </div>
  );
}
