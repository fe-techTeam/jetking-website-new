import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Reveal, Section, SectionHeader } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

const SLOTS = [0, 1, 2, 3, 4] as const;

/**
 * "Our learners, our pride": one statement about the outcomes Jetking delivers, then four or five alumni who hold
 * senior positions (photo, name, designation, organisation). The alumni are page copy (`proof.alumni.N.*`), so the
 * client can fill them in from the admin; until a slot has a name it shows a labelled placeholder. No videos and no
 * testimonials: they were generic and made the section long on a phone. The placement disclaimer stays underneath.
 */
export function PlacementProof({ disclaimer, copy }: { disclaimer: string; copy: HomeCopy }) {
  const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS !== 'false';
  const alumni = SLOTS.map((i) => ({
    name: copy[`proof.alumni.${i}.name` as keyof HomeCopy] as string,
    role: copy[`proof.alumni.${i}.role` as keyof HomeCopy] as string,
    org: copy[`proof.alumni.${i}.org` as keyof HomeCopy] as string,
    photo: copy[`proof.alumni.${i}.photo` as keyof HomeCopy] as string,
  }));
  const shown = alumni.filter((a) => a.name || showPlaceholders);

  return (
    <Section tone="tint" labelledBy="home-proof-heading">
      <SectionHeader
        id="home-proof-heading"
        eyebrow={copy['proof.eyebrow']}
        title={copy['proof.title']}
        lede={copy['proof.lede']}
      />

      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[28px] border border-jk-700 bg-jk-600 p-6 shadow-[var(--k-shadow-up)] sm:p-10 lg:px-14 lg:py-12">
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-32 -z-10 hidden h-[520px] w-[520px] rounded-full border border-white/15 lg:block" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-16 -z-10 hidden h-[360px] w-[360px] rounded-full border border-white/20 lg:block" />
          <p className="max-w-[28ch] font-display text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance text-white sm:text-[40px] lg:text-[52px]">
            {copy['proof.statement']}
          </p>
        </div>
      </Reveal>

      {shown.length ? (
        <Reveal>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {shown.map((a, i) =>
              a.name ? (
                <li key={`${a.name}-${i}`} className="kit-card flex flex-col items-center gap-1 p-4 text-center max-sm:last:odd:col-span-2 sm:p-5">
                  <span className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--k-red-wash)] ring-4 ring-[var(--k-red)] sm:h-28 sm:w-28">
                    {a.photo ? <Image src={a.photo} alt={a.name} fill sizes="112px" className="object-cover object-top" /> : null}
                  </span>
                  <h3 className="mt-3 text-[16px] leading-snug font-extrabold text-[var(--k-ink)]">{a.name}</h3>
                  {a.role ? <p className="text-[13.5px] leading-snug font-bold text-[var(--k-red)]">{a.role}</p> : null}
                  {a.org ? <p className="text-[13.5px] leading-snug text-[var(--k-ink-3)]">{a.org}</p> : null}
                </li>
              ) : (
                <li
                  key={`placeholder-${i}`}
                  className="kit-card flex flex-col items-center gap-1 !border-2 !border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)] p-4 text-center max-sm:last:odd:col-span-2 sm:p-5"
                >
                  <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{copy['proof.placeholder.badge']}</span>
                  <span className="mt-1 grid h-24 w-24 place-items-center rounded-full border-2 border-dashed border-[var(--k-line-strong)] bg-white/60 text-[var(--k-red)] sm:h-28 sm:w-28">
                    <Camera className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-[16px] leading-snug font-extrabold text-[var(--k-ink)]">{copy['proof.placeholder.name']}</h3>
                  <p className="text-[13.5px] leading-snug font-bold text-[var(--k-red)]">{copy['proof.placeholder.role']}</p>
                  <p className="text-[13.5px] leading-snug text-[var(--k-ink-3)]">{copy['proof.placeholder.org']}</p>
                </li>
              ),
            )}
          </ul>
        </Reveal>
      ) : null}

      <p className="mt-5 text-[14px] leading-relaxed text-[var(--k-ink-3)]">{disclaimer}</p>
    </Section>
  );
}
