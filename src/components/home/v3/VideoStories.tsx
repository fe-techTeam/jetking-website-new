'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import type { PlacementTestimonial, VideoTestimonial } from '@/lib/content/types';
import { StoryCard } from '@/components/kit';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { fill } from '@/lib/content/copy/define';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

type Slide =
  | { kind: 'video'; key: string; video: VideoTestimonial }
  | { kind: 'quote'; key: string; story: PlacementTestimonial };

function embedSrc(video: VideoTestimonial): string {
  return video.provider === 'youtube'
    ? `https://www.youtube.com/embed/${video.videoId}?autoplay=1`
    : `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
}

function VideoCard({ video, copy }: { video: VideoTestimonial; copy: HomeCopy }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={fill(copy['proof.video.play'], { title: video.title, name: video.name })}
        className="group/play relative block h-full min-h-[260px] w-full cursor-pointer overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] bg-scrim text-left shadow-[var(--k-shadow)] transition-shadow duration-200 hover:shadow-[var(--k-shadow-up)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-red)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local poster frame of a Jetking-published video */}
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/play:scale-[1.04]"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/10 to-transparent" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--k-red-fill)] text-white shadow-brand ring-4 ring-white/30 transition-transform duration-200 group-hover/play:scale-110"
        >
          <Play className="h-6 w-6 translate-x-0.5 fill-current" strokeWidth={0} />
        </span>
        <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span className="block text-[15px] font-bold text-white">{video.name}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-white/80">{video.title}</span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label={video.title}
        className="m-auto w-[min(920px,92vw)] rounded-[var(--radius-dialog)] bg-transparent p-0 backdrop:bg-black/60"
      >
        <div className="relative overflow-hidden rounded-[var(--radius-dialog)] bg-black">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={copy['proof.video.close']}
            className="absolute top-3 right-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          {open ? (
            <iframe
              title={video.title}
              src={embedSrc(video)}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}

/** One slider for the placement stories: Jetking's own videos and written quotes, alternating. A video loads its player only after a click. */
export function StorySlider({
  videos,
  stories,
  copy,
}: {
  videos: VideoTestimonial[];
  stories: PlacementTestimonial[];
  copy: HomeCopy;
}) {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLUListElement>();

  const slides: Slide[] = [];
  for (let i = 0; i < Math.max(videos.length, stories.length); i++) {
    const v = videos[i];
    const s = stories[i];
    if (v) slides.push({ kind: 'video', key: `v-${v.provider}-${v.videoId}`, video: v });
    if (s) slides.push({ kind: 'quote', key: `q-${s.name}`, story: s });
  }
  if (slides.length === 0) return null;

  return (
    <div>
      {/* Arrows only when there is something to slide to */}
      {edge.start && edge.end ? null : (
        <div className="mb-4 flex justify-end">
          <ScrollNavButtons
            alwaysVisible
            edge={edge}
            onPrev={() => scrollByItem(-1)}
            onNext={() => scrollByItem(1)}
            label={copy['proof.rail.aria']}
          />
        </div>
      )}
      <ul
        ref={ref}
        tabIndex={0}
        aria-label={copy['proof.rail.aria']}
        className="-mx-[var(--gutter)] flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-[var(--gutter)] pb-3 scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-5 sm:px-0 sm:scroll-px-0"
      >
        {slides.map((slide) => (
          <li
            key={slide.key}
            className="flex w-[84%] min-w-0 shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            {slide.kind === 'video' ? (
              <VideoCard video={slide.video} copy={copy} />
            ) : (
              <div className="w-full">
                <StoryCard name={slide.story.name} outcome={slide.story.role} quote={slide.story.quote} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
