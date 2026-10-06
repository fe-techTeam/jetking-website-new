import Image from 'next/image';
import { Section, SectionHeader } from '@/components/kit';
import { EnquiryLink } from '@/components/EnquirySheet';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { BodyBlock, Post } from '@/lib/content/types';
import { AdaptiveNudge } from '@/persona/AdaptiveSlot';
import type { Crumb } from '@/components/ui';
import { categoryHref, formatPostDate, PostCard, postCover } from './BlogCards';
import { cleanBlogBody, decodeEntities } from '@/lib/content/cleanBlogBody';
import { fill } from '@/lib/content/copy/define';
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
          <div className="blog-card-media relative aspect-[840/300] overflow-hidden rounded-[16px]">
            <Image
              src={block.image.url}
              alt={block.image.alt}
              fill
              sizes="(min-width: 1280px) 1440px, 100vw"
              className="object-cover"
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
}: {
  post: Post;
  related: Post[];
  trail: Crumb[];
  copy: typeof blogCopy.defaults;
}) {
  const cover = postCover(post);
  const bannerSrc = cover?.url || copy['article.fallbackImage'];
  const bannerAlt = cover?.alt || post.title;
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

        <div className="blog-hero-banner blog-card-media relative aspect-[840/300] overflow-hidden rounded-[24px] xs:rounded-[28px] sm:rounded-[28px]">
          <Image
            src={bannerSrc}
            alt={bannerAlt}
            fill
            priority
            sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
            className="object-cover object-center"
          />
        </div>

        <header className="mt-7 sm:mt-8 lg:mt-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={categoryHref(post.category)}
              className="tap inline-flex min-h-11 rounded-full border border-[var(--dc-accent-soft)]/35 bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase transition-colors hover:border-[var(--dc-accent-soft)]/60"
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
          <p className="text-[16px] leading-[1.7] text-[var(--dc-ink-secondary)] sm:text-[17.5px]">
            {decodeEntities(post.excerpt)}
          </p>

          <div className="blog-prose mt-8 border-t border-[var(--dc-hairline-strong)]/35 pt-8">
            {body.length > 0 ? (
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
              variants={{
                student: {
                  headline: copy['nudge.student.headline'],
                  body: copy['nudge.student.body'],
                  ctaLabel: copy['nudge.student.cta.label'],
                  ctaHref: copy['nudge.student.cta.href'],
                },
                professional: {
                  headline: copy['nudge.professional.headline'],
                  body: copy['nudge.professional.body'],
                  ctaLabel: copy['nudge.professional.cta.label'],
                  ctaHref: copy['nudge.professional.cta.href'],
                },
                parent: {
                  headline: copy['nudge.parent.headline'],
                  body: copy['nudge.parent.body'],
                  ctaLabel: copy['nudge.parent.cta.label'],
                  ctaHref: copy['nudge.parent.cta.href'],
                },
                franchise: {
                  headline: copy['nudge.franchise.headline'],
                  ctaLabel: copy['nudge.franchise.cta.label'],
                  ctaHref: copy['nudge.franchise.cta.href'],
                },
              }}
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
                <PostCard post={item} copy={copy} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section tone="wash" labelledBy="blog-article-cta">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="k-eyebrow">{copy['articleCta.eyebrow']}</p>
            <h2 id="blog-article-cta" className="section-title mt-2.5 font-display text-[var(--k-ink)]">
              {copy['articleCta.title']}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy['articleCta.body']}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <EnquiryLink
              source="blog-article"
              className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]"
            >
              {copy['articleCta.primary.label']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </EnquiryLink>
            <Link
              href={copy['articleCta.secondary.href'] as Route}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-6 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
            >
              {copy['articleCta.secondary.label']}
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
