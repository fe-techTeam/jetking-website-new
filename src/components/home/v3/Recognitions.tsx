'use client';

import { UNIVERSITY_PARTNERS } from '@/components/explore/content';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { HUE_VARS, RECOGNITIONS } from './data';

export function Recognitions() {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLUListElement>();

  return (
    <section className="py-12 sm:py-14 lg:py-16" aria-labelledby="home-recognition-heading">
      <div className="shell">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="dc-eyebrow text-[13px] font-bold tracking-[0.06em] uppercase">Recognition</p>
            <h2
              id="home-recognition-heading"
              className="section-title mt-2 font-display text-[var(--dc-ink)]"
            >
              Recognised by industry, regulators and peers
            </h2>
          </div>
          <ScrollNavButtons
            edge={edge}
            onPrev={() => scrollByItem(-1)}
            onNext={() => scrollByItem(1)}
            label="recognitions"
            className="mb-1 shrink-0"
          />
        </div>

        <ul
          ref={ref}
          tabIndex={0}
          aria-label="Recognitions"
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {RECOGNITIONS.map((item) => {
            const { accent, tint } = HUE_VARS[item.hue];
            return (
              <li key={item.title} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <article className="flex h-full flex-col gap-3.5 rounded-[24px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] p-5 shadow-[var(--dc-shadow)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-[color-mix(in_srgb,var(--dc-hairline)_80%,transparent)]"
                      style={{ background: tint, color: accent }}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[12px] font-bold tracking-[0.04em] text-[var(--dc-ink)] uppercase"
                      style={{ background: tint }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[var(--dc-ink)] sm:text-[16px]">{item.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--dc-ink-muted)]">{item.detail}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="mt-10">
          <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">Collaboration with top universities &amp; learning entities</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {UNIVERSITY_PARTNERS.map((partner) => (
              <li key={partner.name}>
                <div className="flex h-full flex-col items-center gap-2 rounded-[16px] border border-[var(--dc-hairline)] bg-white p-4 text-center shadow-[var(--dc-shadow)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static partner logos */}
                  <img src={partner.src} alt="" draggable={false} className="h-14 w-full object-contain" />
                  <span className="text-[12px] leading-snug font-semibold text-ink-600">{partner.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
