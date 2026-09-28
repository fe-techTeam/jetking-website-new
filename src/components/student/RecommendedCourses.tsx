'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRef, type ComponentType } from 'react';
import {
  ArrowLeft,
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
import type { Course, CourseLevel } from '@/lib/content/types';
import { scrollBehavior } from '@/lib/motion';

type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;
type Accent = 'cyber' | 'cloud' | 'network' | 'ai';

type Bullet = { label: string; icon: LucideIcon };

type CourseVisual = {
  accent: Accent;
  icon: LucideIcon;
  bullets: Bullet[];
};

const ACCENT: Record<Accent, { ink: string; tint: string; chip: string }> = {
  // `chip` is a fixed (non-flipping) colour used only where the accent sits
  // behind a hardcoded `text-white` icon (see the "Explore Course" arrow
  // below). Unlike `ink` — which intentionally flips to a light tone in dark
  // mode for use as text-on-card — this solid circle needs to stay a dark,
  // saturated tone in both themes so the white arrow stays legible. Values
  // match each accent's light-mode `ink` colour from student.css.
  cyber: { ink: 'var(--stu-cyber)', tint: 'var(--stu-cyber-tint)', chip: '#5f3aa8' },
  cloud: { ink: 'var(--stu-cloud)', tint: 'var(--stu-cloud-tint)', chip: '#2454a6' },
  network: { ink: 'var(--stu-network)', tint: 'var(--stu-network-tint)', chip: '#17683b' },
  ai: { ink: 'var(--stu-ai)', tint: 'var(--stu-ai-tint)', chip: '#9a4312' },
};

const COURSE_VISUALS: Record<string, CourseVisual> = {
  'ethical-hacking-specialist': {
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

function visualFor(course: Course): CourseVisual {
  const known = COURSE_VISUALS[course.slug];
  if (known) return known;

  const key = `${course.slug} ${course.title}`.toLowerCase();
  const accent: Accent =
    key.includes('cyber') || key.includes('security')
      ? 'cyber'
      : key.includes('network') || key.includes('infrastructure')
        ? 'network'
        : key.includes('ai') || key.includes('foundation')
          ? 'ai'
          : 'cloud';

  return {
    accent,
    icon: ACCENT_FALLBACK[accent],
    bullets: course.modules.slice(0, 3).map((label) => ({ label, icon: Sparkles })),
  };
}

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

function BestMatchBadge() {
  return (
    <span className="stu-course-badge" aria-hidden="true">
      <Sparkles className="h-3 w-3" strokeWidth={2.25} />
      Best match
    </span>
  );
}

function CourseCard({
  course,
  visual,
  popular,
}: {
  course: Course;
  visual: CourseVisual;
  popular: boolean;
}) {
  const theme = ACCENT[visual.accent];
  const CoverIcon = visual.icon;

  return (
    <Link
      href={`/courses/${course.slug}` as Route}
      className="stu-course-card group/course relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[22px] border border-[var(--stu-hairline)] bg-[var(--stu-card)] p-5 text-left shadow-[var(--stu-shadow)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--stu-shadow-hover)] sm:min-h-[380px] sm:p-6 lg:min-h-0"
    >
      {popular ? (
        <>
          <BestMatchBadge />
          <span className="sr-only">Best match for you</span>
        </>
      ) : null}

      <div className={`flex flex-wrap items-center gap-2 ${popular ? 'max-w-[72%]' : ''}`}>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--stu-hairline)] bg-[var(--stu-surface)] px-2 py-0.5 text-[12px] font-semibold text-[var(--stu-ink-muted)]">
          <Clock3 className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {course.duration}
        </span>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-bold"
          style={{ background: theme.tint, color: theme.ink }}
        >
          {modeLabel(course.level)}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-[color-mix(in_srgb,var(--stu-hairline)_80%,transparent)] sm:h-12 sm:w-12"
          style={{ background: theme.tint, color: theme.ink }}
        >
          <CoverIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 font-display text-[16px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--stu-ink)] sm:text-[17px]">
          {course.title}
        </h3>
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-0 border-t border-[var(--stu-hairline)]/60 pt-1">
        {visual.bullets.map((item) => (
          <li key={item.label} className="flex items-start gap-2.5 border-b border-[var(--stu-hairline)]/40 py-2.5 last:border-b-0">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ background: theme.tint, color: theme.ink }}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.85} />
            </span>
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug font-semibold text-[var(--stu-ink-secondary)] sm:text-[13px]">
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex items-center justify-between gap-3 border-t border-[var(--stu-hairline)] pt-4 text-[14px] font-bold">
        <span style={{ color: theme.ink }}>Explore Course</span>
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-hover/course:translate-x-0.5"
          style={{ background: theme.chip }}
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </span>
    </Link>
  );
}

export function RecommendedCourses({
  courses,
  title = 'Recommended for You',
  description = 'Popular courses for students — tap a card to explore details.',
  headingId = 'stu-recommended',
}: {
  courses: Course[];
  title?: string;
  description?: string;
  headingId?: string;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const items = courses.slice(0, 4);

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-course-card]');
    const gap = 16;
    const step = (card?.offsetWidth ?? 288) + gap;
    el.scrollBy({ left: dir * step, behavior: scrollBehavior() });
  };

  return (
    <section className="shell py-10 sm:py-12 lg:py-14" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id={headingId}
            className="inline-flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--stu-ink)] xs:text-[28px] sm:text-[32px]"
          >
            <Sparkles
              className="h-6 w-6 text-[var(--stu-accent-soft)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {title}
          </h2>
          <p className="mt-2 max-w-[42ch] text-[14px] text-[var(--stu-ink-muted)] sm:text-[15px]">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={'/courses' as Route}
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--stu-accent-soft)]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </Link>
          <div className="flex gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Previous courses"
              onClick={() => scrollBy(-1)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[var(--stu-hairline)] bg-[var(--stu-card)] text-[var(--stu-ink)] transition-colors hover:border-[var(--stu-accent)]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next courses"
              onClick={() => scrollBy(1)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[var(--stu-hairline)] bg-[var(--stu-card)] text-[var(--stu-ink)] transition-colors hover:border-[var(--stu-accent)]"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: horizontal snap scroll with fixed card width.
          `overflow-x-auto` forces overflow-y to `auto` too (browsers don't
          allow one axis `visible` and the other not), which clips each
          card's box-shadow. Padding gives the shadow room inside the clip
          box; matching negative margins keep the cards' visible position
          unchanged. */}
      <ul
        ref={scroller}
        className="stu-course-track -mx-12 mt-1 flex gap-4 overflow-x-auto overscroll-x-contain px-12 pt-7 -mb-14 pb-16 lg:hidden"
      >
        {items.map((course, i) => {
          const visual = visualFor(course);
          return (
            <li
              key={course.slug}
              data-course-card
              className="w-[min(88vw,300px)] shrink-0 snap-start sm:w-[280px]"
            >
              <CourseCard course={course} visual={visual} popular={i === 0} />
            </li>
          );
        })}
      </ul>

      {/* Desktop: stable 4-column grid — no overlap, equal columns */}
      <ul className="mt-8 hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-4 xl:gap-5">
        {items.map((course, i) => {
          const visual = visualFor(course);
          return (
            <li key={course.slug} className="min-w-0">
              <CourseCard course={course} visual={visual} popular={i === 0} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
