import { definePageCopy } from '../define';
import { seoFieldDefaults } from '../seo';
import { sectionVisibilityDefaults } from '../sections';

/**
 * Investors — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * Compliance data (company facts, grievance officer, registrar, KMP, document lists and section
 * headings) lives in the `investors_page` CMS collection, not here — seeded from
 * `src/lib/investors/contacts.ts` and `disclosures.json` (`npm run sync:investors`).
 *
 * `{brand}`, `{legalName}`, `{date}`, `{title}` and `{count}` are live values filled in by the page.
 */
export const INVESTORS_SECTIONS = [
  'hero',
  'reports',
] as const;

export const investorsCopy = definePageCopy({
  id: 'investors',
  label: 'Investors',
  path: '/investors',
  group: 'Pages',
  description: 'The Investors page (contacts, disclosures and headings). Use Show or hide sections to turn blocks on or off.',
  defaults: {
    ...sectionVisibilityDefaults(INVESTORS_SECTIONS),
    ...seoFieldDefaults(),

    'seo.title': 'Investor Information | {brand}',
    'seo.description':
      'SEBI (LODR) Regulation 46 and 62 disclosures by {legalName}: financial results, shareholding, annual reports, policies and investor contacts.',
    'breadcrumb.label': 'Investors',

    // Banner
    'hero.eyebrow': 'Investors',
    'hero.titleLead': 'Investor',
    'hero.titleAccent': 'Information',
    'hero.body':
      'Disclosure under Regulation 46 and 62 of SEBI (LODR) Regulations — financial information and updates for the shareholders of {legalName}.',
    'hero.image': '/investors/hero.jpg',

    // Reports intro
    'reports.eyebrow': 'Financial documents',
    'reports.titleLead': 'Access our',
    'reports.titleAccent': 'reports',
    'reports.body': 'Financial reports, quarterly results and governance documents.',
    'reports.note':
      'Documents open in a new tab and are hosted by {legalName} on external file storage. Source: jetking.com/investors, last updated {date}. Questions about a disclosure? Write to',

    // Shared small labels
    'common.newTab': '(opens in a new tab)',
    'docs.scrollLabel': '{title} — {count} documents',
    'docs.link.page': 'View Page',
    'docs.link.pdf': 'PDF Download',
    'docs.link.drive': 'View Document',
    'docs.link.other': 'View Link',

    // Company details
    'company.accordion': 'Company Details',
    'company.heading': 'Listing information',
    'company.label.company': 'Company',
    'company.label.listedAt': 'Listed at',
    'company.label.scripCode': 'BSE scrip code',
    'company.label.tradingSymbol': 'Trading symbol',
    'company.label.registeredOffice': 'Registered office',
    'company.label.phone': 'Investor line',
    'company.label.email': 'Email',
    'company.stock.label': 'Stock live on BSE',
    'company.news.label': 'Latest corporate announcements',

    // Investor contacts
    'contacts.accordion': 'Investor Contact Details',
    'contacts.tel': 'Tel:',
    'contacts.fax': 'Fax:',
    'contacts.email': 'Email:',
    'contacts.website': 'Website:',
    'grievance.heading': 'Grievance redressal (designated person)',
    'registrar.heading': 'Registrar and share transfer agent',
    'kmp.heading': 'Key Managerial Personnel authorised to determine the materiality of an event or information',
    'kmp.caption': 'Key Managerial Personnel and their contact details',
    'kmp.col.name': 'Name of the KMP',
    'kmp.col.designation': 'Designation',
    'kmp.col.phone': 'Phone number',
    'kmp.col.email': 'Email id',
  },
});
