import { ArrowLink, ButtonLink, IndexRow, Section } from '@/components/ui';

/**
 * 404.
 *
 * During and after the migration this page will be hit by traffic from legacy URLs
 * that the redirect map missed. It therefore does real work: it offers the main
 * routes rather than being a dead end, and every 404 hit is worth monitoring in
 * Search Console as a signal that the redirect map has a gap.
 */
export default function NotFound() {
  return (
    <Section>
      <div className="mx-auto max-w-2xl py-8">
        <p className="label-mono numeral text-[var(--accent-ink)]">Error 404</p>
        <h1 className="mt-5 text-3xl sm:text-4xl">We could not find that page</h1>
        <p className="lede mt-5">
          The page may have moved during our site migration. Here is where most people
          are heading.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/courses" size="lg">
            Browse courses
          </ButtonLink>
          <ButtonLink href="/centres" tone="secondary" size="lg">
            Find a centre
          </ButtonLink>
        </div>

        <ul className="mt-14 border-t border-border">
          <IndexRow href="/" title="Home" meta="Courses, centres and outcomes" />
          <IndexRow href="/placements" title="Placement support" meta="What it covers" />
          <IndexRow href="/blog" title="Guidance" meta="Choosing a course and a career" />
          <IndexRow href="/franchise" title="Franchise" meta="The operating model" />
        </ul>

        <p className="mt-8 text-sm text-foreground-muted">
          Still stuck? <ArrowLink href="/enquiry">Talk to a counsellor</ArrowLink>
        </p>
      </div>
    </Section>
  );
}
