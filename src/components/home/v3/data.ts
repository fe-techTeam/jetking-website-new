import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Handshake,
  Landmark,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

/**
 * Static homepage content that has no home in the CMS content model — grounded in
 * what already ships elsewhere in this app (About timeline, admissions policy,
 * franchise copy, course fixtures) rather than invented for this page. No figure
 * here is a scale/outcome claim; those come only from `buildFigures()` /
 * `listTrustSignals()`, which is the one place unverified numbers are refused.
 */

/**
 * One of the site's four global category hues (`--theme-{hue}-ink` / `-tint` in
 * globals.css) — the same set `PROGRAM_META` uses for course-card icon chips on the
 * Professional page (`src/components/professional/data.ts`). Reused here, on career
 * paths and the "Why Jetking" cards, instead of inventing new colours per section —
 * that per-card colour-chip treatment is the "internal page" card language this
 * homepage is matching.
 */
export type Hue = 'network' | 'cloud' | 'cyber' | 'ai';

export const HUE_VARS: Record<Hue, { accent: string; tint: string }> = {
  network: { accent: 'var(--theme-network-ink)', tint: 'var(--theme-network-tint)' },
  cloud: { accent: 'var(--theme-cloud-ink)', tint: 'var(--theme-cloud-tint)' },
  cyber: { accent: 'var(--theme-cyber-ink)', tint: 'var(--theme-cyber-tint)' },
  ai: { accent: 'var(--theme-ai-ink)', tint: 'var(--theme-ai-tint)' },
};

/** One of the site's four global category hues (`--theme-{hue}-ink` / `-tint` in globals.css) — the same set `PROGRAM_META` uses on the Professional page, reused here rather than inventing a fifth. */
/** Real cert/vendor logos already in `public/logos/`, limited to certifications Jetking's own course fixtures actually cite. */
export const CERT_LOGOS = [
  { name: 'Cisco', file: '/logos/brands/cisco.svg' },
  { name: 'AWS', file: '/logos/brands/aws.svg' },
  { name: 'Microsoft Azure', file: '/logos/brands/azure.svg' },
  { name: 'Red Hat', file: '/logos/brands/redhat.svg' },
  { name: 'CompTIA', file: '/logos/brands/comptia.svg' },
  { name: 'CEH', file: '/logos/ceh.svg' },
  { name: 'CHFI', file: '/logos/chfi.svg' },
  { name: 'Splunk', file: '/logos/brands/splunk.svg' },
  { name: 'Python', file: '/logos/brands/python.svg' },
  { name: 'Power BI', file: '/logos/brands/powerbi.svg' },
  { name: 'Tableau', file: '/logos/tableau.svg' },
  { name: 'Unity', file: '/logos/brands/unity.svg' },
  { name: 'Unreal Engine', file: '/logos/brands/unreal.svg' },
  { name: 'Windows Server', file: '/logos/brands/windowsserver.svg' },
  { name: 'Google Cloud', file: '/logos/brands/googlecloud.svg' },
  { name: 'Kubernetes', file: '/logos/brands/kubernetes.svg' },
  { name: 'Docker', file: '/logos/brands/docker.svg' },
  { name: 'Linux', file: '/logos/brands/linux.svg' },
  { name: 'Kali Linux', file: '/logos/brands/kali.svg' },
  { name: 'Wireshark', file: '/logos/brands/wireshark.svg' },
  { name: 'Fortinet', file: '/logos/brands/fortinet.svg' },
  { name: 'Check Point', file: '/logos/checkpoint.svg' },
  { name: 'Citrix', file: '/logos/brands/citrix.svg' },
  { name: 'MySQL', file: '/logos/brands/mysql.svg' },
  { name: 'Grafana', file: '/logos/brands/grafana.svg' },
  { name: 'Adobe', file: '/logos/brands/adobe.svg' },
  { name: 'Figma', file: '/logos/brands/figma.svg' },
  { name: 'C++', file: '/logos/brands/cpp.svg' },
  { name: '.NET', file: '/logos/brands/dotnet.svg' },
] as const;

/** Employers beyond `HIRING_PARTNERS` — the rest of the logos in `public/placements/`. `dark` = light-on-dark artwork that needs a dark tile. */
export const MORE_EMPLOYER_LOGOS: ReadonlyArray<{ name: string; file: string; dark?: boolean }> = [
  { name: 'Times of India', file: '/logos/employers/times-of-india.svg' },
  { name: 'Bharti Airtel', file: '/placements/partners/bharti-airtel.svg' },
  { name: 'Birla Corp', file: '/placements/partners/birla-corp.jpg' },
  { name: 'Futwork', file: '/placements/partners/futwork.svg' },
  { name: 'Laundryheap', file: '/placements/partners/laundryheap.svg' },
  { name: 'Reisnet', file: '/placements/partners/reisnet.png', dark: true },
];

export interface Recognition {
  icon: LucideIcon;
  hue: Hue;
}

/**
 * Every entry is taken from the About timeline (`about/data.ts` TIMELINE) or the course fixtures (`fixtures/courses.ts`) — nothing new is claimed here.
 * Only the icon and hue live here; each card's badge, title and detail are the page copy `recognition.items.N.*`, in this order.
 */
export const RECOGNITIONS: Recognition[] = [
  { icon: BadgeCheck, hue: 'cloud' },
  { icon: Award, hue: 'ai' },
  { icon: Trophy, hue: 'cyber' },
  { icon: Handshake, hue: 'network' },
  { icon: Landmark, hue: 'cloud' },
  { icon: ShieldCheck, hue: 'network' },
];
