import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * redirects.json is generated and merged from several sources. Next.js matches redirect sources without regard to
 * case, so an entry like "/Courses" -> "/courses" redirects /courses to itself (an endless loop on a live page —
 * this shipped once). These checks keep that, and two-rule cycles, out of the file.
 */
const entries: Array<{ source: string; destination: string }> = JSON.parse(
  readFileSync(join(process.cwd(), 'redirects.json'), 'utf8'),
);

const path = (p: string) => (p.split(/[?#]/)[0] ?? '').toLowerCase().replace(/\/+$/, '') || '/';

describe('redirects.json', () => {
  it('has no rule that redirects a path to itself (case-insensitively)', () => {
    const loops = entries.filter((e) => path(e.source) === path(e.destination));
    expect(loops.map((e) => `${e.source} -> ${e.destination}`)).toEqual([]);
  });

  it('has no two rules that redirect to each other', () => {
    const next = new Map(entries.map((e) => [path(e.source), path(e.destination)]));
    const cycles = [...next].filter(([a, b]) => a !== b && next.get(b) === a).map(([a, b]) => `${a} <-> ${b}`);
    expect(cycles).toEqual([]);
  });

  it('does not redirect a page the site actually serves', () => {
    const live = ['/', '/courses', '/centres', '/placements', '/about-us', '/enquiry', '/blog', '/faq', '/franchise', '/investors'];
    const hit = entries.filter((e) => live.includes(path(e.source)));
    expect(hit.map((e) => e.source)).toEqual([]);
  });
});
