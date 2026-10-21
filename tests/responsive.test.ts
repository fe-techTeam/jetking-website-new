import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Source-level guards for the responsive, mobile-first and "never hide a section" rules.
 *
 * These read the code, not a browser, so they run in CI with the rest of the suite. They catch the regressions we
 * actually hit while building the pages: desktop-first overrides creeping back in, split heroes that only switch
 * to two columns at 1024px (leaving a half-empty row on tablets and small laptops), and sections that disappear
 * when their data is empty. The layout itself is checked in a browser (see scripts/responsive-audit.browser.js).
 */

const ROOT = join(__dirname, '..');
const src = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function walk(dir: string, ext: string[], out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, ext, out);
    else if (ext.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

const MAX_VARIANT = /\bmax-(xs|sm|md|lg|xl|2xl|\[[0-9]+px\]):/g;

describe('mobile-first authoring', () => {
  const tsx = walk(join(ROOT, 'src'), ['.tsx']);

  it('keeps desktop-first Tailwind max-* variants to the known, reviewed files', () => {
    const allowed = new Set([
      'src/components/CourseCard.tsx',
      'src/components/QuickEnquiryForm.tsx',
      'src/components/centres/CentreHeroForm.tsx',
      'src/components/centres/StickyCentreBar.tsx',
      'src/components/home/hero/StatsStrip.tsx',
      'src/components/kit/Section.tsx',
      'src/components/parent/ParentLanding.tsx',
      'src/components/placements/OfferLetterSlider.tsx',
      'src/features/jetking-ai/jetking-ai-client.tsx',
    ]);
    const offenders = tsx
      .filter((f) => MAX_VARIANT.test(readFileSync(f, 'utf8')) && !(MAX_VARIANT.lastIndex = 0))
      .map((f) => relative(ROOT, f).split('\\').join('/'))
      .filter((f) => !allowed.has(f));
    expect(offenders, 'write the phone layout as the base and scale up with sm:/md:/lg: instead of max-*:').toEqual([]);
  });

  it('does not add more max-* variants than today', () => {
    const count = tsx.reduce((n, f) => n + (readFileSync(f, 'utf8').match(MAX_VARIANT)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(16);
  });

  it('caps raw CSS max-width media queries (they belong in min-width, mobile-first)', () => {
    const css = walk(join(ROOT, 'src', 'styles'), ['.css']);
    const count = css.reduce((n, f) => n + (readFileSync(f, 'utf8').match(/@media \(max-width/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(10);
  });

  it('scales the page gutter up from the phone value', () => {
    const css = src('src/styles/globals.css');
    const values = [...css.matchAll(/--gutter:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(values.length).toBeGreaterThan(2);
    expect(values[0]).toBeLessThanOrEqual(24);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]!);
  });
});

describe('split heroes switch to two columns at 880px, not only at 1024px', () => {
  const files = [
    'src/components/franchise/FranchiseLandingLight.tsx',
    'src/components/explore/ExploreLanding.tsx',
    'src/components/student/journey/StudentExploreHero.tsx',
    'src/components/parent/ParentLanding.tsx',
    'src/components/professional/ProfessionalHero.tsx',
  ];
  for (const file of files) {
    it(file, () => {
      const text = src(file);
      expect(text).toContain('min-[880px]:grid-cols');
      expect(text).not.toContain('gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]');
    });
  }
});

describe('sections stay on the page (placeholder, never hidden) when their data is empty', () => {
  it('course page shows tools, certifications, journey, FAQs, centres and careers placeholders', () => {
    const t = src('src/app/courses/[slug]/CoursePageTemplate.tsx');
    expect(t).toContain('toolsOnly.length || showPlaceholders');
    expect(t).toContain('course.certifications.length || showPlaceholders');
    expect(t).toContain('course.phases?.length || showPlaceholders');
    expect(t).toContain('ownFaqs.length + feeFaqs.length || showPlaceholders');
    expect(t).toContain("coursePlaceholder.centres");
    expect(t).toContain("coursePlaceholder.careerRoles");
    // the internship box is for every course, not only degrees
    expect(t).not.toContain('isDegree && internshipPoints.length');
  });

  it('centre page shows admissions, FAQs and contact placeholders', () => {
    const t = src('src/components/CentreDetail.tsx');
    expect(t).toContain('hasAdmissions || showPlaceholders');
    expect(t).toContain('faqs.length || showPlaceholders');
    expect(t).toContain("centrePlaceholder.admissionsTitle");
    expect(t).toContain("centrePlaceholder.faqQuestion");
    expect((t.match(/showPlaceholders \? \(\s*<div className="flex gap-3">/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('home sections keep their heading and show an empty-state message', () => {
    expect(src('src/components/home/sections/BlogTeaser.tsx')).not.toMatch(/return null/);
    expect(src('src/components/home/sections/BlogTeaser.tsx')).toContain("blog.empty");
    expect(src('src/components/home/sections/ProgramShowcase.tsx')).not.toMatch(/return null/);
    expect(src('src/components/home/sections/ProgramShowcase.tsx')).toContain("programs.empty");
    expect(src('src/components/home/sections/VideoStories.tsx')).not.toMatch(/slides\.length === 0\) return null/);
    expect(src('src/components/home/sections/VideoStories.tsx')).toContain("proof.stories.empty");
  });
});

describe('visual fallbacks', () => {
  it('course cards fall back to the Jetking wordmark when a photo is missing or fails', () => {
    const t = src('src/components/CourseCard.tsx');
    expect(t).toContain('jetking-wordmark');
    expect(t).toContain('onError');
  });

  it('white text on the centre red panels cannot be overridden by the global heading colour', () => {
    const t = src('src/components/centres/CentreExperience.tsx');
    expect(t).toContain('!text-white');
  });
});

describe('large screens (1920 to 4K)', () => {
  it('caps the page container and grows it only at the 1920 and 2560 breakpoints', () => {
    const css = src('src/styles/globals.css');
    // Declared in rem (120rem = 1920px, 160rem = 2560px) so they sort after 2xl in Tailwind's breakpoint cascade;
    // see the note in globals.css. Either unit is the same breakpoint.
    expect(css).toMatch(/--breakpoint-3xl: (1920px|120rem)/);
    expect(css).toMatch(/--breakpoint-4xl: (2560px|160rem)/);
    const flat = css.replace(/\s+/g, ' ');
    expect(flat).toContain('--container-3xl: 1800px');
    expect(flat).toContain('--container-4xl: 2100px');
    expect(flat).toContain('@media (min-width: 2560px) { .shell { max-width: var(--container-4xl); } }');
  });

  it('keeps long running text to a readable line length', () => {
    expect(src('src/components/legal/LegalDocument.tsx')).toContain('max-w-[85ch]');
    expect(src('src/components/blog/BlogArticle.tsx')).toContain('max-w-[75ch]');
    expect(src('src/components/home/sections/PlacementProof.tsx')).toContain('max-w-[100ch]');
    expect(src('src/components/placements/PlacementsLanding.tsx')).toContain('max-w-[110ch]');
    expect(src('src/app/enquiry/EnquiryForm.tsx')).toContain('max-w-[70ch]');
  });
});
