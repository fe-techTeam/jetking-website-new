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
import { CounsellorBand } from './CounsellorBand';
import { HomeFaq } from './HomeFaq';

/**
 * Everything below the hero, ordered the way a visitor decides:
 *   1. programmes        what you can study: courses lead, as on every comparable site
 *   2. partner logos     proof straight after the product (certifications, hiring partners)
 *   3. why Jetking       the reasons to choose us over the alternatives
 *   4. how it works      the path from first class to first job
 *   5. placements        outcomes and student voices, at the peak of interest
 *   6. counsellor band   a low-pressure ask while intent is highest
 *   7. centre network    "is there one near me?": the offline answer
 *   8. recognitions      accreditations, as reassurance before committing
 *   9. blog              for those still reading
 *  10. FAQ               the last objections (eligibility, fees and EMI, placement)
 *  11. lead form         the closing ask
 *  12. franchise         a different audience, kept clear of the student journey
 * then the site's normal footer (see `FooterChrome`). Backgrounds alternate plain / tint section by
 * section (the light theme's `--theme-surface`), with the placements on the blush wash.
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
      <ProgramShowcase courses={data.courses} copy={copy} />
      <CredibilityMarquee copy={copy} />
      <WhyJetking copy={copy} />
      <HowItWorks copy={copy} />
      <PlacementProof
        testimonials={data.placements.testimonials}
        disclaimer={data.placements.disclaimer}
        copy={copy}
      />
      <CounsellorBand copy={copy} />
      <CentreNetwork cities={data.cities} centres={data.centres} counts={data.counts} copy={copy} />
      <Recognitions copy={copy} />
      <BlogTeaser posts={data.posts} copy={copy} />
      <HomeFaq faqs={data.faqs} counts={data.counts} copy={copy} />
      <FinalCta centres={enquiryCentres} copy={copy} />
      <FranchiseBand copy={copy} />
    </div>
  );
}
