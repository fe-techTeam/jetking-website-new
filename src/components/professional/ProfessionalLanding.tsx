import type { Course, Testimonial } from '@/lib/content/types';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';
import { ProfessionalBottomCta } from './ProfessionalBottomCta';
import { ProfessionalGrowthPath } from './ProfessionalGrowthPath';
import { ProfessionalHero } from './ProfessionalHero';
import { ProfessionalImpact } from './ProfessionalImpact';
import { ProfessionalPrograms } from './ProfessionalPrograms';
import { ProfessionalSocialProof } from './ProfessionalSocialProof';

export function ProfessionalLanding({
  copy,
  courses,
}: {
  copy: typeof professionalCopy.defaults;
  courses: Course[];
  testimonials?: Testimonial[];
}) {
  return (
    <>
      <section
        className={[
          'home-v2 home-v2-themeable relative z-20 flex flex-col overflow-hidden',
          /* Bleed the section's own gradient background up behind the sticky,
             transparent header instead of stopping in a hard line at its
             bottom edge — see the matching fix in home/v2/HomeV2.tsx. Offsets
             must match SiteHeader's height breakpoints (72/80/88/96). */
          '-mt-[72px] pt-[72px]',
          'xs:-mt-[80px] xs:pt-[80px]',
          'sm:-mt-[88px] sm:pt-[88px]',
          '2xl:-mt-[96px] 2xl:pt-[96px]',
        ].join(' ')}
      >
        <div className="shell relative flex flex-col pt-8 pb-6 xs:pt-10 xs:pb-7 sm:pt-12 sm:pb-8 md:pt-14 md:pb-9 lg:pt-12 lg:pb-8 xl:pt-10 xl:pb-7 2xl:pt-8 2xl:pb-6 3xl:pt-10 3xl:pb-8">
          <ProfessionalHero copy={copy} />
        </div>
      </section>

      <div className="professional-page relative overflow-hidden">
        <ProfessionalGrowthPath copy={copy} />
        <ProfessionalPrograms copy={copy} courses={courses} />
        <ProfessionalImpact copy={copy} />
        <ProfessionalSocialProof copy={copy} />
        <ProfessionalBottomCta copy={copy} />
      </div>
    </>
  );
}
