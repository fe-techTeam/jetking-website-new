import type { Metadata, Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { breadcrumbSchema } from '@/lib/seo';
import { sitemapCopy } from '@/lib/content/copy/pages/sitemap';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(sitemapCopy, '/sitemap');
}

/**
 * Human-readable sitemap. It is generated from the same content source as `/sitemap.xml`, so a
 * new course, centre or article shows up here without anyone editing this file.
 */
export default async function SitemapPage() {
  const copy = await loadCopy(sitemapCopy);
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/sitemap' },
  ];
  const PAGE_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: copy['groups.0.title'],
      links: [
        { label: copy['groups.0.links.0.label'], href: copy['groups.0.links.0.href'] },
        { label: copy['groups.0.links.1.label'], href: copy['groups.0.links.1.href'] },
        { label: copy['groups.0.links.2.label'], href: copy['groups.0.links.2.href'] },
        { label: copy['groups.0.links.3.label'], href: copy['groups.0.links.3.href'] },
        { label: copy['groups.0.links.4.label'], href: copy['groups.0.links.4.href'] },
        { label: copy['groups.0.links.5.label'], href: copy['groups.0.links.5.href'] },
      ],
    },
    {
      title: copy['groups.1.title'],
      links: [
        { label: copy['groups.1.links.0.label'], href: copy['groups.1.links.0.href'] },
        { label: copy['groups.1.links.1.label'], href: copy['groups.1.links.1.href'] },
        { label: copy['groups.1.links.2.label'], href: copy['groups.1.links.2.href'] },
        { label: copy['groups.1.links.3.label'], href: copy['groups.1.links.3.href'] },
        { label: copy['groups.1.links.4.label'], href: copy['groups.1.links.4.href'] },
      ],
    },
    {
      title: copy['groups.2.title'],
      links: [
        { label: copy['groups.2.links.0.label'], href: copy['groups.2.links.0.href'] },
        { label: copy['groups.2.links.1.label'], href: copy['groups.2.links.1.href'] },
        { label: copy['groups.2.links.2.label'], href: copy['groups.2.links.2.href'] },
      ],
    },
  ];
  const [courses, centres, posts] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listPosts(),
  ]);

  const centresByState = new Map<string, typeof centres>();
  for (const centre of [...centres].sort((a, b) => a.name.localeCompare(b.name))) {
    const list = centresByState.get(centre.state) ?? [];
    list.push(centre);
    centresByState.set(centre.state, list);
  }
  const states = [...centresByState.keys()].sort((a, b) => a.localeCompare(b));

  const latestPosts = [...posts]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 8);

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        <section className="shell relative pt-6 sm:pt-8" data-reveal-skip>
          <Breadcrumbs trail={trail} />

          <div className="relative mt-5 sm:mt-6">
            <div className="dc-banner relative min-h-[220px] overflow-hidden rounded-[24px] xs:min-h-[240px] xs:rounded-[28px] sm:min-h-[260px] sm:rounded-[28px]">
              <Image
                src={copy['hero.image']}
                alt=""
                fill
                priority
                sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 sm:justify-center sm:px-10 sm:py-12 lg:max-w-[62%] lg:px-12 xl:px-14">
                <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>
                <h1 className="page-title mt-4 font-display text-balance text-[var(--dc-ink)]">
                  {copy['hero.titleLead']} <span className="dc-accent-glow">{copy['hero.titleAccent']}</span>
                </h1>
                <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] sm:text-[16px]">
                  {copy['hero.body']}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="shell relative mt-8 space-y-6 sm:mt-10 sm:space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {PAGE_GROUPS.map((group) => (
              <section
                key={group.title}
                aria-labelledby={`sm-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="dc-panel rounded-[24px] px-5 py-6 xs:rounded-[28px] sm:px-7 sm:py-8"
              >
                <h2
                  id={`sm-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="subsection-title font-display text-[var(--dc-ink)]"
                >
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <SitemapLink href={link.href}>{link.label}</SitemapLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section
            aria-labelledby="sm-courses"
            className="dc-panel rounded-[24px] px-5 py-7 xs:rounded-[28px] sm:px-8 sm:py-9"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2
                id="sm-courses"
                className="subsection-title font-display text-[var(--dc-ink)]"
              >
                {copy['courses.title']}
              </h2>
              <Link
                href={copy['courses.cta.href'] as Route}
                className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
              >
                {copy['courses.cta.label']}
              </Link>
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.slug}>
                  <SitemapLink href={`/courses/${course.slug}`}>{course.title}</SitemapLink>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="sm-centres"
            className="dc-panel rounded-[24px] px-5 py-7 xs:rounded-[28px] sm:px-8 sm:py-9"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2
                id="sm-centres"
                className="subsection-title font-display text-[var(--dc-ink)]"
              >
                {copy['centres.title']}
              </h2>
              <Link
                href={copy['centres.cta.href'] as Route}
                className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
              >
                {copy['centres.cta.label']}
              </Link>
            </div>
            <div className="mt-5 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {states.map((state) => (
                <div key={state}>
                  <h3 className="dc-eyebrow label-mono">{state}</h3>
                  <ul className="mt-2 space-y-1">
                    {centresByState.get(state)!.map((centre) => (
                      <li key={centre.slug}>
                        <SitemapLink href={centrePath(centre.slug)}>{centre.name}</SitemapLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {latestPosts.length > 0 && (
            <section
              aria-labelledby="sm-blog"
              className="dc-panel rounded-[24px] px-5 py-7 xs:rounded-[28px] sm:px-8 sm:py-9"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id="sm-blog"
                  className="subsection-title font-display text-[var(--dc-ink)]"
                >
                  {copy['blog.title']}
                </h2>
                <Link
                  href={copy['blog.cta.href'] as Route}
                  className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
                >
                  {copy['blog.cta.label']}
                </Link>
              </div>
              <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {latestPosts.map((post) => (
                  <li key={post.slug}>
                    <SitemapLink href={`/blog/${post.slug}`}>{post.title}</SitemapLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-center text-[14px] text-[var(--dc-ink-muted)]">
            {copy['xml.lead']}{' '}
            <a href={copy['xml.href']} className="font-semibold text-[var(--dc-accent-soft)] hover:underline">
              {copy['xml.label']}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

function SitemapLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as Route}
      className="flex min-h-11 items-center rounded-lg px-2 py-1.5 text-[14.5px] leading-snug text-[var(--dc-ink-secondary)] transition-colors hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dc-accent-soft)]"
    >
      {children}
    </Link>
  );
}
