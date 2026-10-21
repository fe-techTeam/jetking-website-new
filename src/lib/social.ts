/**
 * Jetking's official social profiles, as linked from the "Follow Us" block of the live
 * jetking.com footer (checked 2026-09-21). One list, used by the footer and by the
 * Organization schema's `sameAs`, so the two can never disagree.
 */
export type SocialNetwork = 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'twitter';

export interface SocialLink {
  network: SocialNetwork;
  /** Accessible name for the icon-only link. */
  label: string;
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  // Each URL can be overridden with its NEXT_PUBLIC_SOCIAL_* variable (literal reads, so Next inlines them for the footer).
  { network: 'facebook', label: 'Jetking on Facebook', href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() || 'https://www.facebook.com/JetkingOfficial/' },
  { network: 'instagram', label: 'Jetking on Instagram', href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || 'https://www.instagram.com/jetkingofficial/' },
  { network: 'youtube', label: 'Jetking on YouTube', href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() || 'https://www.youtube.com/c/JetkingOfficial' },
  { network: 'linkedin', label: 'Jetking on LinkedIn', href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() || 'https://in.linkedin.com/company/jetking' },
  { network: 'twitter', label: 'Jetking on Twitter (X)', href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER?.trim() || 'https://twitter.com/JetkingLtd' },
];
