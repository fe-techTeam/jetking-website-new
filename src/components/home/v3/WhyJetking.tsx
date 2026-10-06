import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Cpu,
  Trophy,
} from "lucide-react";
import { REASONS } from "@/components/explore/content";
import { Reveal, Section, SectionHeader } from "@/components/kit";
import { IconSlot } from "@/components/kit/IconSlot";
import type { HomeCopy } from "@/lib/content/copy/pages/home";

/** Website content: the "10 reasons why Jetking is every student's choice" already published on jetking.com (see `explore/content.ts`). Five are shown; the rest live on /explore. Only the icon is looked up from there — the wording is the page copy `why.items.N.*`, in this order. */
const SHOWN = [
  "Trained & Certified Faculty",
  "Practical Foundation through Labs",
  "Scenario Based Learning",
  "SmartLabPlus Teaching Methodology",
  "Placement Support",
];
const ICONS = SHOWN.map((t) => REASONS.find((r) => r.title === t)!.icon);

/** Icons for the four-step journey strip; wording is the page copy `how.steps.N.*`. */
const JOURNEY_ICONS = [BookOpen, Cpu, Trophy, BriefcaseBusiness];

/** The lab reason leads: it gets the photo. The other four sit beside it as a 2 x 2. */
const FEATURED = 1;
const REST = [0, 2, 3, 4];
const FEATURED_PHOTO = "/home/why-labs.jpg";

export function WhyJetking({ copy }: { copy: HomeCopy }) {
  return (
    <Section tone="plain" labelledBy="home-why-heading">
      <SectionHeader
        id="home-why-heading"
        eyebrow={copy["why.eyebrow"]}
        title={copy["why.title"]}
        action={
          <Link
            href={copy["why.cta.href"] as Route}
            className="tap inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {copy["why.cta.label"]}
            <ArrowRight
              className="h-4 w-4"
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </Link>
        }
      />

      <Reveal>
        <ul
          aria-label={copy["why.rail.aria"]}
          className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
          {/* Featured: photo card */}
          <li className="group relative isolate min-h-[340px] overflow-hidden rounded-[var(--k-r)] border border-[var(--k-line)] shadow-[var(--k-shadow)] sm:min-h-[400px] lg:min-h-full">
            <Image
              src={FEATURED_PHOTO}
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="-z-10 object-cover object-[center_35%] transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-scrim/95 via-scrim/55 to-scrim/5"
            />
            <div className="flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
                  <IconSlot
                    icon={ICONS[FEATURED]}
                    className="h-6 w-6"
                    strokeWidth={1.8}
                  />
                </span>
              </div>
              <div>
                <h3 className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-white sm:text-[28px]">
                  {copy[`why.items.${FEATURED}.title` as keyof HomeCopy]}
                </h3>
                <p className="mt-3 max-w-[40ch] text-[14.5px] leading-relaxed text-white/80 sm:text-[15.5px]">
                  {copy[`why.items.${FEATURED}.detail` as keyof HomeCopy]}
                </p>
              </div>
            </div>
          </li>

          {/* The other four */}
          <li className="contents">
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {REST.map((i) => {
                return (
                  <li
                    key={i}
                    className="kit-card kit-card-lift group relative flex items-start gap-4 overflow-hidden p-5 sm:flex-col sm:gap-0 sm:p-7"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--k-red-fill)] transition-transform duration-300 group-hover:scale-x-100"
                    />
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--k-red-wash)] text-[var(--k-red)] ring-1 ring-[var(--k-line)] transition-colors duration-200 group-hover:bg-[var(--k-red-fill)] group-hover:text-white">
                      <IconSlot
                        icon={ICONS[i]}
                        className="h-6 w-6"
                        strokeWidth={1.8}
                      />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-[17px] sm:mt-5 sm:text-[18px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--k-ink)]">
                        {copy[`why.items.${i}.title` as keyof HomeCopy]}
                      </h3>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--k-ink-2)] sm:mt-2">
                        {copy[`why.items.${i}.detail` as keyof HomeCopy]}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </Reveal>

      {/* The path in one line: learn, practise, certify, get placed */}
      <Reveal>
        <div className="mt-10 sm:mt-12">
          <p className="mb-4 text-[13px] font-bold tracking-[0.1em] text-[var(--k-ink-3)] uppercase">
            {copy["how.title"]}
          </p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_ICONS.map((Icon, i) => (
              <li
                key={i}
                className="relative flex items-start gap-3.5 rounded-[var(--k-r)] border border-[var(--k-line)] bg-[var(--k-card)] p-4 sm:p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--k-red-wash)] text-[var(--k-red)] ring-1 ring-[var(--k-line)]">
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[16px] leading-snug font-extrabold text-[var(--k-ink)]">
                    {copy[`how.steps.${i}.title` as keyof HomeCopy]}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-snug text-[var(--k-ink-2)]">
                    {copy[`how.steps.${i}.points.0` as keyof HomeCopy]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </Section>
  );
}
