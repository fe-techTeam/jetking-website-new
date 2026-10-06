import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { content } from '@/lib/content';
import { SOCIAL_LINKS } from '@/lib/social';
import { SocialIcon } from '@/components/SocialIcon';
import { LEGAL_LINKS } from '@/lib/legal';
import { loadCopy } from '@/lib/content/copy/load';
import { fill } from '@/lib/content/copy/define';
import { siteCopy } from '@/lib/content/copy/pages/site';
import { copyLinks } from '@/components/providers/site-copy-links';

/** Curated subset shown directly; the rest stay reachable via the "View all" link and sitemap. */
const FEATURED_COURSE_SLUGS = [
  'bca-cloud-cyber-security',
  'mca-cloud-cyber-security',
  'cloud-cyber-security-engineer',
  'ethical-hacking-specialist',
  'aws-solution-specialist',
  'data-analyst',
  'networking-essentials',
  'digital-marketing',
];

const FEATURED_CITY_SLUGS = [
  'mumbai',
  'delhi',
  'bengaluru',
  'pune',
  'hyderabad',
  'kolkata',
  'ahmedabad',
  'chandigarh',
];

/**
 * Server component, rendered on every public route except the homepage (see
 * FooterChrome). The footer is a significant internal-linking surface for
 * SEO — the course and city links here are how crawl equity reaches those
 * pages — so it stays fully static and identical for every visitor.
 *
 * `bg-background` (white in light, the dark canvas in dark) follows the site's own light/dark toggle rather than forcing a
 * permanently dark panel, so the utilities below are the same ones used on
 * every other themed section. There is no separate dark-mode branch.
 */
export async function SiteFooter() {
  const [courses, cities, copy] = await Promise.all([content.listCourses(), content.listCities(), loadCopy(siteCopy)]);

  const featuredCourses = FEATURED_COURSE_SLUGS.map((slug) =>
    courses.find((c) => c.slug === slug),
  ).filter((c) => c !== undefined);

  const featuredCities = FEATURED_CITY_SLUGS.map((slug) =>
    cities.find((c) => c.slug === slug),
  ).filter((c) => c !== undefined);

  // Registered-office contact details, as published on the Investors page. The phone defaults to
  // NEXT_PUBLIC_PHONE when set, else the helpline (see the `site` copy defaults).
  const phone = copy['contact.phone'];
  const company = copyLinks(copy, 'footer.company', 8);
  const socialCopy = copyLinks(copy, 'footer.social', SOCIAL_LINKS.length);
  const socialLinks = SOCIAL_LINKS.map((link, i) => ({
    network: link.network,
    label: socialCopy[i]?.label ?? link.label,
    href: socialCopy[i]?.href ?? link.href,
  }));
  const legal = copyLinks(copy, 'footer.legal', LEGAL_LINKS.length);

  return (
    <footer id="site-footer" className="border-t border-border bg-background">
      <div className="shell py-10 sm:py-16 lg:py-20">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          <div>
            <Image
              src="/brand/jetking-wordmark.png"
              alt={copy['footer.logo.alt']}
              width={360}
              height={113}
              sizes="120px"
              className="h-8 w-auto object-contain object-left"
            />
            <p className="mt-5 max-w-sm text-base text-foreground-secondary text-balance">
              {copy['footer.description']}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-foreground-secondary">
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted"
                  aria-hidden="true"
                />
                <span>{copy['contact.address']}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <a href={`tel:${phone}`} className="link-underline tap inline-flex min-h-11 items-center sm:min-h-6 hover:text-foreground">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <a
                  href={`mailto:${copy['contact.email']}`}
                  className="link-underline tap inline-flex min-h-11 items-center sm:min-h-6 hover:text-foreground"
                >
                  {copy['contact.email']}
                </a>
              </li>
            </ul>

            <nav aria-label={copy['footer.social.ariaLabel']} className="mt-8">
              <h2 className="label-mono">{copy['footer.social.heading']}</h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <li key={social.network}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground-secondary transition-colors hover:border-[var(--accent-ink)] hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ink)]"
                    >
                      <SocialIcon network={social.network} className="h-[18px] w-[18px]" />
                      <span className="sr-only">{copy['footer.social.newTabHint']}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Phones: each link group collapses (see FooterNav). sm: three columns. lg: `contents` hands them back to the parent grid. */}
          <div className="border-t border-border sm:grid sm:grid-cols-3 sm:gap-x-6 sm:border-0 lg:contents">
            <FooterNav label={copy['footer.courses.heading']}>
              {featuredCourses.map((course) => (
                <FooterLink key={course.slug} href={`/courses/${course.slug}`}>
                  {course.shortTitle}
                </FooterLink>
              ))}
              <FooterLink href="/courses" emphasis>
                {copy['footer.courses.viewAll']}
              </FooterLink>
            </FooterNav>

            <FooterNav label={copy['footer.centres.heading']}>
              {featuredCities.map((city) => (
                <FooterLink key={city.slug} href={`/centres?q=${encodeURIComponent(city.name)}`}>
                  {fill(copy['footer.centres.cityLink'], { city: city.name })}
                </FooterLink>
              ))}
              <FooterLink href="/centres" emphasis>
                {copy['footer.centres.viewAll']}
              </FooterLink>
            </FooterNav>

            <FooterNav
              label={copy['footer.company.heading']}
              listClassName="grid grid-cols-2 gap-x-6 gap-y-0 sm:block sm:space-y-3"
            >
              {company.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </FooterNav>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="shell flex flex-col gap-2 py-6 text-sm text-foreground-muted lg:flex-row lg:items-center lg:justify-between">
          <p>{fill(copy['footer.copyright'], { year: new Date().getFullYear() })}</p>
          <nav aria-label={copy['footer.legal.ariaLabel']} className="flex flex-wrap gap-x-5">
            {legal.map((l) => (
              <Link
                key={l.href}
                href={l.href as never}
                className="inline-flex min-h-11 items-center transition-colors hover:text-foreground focus-visible:text-foreground lg:min-h-6"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p>{copy['footer.tagline']}</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Phones get a native disclosure per group (no client JS); sm+ gets the plain column.
 * The links render in both, with complementary visibility — `<details>` can't be forced
 * open at a breakpoint with CSS alone, and both copies stay in the server HTML for crawlers.
 */
function FooterNav({
  label,
  children,
  listClassName,
}: {
  label: string;
  children: React.ReactNode;
  listClassName?: string;
}) {
  // Phones: the links carry their own 44px of padding (FooterLink), so the list needs no gap; sm+ spaces them out.
  const list = listClassName ?? 'space-y-0 sm:space-y-3';
  return (
    <nav aria-label={label}>
      <details className="group border-b border-border sm:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <h2 className="label-mono">{label}</h2>
          <ChevronDown
            className="h-4 w-4 text-foreground-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            strokeWidth={2.25}
            aria-hidden="true"
          />
        </summary>
        <ul className={`pb-3 ${list}`}>{children}</ul>
      </details>
      <div className="hidden sm:block">
        <h2 className="label-mono">{label}</h2>
        <ul className={`mt-5 ${list}`}>{children}</ul>
      </div>
    </nav>
  );
}

function FooterLink({
  href,
  children,
  emphasis,
}: {
  href: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  // Phones: 12px above/below the 20px line makes a 44px row, and 12px each side (pulled back with a negative
  // margin so the text stays aligned) keeps short words like "FAQ" 44px wide. The underline is pinned to the
  // text (background-origin) rather than the padding box so it still sits under the words.
  const touch = 'max-sm:-mx-3 max-sm:inline-block max-sm:px-3 max-sm:py-3 max-sm:[background-origin:content-box]';
  return (
    <li>
      <Link
        href={href as never}
        className={
          emphasis
            ? `link-underline ${touch} text-sm font-bold text-foreground transition-colors hover:text-[var(--accent-ink)]`
            : `link-underline ${touch} text-sm text-foreground-secondary transition-colors hover:text-foreground`
        }
      >
        {children}
      </Link>
    </li>
  );
}
