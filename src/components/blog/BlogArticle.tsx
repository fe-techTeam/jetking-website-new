import Image from 'next/image';
import { Section, SectionHeader } from '@/components/kit';
import { EnquiryLink } from '@/components/EnquirySheet';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { BodyBlock, Post } from '@/lib/content/types';
import { AdaptiveNudge } from '@/persona/AdaptiveSlot';
import type { Crumb } from '@/components/ui';
import { BlogLogoBanner, categoryHref, formatPostDate, PostCard, postCover } from './BlogCards';
import { cleanBlogBody, decodeEntities } from '@/lib/content/cleanBlogBody';
import { fill } from '@/lib/content/copy/define';
import { sanitizeRichHtml } from '@/lib/rich/html';
import type { blogCopy } from '@/lib/content/copy/pages/blog';

function Block({ block }: { block: BodyBlock }) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2 className="blog-prose-h2">{block.text}</h2>
      ) : (
        <h3 className="blog-prose-h3">{block.text}</h3>
      );
    case 'paragraph':
      return <p className="blog-prose-p">{block.text}</p>;
    case 'list':
      return block.ordered ? (
        <ol className="blog-prose-ol">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="blog-prose-ul">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="blog-prose-quote">
          <p>{block.text}</p>
          {block.attribution ? <footer>— {block.attribution}</footer> : null}
        </blockquote>
      );
    case 'image':
      return (
        <figure className="blog-prose-figure">
          <div className="blog-card-media relative aspect-[12/5] overflow-hidden rounded-[16px]">
            <Image
              src={block.image.url}
              alt={block.image.alt}
              fill
              sizes="(min-width: 1280px) 1440px, 100vw"
              className="object-contain"
            />
          </div>
          {block.image.alt ? <figcaption>{block.image.alt}</figcaption> : null}
        </figure>
      );
  }
}

export function BlogArticle({
  post,
  related,
  trail,
  copy,
  marketingCovers,
}: {
  post: Post;
  related: Post[];
  trail: Crumb[];
  copy: typeof blogCopy.defaults;
  marketingCovers?: Iterable<string>;
}) {
  const cover = postCover(post, marketingCovers);
  const body = cleanBlogBody(post.body);

  return (
    <div className="blog-page relative overflow-hidden">
      {/* ── Article hero — breadcrumbs, image banner, then title block ─ */}
      <section className="shell relative pt-6 pb-8 xs:pt-8 sm:pt-10 lg:pt-12 lg:pb-10">
        <nav aria-label={copy['article.breadcrumbLabel']} className="mb-4 text-[12.5px] text-[var(--dc-ink-muted)] sm:mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            {trail.map((item, index) => {
              const href = item.path as Route;
              const isLast = index === trail.length - 1;
              return (
                <li key={item.path} className="flex items-center gap-1.5">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-[var(--dc-ink-muted)]/45">
                      /
                    </span>
                  ) : null}
                  {isLast ? (
                    <span aria-current="page" className="line-clamp-1 text-[var(--dc-ink-secondary)]">
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="tap transition-colors hover:text-[var(--dc-accent-soft)]"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="blog-hero-banner blog-card-media relative aspect-[12/5] overflow-hidden rounded-[24px] xs:rounded-[28px] sm:rounded-[28px]">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || post.title}
              fill
              priority
              sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
              className="object-contain object-center"
            />
          ) : (
            <BlogLogoBanner />
          )}
        </div>

        <header className="mt-7 sm:mt-8 lg:mt-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={categoryHref(post.category)}
              className="tap inline-flex items-center rounded-full border border-[var(--dc-accent-soft)]/35 bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase transition-colors hover:border-[var(--dc-accent-soft)]/60"
            >
              {post.category}
            </Link>
            <time
              dateTime={post.publishedAt}
              className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]"
            >
              {formatPostDate(post.publishedAt)}
            </time>
            <span className="text-[12.5px] font-semibold text-[var(--dc-ink-muted)]">
              {post.author}
            </span>
          </div>

          <h1 className="page-title mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
            {post.title}
          </h1>
        </header>
      </section>

      <div className="shell pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pb-16">
        <article className="w-full min-w-0">
          <p className="max-w-[75ch] text-[16px] leading-[1.7] text-[var(--dc-ink-secondary)] sm:text-[17.5px]">
            {decodeEntities(post.excerpt)}
          </p>

          <div className="blog-prose mt-8 border-t border-[var(--dc-hairline-strong)]/35 pt-8">
            {post.bodyHtml ? (
              <div className="blog-rich" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.bodyHtml) }} />
            ) : body.length > 0 ? (
              body.map((block, index) => <Block key={index} block={block} />)
            ) : (
              <p className="blog-prose-p text-[var(--dc-ink-muted)]">
                {copy['article.emptyBody']}
              </p>
            )}
          </div>

          <div className="mt-12 sm:mt-14">
            <AdaptiveNudge
              id="article-footer-nudge"
              tone="blog"
              reserve="standard"
              fallback={{
                headline: copy['nudge.fallback.headline'],
                body: copy['nudge.fallback.body'],
                ctaLabel: copy['nudge.fallback.cta.label'],
                ctaHref: copy['nudge.fallback.cta.href'],
              }}
              variants={{}}
            />
          </div>
        </article>
      </div>

      {related.length ? (
        <Section tone="tint" labelledBy="blog-related">
          <SectionHeader
            id="blog-related"
            eyebrow={copy['related.eyebrow']}
            title={fill(copy['related.title'], { category: post.category })}
            action={
              <Link
                href={'/blog' as Route}
                className="tap inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
              >
                {copy['related.allLabel']}
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => (
              <li key={item.slug} className="h-full">
                <PostCard post={item} copy={copy} marketingCovers={marketingCovers} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section tone="plain" labelledBy="blog-article-cta">
        <div className="kit-card overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,min(24rem,42%))]">
          <div className="p-6 sm:p-10">
            <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">
              {copy['articleCta.eyebrow']}
            </p>
            <h2 id="blog-article-cta" className="section-title mt-2.5 font-display text-[var(--k-ink)]">
              {copy['articleCta.title']}
            </h2>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy['articleCta.body']}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <EnquiryLink
                source="blog-article"
                className="group/book inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--k-red-fill)] py-3 pr-3 pl-5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
              >
                <span>{copy['articleCta.primary.label']}</span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--k-red)] transition-transform duration-200 group-hover/book:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </EnquiryLink>
              <Link
                href={copy['articleCta.secondary.href'] as Route}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--k-line-strong)] px-6 py-3 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)] hover:text-[var(--k-red)]"
              >
                {copy['articleCta.secondary.label']}
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] md:self-center">
            <Image
              src={copy['articleCta.image']}
              alt=""
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover object-[center_28%]"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
