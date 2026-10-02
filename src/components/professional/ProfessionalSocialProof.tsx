'use client';

import Image from 'next/image';
import { Carousel } from '@/components/Carousel';
import { ProfessionalPartnerMarquee } from './ProfessionalPartnerMarquee';
import { SUCCESS_STORIES } from './data';

export function ProfessionalSocialProof() {
  return (
    <section className="bg-[var(--pro-surface)] py-10 sm:py-12 lg:py-14" aria-labelledby="pro-stories-heading">
      <div className="shell">
        <div className="pro-why overflow-hidden rounded-[28px] px-6 py-10 xs:rounded-[32px] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="flex flex-col gap-12 lg:gap-14">
            <div>
              <p className="text-[13px] font-bold tracking-[0.06em] text-[var(--pro-accent-soft)] uppercase">
                Success stories
              </p>
              <h2
                id="pro-stories-heading"
                className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--pro-ink)] xs:text-[28px] sm:text-[32px]"
              >
                Real career transitions
              </h2>
              <p className="mt-2 text-[14px] text-[var(--pro-ink-secondary)] sm:text-[15px]">
                Working professionals like you who upskilled without quitting their day job.
              </p>

              <Carousel
                items={SUCCESS_STORIES}
                label="Success stories"
                className="mt-6 sm:mt-8"
                itemKey={(story) => story.id}
                itemLabel={(story) => `${story.name}, ${story.from} to ${story.to}`}
                classNames={{
                  viewport: 'rounded-[24px]',
                  dotActive: 'bg-[var(--pro-accent-soft)]',
                  dotIdle: 'bg-[var(--pro-ink-muted)]/40',
                  button:
                    'border-[var(--pro-hairline)] bg-[var(--pro-card)] text-[var(--pro-ink)] transition-colors hover:border-[var(--pro-accent-soft)] hover:text-[var(--pro-accent-soft)]',
                }}
              >
                {(story) => (
                  <article className="pro-quote p-6 text-white sm:p-7">
                    <p className="text-[12px] font-bold tracking-[0.06em] text-white/70 uppercase">
                      From {story.from} to {story.to}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-4 block font-display text-[56px] leading-none font-extrabold text-white/30"
                    >
                      &ldquo;
                    </span>
                    <p className="-mt-5 text-[15.5px] leading-relaxed font-medium sm:text-[16.5px]">
                      {story.quote}
                    </p>
                    <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/40">
                          <Image
                            src={story.avatar}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover object-top"
                          />
                        </span>
                        <cite className="not-italic">
                          <span className="block text-[14.5px] font-bold">{story.name}</span>
                          <span className="mt-0.5 block text-[13px] text-white/85">
                            {story.from} → {story.to}
                          </span>
                        </cite>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-jk-600">
                        {story.hike} Salary Hike
                      </span>
                    </footer>
                  </article>
                )}
              </Carousel>
            </div>

            <div className="border-t border-[var(--pro-hairline)] pt-10 lg:pt-12">
              <h3 className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pro-ink)] sm:text-[26px]">
                Our Hiring Partners
              </h3>
              <p className="mt-2 max-w-[62ch] text-[14px] text-[var(--pro-ink-secondary)] sm:text-[15px]">
                Recruiters featured on jetking.com. Placements are subject to recruitment norms —
                Jetking does not guarantee placement in any organisation.
              </p>
              <div className="mt-7 sm:mt-8">
                <ProfessionalPartnerMarquee />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
