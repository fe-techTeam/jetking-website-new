import type { Metadata, Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Sitemap | Jetking',
    description:
      'Every page on the Jetking website in one place — learner paths, courses, centres by state, company information and the blog.',
  },
  '/sitemap',
);

const trail: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Sitemap', path: '/sitemap' },
];

const PAGE_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Start here',
    links: [
      { label: 'Home', href: '/' },
      { label: "I'm a student", href: '/student' },
      { label: "I'm a parent", href: '/parent' },
      { label: "I'm a working professional", href: '/professional' },
      { label: "I'm exploring", href: '/explore' },
      { label: 'Franchise', href: '/franchise' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'Placements', href: '/placements' },
      { label: 'Investors', href: '/investors' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Get in touch',
    links: [
      { label: 'Enquire now', href: '/enquiry' },
      { label: 'Jetking AI assistant', href: '/chatbot' },
      { label: 'Log in / My account', href: '/account' },
    ],
  },
];

/**
 * Human-readable sitemap. It is generated from the same content source as `/sitemap.xml`, so a
 * new course, centre or article shows up here without anyone editing this file.
 */
export default async function SitemapPage() {
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
            <div className="dc-banner relative min-h-[220px] overflow-hidden rounded-[24px] xs:min-h-[240px] xs:rounded-[28px] sm:min-h-[260px] sm:rounded-[32px]">
              <Image
                src="/home/journey-explore-v2.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_28%]"
              />
              <div aria-hidden="true" className="dc-banner-wash pointer-events-none absolute inset-0" />

              <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-10 xs:px-8 sm:justify-center sm:px-10 sm:py-12 lg:max-w-[62%] lg:px-12 xl:px-14">
                <p className="dc-eyebrow label-mono text-[14px]">Sitemap</p>
                <h1 className="mt-4 font-display text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-[var(--dc-ink)] xs:text-[38px] sm:text-[44px] lg:text-[48px]">
                  Every page, <span className="dc-accent-glow">in one place</span>
                </h1>
                <p className="mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] sm:text-[16px]">
                  Find a course, a centre or a page without hunting through the menu.
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
                  className="font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[22px]"
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
                className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[26px]"
              >
                Courses
              </h2>
              <Link
                href={'/courses' as Route}
                className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
              >
                All courses →
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
                className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[26px]"
              >
                Centres
              </h2>
              <Link
                href={'/centres' as Route}
                className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
              >
                All centres →
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
                  className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[26px]"
                >
                  Latest from the blog
                </h2>
                <Link
                  href={'/blog' as Route}
                  className="tap text-[14px] font-bold text-[var(--dc-accent-soft)] hover:underline"
                >
                  All articles →
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

          <p className="text-center text-[13px] text-[var(--dc-ink-muted)]">
            Looking for the machine-readable version?{' '}
            <a href="/sitemap.xml" className="font-semibold text-[var(--dc-accent-soft)] hover:underline">
              sitemap.xml
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
