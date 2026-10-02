'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Quote } from 'lucide-react';
import { Carousel } from '@/components/Carousel';
import { PLACEMENT_DISCLAIMER, TESTIMONIALS } from '@/components/placements/data';

/**
 * Red "Our learners, our pride" banner: heading left, a white testimonial card carousel
 * right. Slides are Jetking's own published, named placement stories
 * (`placements/data.ts`) — not the CMS homepage-variant placeholders, and no invented
 * ratings. The placement disclaimer stays underneath.
 */
type Slide = (typeof TESTIMONIALS)[number] & { id: string };

const SLIDES: Slide[] = TESTIMONIALS.map((t, i) => ({ ...t, id: `story-${i}` }));

function splitRole(role: string): { title?: string; company: string } {
  const i = role.lastIndexOf(',');
  return i === -1 ? { company: role.trim() } : { title: role.slice(0, i).trim(), company: role.slice(i + 1).trim() };
}

export function PlacementProof() {
  return (
    <section className="border-y border-[var(--dc-hairline)] bg-[var(--dc-surface)] py-12 sm:py-14 lg:py-16" aria-labelledby="home-proof-heading">
      <div className="shell">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-jk-600 to-jk-800 p-6 text-white shadow-xl shadow-jk-800/30 sm:p-10 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-10">
          <div>
            <h2 id="home-proof-heading" className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-white sm:text-[34px]">
              Our learners, our pride
            </h2>
            <p className="mt-3 max-w-[38ch] text-[14.5px] leading-relaxed text-white/85">
              Real stories from students who trained at Jetking and now work at organisations across industries.
            </p>
            <Link
              href={'/placements' as Route}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-bold text-jk-700 transition-colors hover:bg-jk-50"
            >
              Watch success stories
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <Carousel
              items={SLIDES}
              label="Placement stories"
              dots={false}
              itemKey={(s) => s.id}
              itemLabel={(s) => `${s.name}, ${s.role}`}
              classNames={{
                controls: 'text-white',
                button: 'border-white/40 bg-white/10 text-white hover:bg-white/20',
                dotActive: 'bg-white',
                dotIdle: 'bg-white/40',
              }}
            >
              {(s) => {
                const { title, company } = splitRole(s.role);
                // No drop shadow: the Carousel viewport clips overflow, so a shadow shows as a hard cut edge.
                // flex-1 makes each card fill the tallest slide, so short quotes leave no empty band.
                return (
                  <figure className="flex flex-1 flex-col rounded-[20px] bg-white p-5 text-ink-800 ring-1 ring-black/5 sm:p-6">
                    <Quote className="h-6 w-6 text-jk-600" strokeWidth={1.75} aria-hidden="true" />
                    <blockquote className="mt-2 flex-1 text-[14px] leading-relaxed sm:text-[14.5px]">{s.quote}</blockquote>
                    <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-200 pt-4">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-jk-50 font-extrabold text-jk-700"
                      >
                        {s.name.trim().charAt(0)}
                      </span>
                      <span className="min-w-0 text-[13px]">
                        <span className="block font-extrabold">{s.name}</span>
                        <span className="block text-ink-600">{title ? `${title}, ${company}` : company}</span>
                      </span>
                    </figcaption>
                  </figure>
                );
              }}
            </Carousel>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-[var(--dc-ink-muted)]">{PLACEMENT_DISCLAIMER}</p>
      </div>
    </section>
  );
}
