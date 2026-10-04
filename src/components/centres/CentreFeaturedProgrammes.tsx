import type { CentreFeaturedProgramme, Course } from '@/lib/content/types';
import { CourseCard } from '@/components/CourseCard';

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

const GRID = 'mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3';

/** Featured programmes for this centre. Heading level is h3: the parent section carries the h2. */
export function CentreFeaturedProgrammes({
  programmes,
  courses,
  centreSlug,
}: {
  programmes: CentreFeaturedProgramme[];
  courses: Course[];
  centreSlug: string;
}) {
  if (!programmes.length) return null;

  return (
    <div>
      <h3 id="centre-featured" className="text-[18px] font-extrabold text-[var(--k-ink)]">
        Featured courses
      </h3>
      <ul className={GRID}>
        {programmes.map((prog, i) => {
          const course = courseForProgramme(prog.title, courses);
          return (
            <li key={prog.title} className="min-w-0">
              <CourseCard
                course={{
                  slug: course?.slug ?? '',
                  title: prog.title,
                  level: course?.level ?? 'certification',
                  duration: prog.duration ?? course?.duration ?? '',
                  eligibility: course?.eligibility ?? prog.subtitle ?? '',
                  heroImage: course?.heroImage,
                }}
                surface="centre-featured"
                href={course ? undefined : `/enquiry?centre=${centreSlug}`}
                cta={course ? 'View course' : 'Enquire now'}
                tag={prog.mode ?? prog.subtitle}
                badge={i === 0 ? 'Featured' : undefined}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The rest of the catalogue offered at this centre. */
export function CentreCatalogueProgrammes({
  courses,
  title = 'All courses',
}: {
  courses: Course[];
  title?: string;
}) {
  return (
    <div>
      <h3 id="centre-all-prog" className="text-[18px] font-extrabold text-[var(--k-ink)]">
        {title}
      </h3>
      {courses.length ? (
        <ul className={GRID}>
          {courses.map((course) => (
            <li key={course.slug} className="min-w-0">
              <CourseCard course={course} surface="centre-courses" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[15px] text-[var(--k-ink-2)]">Ask a counsellor which courses run at this centre.</p>
      )}
    </div>
  );
}
