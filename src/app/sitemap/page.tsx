import type { Metadata, Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { breadcrumbSchema } from '@/lib/seo';
import { sitemapCopy } from '@/lib/content/copy/pages/sitemap';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { isSectionVisible } from '@/lib/content/copy/sections';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { Section, SectionHeader } from '@/components/kit';
import { COURSE_LEVEL_LABEL, courseLevel } from '@/lib/course-categories';
import { courseHref } from '@/lib/course-href';
import { isChatbotPubliclyEnabled } from '@/lib/chatbot/availability';
import { BookOpen, Compass, MapPin, Newspaper, type LucideIcon } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(sitemapCopy, '/sitemap');
}

/**
 * Human-readable sitemap. It is generated from the same content source as `/sitemap.xml`, so a
 * new course, centre or article shows up here without anyone editing this file.
 */
export default async function SitemapPage() {
  const copy = await loadCopy(sitemapCopy);
  const show = (id: string) => isSectionVisible(copy, id);
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.label'], path: '/sitemap' },
  ];
  const [courses, centres, posts, chatbotEnabled] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listPosts(),
    isChatbotPubliclyEnabled(),
  ]);
  const PAGE_GROUPS = readPageGroups(copy, { includeChatbot: chatbotEnabled });

  const centresByState = new Map<string, typeof centres>();
  for (const centre of [...centres].sort((a, b) => a.name.localeCompare(b.name))) {
    const list = centresByState.get(centre.state) ?? [];
    list.push(centre);
    centresByState.set(centre.state, list);
  }
  const states = [...centresByState.keys()].sort((a, b) => a.localeCompare(b));

  // Every published article — same set as /sitemap.xml (minus noindex / non-canonical).
  const allPosts = [...posts]
    .filter((post) => !post.seo.noindex && (!post.seo.canonicalPath || post.seo.canonicalPath === `/blog/${post.slug}`))
    .sort((a, b) => a.title.localeCompare(b.title));

  const courseGroups = [...new Set(courses.map((c) => courseLevel(c)))].map((level) => ({
    level,
    label: COURSE_LEVEL_LABEL[level],
    list: courses.filter((c) => courseLevel(c) === level),
  }));
  const JUMPS: { id: string; label: string; count?: number; Icon: LucideIcon }[] = [
    ...(show('pages') ? [{ id: 'pages', label: copy['pages.title'], count: PAGE_GROUPS.reduce((n, g) => n + g.links.length, 0), Icon: Compass }] : []),
    ...(show('courses') ? [{ id: 'courses', label: copy['courses.title'], count: courses.length, Icon: BookOpen }] : []),
    ...(show('centres') ? [{ id: 'centres', label: copy['centres.title'], count: centres.length, Icon: MapPin }] : []),
    ...(show('blog') && allPosts.length ? [{ id: 'blog', label: copy['jump.blog'], count: allPosts.length, Icon: Newspaper }] : []),
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />

      <div className="dark-canvas pb-16 sm:pb-20 lg:pb-24">
        {show('hero') ? (
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
        ) : null}

        {/* Jump bar: the four parts of the page, with how much is in each */}
        {show('jump') && JUMPS.length ? (
        <nav aria-label={copy['jump.label']} className="shell relative mt-8 sm:mt-10">
          <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {JUMPS.map(({ id, label, count, Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[13.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
                >
                  <Icon className="h-4 w-4 text-[var(--dc-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                  {label}
                  {count ? <span className="numeral text-[12px] font-semibold text-[var(--dc-ink-muted)]">{count}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        ) : null}

        <div className="mt-10 sm:mt-12">
          {/* ── Main pages ─────────────────────────────────────────────── */}
          {show('pages') ? (
          <Section tone="plain" id="pages" labelledBy="sm-pages" className="scroll-mt-28">
            <SectionHeader id="sm-pages" title={copy['pages.title']} />
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {PAGE_GROUPS.map((group, gi) => (
                <section key={group.title} aria-labelledby={`sm-g-${gi}`}>
                  <h3 id={`sm-g-${gi}`} className="flex items-baseline gap-2 border-b border-[var(--k-line-strong)] pb-2 text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">
                    {group.title}
                  </h3>
                  <ul className="mt-2">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href as Route} className="flex min-h-10 items-center text-[15px] text-[var(--k-ink-2)] transition-colors hover:text-[var(--k-red)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--k-red)]">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Section>
          ) : null}

          {/* ── Courses, by level ─────────────────────────────────────── */}
          {show('courses') ? (
          <Section tone="tint" id="courses" labelledBy="sm-courses" className="scroll-mt-28">
            <SectionHeader
              id="sm-courses"
              title={copy['courses.title']}
              action={<AllLink href={copy['courses.cta.href']}>{copy['courses.cta.label']}</AllLink>}
            />
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {courseGroups.map((g) => (
                <section key={g.level}>
                  <h3 className="flex items-baseline gap-2 border-b border-[var(--k-line-strong)] pb-2 text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">
                    {g.label}
                    <span className="numeral text-[12px] font-semibold tracking-normal text-[var(--k-ink-3)]">{g.list.length}</span>
                  </h3>
                  <ul className="mt-2">
                    {g.list.map((course) => (
                      <li key={course.slug}>
                        <Link href={courseHref(course)} className="flex min-h-10 items-center text-[15px] text-[var(--k-ink-2)] transition-colors hover:text-[var(--k-red)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--k-red)]">
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Section>
          ) : null}

          {/* ── Centres, by state ─────────────────────────────────────── */}
          {show('centres') ? (
          <Section tone="plain" id="centres" labelledBy="sm-centres" className="scroll-mt-28">
            <SectionHeader
              id="sm-centres"
              title={copy['centres.title']}
              action={<AllLink href={copy['centres.cta.href']}>{copy['centres.cta.label']}</AllLink>}
            />
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {states.map((state) => {
                const list = centresByState.get(state)!;
                return (
                  <section key={state}>
                    <h3 className="flex items-baseline gap-2 border-b border-[var(--k-line-strong)] pb-2 text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">
                      {state}
                      <span className="numeral text-[12px] font-semibold tracking-normal text-[var(--k-ink-3)]">{list.length}</span>
                    </h3>
                    <ul className="mt-2">
                      {list.map((centre) => (
                        <li key={centre.slug}>
                          <Link
                            href={centrePath(centre.slug) as Route}
                            className="flex min-h-10 items-center text-[15px] text-[var(--k-ink-2)] transition-colors hover:text-[var(--k-red)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--k-red)]"
                          >
                            {centre.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Section>
          ) : null}

          {/* ── Blog (full catalogue, mirrors sitemap.xml) ────────────── */}
          {show('blog') && allPosts.length > 0 ? (
            <Section tone="tint" id="blog" labelledBy="sm-blog" className="scroll-mt-28">
              <SectionHeader
                id="sm-blog"
                title={copy['blog.title']}
                action={<AllLink href={copy['blog.cta.href']}>{copy['blog.cta.label']}</AllLink>}
              />
              <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {allPosts.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}` as Route} className="flex min-h-10 items-center text-[15px] text-[var(--k-ink-2)] transition-colors hover:text-[var(--k-red)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--k-red)]">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <p className="shell mt-10 text-center text-[14px] text-[var(--dc-ink-muted)]">
          {copy['xml.lead']}{' '}
          <a href={copy['xml.href']} className="font-semibold text-[var(--dc-accent-soft)] hover:underline">
            {copy['xml.label']}
          </a>
        </p>
      </div>
    </>
  );
}

function AllLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href as Route} className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)] hover:underline">
      {children}
    </Link>
  );
}

/** Read `groups.{n}.title` + `groups.{n}.links.{i}.{label,href}` until the first missing index. */
function readPageGroups(
  copy: Record<string, string>,
  opts: { includeChatbot: boolean },
): { title: string; links: { label: string; href: string }[] }[] {
  const groups: { title: string; links: { label: string; href: string }[] }[] = [];
  for (let g = 0; ; g++) {
    const title = copy[`groups.${g}.title`];
    if (!title) break;
    const links: { label: string; href: string }[] = [];
    for (let i = 0; ; i++) {
      const label = copy[`groups.${g}.links.${i}.label`];
      const href = copy[`groups.${g}.links.${i}.href`];
      if (!label || !href) break;
      if (!opts.includeChatbot && href === '/chatbot') continue;
      links.push({ label, href });
    }
    if (links.length) groups.push({ title, links });
  }
  return groups;
}
