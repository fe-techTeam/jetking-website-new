import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  AboutPageContent,
  Announcement,
  SeoSettings,
  ChatbotSettings,
  ChatbotKnowledge,
  Centre,
  City,
  Course,
  Faculty,
  Faq,
  HomepageVariant,
  InvestorsPageContent,
  LegalDoc,
  LogoList,
  NavigationMenu,
  PageCopyRecord,
  PersonaRule,
  PlacementPage,
  PlacementsPageRecord,
  Policy,
  Post,
  TrustSignal,
} from '@/lib/content/types';
import { courses as seedCourses } from '@/lib/content/fixtures/courses';
import { withCourseSections } from '@/lib/content/fixtures/courses-sections';
import { centres as seedCentres, cities as seedCities } from '@/lib/content/fixtures/locations';
import { posts as seedPosts } from '@/lib/content/fixtures/posts';
import { faqs as seedFaqs } from '@/lib/content/fixtures/faqs';
import { trustSignals as seedTrust } from '@/lib/content/fixtures/trust';
import {
  faculty as seedFaculty,
  homepageVariants as seedVariants,
  personaRules as seedRules,
  placements as seedPlacements,
  policies as seedPolicies,
} from '@/lib/content/fixtures/kb';
import { chatbotSettingsDefaults } from '@/lib/content/fixtures/chatbot';
import { seoSettingsDefaults } from '@/lib/content/fixtures/seo-settings';
import { aboutDefaults } from '@/lib/content/fixtures/about';
import { legalDefaults } from '@/lib/content/fixtures/legal';
import { logoListDefaults } from '@/lib/content/fixtures/logo-lists';
import { navigationDefaults } from '@/lib/content/fixtures/navigation';
import { placementsDefaults } from '@/lib/content/fixtures/placements-page';
import { investorsDefaults } from '@/lib/content/fixtures/investors-page';
import { getSupabase } from '@/lib/supabase';
import type { CmsCollection, PublishStatus } from '@/lib/cms/types';
import { CMS_COLLECTIONS } from '@/lib/cms/schemas';
import { isDatabaseConfigured } from '@/lib/db/client';
import {
  deleteRecordRow,
  listRecordRows,
  resetRecordRows,
  upsertRecordRow,
} from '@/lib/cms/records-db';
import { recordRevision } from '@/lib/cms/revisions';
import { CMS_ID_KEYS } from '@/lib/cms/id-keys';
import { sanitizeRichHtml } from '@/lib/rich/html';
import { isRichHtml } from '@/lib/rich/text';
import {
  deleteLocationRow,
  isLocationCollection,
  listLocationRows,
  resetLocationRows,
  upsertLocationRow,
} from '@/lib/cms/locations-db';

export type { CmsCollection } from '@/lib/cms/types';

type WithStatus<T> = T & { status: PublishStatus };

export interface CmsStore {
  courses: WithStatus<Course>[];
  cities: WithStatus<City>[];
  centres: WithStatus<Centre>[];
  posts: WithStatus<Post>[];
  faqs: WithStatus<Faq>[];
  policies: WithStatus<Policy>[];
  faculty: WithStatus<Faculty>[];
  placements: WithStatus<PlacementPage>[];
  trust_signals: WithStatus<TrustSignal>[];
  homepage_variants: WithStatus<HomepageVariant>[];
  persona_rules: WithStatus<PersonaRule>[];
  about_page: WithStatus<AboutPageContent>[];
  placements_page: WithStatus<PlacementsPageRecord>[];
  investors_page: WithStatus<InvestorsPageContent>[];
  legal_documents: WithStatus<LegalDoc>[];
  logo_lists: WithStatus<LogoList>[];
  site_navigation: WithStatus<NavigationMenu>[];
  page_copy: WithStatus<PageCopyRecord>[];
  announcements: WithStatus<Announcement>[];
  seo_settings: WithStatus<SeoSettings>[];
  chatbot_settings: WithStatus<ChatbotSettings>[];
  chatbot_knowledge: WithStatus<ChatbotKnowledge>[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'cms', 'store.json');

function seedStore(): CmsStore {
  const published = <T,>(items: T[]): WithStatus<T>[] =>
    items.map((item) => ({ ...item, status: 'published' as const }));

  return {
    // Merge the optional enrichment sections onto each course as it is seeded.
    courses: published(withCourseSections(seedCourses)),
    cities: published(seedCities),
    centres: published(seedCentres),
    posts: published(seedPosts),
    faqs: published(seedFaqs),
    policies: published(seedPolicies),
    faculty: published(seedFaculty),
    placements: published(seedPlacements),
    trust_signals: published(seedTrust),
    homepage_variants: published(seedVariants),
    persona_rules: published(seedRules),
    about_page: published([aboutDefaults]),
    placements_page: published([placementsDefaults]),
    investors_page: published([investorsDefaults]),
    legal_documents: published(legalDefaults),
    logo_lists: published(logoListDefaults),
    // Starts as the menu that was already live, so nothing changes until an editor edits it.
    site_navigation: published(navigationDefaults),
    // No overrides until an editor changes something: every page starts on its shipped text.
    page_copy: [],
    seo_settings: published([seoSettingsDefaults]),
    chatbot_settings: published([chatbotSettingsDefaults]),
    chatbot_knowledge: [],
    // One disabled example so the editor has something to copy; nothing shows on the site until published.
    announcements: [
      {
        id: 'example-admissions-open',
        message: 'Admissions are open for the next batch.',
        linkLabel: 'Enquire now',
        linkHref: '/enquiry',
        tone: 'promo',
        startsAt: '',
        endsAt: '',
        dismissible: true,
        status: 'draft',
      },
    ],
  };
}

/**
 * A store file written before a collection existed has no key for it. Fill the gap from the in-repo
 * defaults — in memory only, so a read-only filesystem (a deployed build) still serves every page,
 * and the next save writes the full set back to disk.
 */
function withMissingCollections(store: CmsStore): CmsStore {
  const missing = CMS_COLLECTIONS.filter((key) => !Array.isArray((store as unknown as Record<string, unknown>)[key]));
  if (missing.length === 0) return store;
  // Seeding builds every collection (416 posts…), so only pay for it when something is actually absent.
  const seeded = seedStore() as unknown as Record<string, unknown>;
  const filled = { ...store } as unknown as Record<string, unknown>;
  for (const key of missing) filled[key] = seeded[key];
  return filled as unknown as CmsStore;
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

let parsedCache: { raw: string; store: CmsStore } | null = null;

async function ensureFileStore(): Promise<CmsStore> {
  let raw: string;
  try {
    raw = await fs.readFile(STORE_PATH, 'utf8');
  } catch (error) {
    // Only a missing file is a first-run condition. Any other read failure
    // (permissions, a corrupt/truncated file) must not be silently papered over
    // by reseeding — that would discard every admin edit with no warning.
    if (!isEnoent(error)) throw error;
    const seeded = seedStore();
    await writeFileStore(seeded);
    return seeded;
  }

  // A static build renders hundreds of pages and each reads several collections: re-parsing the whole
  // multi-megabyte file for every read saturates the CPU (pages blow their 60s budget). The file text is
  // the cache key, so any change on disk — this process, another instance, a hand edit — is picked up
  // immediately. Callers replace whole collections on the top-level object, never mutate the arrays, so
  // a shallow copy per read is enough to keep the cached copy clean.
  if (parsedCache && parsedCache.raw === raw) return { ...parsedCache.store };

  try {
    const store = withMissingCollections(JSON.parse(raw) as CmsStore);
    parsedCache = { raw, store };
    return { ...store };
  } catch (error) {
    console.error(
      `[cms:store] ${STORE_PATH} contains invalid JSON — refusing to reseed and discard it. Fix or delete the file manually.`,
    );
    throw error;
  }
}

/**
 * Write-to-temp-then-rename: a crash or process kill mid-write leaves the temp
 * file damaged, never the live store — `rename` is atomic on the same filesystem,
 * so readers only ever see the fully-written old or new content, never a partial
 * write (which `ensureFileStore` above would otherwise mistake for corruption and
 * refuse to recover from).
 */
async function writeFileStore(store: CmsStore): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmpPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(tmpPath, STORE_PATH);
}

/**
 * Serializes every read-modify-write against the store behind one in-process
 * queue. Without this, two concurrent saves each read the same pre-change
 * snapshot and the second writer's full-file overwrite silently discards the
 * first writer's change — not just to the collection being edited, to whatever
 * else changed in between the two reads. This fixes the common single-instance
 * case; it does not make the store safe across multiple server instances, which
 * would need a real datastore with atomic upserts (Supabase writes already run
 * alongside this when configured, but reads still come from this file).
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task, task);
  writeQueue = result.catch(() => {});
  return result;
}

/** The starting content for a database that has none yet: the file store when present, else the in-repo fixtures. Never written to disk. */
async function loadSeedStore(): Promise<CmsStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return withMissingCollections(JSON.parse(raw) as CmsStore);
  } catch {
    return seedStore();
  }
}

export async function readCmsStore(): Promise<CmsStore> {
  return ensureFileStore();
}

/** Rows of a collection from Postgres, or null when the database is not configured / reachable. */
async function listDbCollection(
  collection: CmsCollection,
  publishedOnly?: boolean,
): Promise<Record<string, unknown>[] | null> {
  if (!isDatabaseConfigured() || isLocationCollection(collection)) return null;
  return listRecordRows(collection, {
    publishedOnly,
    idKey: CMS_ID_KEYS[collection],
    seed: async () => (await loadSeedStore())[collection] as unknown as Record<string, unknown>[],
  });
}

/**
 * Defence in depth for the public site: rich FAQ answers are sanitised when saved, but rows can also arrive
 * from a database edit, an old store file or a restored revision. Pages render these with
 * dangerouslySetInnerHTML, so anything served publicly is cleaned again here (a no-op on clean HTML).
 */
export function sanitizePublicRows<T>(collection: CmsCollection, rows: T[]): T[] {
  if (collection !== 'faqs' && collection !== 'courses' && collection !== 'centres') return rows;
  const clean = (v: unknown) => (typeof v === 'string' && isRichHtml(v) ? sanitizeRichHtml(v) : v);
  return rows.map((row) => {
    const r = row as unknown as Record<string, unknown>;
    if (collection === 'faqs') return typeof r.answer === 'string' && isRichHtml(r.answer) ? ({ ...r, answer: clean(r.answer) } as T) : row;
    if (!Array.isArray(r.faqs)) return row;
    return { ...r, faqs: (r.faqs as Array<Record<string, unknown>>).map((f) => ({ ...f, answer: clean(f?.answer) })) } as T;
  });
}

export async function listCollection<K extends CmsCollection>(
  collection: K,
  opts?: { publishedOnly?: boolean },
): Promise<CmsStore[K]> {
  const rows = await listCollectionRaw(collection, opts);
  return (opts?.publishedOnly ? sanitizePublicRows(collection, rows as unknown[]) : rows) as CmsStore[K];
}

async function listCollectionRaw<K extends CmsCollection>(
  collection: K,
  opts?: { publishedOnly?: boolean },
): Promise<CmsStore[K]> {
  // Cities and centres have their own tables (empty/unreachable => file store).
  if (isLocationCollection(collection)) {
    const dbRows = await listLocationRows(collection, opts);
    if (dbRows) return dbRows as unknown as CmsStore[K];
  }
  const dbRows = await listDbCollection(collection, opts?.publishedOnly);
  if (dbRows) return dbRows as unknown as CmsStore[K];

  const store = await readCmsStore();
  const rows = store[collection];
  if (opts?.publishedOnly) {
    return rows.filter((row) => row.status === 'published') as CmsStore[K];
  }
  // A copy: the parsed file is cached and shared, so callers must not be handed its arrays to sort or push into.
  return [...rows] as CmsStore[K];
}

export class DuplicateIdError extends Error {
  constructor(id: string) {
    super(`A record with id "${id}" already exists.`);
    this.name = 'DuplicateIdError';
  }
}

const SYSTEM_ACTOR = 'system';

export async function upsertRecord(
  collection: CmsCollection,
  record: Record<string, unknown>,
  idKey: string,
  /**
   * The id this record was loaded under, if editing an existing row. Without
   * this, changing the id field in the editor (e.g. renaming a course's slug)
   * doesn't find the old row — `findIndex` looks up the *new* id, which no row
   * has yet — so the edit gets pushed as an extra row and the stale original is
   * left behind, still published, still rendering at its old URL.
   */
  previousId?: string,
  /** Who is saving — recorded in the version history. */
  actor: string = SYSTEM_ACTOR,
  /** Marks a history entry as a restore rather than an ordinary save. */
  revisionAction: 'save' | 'restore' = 'save',
): Promise<void> {
  return serialized(async () => {
    const useDb = isDatabaseConfigured() && !isLocationCollection(collection);
    const store = useDb ? null : await readCmsStore();
    // For DB-backed collections the database is the truth for duplicate/rename checks (the file copy may lag it).
    const dbRows = isLocationCollection(collection)
      ? await listLocationRows(collection)
      : useDb
        ? await listDbCollection(collection)
        : null;
    const rows = [...(dbRows ?? (store![collection] as unknown as Record<string, unknown>[]))];
    const id = record[idKey];

    // Renaming: the old row still carries `previousId`, not `id`, so it can
    // never itself trip this check — a hit here means a *different* row already
    // owns the new id.
    const renaming = previousId !== undefined && previousId !== id;
    if (renaming && rows.some((r) => r[idKey] === id)) {
      throw new DuplicateIdError(String(id));
    }
    // Creating (no previousId) over an existing id would silently overwrite that record.
    if (previousId === undefined && rows.some((r) => r[idKey] === id)) {
      throw new DuplicateIdError(String(id));
    }

    if (useDb) {
      await upsertRecordRow(collection, record, idKey, previousId, actor);
    } else {
      const targetIdx = rows.findIndex((r) => r[idKey] === (renaming ? previousId : id));
      if (targetIdx >= 0) rows[targetIdx] = record;
      else rows.push(record);
      (store as unknown as Record<string, unknown>)[collection] = rows;

      if (isLocationCollection(collection)) await upsertLocationRow(collection, record, previousId, rows);

      const supabase = getSupabase();
      if (supabase) {
        if (renaming && targetIdx >= 0) {
          await supabase.from(collection).delete().eq(idKey, previousId);
        }
        await supabase.from(collection).upsert(record as never);
      }

      await writeFileStore(store!);
    }
    await recordRevision(collection, String(id), revisionAction, record, actor);
  });
}

export async function deleteRecord(
  collection: CmsCollection,
  idKey: string,
  id: string,
  actor: string = SYSTEM_ACTOR,
): Promise<void> {
  return serialized(async () => {
    const useDb = isDatabaseConfigured() && !isLocationCollection(collection);
    // Keep the last state so the record can be restored from the trash.
    const current = (await listCollection(collection)) as unknown as Record<string, unknown>[];
    const existing = current.find((r) => r[idKey] === id);

    if (useDb) {
      await deleteRecordRow(collection, id);
    } else {
      const store = await readCmsStore();
      const rows = (store[collection] as unknown as Record<string, unknown>[]).filter((r) => r[idKey] !== id);
      (store as unknown as Record<string, unknown>)[collection] = rows;

      if (isLocationCollection(collection)) await deleteLocationRow(collection, id);

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from(collection).delete().eq(idKey, id);
      }

      await writeFileStore(store);
    }
    if (existing) await recordRevision(collection, id, 'delete', existing, actor);
  });
}

export async function resetCmsStoreFromFixtures(): Promise<CmsStore> {
  return serialized(async () => {
    const seeded = seedStore();
    if (isDatabaseConfigured()) {
      await resetRecordRows();
      await resetLocationRows('cities', seeded.cities as unknown as Record<string, unknown>[]);
      await resetLocationRows('centres', seeded.centres as unknown as Record<string, unknown>[]);
    }
    await writeFileStore(seeded);
    return seeded;
  });
}
