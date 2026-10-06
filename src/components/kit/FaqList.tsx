import { useId } from 'react';

/**
 * An open FAQ accordion: no outer box, thin rules between questions, a red bar on the open one. Uses native
 * `<details>`, so it works without JavaScript and is keyboard operable. One component, used wherever the
 * site lists questions (home, /faq, centre pages), so they cannot drift apart.
 */
export function FaqList({
  items,
  startAt = 1,
  continued = false,
}: {
  items: ReadonlyArray<{ id: string; question: string; answer: string }>;
  /** Number shown on the first row, for a list that carries on from another one. */
  startAt?: number;
  /** Drops the top rule when this list sits directly under another FaqList. */
  continued?: boolean;
}) {
  // Sharing a `name` makes the browser keep only one of these `<details>` open at a time, with no JavaScript.
  const group = useId();
  return (
    <div className={`kit ${continued ? '' : 'border-t border-[var(--k-line-strong)]'}`}>
      {items.map((faq, i) => (
        <details
          key={faq.id}
          name={group}
          className="group relative border-b border-[var(--k-line-strong)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:scale-y-0 before:bg-[var(--k-red-fill)] before:transition-transform before:duration-200 open:before:scale-y-100"
        >
          <summary className="cursor-pointer list-none py-5 pl-0 text-[17px] leading-snug font-bold text-[var(--k-ink)] marker:content-none transition-[padding,color] duration-200 group-open:pl-5 hover:text-[var(--k-red)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-red)] sm:py-6 sm:text-[18px] [&::-webkit-details-marker]:hidden">
            <span className="flex items-start gap-4">
              <span aria-hidden="true" className="numeral mt-1 hidden w-7 shrink-0 text-[13px] font-bold text-[var(--k-ink-3)] sm:block">
                {String(i + startAt).padStart(2, '0')}
              </span>
              <span className="flex-1">{faq.question}</span>
              <span
                aria-hidden="true"
                className="centres-faq-toggle mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--k-line-strong)] bg-[var(--k-red-wash)] text-[var(--k-red)]"
              >
                <span className="centres-faq-toggle-icon" />
              </span>
            </span>
          </summary>
          <p className="max-w-[68ch] pb-6 pl-5 text-[15.5px] leading-relaxed text-[var(--k-ink-2)] sm:text-[16px] lg:pl-12">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
