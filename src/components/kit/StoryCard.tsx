import Image from 'next/image';
import { Quote } from 'lucide-react';

/**
 * A learner story: portrait, name, outcome and a short quote. `outcome` is the factual line
 * ("Cloud Support Engineer at X"); keep claims to what can be sourced.
 */
export function StoryCard({
  name,
  outcome,
  quote,
  photo,
}: {
  name: string;
  outcome: string;
  quote?: string;
  photo?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <figure className="kit kit-card kit-card-lift flex h-full flex-col gap-4 p-5 sm:p-6">
      {quote ? (
        <blockquote className="flex-1 text-[15.5px] leading-relaxed text-[var(--k-ink-2)]">
          <Quote className="mb-2 h-6 w-6 text-[var(--k-red)] opacity-70" aria-hidden="true" />
          {quote}
        </blockquote>
      ) : null}
      <figcaption className="flex items-center gap-3 border-t border-[var(--k-line)] pt-4">
        {photo ? (
          <Image src={photo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--k-red-wash)] text-[15px] font-bold text-[var(--k-red)]"
          >
            {initials}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-[var(--k-ink)]">{name}</span>
          <span className="block text-[13.5px] leading-snug text-[var(--k-ink-3)]">{outcome}</span>
        </span>
      </figcaption>
    </figure>
  );
}
