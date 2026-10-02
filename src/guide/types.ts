export type ChunkType =
  | 'course'
  | 'faq'
  | 'post'
  | 'news'
  | 'centre'
  | 'city'
  | 'policy'
  | 'faculty'
  | 'placement';

/** One retrievable unit of Jetking content. */
export interface Chunk {
  id: string;
  type: ChunkType;
  title: string;
  /** The text the model is allowed to ground on. */
  text: string;
  /** Where the visitor can verify this — every answer cites real URLs. */
  url: string;
  /** Source entity slug, used for post-generation entity verification. */
  sourceSlug?: string;
}
