import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Headphones, Phone } from "lucide-react";
import { TrackedAnchor } from "@/components/TrackedAnchor";
import { siteConfig } from "@/lib/site";
import type { HomeCopy } from "@/lib/content/copy/pages/home";

/**
 * A mid-page prompt for visitors who have seen the courses and the proof but are not ready to pick:
 * talk to a counsellor. Sits after the placements, where intent is highest, so the lead form at the foot
 * of the page is not the only way to ask. A full-width band: the photo runs edge to edge on the left, the
 * message sits on the right, with no card around either.
 */
export function CounsellorBand({ copy }: { copy: HomeCopy }) {
  const helplineHref = `tel:${siteConfig.helpline.replace(/[^\d+]/g, "")}`;

  return (
    <section
      aria-labelledby="home-counsellor-heading"
      className="kit bg-[var(--k-bg)] text-[var(--k-ink)]"
    >
      <div className="shell grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:min-h-[440px] lg:self-stretch">
          <Image
            src="/home/counsellor.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex items-center">
          <div className="w-full pb-10 sm:pb-12 lg:pb-0">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
              <Headphones
                className="h-7 w-7"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
            <h2
              id="home-counsellor-heading"
              className="mt-6 max-w-[20ch] font-display text-[30px] leading-[1.08] font-extrabold tracking-[-0.025em] sm:text-[38px] lg:text-[44px]"
            >
              {copy["counsellor.title"]}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy["counsellor.body"]}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={copy["counsellor.cta.href"] as Route}
                className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold"
              >
                {copy["counsellor.cta.label"]}
                <ArrowRight
                  className="h-4 w-4"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              </Link>
              <TrackedAnchor
                href={helplineHref}
                event="phone_clicked"
                props={{ type: "home-counsellor" }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-5 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]"
              >
                <Phone
                  className="h-4 w-4 text-[var(--k-red)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {siteConfig.helpline}
              </TrackedAnchor>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
