/** Single source of truth for site-level constants. */

export const siteConfig = {
  name: 'Jetking',
  legalName: 'Jetking Infotrain Limited',
  tagline: 'India\'s trusted IT training brand',
  description:
    'Jetking offers degree, diploma and certification courses in cloud computing, cyber security and IT infrastructure, with centres across India and placement support.',
  locale: 'en_IN',
  /**
   * Must be an absolute origin in production — canonical URLs and OG tags depend on
   * it. Reads the `NEXT_PUBLIC_` variant deliberately: this file is imported by
   * several 'use client' components (SiteHeader, EnquiryForm, …), and the private
   * `SITE_URL` read directly here once already caused a production outage when a
   * sibling file did the same thing across the server/client boundary.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  /**
   * National enquiry line, E.164. Optional: when it is unset, "call us" affordances
   * route to /centres instead of rendering a `tel:` link to nothing — a dead call
   * button on an education site costs more than one extra click.
   */
  phone: process.env.NEXT_PUBLIC_PHONE ?? '',
} as const;

export function absoluteUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalised}`;
}

export const mainNav = [
  { label: 'About Us', href: '/about-us' },
  { label: 'Courses', href: '/courses' },
  { label: 'Centres', href: '/centres' },
  { label: 'Placements', href: '/placements' },
  { label: 'Franchise', href: '/franchise' },
  { label: 'Investors', href: '/investors' },
  { label: 'Blog', href: '/blog' },
] as const;
