import { definePageCopy } from '../define';
import { COMPANY, GRIEVANCE_OFFICER, KMP, KMP_CONTACT, REGISTRAR } from '@/lib/investors/contacts';

/**
 * Investors — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * Compliance details (company facts, grievance officer, registrar, KMP) default to the values typed
 * and reviewed in `src/lib/investors/contacts.ts` (transcribed from jetking.com/investors) — edit
 * them here once the page is live. The document lists themselves (hundreds of rows) are synced from
 * jetking.com/investors into `disclosures.json` (`npm run sync:investors`), not edited here; only
 * their section headings can be reworded (`sections.<id>.title`).
 *
 * `{brand}`, `{legalName}`, `{date}`, `{title}` and `{count}` are live values filled in by the page.
 */
export const investorsCopy = definePageCopy({
  id: 'investors',
  label: 'Investors',
  path: '/investors',
  group: 'Pages',
  description: 'The Investors page (contacts, disclosures and headings).',
  defaults: {
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
    'hero.image': '/home/journey-franchise-v2.jpg',

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
    'company.listedAt': COMPANY.listedAt,
    'company.scripCode': COMPANY.scripCode,
    'company.tradingSymbol': COMPANY.tradingSymbol,
    'company.registeredOffice': COMPANY.registeredOffice,
    'company.phone': COMPANY.phone,
    'company.email': COMPANY.email,
    'company.stock.label': 'Stock live on BSE',
    'company.news.label': 'Latest corporate announcements',

    // Investor contacts
    'contacts.accordion': 'Investor Contact Details',
    'contacts.tel': 'Tel:',
    'contacts.fax': 'Fax:',
    'contacts.email': 'Email:',
    'contacts.website': 'Website:',
    'grievance.heading': 'Grievance redressal (designated person)',
    'grievance.name': GRIEVANCE_OFFICER.name,
    'grievance.phone': GRIEVANCE_OFFICER.phone,
    'grievance.email': GRIEVANCE_OFFICER.email,
    'registrar.heading': 'Registrar and share transfer agent',
    'registrar.name': REGISTRAR.name,
    'registrar.address': REGISTRAR.address,
    'registrar.phone': REGISTRAR.phone,
    'registrar.fax': REGISTRAR.fax,
    'registrar.email': REGISTRAR.email,
    'registrar.website': REGISTRAR.website,
    'kmp.heading': 'Key Managerial Personnel authorised to determine the materiality of an event or information',
    'kmp.caption': 'Key Managerial Personnel and their contact details',
    'kmp.col.name': 'Name of the KMP',
    'kmp.col.designation': 'Designation',
    'kmp.col.phone': 'Phone number',
    'kmp.col.email': 'Email id',
    'kmp.0.name': KMP[0].name,
    'kmp.0.designation': KMP[0].designation,
    'kmp.1.name': KMP[1].name,
    'kmp.1.designation': KMP[1].designation,
    'kmp.2.name': KMP[2].name,
    'kmp.2.designation': KMP[2].designation,
    'kmp.3.name': KMP[3].name,
    'kmp.3.designation': KMP[3].designation,
    // All four KMP share the company's investor line and mailbox.
    'kmp.phone': KMP_CONTACT.phone,
    'kmp.email': KMP_CONTACT.email,

    // Disclosure section headings (synced from jetking.com/investors; keyed by section id)
    'sections.board-of-directors.title': 'Board of Directors',
    'sections.appointment-independent-directors.title': 'Appointment Letter of Independent Directors',
    'sections.code-of-conduct-policies.title': 'Code of Conduct & Policies',
    'sections.shareholding-pattern.title': 'Shareholding Pattern',
    'sections.press-releases.title': 'Press Releases & Newspaper Publications',
    'sections.notices.title': 'Notices & Announcements',
    'sections.material-events.title': 'Material Events',
    'sections.financial-results.title': 'Financial Results',
    'sections.annual-reports.title': 'Annual Reports',
    'sections.annual-returns.title': 'Annual Returns (MGT-7)',
    'sections.subsidiary-financials.title': 'Subsidiary Financials',
    'sections.secretarial-compliance.title': 'Annual Secretarial Compliance Report',
    'sections.corporate-governance-reports.title': 'Corporate Governance Reports',
    'sections.related-party.title': 'Related Party Disclosure',
    'sections.agm-voting-results.title': 'AGM Voting Results',
    'sections.voting-results.title': 'Voting Results',
    'sections.familiarisation.title': 'Familiarisation Programme',
    'sections.investor-updates.title': 'Investor Updates',
    'sections.unclaimed-dividends.title': 'Unpaid / Unclaimed Dividends and Shares',
    'sections.company-documents.title': 'Company Documents',
  },
});
