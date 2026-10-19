import Image from 'next/image';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { centresCopy } from '@/lib/content/copy/pages/centres';
import { HeroEnquiryCard } from '@/components/HeroEnquiryCard';
import type { EnquiryCentre } from '@/components/QuickEnquiryForm';
import { CentresHeroSearch } from './CentresHeroSearch';

export function CentresHero({
  cityCount,
  centreCount,
  centres,
  initialQuery = '',
  copy,
}: {
  copy: typeof centresCopy.defaults;
  cityCount: number;
  centreCount: number;
  /** Feeds the banner's lead form (state → centre). */
  centres: EnquiryCentre[];
  initialQuery?: string;
}) {
  return (
    <section className="shell relative pt-6 pb-10 xs:pt-8 sm:pt-10 lg:pt-12 lg:pb-12">
      <div className="centres-hero-banner relative min-h-[min(72vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[380px] xs:rounded-[28px] sm:min-h-[440px] sm:rounded-[28px] lg:min-h-[520px]">
        <Image
          src={copy['directoryHero.image']}
          alt=""
          fill
          priority
          sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
          className="object-cover object-[center_22%]"
        />
        <div aria-hidden="true" className="centres-hero-wash pointer-events-none absolute inset-0" />

        <div className="relative z-[1] flex h-full min-h-[inherit] flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-1 flex-col justify-center px-6 py-10 xs:px-8 xs:py-12 sm:px-10 sm:py-14 lg:max-w-[60%] lg:px-12 lg:py-16 xl:px-14">
            <p className="k-hero-eyebrow">
              {fill(copy['directoryHero.eyebrow'], { centres: centreCount })}
            </p>

            <h1 className="page-title mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
              {copy['directoryHero.title']} <span className="text-[var(--dc-accent-soft)]">{copy['directoryHero.titleAccent']}</span>
            </h1>

            <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
              {copy['directoryHero.sub']}
            </p>

            <div className="mt-7 w-full sm:mt-8">
              <CentresHeroSearch initialQuery={initialQuery} copy={copy} />
            </div>

            <p className="mt-5 numeral text-[13.5px] font-bold tracking-[0.12em] text-[var(--dc-ink-muted)] uppercase sm:mt-6">
              {fill(copy['directoryHero.stats'], {
                brand: siteConfig.name,
                cities: cityCount,
                cityUnit: cityCount === 1 ? copy['units.cityOne'] : copy['units.cityMany'],
                centres: centreCount,
                centreUnit: centreCount === 1 ? copy['units.centreOne'] : copy['units.centreMany'],
              })}
            </p>
          </div>

          <HeroEnquiryCard
            centres={centres}
            source="centres-hero-form"
            tone="centres"
            titleId="centres-hero-form-title"
          />
        </div>
      </div>
    </section>
  );
}
