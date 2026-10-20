import type { HomeData } from '../data';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { isSectionVisible } from '@/lib/content/copy/sections';
import { ProgramShowcase } from './ProgramShowcase';
import { WhyJetking } from './WhyJetking';
import { Recognitions } from './Recognitions';
import { CentreNetwork } from './CentreNetwork';
import { CredibilityMarquee } from './CredibilityMarquee';
import { PlacementProof } from './PlacementProof';
import { BlogTeaser } from './BlogTeaser';
import { FranchiseBand } from './FranchiseBand';
import { FinalCta } from './FinalCta';
import { HomeFaq } from './HomeFaq';

/**
 * Everything below the hero, ordered the way a visitor decides.
 * Each block respects `sections.<id>.visible` from Page text (admin).
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
  const show = (id: string) => isSectionVisible(copy, id);

  return (
    <div className="dark-canvas no-orbs">
      {show('programs') ? <ProgramShowcase courses={data.courses} copy={copy} /> : null}
      {show('marquee') ? (
        <CredibilityMarquee copy={copy} certifications={data.logos.certifications} employers={data.logos.employers} />
      ) : null}
      {show('why') ? <WhyJetking copy={copy} /> : null}
      {show('proof') ? <PlacementProof disclaimer={data.placements.disclaimer} copy={copy} /> : null}
      {show('recognition') ? <Recognitions copy={copy} /> : null}
      {show('network') ? (
        <CentreNetwork cities={data.cities} centres={data.centres} counts={data.counts} copy={copy} />
      ) : null}
      {show('blog') ? <BlogTeaser posts={data.posts} copy={copy} /> : null}
      {show('cta') ? <FinalCta centres={enquiryCentres} copy={copy} /> : null}
      {show('faq') ? <HomeFaq faqs={data.faqs} counts={data.counts} copy={copy} /> : null}
      {show('franchise') ? <FranchiseBand copy={copy} /> : null}
    </div>
  );
}
