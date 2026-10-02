import { buildIndex, type KnowledgeIndex } from '@/features/knowledge/lib/index-builder';
import type { KnowledgeBase } from '@/features/knowledge/types';

/**
 * Lazily loads the crawled knowledge base and builds the retrieval index once
 * per server process.
 *
 * The JSON is a few hundred KB, so it is imported dynamically — that keeps it
 * off the critical path until the first question is actually asked.
 */
let indexPromise: Promise<KnowledgeIndex> | null = null;

export function loadIndex(): Promise<KnowledgeIndex> {
  indexPromise ??= import('@/content/jetking-kb.json')
    .then((module) => buildIndex(module.default as unknown as KnowledgeBase))
    .catch((error: unknown) => {
      // Reset so a transient load failure can be retried.
      indexPromise = null;
      throw error;
    });

  return indexPromise;
}
