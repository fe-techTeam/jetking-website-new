/**
 * ══════════════════════════════════════════════════════════════════════════════
 * REDIRECT MAP GENERATOR — Week 1 (drafted), Week 4 (applied)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Reads `data/legacy-urls.json` and the new site's route inventory, then proposes a
 * 1:1 redirect for every legacy URL that does not survive unchanged.
 *
 * ── What this deliberately does NOT do ─────────────────────────────────────
 * It does not auto-approve anything. It emits two files:
 *
 *   redirects.generated.json   high-confidence matches, for review then promotion
 *                              into redirects.json
 *   data/redirect-gaps.json    everything it could not confidently match
 *
 * Every entry in the gaps file needs a human decision: redirect to the nearest
 * equivalent, keep as-is, or 410. The one option that is never acceptable is a
 * wildcard to the homepage — that tells Google the old page's topic no longer
 * exists anywhere, and the ranking is lost rather than transferred.
 *
 * Usage:
 *   npx tsx scripts/build-redirects.ts
 *   npx tsx scripts/build-redirects.ts --threshold 0.7
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { courses } from '../src/lib/content/fixtures/courses';
import { centres, cities } from '../src/lib/content/fixtures/locations';
import { posts } from '../src/lib/content/fixtures/posts';

interface LegacyUrl {
  path: string;
  status: number;
  title: string | null;
  clicks?: number;
}

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
  confidence: number;
  reason: string;
}

interface Gap {
  path: string;
  clicks?: number;
  title: string | null;
  bestGuess?: string;
  confidence: number;
  action: 'DECIDE: redirect | keep | 410';
}

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const THRESHOLD = Number(arg('threshold', '0.6'));
const LEGACY_FILE = join(process.cwd(), 'data', 'legacy-urls.json');

/* ── The new site's route inventory ──────────────────────────────────────── */

function buildInventory(): Array<{ path: string; slug: string; keywords: string[] }> {
  const staticRoutes: Array<{ path: string; slug: string; keywords: string[] }> = [
    { path: '/', slug: 'home', keywords: ['home', 'jetking'] },
    { path: '/about-us', slug: 'about-us', keywords: ['about', 'about us', 'legacy', 'company'] },
    { path: '/courses', slug: 'courses', keywords: ['courses', 'programmes', 'training'] },
    { path: '/centres', slug: 'centres', keywords: ['centres', 'centers', 'locations', 'branches'] },
    { path: '/placements', slug: 'placements', keywords: ['placement', 'placements', 'jobs', 'careers'] },
    { path: '/franchise', slug: 'franchise', keywords: ['franchise', 'partner', 'business'] },
    { path: '/blog', slug: 'blog', keywords: ['blog', 'articles', 'news'] },
    { path: '/faq', slug: 'faq', keywords: ['faq', 'questions', 'help'] },
  ];

  const routes = [...staticRoutes];

  for (const course of courses) {
    if (course.hasDetailPage === false) continue;
    routes.push({
      path: `/courses/${course.slug}`,
      slug: course.slug,
      keywords: tokenize(`${course.title} ${course.shortTitle} ${course.slug}`),
    });
  }
  for (const city of cities) {
    routes.push({
      path: `/centres/${city.slug}`,
      slug: city.slug,
      keywords: tokenize(`${city.name} ${city.slug} centre center`),
    });
  }
  for (const centre of centres) {
    routes.push({
      path: `/centres/${centre.slug}`,
      slug: centre.slug,
      keywords: tokenize(`${centre.name} ${centre.locality} ${centre.slug}`),
    });
    routes.push({
      path: `/centres/${centre.citySlug}/${centre.slug}`,
      slug: centre.slug,
      keywords: tokenize(`${centre.name} ${centre.locality} ${centre.slug}`),
    });
  }
  for (const post of posts) {
    routes.push({
      path: `/blog/${post.slug}`,
      slug: post.slug,
      keywords: tokenize(`${post.title} ${post.slug}`),
    });
  }

  return routes;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 2);
}

/* ── Matching ────────────────────────────────────────────────────────────── */

/** Jaccard overlap on token sets — cheap, and adequate for slug-shaped strings. */
function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
}

function main0(legacy: LegacyUrl[]) {
  const inventory = buildInventory();
  const inventoryPaths = new Set(inventory.map((r) => r.path));

  const redirects: Redirect[] = [];
  const gaps: Gap[] = [];
  let unchanged = 0;

  for (const entry of legacy) {
    // Already-dead URLs on the old site do not need a redirect on the new one.
    if (entry.status !== 200) continue;

    // Survives unchanged — no redirect needed, and adding one would be a self-loop.
    if (inventoryPaths.has(entry.path)) {
      unchanged += 1;
      continue;
    }

    const legacyTokens = tokenize(`${entry.path} ${entry.title ?? ''}`);

    let best: { path: string; score: number } | undefined;
    for (const route of inventory) {
      const score = similarity(legacyTokens, route.keywords);
      if (!best || score > best.score) best = { path: route.path, score };
    }

    // An exact slug match at a new prefix is the common, safe case:
    // /blog/foo.html → /blog/foo, or /courses/foo/ → /courses/foo
    const bareSlug = entry.path.replace(/\.(html?|php|aspx)$/i, '').replace(/\/$/, '');
    if (inventoryPaths.has(bareSlug)) {
      redirects.push({
        source: entry.path,
        destination: bareSlug,
        permanent: true,
        confidence: 1,
        reason: 'Same slug, extension or trailing slash removed',
      });
      continue;
    }

    if (best && best.score >= THRESHOLD) {
      redirects.push({
        source: entry.path,
        destination: best.path,
        permanent: true,
        confidence: Number(best.score.toFixed(2)),
        reason: `Token similarity ${best.score.toFixed(2)} against ${best.path}`,
      });
    } else {
      gaps.push({
        path: entry.path,
        clicks: entry.clicks,
        title: entry.title,
        bestGuess: best?.path,
        confidence: Number((best?.score ?? 0).toFixed(2)),
        action: 'DECIDE: redirect | keep | 410',
      });
    }
  }

  // Highest-traffic gaps first — that is the order a human should work through them.
  gaps.sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0) || b.confidence - a.confidence);
  redirects.sort((a, b) => a.source.localeCompare(b.source));

  return { redirects, gaps, unchanged };
}

/* ── Validation: catch the failure modes before they ship ────────────────── */

function validate(redirects: Redirect[]): string[] {
  const errors: string[] = [];
  const bySource = new Map<string, Redirect[]>();

  for (const r of redirects) {
    if (r.source === r.destination) {
      errors.push(`Self-redirect: ${r.source}`);
    }
    if (r.destination === '/' && r.source !== '/') {
      errors.push(
        `Homepage redirect: ${r.source} → /. This discards the page's ranking rather ` +
          `than transferring it. Find a topical equivalent or 410 it.`,
      );
    }
    const list = bySource.get(r.source) ?? [];
    list.push(r);
    bySource.set(r.source, list);
  }

  for (const [source, list] of bySource) {
    if (list.length > 1) {
      errors.push(`Duplicate source "${source}" → ${list.map((r) => r.destination).join(', ')}`);
    }
  }

  // Chain detection: A→B where B is itself a source.
  const sources = new Set(redirects.map((r) => r.source));
  for (const r of redirects) {
    if (sources.has(r.destination)) {
      errors.push(`Chain: ${r.source} → ${r.destination}, which also redirects. Collapse to one hop.`);
    }
  }

  return errors;
}

/* ── Runner ──────────────────────────────────────────────────────────────── */

async function main() {
  let legacy: LegacyUrl[];
  try {
    legacy = JSON.parse(await readFile(LEGACY_FILE, 'utf8')) as LegacyUrl[];
  } catch {
    console.error(
      `\n✗ Could not read data/legacy-urls.json.\n` +
        `  Run scripts/crawl-legacy.ts first — the redirect map cannot be built\n` +
        `  without knowing what URLs exist today.\n`,
    );
    process.exit(1);
  }

  console.log(`\nBuilding redirect map from ${legacy.length} legacy URLs\n${'─'.repeat(60)}`);

  const { redirects, gaps, unchanged } = main0(legacy);
  const errors = validate(redirects);

  await mkdir(dirname(LEGACY_FILE), { recursive: true });
  await writeFile(
    join(process.cwd(), 'redirects.generated.json'),
    `${JSON.stringify(
      redirects.map(({ source, destination, permanent }) => ({ source, destination, permanent })),
      null,
      2,
    )}\n`,
    'utf8',
  );
  await writeFile(
    join(process.cwd(), 'data', 'redirect-gaps.json'),
    `${JSON.stringify(gaps, null, 2)}\n`,
    'utf8',
  );

  console.log(`  survive unchanged     ${unchanged}`);
  console.log(`  redirects proposed    ${redirects.length}`);
  console.log(`  need a human decision ${gaps.length}`);

  if (errors.length) {
    console.log(`\n✗ ${errors.length} problem(s) in the proposed map:\n`);
    for (const error of errors) console.log(`  ${error}`);
  }

  if (gaps.length) {
    console.log(`\nTop unresolved URLs (by traffic):\n`);
    for (const gap of gaps.slice(0, 10)) {
      const clicks = gap.clicks !== undefined ? `${gap.clicks} clicks` : 'traffic unknown';
      console.log(`  ${gap.path}  (${clicks})`);
      if (gap.bestGuess) console.log(`     best guess: ${gap.bestGuess} @ ${gap.confidence}`);
    }
  }

  console.log(
    `\nWritten:\n` +
      `  redirects.generated.json   → review, then merge into redirects.json\n` +
      `  data/redirect-gaps.json    → resolve every entry before launch\n\n` +
      `Nothing here is applied automatically. redirects.json is the file the build\n` +
      `reads, and it changes only by human review.\n`,
  );

  if (errors.length) process.exit(1);
}

main().catch((error) => {
  console.error('Redirect build failed:', error);
  process.exit(1);
});
