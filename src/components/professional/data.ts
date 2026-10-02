import type { LucideIcon } from 'lucide-react';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import {
  Award,
  Bot,
  Boxes,
  Briefcase,
  CalendarDays,
  CircleGauge,
  Clock3,
  Cloud,
  Cpu,
  Database,
  Fingerprint,
  GitBranch,
  GraduationCap,
  LockKeyhole,
  Moon,
  MonitorPlay,
  Radar,
  Route as RouteIcon,
  Server,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wifi,
  Workflow,
} from 'lucide-react';
import type { Course } from '@/lib/content/types';

export const HERO_FEATURES = [
  { label: 'Practical Learning', icon: Sparkles },
  { label: 'Flexible Batches', icon: Clock3 },
  { label: 'Career Support', icon: Users },
  { label: 'Recognized Certs', icon: Award },
] as const;

export const GROWTH_STEPS = [
  {
    title: 'Where You Are',
    detail: 'Current Role',
    icon: Briefcase,
  },
  {
    title: 'Upskill',
    detail: 'Industry-Relevant Courses',
    icon: TrendingUp,
  },
  {
    title: 'Get Certified',
    detail: 'Build Credibility',
    icon: Award,
  },
  {
    title: 'Interview Ready',
    detail: 'Expert Training & Mock Interviews',
    icon: GraduationCap,
  },
  {
    title: 'Get Hired',
    detail: 'Better Role. Bigger Package.',
    icon: Trophy,
  },
] as const;

export const IMPACT_STATS = [
  { value: 'Hands-on', label: 'Portfolio-ready lab projects', icon: TrendingUp },
  { value: 'Certified', label: 'Industry credentials included', icon: Award },
  { value: 'Placement', label: 'Assistance & interview prep', icon: Briefcase },
  { value: SINCE_FOUNDED, label: 'Training IT talent', icon: Trophy },
] as const;

export const PROFESSIONAL_BENEFITS = [
  {
    title: 'Hands-on Projects',
    detail: 'Build portfolio-ready work in guided labs — not theory-only sessions.',
    icon: Sparkles,
  },
  {
    title: 'Recognized Certifications',
    detail: 'Industry credentials included to strengthen your professional profile.',
    icon: Award,
  },
  {
    title: 'Flexible Batches',
    detail: 'Weekend and evening options designed around a full-time work schedule.',
    icon: Clock3,
  },
  {
    title: 'Career Counsellors',
    detail: 'Dedicated guidance on courses, timing, and your next career move.',
    icon: Users,
  },
  {
    title: 'Interview Preparation',
    detail: 'Mock interviews and resume support before you step into hiring loops.',
    icon: GraduationCap,
  },
  {
    title: 'Hiring Network',
    detail: 'Access to Jetking’s hiring partners across roles, sectors, and cities.',
    icon: Briefcase,
  },
] as const;

export const FLEXIBLE_OPTIONS = [
  { label: 'Weekend Batches', icon: CalendarDays },
  { label: 'Evening Batches', icon: Moon },
  { label: 'Online Live Classes', icon: MonitorPlay },
  { label: 'Career Break Friendly', icon: Clock3 },
] as const;

export const BOTTOM_CTA_FEATURES = [
  { label: '1:1 Expert Counseling', icon: Users },
  { label: 'Personalized Career Plan', icon: Sparkles },
  { label: 'Course Recommendation', icon: GraduationCap },
] as const;

/**
 * Recruiters Jetking itself publishes on jetking.com. Logos are the site's own
 * (vector logos in /public/logos/employers; Tikona is a raster in /public/placements/recruiters); a company that is not listed there is not
 * shown here, rather than being drawn from a generic "top IT employers" list.
 */
export const HIRING_PARTNERS = [
  { name: 'Accenture', logo: '/logos/employers/accenture.svg' },
  { name: 'Amazon', logo: '/logos/employers/amazon.svg' },
  { name: 'Capgemini', logo: '/logos/employers/capgemini.svg' },
  { name: 'IBM', logo: '/logos/employers/ibm.svg' },
  { name: 'Infosys', logo: '/logos/employers/infosys.svg' },
  { name: 'Microsoft', logo: '/logos/employers/microsoft.svg' },
  { name: 'Samsung', logo: '/logos/employers/samsung.svg' },
  { name: 'SAP', logo: '/logos/employers/sap.svg' },
  { name: 'Tech Mahindra', logo: '/logos/employers/tech-mahindra.svg' },
  { name: 'Tikona', logo: '/placements/recruiters/tikona.png' },
  { name: 'Vodafone', logo: '/logos/employers/vodafone.svg' },
  { name: 'Wipro', logo: '/placements/partners/wipro.svg' },
] as const;

export interface ProgramMeta {
  icon: LucideIcon;
  salaryHint: string;
  durationLabel: string;
  accent: string;
  /**
   * Non-flipping counterpart of `accent`, for spots (like the solid
   * "Explore Course" arrow circle) that pair a fixed white icon with the
   * background — `accent` itself is an ink token that goes pastel-light in
   * dark mode, which would wash the white icon out. Falls back to `accent`
   * when not set.
   */
  accentSolid?: string;
  accentTint: string;
  bullets: Array<{ label: string; icon: LucideIcon }>;
}

/** Illustrative salary bands for program cards — not authoritative fee data. */
const PROGRAM_META: Record<string, ProgramMeta> = {
  'cloud-computing-engineer-ai': {
    icon: Cloud,
    salaryHint: '₹12 LPA',
    durationLabel: '3 – 6 Months',
    accent: 'var(--pro-cloud)',
    accentSolid: 'var(--color-track-cloud)',
    accentTint: 'var(--pro-cloud-tint)',
    bullets: [
      { label: 'AWS / Azure Cloud Labs', icon: Cloud },
      { label: 'Containers & Kubernetes', icon: Boxes },
      { label: 'CI/CD Pipeline Practice', icon: GitBranch },
    ],
  },
  'ethical-hacking-specialist': {
    icon: Shield,
    salaryHint: '₹10 LPA',
    durationLabel: '4 – 8 Months',
    accent: 'var(--pro-cyber)',
    accentSolid: 'var(--color-track-cyber)',
    accentTint: 'var(--pro-cyber-tint)',
    bullets: [
      { label: 'Ethical Hacking & Pen Testing', icon: Fingerprint },
      { label: 'Network Security & Firewalls', icon: LockKeyhole },
      { label: 'SOC Operations & SIEM', icon: Radar },
    ],
  },
  'cloud-computing-professional-ai': {
    icon: Cpu,
    salaryHint: '₹15 LPA',
    durationLabel: '4 – 6 Months',
    accent: 'var(--pro-ai)',
    accentSolid: 'var(--color-track-ai)',
    accentTint: 'var(--pro-ai-tint)',
    bullets: [
      { label: 'Cloud AI Service Landscape', icon: Bot },
      { label: 'Model APIs & Integration', icon: Cpu },
      { label: 'Deploy & Monitor Workloads', icon: CircleGauge },
    ],
  },
  'routing-switching-administrator': {
    icon: Wifi,
    salaryHint: '₹8 LPA',
    durationLabel: '3 – 6 Months',
    accent: 'var(--pro-network)',
    accentSolid: 'var(--color-track-network)',
    accentTint: 'var(--pro-network-tint)',
    bullets: [
      { label: 'Routing & Switching', icon: RouteIcon },
      { label: 'Windows & Linux Servers', icon: Server },
      { label: 'Hybrid Cloud Connectivity', icon: Wifi },
    ],
  },
  'bca-cloud-cyber-security': {
    icon: Database,
    salaryHint: '₹6 LPA',
    durationLabel: '6 – 12 Months',
    accent: 'var(--pro-cyber)',
    accentSolid: 'var(--color-track-cyber)',
    accentTint: 'var(--pro-cyber-tint)',
    bullets: [
      { label: 'Cloud Infrastructure Basics', icon: Cloud },
      { label: 'Cyber Security Fundamentals', icon: Shield },
      { label: 'Industry Capstone Project', icon: Workflow },
    ],
  },
};

const DEFAULT_PROGRAM_META: ProgramMeta = {
  icon: Sparkles,
  salaryHint: '₹8 LPA',
  durationLabel: '3 – 6 Months',
  accent: 'var(--pro-accent-soft)',
  accentTint: 'var(--pro-accent-tint)',
  bullets: [],
};

export function programVisualFor(course: Course): ProgramMeta {
  const known = PROGRAM_META[course.slug];
  if (known) return known;

  return {
    ...DEFAULT_PROGRAM_META,
    durationLabel: course.duration || DEFAULT_PROGRAM_META.durationLabel,
    bullets: course.modules.slice(0, 3).map((label) => ({ label, icon: Sparkles })),
  };
}

export const SUCCESS_STORIES = [
  {
    id: 'pro-story-1',
    from: 'System Admin',
    to: 'Cloud Engineer',
    quote:
      'Evening batches meant I could upskill without quitting. Within 8 months I moved to a cloud role with a 70% salary hike.',
    name: 'Rahul M.',
    hike: '70%',
    avatar: '/professional/avatar-rahul.webp',
  },
  {
    id: 'pro-story-2',
    from: 'IT Support',
    to: 'Cyber Security Analyst',
    quote:
      'The hands-on labs and mock interviews made the career switch feel achievable — not just theoretical.',
    name: 'Priya K.',
    hike: '85%',
    avatar: '/professional/avatar-priya.webp',
  },
  {
    id: 'pro-story-3',
    from: 'Network Engineer',
    to: 'DevOps Lead',
    quote:
      'Jetking mapped my existing skills to what hiring managers actually wanted. The DevOps track was spot on.',
    name: 'Vikram S.',
    hike: '60%',
    avatar: '/professional/avatar-vikram.webp',
  },
] as const;
