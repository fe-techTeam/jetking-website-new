import { fill } from './define';

/**
 * Declared SEO keys every marketing page must ship so Page text / SEO overview
 * saves are honoured by `mergeCopy` (undeclared keys are dropped).
 */
export function seoFieldDefaults(opts?: { noindex?: boolean }): Record<string, string> {
  return {
    'seo.ogImage': '',
    'seo.canonicalPath': '',
    'seo.noindex': opts?.noindex ? 'true' : 'false',
  };
}

/** Same shape under a namespace (`privacy.seo.*`) for the legal page_copy document. */
export function namespacedSeoDefaults(ns: string, opts?: { noindex?: boolean }): Record<string, string> {
  return {
    [`${ns}.seo.ogImage`]: '',
    [`${ns}.seo.canonicalPath`]: '',
    [`${ns}.seo.noindex`]: opts?.noindex ? 'true' : 'false',
  };
}

/** Build the `Seo` object `buildMetadata` expects from page_copy fields. */
export function seoFromCopy(
  c: Record<string, string>,
  fillValues?: Record<string, string | number>,
  /** Dot prefix without trailing dot — `seo` or `privacy.seo`. */
  prefix = 'seo',
) {
  const titleRaw = c[`${prefix}.title`] ?? '';
  const descRaw = c[`${prefix}.description`] ?? '';
  return {
    title: fillValues ? fill(titleRaw, fillValues) : titleRaw,
    description: fillValues ? fill(descRaw, fillValues) : descRaw,
    ogImage: c[`${prefix}.ogImage`] || undefined,
    noindex: c[`${prefix}.noindex`] === 'true',
    canonicalPath: c[`${prefix}.canonicalPath`] || undefined,
  };
}
