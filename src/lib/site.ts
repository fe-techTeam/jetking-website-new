/** Single source of truth for site-level constants. */
import { publicEnv } from '@/lib/config/env';

export const siteConfig = {
  name: 'Jetking',
  legalName: 'Jetking Infotrain Limited',
  tagline: 'India\'s trusted IT training brand',
  description:
    'Jetking offers degree, diploma and certification courses in cloud computing, cyber security and IT infrastructure, with centres across India and placement support.',
  locale: 'en_IN',
  /**
   * Must be an absolute origin in production — canonical URLs and OG tags depend on
   * it. Default matches the live host (https://www.jetking.com). Override with
   * NEXT_PUBLIC_SITE_URL for local/preview. Uses the `NEXT_PUBLIC_` variant
   * deliberately: this file is imported by several 'use client' components
   * (SiteHeader, EnquiryForm, …), and reading private `SITE_URL` here once
   * already caused a production outage across the server/client boundary.
   */
  url: publicEnv.siteUrl,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  /**
   * National enquiry line, E.164. Optional: when it is unset, "call us" affordances
   * route to /centres instead of rendering a `tel:` link to nothing — a dead call
   * button on an education site costs more than one extra click.
   */
  phone: process.env.NEXT_PUBLIC_PHONE ?? '',
  /** National toll-free helpline, as published on Investors and the enrollment terms. NEXT_PUBLIC_HELPLINE overrides it. */
  helpline: process.env.NEXT_PUBLIC_HELPLINE?.trim() || '07666830000',
} as const;

/**
 * Build a `wa.me` link from a phone string (CMS or env). Skips empty / placeholder
 * numbers (all 9s). Indian 10-digit and 0-prefixed helpline forms get a `91` prefix.
 */
export function whatsappHrefFromNumber(raw: string | undefined | null): string | null {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits || /^91?9{9,}$/.test(digits)) return null;
  if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  else if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

/** Env fallback when Page text → contact.whatsapp is empty. */
export const whatsappHref = whatsappHrefFromNumber(siteConfig.whatsappNumber);

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
  { label: 'Jetking ABC Labs', href: '/jetking-abc-labs' },
  { label: 'Blog', href: '/blog' },
] as const;
