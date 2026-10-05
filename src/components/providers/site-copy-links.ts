/**
 * Repeating label/href blocks in the site copy (`footer.company.0.label`, `footer.company.0.href`, …)
 * read back as a list. Works on the server and in client components alike (no hooks, no directive).
 */
export function copyLinks(
  copy: Record<string, string>,
  prefix: string,
  count: number,
): Array<{ label: string; href: string }> {
  return Array.from({ length: count }, (_, i) => ({
    label: copy[`${prefix}.${i}.label`] ?? '',
    href: copy[`${prefix}.${i}.href`] ?? '',
  }));
}
