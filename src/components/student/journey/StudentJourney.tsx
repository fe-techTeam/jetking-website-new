'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Course } from '@/lib/content/types';
import { usePersona } from '@/persona/PersonaProvider';
import {
  canSkipSoftSave,
  isJourneyInProgress,
  readStudentJourney,
  recommendCourses,
  shouldShowJourneyPanel,
  startStudentJourney,
  writeStudentJourney,
  type StudentDiscovery,
  type StudentJourneyState,
  type StudentJourneyStep,
} from '@/persona/studentJourney';
import { interestIntent } from '@/persona/studentJourney';
import { track } from '@/lib/analytics';
import { RecommendedCourses } from '../RecommendedCourses';
import { StudentExploreHero } from './StudentExploreHero';
import { JourneyProgress } from './JourneyProgress';
import { DiscoveryStep } from './DiscoveryStep';
import { RecommendStep } from './RecommendStep';
import { SaveRecommendationsStep } from './SaveRecommendationsStep';
import { RoadmapStep } from './RoadmapStep';
import { CounsellingStep } from './CounsellingStep';
import { scrollBehavior } from '@/lib/motion';
import type { StudentCopy } from '@/lib/content/copy/pages/student';

function persist(state: StudentJourneyState) {
  writeStudentJourney(state);
}

function scrollToJourneyPanel() {
  document
    .getElementById('student-journey-panel')
    ?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

export function StudentJourney({
  courses,
  counts,
  copy,
}: {
  courses: Course[];
  counts: { courses: number; centres: number; cities: number };
  copy: StudentCopy;
}) {
  const { hydrated, override, setIntent, record } = usePersona();
  const [journey, setJourney] = useState<StudentJourneyState>(() => readStudentJourney());
  const [booted, setBooted] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const showPanel = shouldShowJourneyPanel(journey);

  /*
   * Move focus to the new step when the wizard advances.
   *
   * Each step replaces the previous one, so the "Continue" button the user just
   * activated unmounts and focus falls back to <body> — a screen reader user hears
   * nothing and a keyboard user restarts their tab sequence at the top of the
   * document. `booted` gates it so restoring a saved journey on load does not
   * yank focus away from wherever the visitor actually landed.
   */
  const didMountStep = useRef(false);
  useEffect(() => {
    if (!booted) return;
    if (!didMountStep.current) {
      didMountStep.current = true;
      return;
    }
    stepRef.current?.focus();
  }, [journey.step, booted]);

  const openJourney = useCallback(() => {
    setJourney((prev) => {
      const next = startStudentJourney(prev);
      persist(next);
      return next;
    });
    requestAnimationFrame(() => scrollToJourneyPanel());
  }, []);

  /*
   * Boot from localStorage. This is a genuine external-source sync, not derived
   * state: reading `localStorage` in the lazy initialiser would run during
   * hydration and produce markup that disagrees with the server's, so the read has
   * to happen after the first commit. It runs exactly once (guarded by `booted`),
   * which is why the cascading-render rule is waived here rather than obeyed.
   */
  useEffect(() => {
    if (!hydrated || booted) return;
    override('student');
    const saved = readStudentJourney();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJourney(saved);
    setBooted(true);
    if (isJourneyInProgress(saved) || saved.journeyStarted) {
      track('journey_resumed', { step: saved.step, surface: 'student' });
    }
  }, [hydrated, booted, override]);

  // Deep link: `/student#start-journey` opens the wizard. Same rationale — the URL
  // hash is not available to the server render.
  useEffect(() => {
    if (!booted) return;
    if (window.location.hash === '#start-journey') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openJourney();
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [booted, openJourney]);

  const recommended = useMemo(() => {
    if (!journey.discovery) return courses.slice(0, 4);
    return recommendCourses(courses, journey.discovery, 4);
  }, [courses, journey.discovery]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.slug === journey.selectedCourseSlug) ?? recommended[0],
    [courses, journey.selectedCourseSlug, recommended],
  );

  const goTo = useCallback((step: StudentJourneyStep, patch: Partial<StudentJourneyState> = {}) => {
    setJourney((prev) => {
      const next = { ...prev, ...patch, step, updatedAt: new Date().toISOString() };
      persist(next);
      track('journey_step', { step });
      return next;
    });
  }, []);

  const onDiscoveryComplete = useCallback(
    (discovery: StudentDiscovery) => {
      const recs = recommendCourses(courses, discovery, 4);
      const intent = interestIntent(discovery.interest);
      setIntent(intent, discovery.interest);
      record({ kind: 'interest', tag: discovery.interest === 'unsure' ? 'Tech career' : intent });
      goTo('recommend', {
        journeyStarted: true,
        discovery,
        recommendedSlugs: recs.map((c) => c.slug),
        selectedCourseSlug: recs[0]?.slug,
      });
    },
    [courses, goTo, setIntent, record],
  );

  const onCourseSelect = useCallback(
    (slug: string) => {
      setJourney((prev) => {
        const next = { ...prev, selectedCourseSlug: slug, updatedAt: new Date().toISOString() };
        persist(next);
        record({
          kind: 'course-view',
          slug,
          level: courses.find((c) => c.slug === slug)?.level ?? 'certification',
          title: courses.find((c) => c.slug === slug)?.title,
        });
        return next;
      });
    },
    [record, courses],
  );

  const onRecommendContinue = useCallback(() => {
    if (canSkipSoftSave(journey)) {
      goTo('roadmap');
    } else {
      goTo('save');
    }
  }, [goTo, journey]);

  const onSoftSaved = useCallback(
    (phone: string, name?: string) => {
      goTo('roadmap', {
        softIdentity: { phone, name, savedAt: new Date().toISOString() },
      });
    },
    [goTo],
  );

  /*
   * Only the wizard panel waits for the client boot.
   *
   * This component used to return a pulsing skeleton for the WHOLE page until
   * `hydrated && booted`, which meant the server-rendered /student was a grey box:
   * no hero, no h1, no course list. It shipped 72KB where /professional shipped
   * 197KB. That is a missing-h1 failure (1.3.1 / 2.4.6), it is the entire page
   * hidden from crawlers and from anyone without JS, and it defeats the point of
   * the SSR-everything rule the rest of this codebase follows so carefully.
   *
   * The hero and the recommended-course rail are static content — they render on
   * the server unconditionally. Only the guided journey, whose state genuinely
   * lives in localStorage, is deferred, and it sits below both.
   */
  return (
    <>
      <StudentExploreHero
        cities={counts.cities}
        onStartJourney={openJourney}
        copy={copy}
      />

      <div className="rounded-t-[28px] bg-[var(--dc-surface)] xs:rounded-t-[40px]">
        <RecommendedCourses
          courses={courses}
          title={copy['courses.title']}
          description={copy['courses.description']}
          viewAllLabel={copy['courses.viewAll.label']}
          viewAllHref={copy['courses.viewAll.href']}
          badgeLabel={copy['courses.badge']}
          trackLabel={copy['courses.trackLabel']}
        />
      </div>

      {booted && showPanel ? (
        <section
          id="student-journey-panel"
          className="shell relative scroll-mt-24 pt-6 pb-10 xs:pt-8 sm:pt-10"
          aria-label={copy['journey.ariaLabel']}
        >
          <div className="mb-6 max-w-2xl">
            <p className="k-eyebrow">
              {copy['journey.eyebrow']}
            </p>
            <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
              {copy['journey.title']}
            </h2>
            <p className="mt-2 text-[14px] text-[var(--dc-ink-secondary)] sm:text-[15px]">
              {copy['journey.body']}
            </p>
          </div>

          <div className="stu-card overflow-hidden rounded-[28px] p-5 xs:rounded-[28px] xs:p-6 sm:p-8 lg:p-10">
            <JourneyProgress current={journey.step} copy={copy} />

            {/*
              Focus moves here on step change (see the effect above), which is what
              announces the new step. No `aria-live` on this container: a live region
              wrapping the whole step would read the entire panel a second time on
              top of the focus announcement.
            */}
            <div
              ref={stepRef}
              tabIndex={-1}
              className="mt-8 rounded-2xl focus:outline-2 focus:outline-[var(--focus-ring)] focus:outline-offset-4 sm:mt-10"
            >
              {journey.step === 'discover' ? (
                <DiscoveryStep initial={journey.discovery} onComplete={onDiscoveryComplete} copy={copy} />
              ) : null}

              {journey.step === 'recommend' && journey.discovery ? (
                <RecommendStep
                  courses={recommended}
                  discovery={journey.discovery}
                  selectedSlug={journey.selectedCourseSlug}
                  onSelect={onCourseSelect}
                  onContinue={onRecommendContinue}
                  copy={copy}
                />
              ) : null}

              {journey.step === 'save' && journey.discovery ? (
                <SaveRecommendationsStep
                  discovery={journey.discovery}
                  recommendedSlugs={journey.recommendedSlugs}
                  selectedCourseSlug={journey.selectedCourseSlug}
                  onSaved={onSoftSaved}
                  onSkip={() => goTo('roadmap')}
                  copy={copy}
                />
              ) : null}

              {journey.step === 'roadmap' && journey.discovery && selectedCourse ? (
                <RoadmapStep
                  course={selectedCourse}
                  discovery={journey.discovery}
                  onContinue={() => goTo('counsel')}
                  copy={copy}
                />
              ) : null}

              {journey.step === 'counsel' && journey.discovery && selectedCourse ? (
                <CounsellingStep
                  course={selectedCourse}
                  discovery={journey.discovery}
                  softName={journey.softIdentity?.name}
                  softPhone={journey.softIdentity?.phone}
                  onComplete={() => goTo('complete')}
                  copy={copy}
                />
              ) : null}

              {journey.step === 'complete' ? (
                <div className="space-y-4 text-center sm:text-left">
                  <h2 className="section-title font-display text-[var(--dc-ink)]">
                    {copy['journey.complete.title']}
                  </h2>
                  <p className="max-w-[48ch] text-[15px] text-[var(--dc-ink-secondary)]">
                    {copy['journey.complete.body']}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      goTo('discover', {
                        journeyStarted: true,
                        discovery: undefined,
                        softIdentity: undefined,
                        recommendedSlugs: [],
                        selectedCourseSlug: undefined,
                      })
                    }
                    className="-my-2 inline-block cursor-pointer py-2 text-[14px] font-bold text-[var(--dc-accent-soft)] underline-offset-2 hover:underline"
                  >
                    {copy['journey.complete.restart']}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
