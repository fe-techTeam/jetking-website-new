import type {
  Centre,
  City,
  ContentSource,
  Course,
  Faculty,
  Faq,
  HomepageVariant,
  PersonaRule,
  PlacementPage,
  Policy,
  Post,
  TrustSignal,
} from '../types';
import { courses } from '../fixtures/courses';
import { withCourseSections } from '../fixtures/courses-sections';
import { centres, cities } from '../fixtures/locations';
import { posts } from '../fixtures/posts';
import { faqs } from '../fixtures/faqs';
import { trustSignals } from '../fixtures/trust';
import { faculty, homepageVariants, personaRules, placements, policies } from '../fixtures/kb';
import { legalDefaults } from '../fixtures/legal';
import { aboutFallback, placementsFallback } from '../page-content';

/**
 * Repo-fixture content source — works offline without Admin CMS / Supabase.
 */
export const localSource: ContentSource = {
  name: 'local',

  async listCourses() {
    return withCourseSections(courses);
  },

  async getCourse(slug: string): Promise<Course | null> {
    const course = courses.find((c) => c.slug === slug);
    return course ? withCourseSections([course])[0]! : null;
  },

  async listCities() {
    return [...cities].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCity(slug: string): Promise<City | null> {
    return cities.find((c) => c.slug === slug) ?? null;
  },

  async listCentres(opts): Promise<Centre[]> {
    const all = opts?.citySlug ? centres.filter((c) => c.citySlug === opts.citySlug) : centres;
    return [...all].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCentre(citySlug: string, slug: string): Promise<Centre | null> {
    return centres.find((c) => c.citySlug === citySlug && c.slug === slug) ?? null;
  },

  async getCentreBySlug(slug: string): Promise<Centre | null> {
    return centres.find((c) => c.slug === slug) ?? null;
  },

  async listPosts(opts): Promise<Post[]> {
    let list = [...posts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    if (opts?.kind) list = list.filter((p) => (p.kind ?? 'blog') === opts.kind);
    if (opts?.category) list = list.filter((p) => p.category === opts.category);
    if (opts?.limit !== undefined) list = list.slice(0, opts.limit);
    return list;
  },

  async getPost(slug: string): Promise<Post | null> {
    return posts.find((p) => p.slug === slug) ?? null;
  },

  async listFaqs(): Promise<Faq[]> {
    return [...faqs];
  },

  async listTrustSignals(): Promise<TrustSignal[]> {
    return trustSignals.filter((signal) => signal.verified && Boolean(signal.source));
  },

  async listPolicies(): Promise<Policy[]> {
    return [...policies];
  },

  async getPolicy(slug: string): Promise<Policy | null> {
    return policies.find((p) => p.slug === slug) ?? null;
  },

  async listFaculty(): Promise<Faculty[]> {
    return [...faculty];
  },

  async getFaculty(slug: string): Promise<Faculty | null> {
    return faculty.find((f) => f.slug === slug) ?? null;
  },

  async listPlacements(): Promise<PlacementPage[]> {
    return [...placements];
  },

  async getPlacement(id: string): Promise<PlacementPage | null> {
    return placements.find((p) => p.id === id) ?? null;
  },

  async listHomepageVariants(): Promise<HomepageVariant[]> {
    return [...homepageVariants];
  },

  async getHomepageVariant(id: string): Promise<HomepageVariant | null> {
    return homepageVariants.find((v) => v.id === id) ?? null;
  },

  async listPersonaRules(): Promise<PersonaRule[]> {
    return [...personaRules].filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  },

  async getAboutPage() {
    return aboutFallback();
  },

  async getPlacementsPage() {
    return placementsFallback();
  },

  async getPageCopyOverrides() {
    return {};
  },

  async listLegalDocuments() {
    return [...legalDefaults];
  },

  async getLegalDocument(slug: string) {
    return legalDefaults.find((d) => d.slug === slug) ?? null;
  },
};
