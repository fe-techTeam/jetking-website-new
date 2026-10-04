import { SINCE_FOUNDED } from '@/lib/brand-facts';
import {
  Award,
  Briefcase,
  CalendarDays,
  Clock3,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Mic,
  MonitorPlay,
  Moon,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';

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
  { value: 'Hands-on', label: 'Portfolio-ready lab projects', icon: Wrench },
  { value: 'Certified', label: 'Industry credentials included', icon: Award },
  { value: 'Placement', label: 'Assistance & interview prep', icon: Briefcase },
  { value: SINCE_FOUNDED, label: 'Training IT talent', icon: Landmark },
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
    icon: Mic,
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
  { label: 'Career Break Friendly', icon: HeartHandshake },
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
