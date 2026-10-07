import type { Centre, Course } from '@/lib/content/types';
import type { centresCopy } from '@/lib/content/copy/pages/centres';
import { CourseCard } from '@/components/CourseCard';

interface CentreCourseItem {
  key: string;
  title: string;
  kind: 'degree' | 'career';
  tag: string;
  /** Duration and mode on one line, e.g. "3 Years · Offline/Hybrid". */
  duration: string;
  href: string;
  /** Course slug for click tracking; empty when the card goes to the enquiry form. */
  slug: string;
  level: Course['level'];
  heroImage?: Course['heroImage'];
  description?: string;
}

/** Courses whose own page a centre programme title can safely point at. */
const KNOWN_SLUGS = new Set([
  'cloud-cyber-security-engineer',
  'bca-cloud-cyber-security',
  'cloud-computing-engineer-ai',
  'routing-switching-administrator',
  'cloud-computing-professional-ai',
  'pc-hardware-support',
]);

/** Centre programme titles are free text; find the catalogue course each one stands for. */
function courseForProgramme(title: string, courses: Course[]): Course | undefined {
  const key = title.toLowerCase();
  const matched = courses.find((c) => {
    if (key.includes('bca') && c.slug.includes('bca')) return true;
    if (key.includes('cyber') && c.slug.includes('cyber')) return true;
    if (key.includes('devops') && c.slug.includes('devops')) return true;
    if (key.includes('ai') && c.slug.includes('ai')) return true;
    return key.includes(c.title.toLowerCase().slice(0, 18));
  });
  if (matched && KNOWN_SLUGS.has(matched.slug)) return matched;

  const fallbackSlug =
    key.includes('bca') || (key.includes('bachelor') && key.includes('computer'))
      ? 'bca-cloud-cyber-security'
      : key.includes('mca') || key.includes('master')
        ? 'cloud-computing-professional-ai'
        : key.includes('cyber') || key.includes('security')
          ? 'cloud-cyber-security-engineer'
          : key.includes('diploma') || key.includes('cloud')
            ? 'cloud-computing-engineer-ai'
            : undefined;
  return (fallbackSlug && courses.find((c) => c.slug === fallbackSlug)) || matched;
}

const GRID = 'mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4';

/** Centre pages store "36 Months"; people say "3 Years". */
function readableDuration(raw?: string): string | undefined {
  const months = raw?.match(/^\s*(\d+)\s*months?\s*$/i);
  if (!months) return raw?.trim() || undefined;
  const n = Number(months[1]);
  if (n >= 12 && n % 12 === 0) return `${n / 12} ${n === 12 ? 'Year' : 'Years'}`;
  return `${n} ${n === 1 ? 'Month' : 'Months'}`;
}

const DEGREE_WORDS = /\b(bca|mca|bachelor|b\.?sc|degree)\b/i;

function normalise(title: string) {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function joinMeta(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' · ');
}

/**
 * The centre's courses in two lists, Degree Programs and Career Courses, each as short cards.
 * The centre's featured programmes (its own wording) come first, then the rest of the catalogue on offer.
 * Heading level is h3: the parent section carries the h2.
 */
export function CentreCourseGroups({
  centre,
  courses,
  offered,
  copy,
}: {
  centre: Centre;
  courses: Course[];
  offered: Course[];
  copy: typeof centresCopy.defaults;
}) {
  const featured = centre.featuredProgrammes ?? [];
  const featuredTitles = new Set(featured.map((p) => normalise(p.title)));
  const items: CentreCourseItem[] = [];

  for (const prog of featured) {
    const course = courseForProgramme(prog.title, courses);
    const kind: CentreCourseItem['kind'] = /degree/i.test(prog.subtitle ?? '')
      ? 'degree'
      : /career/i.test(prog.subtitle ?? '')
        ? 'career'
        : course?.level === 'degree' || DEGREE_WORDS.test(prog.title)
          ? 'degree'
          : 'career';
    items.push({
      key: prog.title,
      title: prog.title,
      kind,
      tag: kind === 'degree' ? copy['centreCourses.degreeTag'] : copy['centreCourses.careerTag'],
      duration: joinMeta(readableDuration(prog.duration ?? course?.duration), prog.mode),
      href: course ? `/courses/${course.slug}` : `/enquiry?centre=${centre.slug}`,
      slug: course?.slug ?? '',
      level: course?.level ?? (kind === 'degree' ? 'degree' : 'certification'),
      heroImage: course?.heroImage,
      description: course?.eligibility ?? prog.subtitle,
    });
  }

  for (const course of offered) {
    if (featuredTitles.has(normalise(course.title))) continue;
    const kind = course.level === 'degree' ? 'degree' : 'career';
    items.push({
      key: course.slug,
      title: course.title,
      kind,
      tag: kind === 'degree' ? copy['centreCourses.degreeTag'] : copy['centreCourses.careerTag'],
      duration: joinMeta(readableDuration(course.duration)),
      href: `/courses/${course.slug}`,
      slug: course.slug,
      level: course.level,
      heroImage: course.heroImage,
      description: course.eligibility,
    });
  }

  const groups = [
    { id: 'centre-degree', title: copy['centreCourses.degreeTitle'], list: items.filter((i) => i.kind === 'degree') },
    { id: 'centre-career', title: copy['centreCourses.careerTitle'], list: items.filter((i) => i.kind === 'career') },
  ].filter((g) => g.list.length);

  if (!groups.length) return <p className="text-[15px] text-[var(--k-ink-2)]">{copy['centreCourses.empty']}</p>;

  return (
    <>
      {groups.map((g) => (
        <div key={g.id}>
          <h3 id={g.id} className="text-[20px] font-extrabold text-[var(--k-ink)] sm:text-[22px]">
            {g.title}
          </h3>
          <ul className={GRID} aria-labelledby={g.id}>
            {g.list.map((item) => (
              <li key={item.key} className="min-w-0">
                <CourseCard
                  course={{
                    slug: item.slug,
                    title: item.title,
                    level: item.level,
                    duration: item.duration,
                    eligibility: item.description ?? '',
                    heroImage: item.heroImage,
                  }}
                  surface="centre-courses"
                  href={item.href}
                  tag={item.tag}
                  cta={copy['centreCourses.explore']}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
