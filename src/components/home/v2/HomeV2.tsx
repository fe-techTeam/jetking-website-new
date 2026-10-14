import Image from 'next/image';
import { Briefcase, FlaskConical, GraduationCap } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import type { NetworkCounts } from '@/lib/brand-facts';
import type { EnquiryCentre } from '@/components/EnquiryModal';

/**
 * The homepage — "Future-Ready".
 *
 * The lead is a split banner: the student photo on the left, a navy outcome panel on the right
 * (learners placed + network size), then the "Power of Three" headline and its three pillars.
 * Enquiries go through the header's Enquire Now and the global Ask Jetking launcher.
 */
export function HomeV2({
  counts,
  placed,
  copy,
}: {
  /** Centres for the hero's quick-enquiry modal. Unused by the banner now; kept so the caller is unchanged. */
  enquiryCentres?: EnquiryCentre[];
  /** Live network size for the outcome panel — computed, never a hand-typed claim. */
  counts: NetworkCounts;
  /** The headline outcome ("3586 / Learners placed in 2025"), from the placements content. */
  placed: { value: string; label: string };
  copy: HomeCopy;
}) {
  const pillars = [
    { text: copy['hero.pillar1'], Icon: GraduationCap },
    { text: copy['hero.pillar2'], Icon: FlaskConical },
    { text: copy['hero.pillar3'], Icon: Briefcase },
  ];
  return (
    <section className="home-v2 home-v2-themeable relative flex flex-col overflow-hidden pt-3 sm:pt-5">
        {/* ── Banner: full-width — photo left, navy outcome panel right ── */}
        <div className="relative grid w-full overflow-hidden sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="relative min-h-[260px] overflow-hidden sm:min-h-[340px] lg:min-h-[440px]">
            <Image
              src={copy['hero.image']}
              alt=""
              fill
              priority
              sizes="(min-width: 640px) 55vw, 100vw"
              className="object-cover object-[60%_30%]"
            />
          </div>
          <p
            className="k-hero-eyebrow absolute top-3 left-3 z-[2] max-w-[calc(100%-1.5rem)] rounded-2xl px-3 py-1.5 leading-snug sm:top-4 sm:left-4 sm:max-w-[52%] sm:text-[12px] lg:max-w-[calc(100%-2rem)] lg:rounded-full lg:text-[13px] lg:whitespace-nowrap"
            style={{ background: 'rgb(255 255 255 / 0.88)', color: '#0b1f4a' }}
          >
            {copy['hero.eyebrow']}
          </p>
          <div
            className="hero-slant flex flex-col justify-center gap-3 px-6 py-8 text-white sm:-ml-9 sm:py-8 sm:pr-5 sm:pl-14 lg:-ml-14 lg:py-12 lg:pr-10 xl:pr-16 lg:pl-24"
            style={{ background: 'linear-gradient(135deg, #0b1f4a 0%, #0f2b63 60%, #12326f 100%)' }}
          >
            {/* Decorative background: red glow, dot grid and concentric rings */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">              <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgb(216 31 38 / 0.35) 0%, transparent 70%)' }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.12) 1.2px, transparent 1.4px)', backgroundSize: '22px 22px', maskImage: 'linear-gradient(to bottom left, #000, transparent 60%)', WebkitMaskImage: 'linear-gradient(to bottom left, #000, transparent 60%)' }} />
              <div className="absolute -right-24 -bottom-28 h-72 w-72 rounded-full" style={{ border: '1.5px solid rgb(255 255 255 / 0.12)' }} />
              <div className="absolute -right-12 -bottom-16 h-48 w-48 rounded-full" style={{ border: '1.5px solid rgb(216 31 38 / 0.45)' }} />
            </div>
            <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
              <p className="numeral font-display leading-none font-extrabold tracking-[-0.04em] text-[color:var(--v2-accent)]" style={{ fontSize: 'clamp(64px, 9.4vw, 140px)' }}>
                {placed.value}
              </p>
              <p className="leading-[1.15] font-bold" style={{ maxWidth: '15ch', fontSize: 'clamp(22px, 2.4vw, 42px)' }}>{placed.label}</p>
            </div>
            <p style={{ position: 'relative', fontSize: 'clamp(16px, 1.9vw, 30px)', borderTop: '1px solid rgb(255 255 255 / 0.25)' }} className="mt-2 pt-4 text-[16px] leading-[1.4] font-medium text-white/90 sm:text-[16px] lg:text-[20px] xl:text-[22px]">
              {fill(copy['hero.placed.detail'], { centres: counts.centres, cities: counts.cities })}
            </p>
          </div>
        </div>

      <div className="shell flex flex-col pb-8 sm:pb-12">
        {/* ── Power of Three ── */}
        <h1 className="mt-8 text-center font-display text-[26px] leading-[1.15] font-extrabold text-[var(--dc-ink)] sm:mt-10 sm:text-[34px] lg:text-[40px]">
          {copy['hero.headline.lead']} <span className="text-[var(--v2-accent)]">{copy['hero.headline.accent']}</span>{' '}
          {copy['hero.headline.tail']} {siteConfig.name}
        </h1>

        <ul className="mt-6 grid gap-5 sm:grid-cols-3 sm:gap-0">
          {pillars.map(({ text, Icon }, i) => (
            <li
              key={i}
              className={[
                'flex items-center gap-3 text-[15px] leading-[1.45] font-medium text-[var(--dc-ink-secondary)] sm:px-6 sm:text-[16px]',
                i > 0 ? 'sm:border-l sm:border-[var(--dc-hairline-strong)]' : '',
              ].join(' ')}
            >
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgb(216 31 38 / 0.1)', color: 'var(--v2-accent)' }}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span style={{ textWrap: 'balance' }}>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
