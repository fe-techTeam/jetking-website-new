import 'server-only';
import type {
  Centre,
  City,
  ContentSource,
  Course,
  Faculty,
  Faq,
  HomepageVariant,
  LegalDoc,
  PersonaRule,
  PlacementPage,
  Policy,
  Post,
  TrustSignal,
} from '../types';
import { listCollection } from '@/lib/cms/store';
import { legalDefaults } from '../fixtures/legal';
import { aboutFallback, normalizeAbout, normalizePlacements, placementsFallback } from '../page-content';

function published<T extends { status: string }>(rows: T[]): Omit<T, 'status'>[] {
  return rows.map(({ status: _s, ...rest }) => rest);
}

/**
 * Admin CMS ContentSource — published records only.
 */
export const adminSource: ContentSource = {
  name: 'admin',

  async listCourses() {
    return published(await listCollection('courses', { publishedOnly: true })) as Course[];
  },

  async getCourse(slug: string) {
    const rows = published(await listCollection('courses', { publishedOnly: true })) as Course[];
    return rows.find((c) => c.slug === slug) ?? null;
  },

  async listCities() {
    const rows = published(await listCollection('cities', { publishedOnly: true })) as City[];
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCity(slug: string) {
    const rows = published(await listCollection('cities', { publishedOnly: true })) as City[];
    return rows.find((c) => c.slug === slug) ?? null;
  },

  async listCentres(opts) {
    let rows = published(await listCollection('centres', { publishedOnly: true })) as Centre[];
    if (opts?.citySlug) rows = rows.filter((c) => c.citySlug === opts.citySlug);
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCentre(citySlug: string, slug: string) {
    const rows = published(await listCollection('centres', { publishedOnly: true })) as Centre[];
    return rows.find((c) => c.citySlug === citySlug && c.slug === slug) ?? null;
  },

  async getCentreBySlug(slug: string) {
    const rows = published(await listCollection('centres', { publishedOnly: true })) as Centre[];
    return rows.find((c) => c.slug === slug) ?? null;
  },

  async listPosts(opts) {
    let list = published(await listCollection('posts', { publishedOnly: true })) as Post[];
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (opts?.kind) list = list.filter((p) => (p.kind ?? 'blog') === opts.kind);
    if (opts?.category) list = list.filter((p) => p.category === opts.category);
    if (opts?.limit !== undefined) list = list.slice(0, opts.limit);
    return list;
  },

  async getPost(slug: string) {
    const rows = published(await listCollection('posts', { publishedOnly: true })) as Post[];
    return rows.find((p) => p.slug === slug) ?? null;
  },

  async listFaqs() {
    return published(await listCollection('faqs', { publishedOnly: true })) as Faq[];
  },

  async listTrustSignals() {
    const rows = published(
      await listCollection('trust_signals', { publishedOnly: true }),
    ) as TrustSignal[];
    return rows.filter((s) => s.verified && Boolean(s.source));
  },

  async listPolicies() {
    return published(await listCollection('policies', { publishedOnly: true })) as Policy[];
  },

  async getPolicy(slug: string) {
    const rows = published(await listCollection('policies', { publishedOnly: true })) as Policy[];
    return rows.find((p) => p.slug === slug) ?? null;
  },

  async listFaculty() {
    return published(await listCollection('faculty', { publishedOnly: true })) as Faculty[];
  },

  async getFaculty(slug: string) {
    const rows = published(await listCollection('faculty', { publishedOnly: true })) as Faculty[];
    return rows.find((f) => f.slug === slug) ?? null;
  },

  async listPlacements() {
    return published(
      await listCollection('placements', { publishedOnly: true }),
    ) as PlacementPage[];
  },

  async getPlacement(id: string) {
    const rows = published(
      await listCollection('placements', { publishedOnly: true }),
    ) as PlacementPage[];
    return rows.find((p) => p.id === id) ?? null;
  },

  async listHomepageVariants() {
    return published(
      await listCollection('homepage_variants', { publishedOnly: true }),
    ) as HomepageVariant[];
  },

  async getHomepageVariant(id: string) {
    const rows = published(
      await listCollection('homepage_variants', { publishedOnly: true }),
    ) as HomepageVariant[];
    return rows.find((v) => v.id === id) ?? null;
  },

  async listPersonaRules() {
    const rows = published(
      await listCollection('persona_rules', { publishedOnly: true }),
    ) as PersonaRule[];
    return rows.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  },

  // About, Placements and the legal pages are CMS documents, but a page must never go blank: if the
  // record is missing or still a draft, the in-repo copy is served instead of nothing.
  async getAboutPage() {
    const [record] = await listCollection('about_page', { publishedOnly: true });
    return record ? normalizeAbout(published([record])[0]!) : aboutFallback();
  },

  async getPlacementsPage() {
    const [record] = await listCollection('placements_page', { publishedOnly: true });
    return record ? normalizePlacements(published([record])[0]!) : placementsFallback();
  },

  async getPageCopyOverrides(id: string) {
    const rows = await listCollection('page_copy', { publishedOnly: true });
    return rows.find((r) => r.id === id)?.entries ?? {};
  },

  async listLegalDocuments() {
    const rows = published(await listCollection('legal_documents', { publishedOnly: true })) as LegalDoc[];
    // A document that is unpublished (or absent) falls back to its in-repo copy.
    return legalDefaults.map((fallback) => rows.find((d) => d.slug === fallback.slug) ?? fallback);
  },

  async getLegalDocument(slug: string) {
    const rows = published(await listCollection('legal_documents', { publishedOnly: true })) as LegalDoc[];
    return rows.find((d) => d.slug === slug) ?? legalDefaults.find((d) => d.slug === slug) ?? null;
  },
};
