import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Trophy } from 'lucide-react';
import type { PlacementTestimonial, VideoTestimonial } from '@/lib/content/types';
import { Reveal, Section, SectionHeader } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { StorySlider } from './VideoStories';

/** The three written stories shown on the jetking.com homepage, by name. Falls back to the first three published. */
const HOME_STORIES = ['Preeti Madan', 'Nikhil Pathare', 'Abhishek'];

/**
 * "Our learners, our pride": Jetking's own published, named placement stories and videos
 * (`placements/data.ts`), the same ones shown on jetking.com, no invented ratings. Starts with the
 * Limca Book of Records placement milestone. The placement disclaimer stays underneath and the rest
 * live on /placements.
 */
export function PlacementProof({
  testimonials,
  videos,
  disclaimer,
  copy,
}: {
  testimonials: PlacementTestimonial[];
  videos: VideoTestimonial[];
  disclaimer: string;
  copy: HomeCopy;
}) {
  const named = HOME_STORIES.map((n) => testimonials.find((t) => t.name === n)).filter(
    (t): t is PlacementTestimonial => Boolean(t),
  );
  const stories = named.length === HOME_STORIES.length ? named : testimonials.slice(0, 3);
  const vimeo = videos.filter((v) => v.provider === 'vimeo');
  const shownVideos = (vimeo.length >= 3 ? vimeo : videos).slice(0, 3);

  return (
    <Section tone="tint" labelledBy="home-proof-heading">
      <SectionHeader
        id="home-proof-heading"
        eyebrow={copy['proof.eyebrow']}
        title={copy['proof.title']}
        lede={copy['proof.lede']}
        action={
          <Link
            href={copy['proof.cta.href'] as Route}
            className="tap inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {copy['proof.cta.label']}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />

      {/* The record: the milestone Jetking is known for, ahead of the individual stories */}
      <Reveal>
        <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-[28px] border border-jk-700 bg-jk-600 p-6 shadow-[var(--k-shadow-up)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:px-14 lg:py-12">
          {/* Concentric rings behind the seal */}
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-32 -z-10 hidden h-[520px] w-[520px] rounded-full border border-white/15 lg:block" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-16 -z-10 hidden h-[360px] w-[360px] rounded-full border border-white/20 lg:block" />

          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.14em] text-white uppercase">
              <Trophy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {copy['proof.record.eyebrow']}
            </p>
            <p className="mt-5 font-display text-[64px] leading-[0.9] font-extrabold tracking-[-0.04em] text-white sm:text-[88px] lg:text-[104px]">
              {copy['proof.record.value']}
            </p>
            <p className="mt-3 text-[20px] leading-snug font-extrabold text-white sm:text-[24px]">
              {copy['proof.record.label']}
            </p>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-white/90 sm:text-[16px]">
              {copy['proof.record.detail']}
            </p>
          </div>

          <div className="flex items-center gap-5 lg:flex-col lg:gap-4">
            <span className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white ring-8 ring-white/10 sm:h-36 sm:w-36 lg:h-44 lg:w-44">
              <Image
                src="/about/achievements/limca.png"
                alt=""
                fill
                sizes="176px"
                className="object-contain p-3"
              />
            </span>
            <span className="numeral rounded-full bg-white px-4 py-1.5 text-[14px] font-extrabold tracking-[0.08em] text-jk-700 shadow-md">
              {copy['proof.record.year']}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-8 sm:mt-10">
          <StorySlider videos={shownVideos} stories={stories} copy={copy} />
        </div>
      </Reveal>
      <p className="mt-5 text-[14px] leading-relaxed text-[var(--k-ink-3)]">{disclaimer}</p>
    </Section>
  );
}
