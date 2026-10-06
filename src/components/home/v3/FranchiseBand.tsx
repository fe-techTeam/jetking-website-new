import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Handshake } from 'lucide-react';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * A different audience from the student journey, so it is its own full-width band at the very end: dark
 * on the left with the offer, white on the right where the building art (which has a white ground) sits
 * edge to edge, with no card or frame around it.
 */
export function FranchiseBand({ copy }: { copy: HomeCopy }) {
  return (
    <section aria-labelledby="home-franchise-heading" className="kit relative grid bg-scrim lg:grid-cols-2">
      <div className="relative flex items-center bg-jk-600">
        <div className="w-full px-[var(--gutter)] py-12 sm:py-16 lg:ml-auto lg:max-w-[calc(var(--container-xl)/2)] lg:py-20 lg:pr-12 2xl:max-w-[calc(var(--container-2xl)/2)]">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30">
            <Handshake className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <h2
            id="home-franchise-heading"
            className="mt-6 max-w-[20ch] font-display text-[30px] leading-[1.08] font-extrabold tracking-[-0.025em] text-white sm:text-[38px] lg:text-[44px]"
          >
            {copy['franchise.title']}
          </h2>
          <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-white/90 sm:text-[17px]">
            {copy['franchise.body']}
          </p>
          <Link
            href={copy['franchise.cta.href'] as Route}
            className="group/fr mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-full bg-white px-7 text-[15px] font-bold text-jk-700 shadow-md transition-colors hover:bg-white/90"
          >
            {copy['franchise.cta.label']}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover/fr:translate-x-0.5"
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <div className="relative min-h-[280px] bg-white sm:min-h-[360px] lg:min-h-[460px]">
        <Image
          src="/franchise/hero-building.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain object-center p-6 sm:p-10"
        />
      </div>
    </section>
  );
}
