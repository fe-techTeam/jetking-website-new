/**
 * Exports every record exposed by the website ContentSource into a compact
 * retrieval corpus for Jetking AI.
 *
 * This is the bridge between the website CMS and the chatbot, and it reads ONLY from the CMS
 * (the same ContentSource the pages use, so CONTENT_SOURCE=admin makes both surfaces change
 * together):
 *   - structured records and prose chunks: courses, FAQs, posts, centres, cities, policies,
 *     faculty and placement notes, via `buildCorpus()`;
 *   - page-level facts: the About and Placements documents, the legal documents, and each
 *     landing page's text (franchise, professional, parent, student, explore) — via
 *     `buildSiteCorpusItems()`, which merges every page's shipped wording with its published CMS
 *     edits. Nothing is hand-copied here any more, so an admin edit reaches the chatbot the next
 *     time this script runs (`npm run build:chatbot-index` runs it, then rebuilds the index).
 */
import './load-dotenv.mjs';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCorpus } from '@/guide/corpus';
import type { ChunkType } from '@/guide/types';
import { content } from '@/lib/content';
import { buildSiteCorpusItems } from '@/lib/content/site-corpus';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(HERE, '../src/content/website-corpus.json');

const typeMap: Record<ChunkType, string> = {
  course: 'course',
  faq: 'faq',
  post: 'blog',
  news: 'blog',
  centre: 'centre',
  city: 'centre',
  policy: 'info',
  faculty: 'info',
  placement: 'placement',
};

const [chunks, courses, centres, cities] = await Promise.all([
  buildCorpus(),
  content.listCourses(),
  content.listCentres(),
  content.listCities(),
]);
const items = chunks.map((chunk) => ({
  id: chunk.id,
  type: typeMap[chunk.type],
  title: chunk.title,
  path: chunk.url,
  text: chunk.text,
  source: 'website-content-source' as const,
}));

items.push(
  ...(await buildSiteCorpusItems({ courses: courses.length, centres: centres.length, cities: cities.length })),
);

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(
  OUTPUT,
  `${JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      contentSource: process.env['CONTENT_SOURCE'] ?? 'local',
      count: items.length,
      items,
      structured: { courses, centres, cities },
    },
    null,
    2,
  )}\n`,
  'utf8',
);

const byType = Object.groupBy(items, (item) => item.type);
const distribution = Object.fromEntries(
  Object.entries(byType).map(([type, rows]) => [type, rows?.length ?? 0]),
);

console.log(`Exported ${items.length} website records to src/content/website-corpus.json`);
console.log(`By type: ${JSON.stringify(distribution)}`);
