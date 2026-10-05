import type { HomeData } from '../data';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { ProgramShowcase } from './ProgramShowcase';
import { WhyJetking } from './WhyJetking';
import { Recognitions } from './Recognitions';
import { CentreNetwork } from './CentreNetwork';
import { CredibilityMarquee } from './CredibilityMarquee';
import { PlacementProof } from './PlacementProof';
import { HowItWorks } from './HowItWorks';
import { BlogTeaser } from './BlogTeaser';
import { FranchiseBand } from './FranchiseBand';
import { FinalCta } from './FinalCta';

/**
 * Everything below the hero, in the order of the approved design: partner logos ->
 * programmes -> career steps -> placements -> recognition -> centre map -> why Jetking ->
 * blog -> franchise -> lead form, ending in the site's normal footer (see `FooterChrome`).
 * Backgrounds alternate white / blush section by section (the light theme's `--theme-surface`).
 *
 * `.dark-canvas.no-orbs` opts into the shared token/card system the rest of the site uses.
 */
export function HomeSections({
  data,
  enquiryCentres,
  copy,
}: {
  data: HomeData;
  enquiryCentres: EnquiryCentre[];
  copy: HomeCopy;
}) {
  return (
    <div className="dark-canvas no-orbs">
      <CredibilityMarquee copy={copy} />
      <ProgramShowcase courses={data.courses} copy={copy} />
      <HowItWorks copy={copy} />
      <PlacementProof
        testimonials={data.placements.testimonials}
        disclaimer={data.placements.disclaimer}
        copy={copy}
      />
      <Recognitions copy={copy} />
      <CentreNetwork cities={data.cities} centres={data.centres} counts={data.counts} copy={copy} />
      <WhyJetking copy={copy} />
      <BlogTeaser posts={data.posts} copy={copy} />
      <FranchiseBand copy={copy} />
      <FinalCta centres={enquiryCentres} copy={copy} />
    </div>
  );
}
