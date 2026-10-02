import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  Centre,
  City,
  Course,
  Faculty,
  Faq,
  HomepageVariant,
  PersonaRule,
  PlacementPage,
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
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CmsCollection, PublishStatus } from '@/lib/cms/types';

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
  };
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

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

  try {
    return JSON.parse(raw) as CmsStore;
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

export async function readCmsStore(): Promise<CmsStore> {
  if (isSupabaseConfigured()) {
    // Production path hooks in via getSupabase() on write; file store is the
    // offline source of truth until tables are fully wired.
  }
  return ensureFileStore();
}

export async function listCollection<K extends CmsCollection>(
  collection: K,
  opts?: { publishedOnly?: boolean },
): Promise<CmsStore[K]> {
  const store = await readCmsStore();
  const rows = store[collection];
  if (opts?.publishedOnly) {
    return rows.filter((row) => row.status === 'published') as CmsStore[K];
  }
  return rows;
}

export class DuplicateIdError extends Error {
  constructor(id: string) {
    super(`A record with id "${id}" already exists.`);
    this.name = 'DuplicateIdError';
  }
}

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
): Promise<void> {
  return serialized(async () => {
    const store = await readCmsStore();
    const rows = [...(store[collection] as unknown as Record<string, unknown>[])];
    const id = record[idKey];

    // Renaming: the old row still carries `previousId`, not `id`, so it can
    // never itself trip this check — a hit here means a *different* row already
    // owns the new id.
    const renaming = previousId !== undefined && previousId !== id;
    if (renaming && rows.some((r) => r[idKey] === id)) {
      throw new DuplicateIdError(String(id));
    }

    const targetIdx = rows.findIndex((r) => r[idKey] === (renaming ? previousId : id));
    if (targetIdx >= 0) rows[targetIdx] = record;
    else rows.push(record);
    (store as unknown as Record<string, unknown>)[collection] = rows;

    const supabase = getSupabase();
    if (supabase) {
      if (renaming && targetIdx >= 0) {
        await supabase.from(collection).delete().eq(idKey, previousId);
      }
      await supabase.from(collection).upsert(record as never);
    }

    await writeFileStore(store);
  });
}

export async function deleteRecord(
  collection: CmsCollection,
  idKey: string,
  id: string,
): Promise<void> {
  return serialized(async () => {
    const store = await readCmsStore();
    const rows = (store[collection] as unknown as Record<string, unknown>[]).filter(
      (r) => r[idKey] !== id,
    );
    (store as unknown as Record<string, unknown>)[collection] = rows;

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from(collection).delete().eq(idKey, id);
    }

    await writeFileStore(store);
  });
}

export async function resetCmsStoreFromFixtures(): Promise<CmsStore> {
  return serialized(async () => {
    const seeded = seedStore();
    await writeFileStore(seeded);
    return seeded;
  });
}
