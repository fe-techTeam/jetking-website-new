/**
 * The placement-partner list behind /explore's "Our Placement Partners" grid — the same
 * companies as jetking.com's partner collage, in its reading order, but each with its own
 * original logo instead of one flattened screenshot.
 *
 * Logos live in `public/logos/employers/` (big brands, vector) and `public/logos/partners/`
 * (fetched from each company's own site or Wikimedia Commons). A company with no verifiable
 * logo has no `file`: it renders as a plain name tile rather than a guessed or wrong mark.
 * `dark: true` = the artwork is light-on-dark and needs a dark tile.
 */
export interface PlacementPartner {
  name: string;
  file?: string;
  dark?: boolean;
}

export const PLACEMENT_PARTNERS: PlacementPartner[] = [
  { name: 'Walmart', file: '/logos/partners/walmart.svg' },
  { name: 'Accenture', file: '/logos/employers/accenture.svg' },
  { name: 'Dew Solutions', file: '/logos/partners/dew.png' },
  { name: 'Mobiloitte', file: '/logos/partners/mobiloitte.png', dark: true },
  { name: 'TokyoTechie', file: '/logos/partners/tokyotechie.png' },
  { name: 'Wipro', file: '/placements/partners/wipro.svg' },
  { name: 'Microsoft', file: '/logos/employers/microsoft.svg' },
  { name: 'IBM', file: '/logos/employers/ibm.svg' },
  { name: 'Hashnode', file: '/logos/partners/hashnode.png' },
  { name: 'Binance', file: '/logos/partners/binance.svg' },
  { name: 'Xoken Nexa' },
  { name: 'SAP', file: '/logos/employers/sap.svg' },
  { name: 'Vodafone', file: '/logos/employers/vodafone.svg' },
  { name: 'eosDublin' },
  { name: 'JPMorgan Chase', file: '/logos/partners/jpmorgan-chase.svg' },
  { name: 'Koinex' },
  { name: 'Capgemini', file: '/logos/employers/capgemini.svg' },
  { name: 'Tech Mahindra', file: '/logos/employers/tech-mahindra.svg' },
  { name: 'PayPal', file: '/logos/partners/paypal.svg' },
  { name: 'DLT Labs' },
  { name: 'VitWit', file: '/logos/partners/vitwit.png' },
  { name: 'Infosys', file: '/logos/employers/infosys.svg' },
  { name: 'CabBazar', file: '/logos/partners/cabbazar.svg' },
  { name: 'Prophaze', file: '/logos/partners/prophaze.png' },
  { name: 'Ingenium' },
  { name: 'Facebook', file: '/logos/partners/facebook.svg' },
  { name: 'SecLogic' },
  { name: 'Kuants' },
  { name: 'Lawyered', file: '/logos/partners/lawyered.png', dark: true },
  { name: 'minzoINDIA' },
  { name: 'prithvi.AI' },
  { name: 'Skinny Herbs' },
  { name: 'Technisanct' },
  { name: 'GetWork' },
  { name: 'Insurance Samadhan', file: '/logos/partners/insurance-samadhan.svg' },
  { name: 'GalaxyCard', file: '/logos/partners/galaxycard.svg' },
  { name: 'Compport', file: '/logos/partners/compport.svg' },
  { name: 'VAPP' },
];
