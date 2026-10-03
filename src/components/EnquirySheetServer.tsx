import { content } from '@/lib/content';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { EnquirySheetProvider } from './EnquirySheet';

/** Loads the centre list the sheet's State → City → Centre dropdowns need, once, for every page. */
export async function EnquirySheetServer({ children }: { children: React.ReactNode }) {
  const [centres, cities] = await Promise.all([content.listCentres(), content.listCities()]);
  return <EnquirySheetProvider centres={toEnquiryCentres(centres, cities)}>{children}</EnquirySheetProvider>;
}
