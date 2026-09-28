'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { AdaptiveNudge } from './AdaptiveSlot';
import { usePersona } from './PersonaProvider';

/**
 * Hero prompt: never asks “who are you?”.
 * Unknown visitors see a neutral helpful nudge; known personas get tailored copy.
 * SilentPersonaInfer adapts the page in the background as they browse.
 */
export function HeroAdaptivePrompt() {
  const { classification, hydrated } = usePersona();
  const known =
    hydrated &&
    classification.persona !== 'unknown' &&
    classification.confidence >= 0.45;

  if (!known) {
    return (
      <div className="slot-stable min-h-[128px] sm:min-h-[90px]" data-slot="home-hero-nudge-neutral">
        <aside
          className="nudge-enter flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          aria-label="Suggested next step"
        >
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              Explore courses that lead to industry certifications
            </p>
            <p className="mt-1 text-sm text-foreground-secondary">
              Cloud, cyber security and IT tracks taught in person at centres near you.
            </p>
          </div>
          <Link
            href={'/courses' as Route}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-jk-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-jk-500"
          >
            Browse courses
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    );
  }

  return (
    <div className="slot-stable min-h-[128px] sm:min-h-[90px]">
      <AdaptiveNudge
        id="home-hero-nudge"
        reserve="none"
        minConfidence={0.45}
        variants={{
          student: {
            headline: 'Not sure which track fits you?',
            body: 'The BCA degree lets you start earning while you study.',
            ctaLabel: 'See the degree track',
            ctaHref: '/courses/bca-cloud-cyber-security',
          },
          professional: {
            headline: 'Studying alongside a full-time job?',
            body: 'Several centres run evening and weekend batches.',
            ctaLabel: 'See professional tracks',
            ctaHref: '/courses',
          },
          parent: {
            headline: 'Evaluating whether this is the right choice?',
            body: 'Seven questions worth asking any training institute.',
            ctaLabel: 'Read the checklist',
            ctaHref: '/blog/what-parents-should-ask-it-institute',
          },
          franchise: {
            headline: 'Considering a Jetking centre?',
            body: 'An honest look at what running one actually involves.',
            ctaLabel: 'Franchise details',
            ctaHref: '/franchise',
          },
        }}
      />
    </div>
  );
}
