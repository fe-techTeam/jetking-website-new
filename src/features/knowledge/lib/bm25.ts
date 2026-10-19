import { tokenize, tokenizeQueryGroups } from '@/features/knowledge/lib/tokenize';

/**
 * Okapi BM25 over an in-memory corpus.
 *
 * The knowledge base is a few thousand short documents, so a full inverted
 * index is unnecessary — scoring is linear over candidate documents drawn from
 * a term→document postings map, which is both simpler and fast enough to run
 * on every keystroke.
 */

const K1 = 1.5;
const B = 0.75;

/**
 * Optimal-string-alignment distance (edits, with adjacent transpositions
 * counted as one), abandoning early once every path exceeds `limit`.
 */
function editDistance(a: string, b: string, limit: number): number {
  let previous2: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previous2[j - 2]! + 1);
      }
      current[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > limit) return limit + 1;
    previous2 = previous;
    previous = current;
  }

  return previous[b.length]!;
}

export interface IndexField {
  text: string;
  /** Term-frequency multiplier. Titles should outweigh body copy. */
  boost: number;
}

interface IndexedDocument {
  id: string;
  length: number;
  frequencies: Map<string, number>;
}

export interface ScoredHit {
  id: string;
  score: number;
  /**
   * Fraction of the query's words this document contains (0..1); a word
   * counts when the document has it or any of its synonyms.
   *
   * Score alone cannot separate "capital of France" from a real question:
   * BM25 rewards a single rare-term overlap, so one incidental match can look
   * strong. Coverage says how much of the question was actually addressed,
   * which is what makes a confidence gate possible without embeddings.
   */
  coverage: number;
}

export class Bm25Index {
  private readonly documents = new Map<string, IndexedDocument>();
  private readonly postings = new Map<string, Set<string>>();
  private totalLength = 0;
  private readonly corrections = new Map<string, string | null>();

  add(id: string, fields: readonly IndexField[]): void {
    const frequencies = new Map<string, number>();
    let length = 0;

    for (const field of fields) {
      for (const term of tokenize(field.text)) {
        frequencies.set(term, (frequencies.get(term) ?? 0) + field.boost);
        length += field.boost;

        let posting = this.postings.get(term);
        if (!posting) {
          posting = new Set();
          this.postings.set(term, posting);
        }
        posting.add(id);
      }
    }

    if (length === 0) return;

    this.documents.set(id, { id, length, frequencies });
    this.totalLength += length;
  }

  private idf(term: string): number {
    const documentFrequency = this.postings.get(term)?.size ?? 0;
    if (documentFrequency === 0) return 0;

    const total = this.documents.size;
    // Add-one form keeps the value positive for terms present in most documents.
    return Math.log(1 + (total - documentFrequency + 0.5) / (documentFrequency + 0.5));
  }

  /**
   * The most common indexed term within one edit (two for long words) of a
   * term the corpus has never seen — "secuirty" → "security", "corse" →
   * "course". Only unknown terms are corrected, so a real word is never
   * rewritten; the first letter must agree, which keeps off-topic words from
   * drifting onto unrelated vocabulary.
   */
  private correct(term: string): string | null {
    if (term.length < 5 || /\d/.test(term) || this.postings.has(term)) return null;
    const cached = this.corrections.get(term);
    if (cached !== undefined) return cached;

    const maxDistance = term.length >= 8 ? 2 : 1;
    let best: string | null = null;
    let bestFrequency = 0;
    for (const [candidate, documents] of this.postings) {
      if (candidate[0] !== term[0] || Math.abs(candidate.length - term.length) > maxDistance) continue;
      if (documents.size <= bestFrequency) continue;
      if (editDistance(term, candidate, maxDistance) <= maxDistance) {
        best = candidate;
        bestFrequency = documents.size;
      }
    }

    this.corrections.set(term, best);
    return best;
  }

  search(query: string, limit = 10): ScoredHit[] {
    const groups = tokenizeQueryGroups(query).map((group) => {
      if (group.some((term) => this.postings.has(term))) return group;
      const corrected = group.map((term) => this.correct(term)).filter((term) => term !== null);
      return corrected.length > 0 ? corrected : group;
    });
    const terms = [...new Set(groups.flat())];
    if (terms.length === 0 || this.documents.size === 0) return [];

    const averageLength = this.totalLength / this.documents.size;

    // Only documents containing at least one query term can score above zero.
    const candidates = new Set<string>();
    for (const term of terms) {
      for (const id of this.postings.get(term) ?? []) candidates.add(id);
    }

    const hits: ScoredHit[] = [];

    for (const id of candidates) {
      const document = this.documents.get(id);
      if (!document) continue;

      let score = 0;

      for (const term of terms) {
        const frequency = document.frequencies.get(term);
        if (!frequency) continue;

        const normalisation = 1 - B + (B * document.length) / averageLength;
        score += this.idf(term) * ((frequency * (K1 + 1)) / (frequency + K1 * normalisation));
      }

      const matched = groups.filter((group) =>
        group.some((term) => document.frequencies.has(term)),
      ).length;

      if (score > 0) hits.push({ id, score, coverage: matched / groups.length });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  get size(): number {
    return this.documents.size;
  }
}
