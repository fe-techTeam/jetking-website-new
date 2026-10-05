import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { Centre } from '@/lib/content/types';
import { formatPostDate } from '@/components/blog/BlogCards';

type CentreUpdateItem = NonNullable<Centre['updates']>[number] & { placeholder?: boolean };

/**
 * One "What's new" card on a centre page, built like the blog cards on the home page: a cover, a category
 * chip and date, a title and a short summary. It is a link only when the update has somewhere to go.
 */
export function CentreUpdateCard({ update, readLabel }: { update: CentreUpdateItem; readLabel: string }) {
  const body = (
    <>
      <div className="blog-card-media relative aspect-[16/9] overflow-hidden">
        {update.image ? (
          <Image
            src={update.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/post:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,var(--dc-card),var(--dc-surface),var(--dc-card))]"
          >
            <CalendarDays className="h-9 w-9 text-[var(--dc-accent-soft)]" strokeWidth={1.6} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {update.category ? (
            <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
              {update.category}
            </span>
          ) : null}
          {update.date ? (
            <time dateTime={update.date} className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]">
              {formatPostDate(update.date)}
            </time>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-[16.5px] leading-snug font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] transition-colors group-hover/post:text-[var(--dc-accent-soft)]">
          {update.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">{update.summary}</p>

        {update.link ? (
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="text-[13.5px] font-bold text-[var(--dc-accent-soft)]">{readLabel}</span>
            <span aria-hidden="true" className="dc-cta grid h-9 w-9 shrink-0 place-items-center rounded-full">
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/post:translate-x-0.5" strokeWidth={2.25} />
            </span>
          </div>
        ) : null}
      </div>
    </>
  );

  const shell = `blog-card group/post flex h-full flex-col overflow-hidden rounded-[var(--dc-cut)]${update.placeholder ? ' !border-dashed' : ''}`;

  return (
    <article className="h-full">
      {update.link ? (
        <Link href={update.link as Route} className={`${shell} blog-card-interactive`}>
          {body}
        </Link>
      ) : (
        <div className={shell}>{body}</div>
      )}
    </article>
  );
}
