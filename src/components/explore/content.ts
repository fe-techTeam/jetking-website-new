import { Award, Building2, Handshake, Heart, Landmark, Laptop, Lightbulb, ShieldCheck, Smile, Sparkles } from 'lucide-react';

/** Website content shared by the Explore page and the homepage. */

/**
 * "10 reasons why Jetking is every student's choice" — mirrored from the live
 * jetking.com homepage (fetched 2026-08-21). One reason is reworded: the live
 * site's "100% Job Guarantee" is softened to match the placement disclaimer
 * used everywhere else on this site — see PLACEMENT_DISCLAIMER and the
 * job-guarantee cleanup elsewhere in this codebase. Everything else is
 * unchanged from what Jetking currently publishes.
 */
export const REASONS = [
  {
    title: 'Trained & Certified Faculty',
    detail: 'Award winning and internationally bench-marked training faculty.',
    icon: Award,
  },
  {
    title: 'Practical Foundation through Labs',
    detail: 'One computer per student, so every theory lesson gets hands-on practice.',
    icon: Laptop,
  },
  {
    title: 'Placement Support',
    detail: 'We take every necessary step to help you get a suitable job on completing the course.',
    icon: ShieldCheck,
  },
  {
    title: 'Scenario Based Learning',
    detail: 'Case studies and animated scenarios give you real-life problem-solving practice.',
    icon: Lightbulb,
  },
  {
    title: 'SmartLabPlus Teaching Methodology',
    detail: 'Innovative methods of teaching that make learning fun and easy to remember.',
    icon: Sparkles,
  },
  {
    title: 'Countrywide Network',
    detail: 'A well-established, nationally recognised institute with centres across India.',
    icon: Building2,
  },
  {
    title: 'Personality Development',
    detail: 'Builds confidence and supports better job and salary prospects.',
    icon: Smile,
  },
  {
    title: 'State-of-the-Art Infrastructure',
    detail: 'Every centre is equipped for a successful learning environment.',
    icon: Landmark,
  },
  {
    title: 'De-stress with Yoga',
    detail: 'A relaxed mind finds it easier to learn.',
    icon: Heart,
  },
  {
    title: 'Partnership with NSDC',
    detail: 'Associated with the National Skill Development Corporation as a skill development partner.',
    icon: Handshake,
  },
] as const;

/** Real logos, fetched from the "Collaboration With Top Universities and Learning Entities" section live on jetking.com (2026-08-21). */
export const UNIVERSITY_PARTNERS = [
  { name: 'Yenepoya (Deemed to be University)', src: '/university-partners/yenepoya.png' },
  { name: 'Tilak Maharashtra Vidyapeeth, Pune', src: '/university-partners/tilak-maharashtra-vidyapeeth.png' },
  { name: 'Pearson', src: '/university-partners/pearson.png' },
  { name: 'Lincoln University College', src: '/university-partners/lincoln-university.png' },
] as const;
