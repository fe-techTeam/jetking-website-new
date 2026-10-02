import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { FeatureExtractionPipeline } from '@xenova/transformers';

import { Bm25Index } from '@/features/knowledge/lib/bm25';
import { tokenize } from '@/features/knowledge/lib/tokenize';
import { serverEnv } from '@/lib/config/env.server';

/**
 * Local hybrid retrieval over the Jetking knowledge base.
 *
 * Runs in one of two modes:
 *
 * - `dense`   — the sentence model embeds the query and is fused with BM25.
 *               Best quality: it handles paraphrase, Hinglish and typos.
 * - `lexical` — BM25 and the city-entity boost only, no model at all.
 *
 * The mode matters because the model does not fit a serverless deployment:
 * the quantised weights are 130 MB and onnxruntime-node another 92 MB, against
 * Vercel's 250 MB unzipped function limit. Worse, nothing is bundled, so the
 * library tries to download the weights on cold start and write them to a
 * read-only filesystem — which throws, and the assistant answers nothing.
 *
 * So `auto` probes the model once and falls back to lexical for the life of
 * the process. A degraded answer beats a dead endpoint, and the corpus stays
 * entirely local either way.
 */

const MODEL = serverEnv.embedModel;
const MODE = serverEnv.retrievalMode;

/**
 * How much the lexical signal can move a result.
 *
 * Deliberately small: dense similarity decides what is *about* the question,
 * lexical only breaks ties in favour of passages containing the exact entity.
 * Set too high, BM25's term-frequency bias promotes long boilerplate pages
 * (a Terms & Conditions page repeating "Jetking … placed") over the passage
 * that actually answers the question. Tuned against scripts/eval-retrieval.mjs.
 */
const LEXICAL_WEIGHT = serverEnv.lexicalWeight;

/** Lexical hits past this rank contribute nothing; the tail is noise. */
const LEXICAL_DEPTH = serverEnv.lexicalDepth;

/**
 * Half-saturation constant for mapping BM25 onto 0..1. A raw score equal to
 * this maps to 0.5, so it sets where the confidence gate effectively bites.
 */
const LEXICAL_SATURATION = serverEnv.lexicalSaturation;

/** Floor applied to a row whose city the question names, in lexical mode. */
const CITY_MATCH_FLOOR = serverEnv.cityMatchFloor;

/**
 * How much a row's source-authority (course/policy vs. blog) can move ranking.
 *
 * Additive on `boost`, same as the lexical/city/title boosts below — never on
 * `dense`/`topScore`, so the confidence gate's calibration is untouched by a
 * change that is about re-ranking, not about whether to answer at all.
 */
const AUTHORITY_WEIGHT = serverEnv.authorityWeight;

let extractorPromise: Promise<FeatureExtractionPipeline | null> | null = null;

/**
 * Loads the sentence model, or resolves `null` when it is unavailable.
 *
 * Resolving rather than rejecting is deliberate: the failure is expected on
 * serverless, and every caller should degrade to lexical rather than surface
 * an error. The promise is cached, so a failed load is not retried on every
 * request — which would add a multi-second download attempt to each one.
 */
async function loadExtractor(): Promise<FeatureExtractionPipeline | null> {
  try {
    // Imported dynamically, inside the try: @xenova/transformers pulls in
    // onnxruntime-node, whose native binding fails to load on a serverless
    // runtime. As a static top-level import that throw happens during module
    // evaluation — before any handler runs — and the route 500s instead of
    // degrading. Deferring it turns a dead endpoint into a lexical answer.
    const { pipeline } = await import('@xenova/transformers');
    return await pipeline('feature-extraction', MODEL, { quantized: true });
  } catch (error) {
    if (MODE === 'dense') throw error;
    console.warn(
      `[retrieval] embedding model unavailable, using lexical search: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

function getExtractor(): Promise<FeatureExtractionPipeline | null> {
  if (MODE === 'lexical') return Promise.resolve(null);
  // Cached, so a failed load is not retried on every request.
  extractorPromise ??= loadExtractor();
  return extractorPromise;
}

/**
 * Boost applied to a centre row whose city the question names.
 *
 * Large on purpose, and safe because it only fires on an exact city-name
 * match. Every "Jetking centre in X" row is the same sentence with one word
 * changed, so their vectors sit within ~0.05 cosine of each other and the
 * model cannot tell Kolkata from Kanpur. Nothing short of an entity match
 * separates them reliably.
 */
const CITY_BOOST = serverEnv.cityBoost;

/**
 * Exact programme names must beat semantically similar programmes.
 *
 * Sentence embeddings correctly understand that "Cloud & DevOps Engineer"
 * and "Cloud Computing with AI" are related, but that is harmful when the
 * user names one and asks for an exact fact such as duration. This bounded
 * title-coverage boost resolves the entity first and leaves dense similarity
 * to rank the answer facet within that entity.
 */
const ENTITY_TITLE_BOOST = 0.18;

function titleCoverage(query: string, title?: string): number {
  if (!title) return 0;
  const queryText = ` ${query.toLowerCase().replace(/[^a-z0-9+]+/g, ' ')} `;
  const acronymMatch = (title.match(/\b[A-Z][A-Z0-9+]{1,4}\b/g) ?? []).some((acronym) =>
    queryText.includes(` ${acronym.toLowerCase()} `),
  );
  const queryTerms = new Set(tokenize(query));
  const titleTerms = [...new Set(tokenize(title))].filter(
    (term) => !['jetking', 'course', 'program', 'programme', 'certified', 'training'].includes(term),
  );
  if (titleTerms.length < 2) return acronymMatch ? 1 : 0;
  const matched = titleTerms.filter((term) => queryTerms.has(term)).length;
  const lexicalCoverage = matched >= 2 ? matched / titleTerms.length : 0;
  return acronymMatch ? Math.max(lexicalCoverage, 1) : lexicalCoverage;
}

interface IndexItem {
  type: string;
  text: string;
  /** Site-relative source path, when the item came from a structured record. */
  path?: string;
  title?: string;
  /** Set on centre rows; the entity key for city-aware boosting. */
  city?: string;
  /**
   * Source-authority weight, assigned per type at index-build time (see
   * scripts/build-index.mjs). 1 = neutral; absent on older index files, which
   * is treated the same as 1 so this is backward compatible without a rebuild.
   */
  authority?: number;
  source?: string;
}

/** Source of the clean per-programme records generated from the site's own content. */
const STRUCTURED_SOURCE = 'website-content-source';

/**
 * Words visitors use for a facet that its structured record never says.
 *
 * "How long is BCA…? …runs for 3 years." is the exact answer to "how long is
 * the BCA course", yet it lacks "course", so lexical coverage ranked it below
 * scraped pages that repeat the word. Indexed alongside the record only.
 */
const FACET_VOCABULARY: Record<string, string> = {
  course: 'course',
  duration: 'course duration long',
};

interface Store {
  dim: number;
  items: IndexItem[];
  vectors: Float32Array;
  lexical: Bm25Index;
  /** Lowercased city name -> indices of every row for that city. */
  cityRows: Map<string, number[]>;
}

let store: Store | null = null;
/**
 * Locates and reads the embedding index.
 *
 * The file is included by Next's output tracing rather than bundled, so it is
 * found on disk — and `process.cwd()` is not guaranteed to be the project
 * root in every deployment target. Trying a short candidate list, and failing
 * with the paths that were actually attempted, turns a silent "no answers"
 * into something diagnosable from a log line.
 */
function readIndexFile(): string {
  const relative = path.join('src', 'content', 'jetking-embeddings.json');
  const candidates = [
    ...(serverEnv.indexPath ? [serverEnv.indexPath] : []),
    path.join(process.cwd(), relative),
    path.join(process.cwd(), '.next', 'server', relative),
    path.join(process.cwd(), '..', relative),
  ];

  for (const candidate of candidates) {
    try {
      return readFileSync(candidate, 'utf8');
    } catch {
      // Try the next location.
    }
  }

  const tried = candidates.map((candidate) => `  ${candidate}`).join('\n');
  throw new Error(
    `Embedding index not found. Tried:\n${tried}\n` +
      'Set JK_INDEX_PATH to an absolute path, or run `npm run build:index -- --embed`.',
  );
}

function getStore(): Store {
  if (store) return store;

  const raw = JSON.parse(readIndexFile()) as {
    dim: number;
    items: IndexItem[];
    vectors: string;
  };

  const buf = Buffer.from(raw.vectors, 'base64');
  const vectors = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

  // Built once per process, alongside the vectors it mirrors. Index position is
  // the id, so a lexical hit maps straight back to its dense counterpart.
  const lexical = new Bm25Index();
  raw.items.forEach((item, i) => {
    const newline = item.text.indexOf('\n');
    const heading = newline > 0 ? item.text.slice(0, newline) : '';
    const body = newline > 0 ? item.text.slice(newline + 1) : item.text;
    const facet = item.source === STRUCTURED_SOURCE ? (FACET_VOCABULARY[item.type] ?? '') : '';
    lexical.add(String(i), [
      { text: heading, boost: 3 },
      { text: item.title ?? '', boost: 2 },
      { text: body, boost: 1 },
      { text: facet, boost: 1 },
    ]);
  });

  const cityRows = new Map<string, number[]>();
  raw.items.forEach((item, i) => {
    if (!item.city) return;
    const key = item.city.toLowerCase();
    const rows = cityRows.get(key);
    if (rows) rows.push(i);
    else cityRows.set(key, [i]);
  });

  store = { dim: raw.dim, items: raw.items, vectors, lexical, cityRows };
  return store;
}

/** Cities named in the question, matched on whole words only. */
function citiesIn(query: string, cityRows: Map<string, number[]>): number[] {
  const haystack = ` ${query.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  const rows: number[] = [];

  for (const [city, indices] of cityRows) {
    if (haystack.includes(` ${city} `)) rows.push(...indices);
  }

  return rows;
}

interface SemanticHit {
  type: string;
  text: string;
  /**
   * Fused ranking score — dense cosine plus the lexical and entity boosts.
   *
   * Callers re-sort by this after applying their own topic weighting, so it
   * has to carry the fusion. Returning raw cosine here silently threw the
   * fusion away: "a centre in Kolkata" ranked Kanpur first because every
   * "Jetking centre in X" row has near-identical cosine.
   */
  score: number;
  /** Raw cosine, for callers that need the unmodified similarity. */
  denseScore: number;
  /** Site-relative source path, when the hit came from a structured record. */
  path?: string;
  title?: string;
}

type RetrievalMode = 'dense' | 'lexical';

export interface SemanticResult {
  /** Which path produced this result — useful for diagnosing a deployment. */
  mode: RetrievalMode;
  /**
   * Best *dense* cosine score. Kept as pure cosine so the caller's confidence
   * gate keeps its calibration — fusion changes ordering, not the gate.
   */
  topScore: number;
  hits: SemanticHit[];
  /** Total items in the local knowledge base (for the reasoning display). */
  size: number;
}

/**
 * Maps a BM25 score onto 0..1 so it can be compared against the same
 * confidence gate as cosine similarity.
 *
 * BM25 is unbounded and scales with query length, so a raw score cannot be
 * thresholded. Saturating it keeps the ordering identical while producing a
 * number the caller can gate on — which is what stops an off-topic question
 * being answered when the model is unavailable.
 */
function saturate(score: number): number {
  return score <= 0 ? 0 : score / (score + LEXICAL_SATURATION);
}

/** Loads the index and sentence model ahead of the first question, which otherwise pays ~30s for both. */
export async function warmRetrieval(): Promise<void> {
  getStore();
  await getExtractor();
}

export async function semanticSearch(query: string, k = 6): Promise<SemanticResult> {
  const extractor = await getExtractor();
  const { dim, items, vectors, lexical, cityRows } = getStore();

  // Lexical signal is computed in both modes: it is the whole ranking when
  // there is no model, and the tie-breaker for exact entities when there is.
  const lexicalHits = lexical.search(query, LEXICAL_DEPTH);
  const boost = new Map<number, number>();
  const lexicalScore = new Map<number, number>();

  lexicalHits.forEach((hit, rank) => {
    const row = Number(hit.id);
    // Rank-based, not score-based: BM25 magnitudes scale with document length,
    // so mixing them into cosine directly lets a long page outrank a short
    // exact answer. Rank decay keeps the boost bounded.
    boost.set(row, LEXICAL_WEIGHT * (1 - rank / LEXICAL_DEPTH));
    // Coverage-weighted: a high score from one incidental term match is not
    // confidence, and without this an off-topic question clears the gate.
    lexicalScore.set(row, saturate(hit.score) * hit.coverage);
  });

  const cityHits = citiesIn(query, cityRows);
  for (const row of cityHits) boost.set(row, (boost.get(row) ?? 0) + CITY_BOOST);

  items.forEach((item, row) => {
    if (item.authority !== undefined && item.authority !== 1) {
      boost.set(row, (boost.get(row) ?? 0) + (item.authority - 1) * AUTHORITY_WEIGHT);
    }
    if (item.type === 'centre') return;
    const coverage = titleCoverage(query, item.title);
    if (coverage >= 0.5) {
      boost.set(row, (boost.get(row) ?? 0) + ENTITY_TITLE_BOOST * coverage);
    }
  });

  const dense = new Float32Array(items.length);
  let topScore = 0;

  if (extractor) {
    const out = await extractor(query, { pooling: 'mean', normalize: true });
    const q = out.data as Float32Array;

    for (let i = 0; i < items.length; i++) {
      let sum = 0;
      const off = i * dim;
      for (let d = 0; d < dim; d++) sum += q[d]! * vectors[off + d]!;
      dense[i] = sum;
      if (sum > topScore) topScore = sum;
    }
  } else {
    // No model: the saturated BM25 score stands in for cosine, so the gate
    // keeps working and off-topic questions are still refused.
    for (const [row, confidence] of lexicalScore) {
      dense[row] = confidence;
      if (confidence > topScore) topScore = confidence;
    }
    // A named city is a certain match even if few other terms hit.
    for (const row of cityHits) {
      if (dense[row]! < CITY_MATCH_FLOOR) dense[row] = CITY_MATCH_FLOOR;
      if (dense[row]! > topScore) topScore = dense[row]!;
    }
  }

  const ranked: { i: number; s: number }[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    ranked[i] = { i, s: dense[i]! + (boost.get(i) ?? 0) };
  }
  ranked.sort((a, b) => b.s - a.s);

  const hits = ranked.slice(0, k).map(({ i, s }) => {
    const item = items[i]!;
    return {
      type: item.type,
      text: item.text,
      score: s,
      denseScore: dense[i]!,
      ...(item.path ? { path: item.path } : {}),
      ...(item.title ? { title: item.title } : {}),
    };
  });

  return { topScore, hits, size: items.length, mode: extractor ? 'dense' : 'lexical' };
}
