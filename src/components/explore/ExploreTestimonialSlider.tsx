'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { Carousel } from '@/components/Carousel';
import type { PlacementTestimonial as Testimonial, VideoTestimonial } from '@/lib/content/types';
import { fill } from '@/lib/content/copy/define';
import type { exploreCopy } from '@/lib/content/copy/pages/explore';

const AVATARS = [
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
  '/student/testimonial.webp',
] as const;

type Slide =
  | { kind: 'quote'; key: string; data: Testimonial }
  | { kind: 'video'; key: string; data: VideoTestimonial };

function embedSrc(video: VideoTestimonial): string {
  return video.provider === 'youtube'
    ? `https://www.youtube.com/embed/${video.videoId}?autoplay=1`
    : `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
}

function VideoSlide({ video, copy }: { video: VideoTestimonial; copy: typeof exploreCopy.defaults }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="kit kit-card relative flex h-full min-h-[220px] flex-col overflow-hidden p-0 sm:min-h-[240px]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={fill(copy['slider.play'], { title: video.title, name: video.name })}
        className="group/play relative flex h-full min-h-[220px] w-full cursor-pointer items-end sm:min-h-[240px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube/Vimeo thumbnail */}
        <img
          src={video.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/play:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/15 to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-lg shadow-black/40 transition-transform duration-200 group-hover/play:scale-110"
        >
          <Play className="h-6 w-6 fill-current" strokeWidth={0} />
        </span>
        <footer className="relative z-10 flex items-center gap-3 p-6 text-left sm:p-7">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/40">
            <Image src={AVATARS[3]} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span>
            <span className="block text-[14.5px] font-bold text-white">{video.name}</span>
            <span className="mt-0.5 block text-[13px] text-white">{video.title}</span>
          </span>
        </footer>
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
            aria-label={copy['slider.close']}
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
    </div>
  );
}

export function ExploreTestimonialSlider({
  testimonials,
  videos,
  copy,
}: {
  testimonials: Testimonial[];
  videos: VideoTestimonial[];
  copy: typeof exploreCopy.defaults;
}) {
  const slides: Slide[] = [
    ...testimonials.map((t): Slide => ({ kind: 'quote', key: t.name, data: t })),
    ...videos.map((v): Slide => ({ kind: 'video', key: v.name, data: v })),
  ];
  if (slides.length === 0) return null;

  return (
    <Carousel
      items={slides}
      label={copy['slider.label']}
      itemKey={(slide) => slide.key}
      itemLabel={(slide) => (slide.kind === 'video' ? fill(copy['slider.videoLabel'], { name: slide.data.name }) : `${slide.data.name}, ${slide.data.role}`)}
      classNames={{
        dotActive: 'bg-[var(--dc-accent-soft)]',
        dotIdle: 'bg-[var(--dc-ink-muted)]/40',
        button:
          'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:text-[var(--dc-accent-soft)]',
      }}
    >
      {(slide, i) =>
        slide.kind === 'video' ? (
          <VideoSlide video={slide.data} copy={copy} />
        ) : (
          <blockquote className="kit kit-card flex h-full min-h-[220px] flex-col p-6 sm:min-h-[240px] sm:p-7">
            <span
              aria-hidden="true"
              className="font-display text-[56px] leading-none font-extrabold text-[var(--k-red)] opacity-40"
            >
              &ldquo;
            </span>
            <p className="-mt-5 flex-1 text-[15.5px] leading-relaxed font-medium text-[var(--k-ink-2)] sm:text-[16.5px]">
              {slide.data.quote}
            </p>
            <footer className="mt-6 flex items-center gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--k-line-strong)]">
                <Image
                  src={AVATARS[i % AVATARS.length] ?? AVATARS[0]}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <cite className="not-italic">
                <span className="block text-[14.5px] font-bold text-[var(--k-ink)]">{slide.data.name}</span>
                <span className="mt-0.5 block text-[13px] text-[var(--k-ink-3)]">{slide.data.role}</span>
              </cite>
            </footer>
          </blockquote>
        )
      }
    </Carousel>
  );
}
