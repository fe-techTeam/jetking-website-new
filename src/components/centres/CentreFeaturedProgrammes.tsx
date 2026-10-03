import Link from 'next/link';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  Cable,
  CircleGauge,
  Clock3,
  Cloud,
  CloudCog,
  Code2,
  Cpu,
  Fingerprint,
  GitBranch,
  GraduationCap,
  LockKeyhole,
  Network,
  Radar,
  Route as RouteIcon,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type { CentreFeaturedProgramme, Course, CourseLevel } from '@/lib/content/types';

type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;
type Accent = 'cyber' | 'cloud' | 'network' | 'ai';

const ACCENT: Record<Accent, { ink: string; tint: string }> = {
  cyber: { ink: 'var(--dc-cyber)', tint: 'var(--dc-cyber-tint)' },
  cloud: { ink: 'var(--dc-cloud)', tint: 'var(--dc-cloud-tint)' },
  network: { ink: 'var(--dc-network)', tint: 'var(--dc-network-tint)' },
  ai: { ink: 'var(--dc-ai)', tint: 'var(--dc-ai-tint)' },
};

type ProgVisual = {
  accent: Accent;
  icon: LucideIcon;
  bullets: Array<{ label: string; icon: LucideIcon }>;
  courseSlug?: string;
};

const COURSE_VISUALS: Record<string, Omit<ProgVisual, 'courseSlug'>> = {
  'cloud-cyber-security-engineer': {
    accent: 'cyber',
    icon: ShieldCheck,
    bullets: [
      { label: 'Ethical Hacking & Pen Testing', icon: Fingerprint },
      { label: 'Network Security & Firewalls', icon: LockKeyhole },
      { label: 'SOC Operations & SIEM', icon: Radar },
    ],
  },
  'bca-cloud-cyber-security': {
    accent: 'cyber',
    icon: GraduationCap,
    bullets: [
      { label: 'Cloud Infrastructure Basics', icon: Cloud },
      { label: 'Cyber Security Fundamentals', icon: Shield },
      { label: 'Industry Capstone Project', icon: Workflow },
    ],
  },
  'cloud-computing-engineer-ai': {
    accent: 'cloud',
    icon: CloudCog,
    bullets: [
      { label: 'AWS / Azure Cloud Labs', icon: Cloud },
      { label: 'Containers & Kubernetes', icon: Boxes },
      { label: 'CI/CD Pipeline Practice', icon: GitBranch },
    ],
  },
  'routing-switching-administrator': {
    accent: 'network',
    icon: Network,
    bullets: [
      { label: 'Routing & Switching', icon: RouteIcon },
      { label: 'Windows & Linux Servers', icon: Server },
      { label: 'Hybrid Cloud Connectivity', icon: Cable },
    ],
  },
  'cloud-computing-professional-ai': {
    accent: 'ai',
    icon: BrainCircuit,
    bullets: [
      { label: 'Cloud AI Service Landscape', icon: Bot },
      { label: 'Model APIs & Integration', icon: Cpu },
      { label: 'Deploy & Monitor Workloads', icon: CircleGauge },
    ],
  },
  'pc-hardware-support': {
    accent: 'ai',
    icon: Code2,
    bullets: [
      { label: 'Computing Fundamentals', icon: Cpu },
      { label: 'Networking Basics', icon: Network },
      { label: 'Career Pathway Planning', icon: GraduationCap },
    ],
  },
};

const ACCENT_FALLBACK: Record<Accent, LucideIcon> = {
  cyber: ShieldCheck,
  cloud: CloudCog,
  network: Server,
  ai: BrainCircuit,
};

function modeLabel(level: CourseLevel): string {
  if (level === 'degree' || level === 'diploma') return 'Full Time';
  if (level === 'short') return 'Foundation';
  return 'Certification';
}

function visualForCourse(course: Course): ProgVisual {
  const known = COURSE_VISUALS[course.slug];
  if (known) return { ...known, courseSlug: course.slug };

  const key = `${course.slug} ${course.title}`.toLowerCase();
  const accent: Accent =
    key.includes('cyber') || key.includes('security')
      ? 'cyber'
      : key.includes('network') || key.includes('infrastructure')
        ? 'network'
        : key.includes('ai') || key.includes('foundation')
          ? 'ai'
          : 'cloud';

  const modules = course.modules?.slice(0, 3) ?? [];
  return {
    accent,
    icon: ACCENT_FALLBACK[accent],
    courseSlug: course.slug,
    bullets:
      modules.length > 0
        ? modules.map((label) => ({ label, icon: Sparkles }))
        : [
            { label: 'Industry-relevant skills', icon: Sparkles },
            { label: 'Hands-on labs & projects', icon: Workflow },
            { label: 'Placement support', icon: GraduationCap },
          ],
  };
}

function visualForFeatured(title: string, courses: Course[]): ProgVisual {
  const key = title.toLowerCase();
  const matched = courses.find((c) => {
    if (key.includes('bca') && c.slug.includes('bca')) return true;
    if (key.includes('cyber') && c.slug.includes('cyber')) return true;
    if (key.includes('devops') && c.slug.includes('devops')) return true;
    if (key.includes('ai') && c.slug.includes('ai')) return true;
    return key.includes(c.title.toLowerCase().slice(0, 18));
  });

  if (matched && COURSE_VISUALS[matched.slug]) {
    return { ...COURSE_VISUALS[matched.slug]!, courseSlug: matched.slug };
  }

  if (key.includes('bca') || (key.includes('bachelor') && key.includes('computer'))) {
    return {
      ...COURSE_VISUALS['bca-cloud-cyber-security']!,
      courseSlug: matched?.slug ?? 'bca-cloud-cyber-security',
    };
  }

  if (key.includes('mca') || key.includes('master')) {
    return {
      accent: 'ai',
      icon: BrainCircuit,
      courseSlug: matched?.slug ?? 'cloud-computing-professional-ai',
      bullets: [
        { label: 'Cloud AI Service Landscape', icon: Bot },
        { label: 'Advanced Cloud Architecture', icon: CloudCog },
        { label: 'Capstone & Placement Prep', icon: Sparkles },
      ],
    };
  }

  if (key.includes('cyber') || key.includes('security')) {
    return {
      ...COURSE_VISUALS['cloud-cyber-security-engineer']!,
      courseSlug: matched?.slug ?? 'cloud-cyber-security-engineer',
    };
  }

  if (key.includes('diploma') || key.includes('cloud')) {
    return {
      ...COURSE_VISUALS['cloud-computing-engineer-ai']!,
      courseSlug: matched?.slug ?? 'cloud-computing-engineer-ai',
    };
  }

  return {
    accent: 'ai',
    icon: Sparkles,
    courseSlug: matched?.slug,
    bullets: [
      { label: 'Industry-relevant skills', icon: Sparkles },
      { label: 'Hands-on labs & projects', icon: Workflow },
      { label: 'Placement support', icon: GraduationCap },
    ],
  };
}

function ProgrammeCardShell({
  href,
  featured,
  badgeLabel,
  duration,
  mode,
  title,
  subtitle,
  visual,
  ctaLabel = 'Explore Course',
}: {
  href: Route;
  featured?: boolean;
  badgeLabel?: string;
  duration?: string;
  mode?: string;
  title: string;
  subtitle?: string;
  visual: ProgVisual;
  ctaLabel?: string;
}) {
  const theme = ACCENT[visual.accent];
  const CoverIcon = visual.icon;

  return (
    <article className="relative h-full">
      <Link
        href={href}
        className="centres-clip-shell centres-clip-interactive group/course"
      >
        <div className="centres-clip-card relative flex h-full min-h-[340px] flex-col overflow-hidden p-5 text-left sm:min-h-[360px] sm:p-6 lg:min-h-0">
          {featured && badgeLabel ? (
            <span className="centres-course-badge">
              <Sparkles className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
              {badgeLabel}
            </span>
          ) : null}

          <div className={`flex flex-wrap items-center gap-2 ${featured ? 'max-w-[72%]' : ''}`}>
            {duration ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-surface)] px-2 py-0.5 text-[12px] font-semibold text-[var(--dc-ink-muted)]">
                <Clock3 className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                {duration}
              </span>
            ) : null}
            {mode ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-bold"
                style={{ background: theme.tint, color: theme.ink }}
              >
                {mode}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-[color-mix(in_srgb,var(--dc-hairline-strong)_80%,transparent)] sm:h-12 sm:w-12"
              style={{ background: theme.tint, color: theme.ink }}
            >
              <CoverIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
            </span>
            <h3 className="min-w-0 flex-1 font-display text-[16px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--dc-ink)] sm:text-[17px]">
              {title}
            </h3>
          </div>

          {subtitle ? (
            <p className="mt-2 text-[14px] text-[var(--dc-ink-muted)]">{subtitle}</p>
          ) : null}

          <ul className="mt-4 flex flex-1 flex-col gap-0 border-t border-[var(--dc-hairline-strong)]/60 pt-1">
            {visual.bullets.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2.5 border-b border-[var(--dc-hairline-strong)]/40 py-2.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: theme.tint, color: theme.ink }}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                </span>
                <span className="min-w-0 flex-1 text-[12.5px] leading-snug font-semibold text-[var(--dc-ink-secondary)] sm:text-[13px]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <span className="mt-auto inline-flex items-center justify-between gap-3 border-t border-[var(--dc-hairline-strong)] pt-4 text-[14px] font-bold">
            <span style={{ color: theme.ink }}>{ctaLabel}</span>
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-hover/course:translate-x-0.5"
              style={{ background: theme.ink }}
            >
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}

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

  const cols =
    programmes.length === 1
      ? 'sm:grid-cols-1 max-w-md'
      : programmes.length === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 xl:grid-cols-3';

  return (
    <section aria-labelledby="centre-featured">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)] uppercase">
            At this centre
          </p>
          <h2
            id="centre-featured"
            className="section-title mt-1.5 inline-flex items-center gap-2.5 font-display text-[var(--dc-ink)]"
          >
            <Sparkles
              className="h-5 w-5 text-[var(--dc-accent-soft)] sm:h-6 sm:w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Featured courses
          </h2>
        </div>
        <span className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--dc-ink-muted)] uppercase">
          {programmes.length}
        </span>
      </div>

      <ul className={`grid gap-4 ${cols}`}>
        {programmes.map((prog, i) => {
          const visual = visualForFeatured(prog.title, courses);
          const href = visual.courseSlug
            ? (`/courses/${visual.courseSlug}` as Route)
            : (`/enquiry?centre=${centreSlug}` as Route);
          return (
            <li key={prog.title} className="min-w-0">
              <ProgrammeCardShell
                href={href}
                featured={i === 0}
                badgeLabel="Featured"
                duration={prog.duration}
                mode={prog.mode ?? prog.subtitle}
                title={prog.title}
                subtitle={prog.subtitle && prog.mode ? prog.subtitle : undefined}
                visual={visual}
                ctaLabel={visual.courseSlug ? 'Explore Course' : 'Enquire Now'}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CentreCatalogueProgrammes({
  courses,
  title = 'All courses',
}: {
  courses: Course[];
  title?: string;
}) {
  if (!courses.length) {
    return (
      <section aria-labelledby="centre-all-prog">
        <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)] uppercase">
          Catalogue
        </p>
        <h2
          id="centre-all-prog"
          className="section-title mt-1.5 font-display text-[var(--dc-ink)]"
        >
          {title}
        </h2>
        <p className="mt-4 text-[14px] text-[var(--dc-ink-secondary)]">
          Ask a counsellor which courses run at this centre.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="centre-all-prog">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)] uppercase">
            Catalogue
          </p>
          <h2
            id="centre-all-prog"
            className="section-title mt-1.5 inline-flex items-center gap-2.5 font-display text-[var(--dc-ink)]"
          >
            <GraduationCap
              className="h-5 w-5 text-[var(--dc-accent-soft)] sm:h-6 sm:w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {title}
          </h2>
        </div>
        <span className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--dc-ink-muted)] uppercase">
          {courses.length}
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <li key={course.slug} className="min-w-0">
            <ProgrammeCardShell
              href={`/courses/${course.slug}` as Route}
              duration={course.duration}
              mode={modeLabel(course.level)}
              title={course.title}
              visual={visualForCourse(course)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
