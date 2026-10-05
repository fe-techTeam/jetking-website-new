import type { PageCopyDef } from './define';
import { homeCopy } from './pages/home';
import { studentCopy } from './pages/student';
import { parentCopy } from './pages/parent';
import { professionalCopy } from './pages/professional';
import { franchiseCopy } from './pages/franchise';
import { exploreCopy } from './pages/explore';
import { aboutCopy } from './pages/about';
import { placementsCopy } from './pages/placements';
import { coursesCopy } from './pages/courses';
import { centresCopy } from './pages/centres';
import { blogCopy } from './pages/blog';
import { faqCopy } from './pages/faq';
import { enquiryCopy } from './pages/enquiry';
import { investorsCopy } from './pages/investors';
import { legalCopy } from './pages/legal';
import { sitemapCopy } from './pages/sitemap';
import { siteCopy } from './pages/site';

/** Every page whose text is editable in the admin, in the order the admin lists them. */
export const COPY_PAGES: PageCopyDef[] = [homeCopy, studentCopy, parentCopy, professionalCopy, franchiseCopy, exploreCopy, aboutCopy, placementsCopy, coursesCopy, centresCopy, blogCopy, faqCopy, enquiryCopy, investorsCopy, legalCopy, sitemapCopy, siteCopy];

export function copyPageById(id: string): PageCopyDef | undefined {
  return COPY_PAGES.find((p) => p.id === id);
}
