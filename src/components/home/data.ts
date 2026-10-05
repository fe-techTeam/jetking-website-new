import 'server-only';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { content } from '@/lib/content';
import type {
  AboutPageContent,
  City,
  Course,
  Faq,
  HomepageVariant,
  PlacementsPageContent,
  Post,
  TrustSignal,
} from '@/lib/content/types';

/**
 * One content read, shared by the hero (`HomeV2`) and the section stack below it
 * (`HomeSections`, `v3/`).
 *
 * The hero itself only ever needed counts — this is why the doc comment used to say
 * "the leads never iterate the catalogue." That stopped being true once the homepage
 * grew a programme showcase, a centre grid, and a blog teaser: each needs a
 * bounded, curated slice of the catalogue (featured courses, cities, latest posts),
 * not the whole of it and not arbitrary iteration.
 */
export interface HomeData {
  /** About page copy — reused by Explore. */
  about: AboutPageContent;
  /** Placements page copy (stories, disclaimer, figures) — `PlacementProof`, Explore. */
  placements: PlacementsPageContent;
  counts: { courses: number; centres: number; cities: number };
  /** Verified signals only — unverified claims never leave the content source. */
  trust: TrustSignal[];
  variants: HomepageVariant[];
  /** Resolved lead photograph, or `undefined` to render the labelled frame. */
  heroImage?: string;
  /** Full catalogue — `ProgramShowcase` filters to `featured`. */
  courses: Course[];
  /** Sorted by name — `CentreNetwork` shows a curated slice. */
  cities: City[];
  /** A handful of the most common questions across topics — `HomeFaq`. */
  faqs: Faq[];
  /** Most recent posts, already limited — `BlogTeaser`. */
  posts: Post[];
  /** Slim centre records for the map — `CentreNetwork`. */
  centres: Array<{ slug: string; name: string; citySlug: string; locality: string }>;
}

/**
 * Where a lead's imagery comes from.
 *
 * The CMS wins: whatever `banner.imageUrl` the default homepage variant carries is
 * what ships in the portrait slot. Otherwise we fall back to files dropped under
 * `public/home/`, so swapping artwork is a file copy rather than a code change —
 * which matters because the person with the photograph is not usually the person
 * with the repo.
 *
 * Resolved once at module scope: `public/` is fixed for the lifetime of a build,
 * so there is nothing to re-check per request.
 */
const IMAGE_EXTENSIONS = ['avif', 'webp', 'jpg', 'jpeg', 'png'] as const;

function droppedImage(basename: string): string | undefined {
  for (const ext of IMAGE_EXTENSIONS) {
    if (existsSync(join(process.cwd(), 'public', 'home', `${basename}.${ext}`))) {
      return `/home/${basename}.${ext}`;
    }
  }
  return undefined;
}

const heroPortrait = droppedImage('hero');

/** One question per topic a visitor asks before enrolling, then more of the same until there are six. Franchise questions have their own page. */
const FAQ_TOPICS: Faq['topic'][] = ['admissions', 'fees', 'placement', 'courses', 'centres'];

function pickHomeFaqs(all: Faq[]): Faq[] {
  const eligible = all.filter((f) => f.topic !== 'franchise');
  const firstPerTopic = FAQ_TOPICS.map((topic) => eligible.find((f) => f.topic === topic)).filter((f): f is Faq => Boolean(f));
  const rest = eligible.filter((f) => !firstPerTopic.includes(f));
  return [...firstPerTopic, ...rest].slice(0, 6);
}

export async function loadHomeData(): Promise<HomeData> {
  const [courses, cities, centres, trust, variants, posts, about, placements, allFaqs] = await Promise.all([
    content.listCourses(),
    content.listCities(),
    content.listCentres(),
    content.listTrustSignals(),
    content.listHomepageVariants(),
    content.listPosts({ limit: 3 }),
    content.getAboutPage(),
    content.getPlacementsPage(),
    content.listFaqs(),
  ]);

  const defaultVariant = variants.find((v) => v.id === 'default') ?? variants[0];

  return {
    about,
    placements,
    counts: { courses: courses.length, centres: centres.length, cities: cities.length },
    trust,
    variants,
    heroImage: defaultVariant?.banner?.imageUrl ?? heroPortrait,
    courses,
    cities,
    posts,
    faqs: pickHomeFaqs(allFaqs),
    centres: centres.map((c) => ({ slug: c.slug, name: c.name, citySlug: c.citySlug, locality: c.locality })),
  };
}
