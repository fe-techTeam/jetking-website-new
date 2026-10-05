import { definePageCopy } from '../define';
import { SINCE_FOUNDED } from '../../../brand-facts';

/**
 * Professionals — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `{siteName}` and `{from}`/`{to}`-style tokens are filled with live values by the page. Item counts
 * (steps, stats, cards, stories) are fixed by the layout.
 */
export const professionalCopy = definePageCopy({
  id: 'professional',
  label: 'Professionals',
  path: '/professional',
  group: 'Pages',
  description: 'The working-professional landing page.',
  defaults: {
    'seo.title': 'Working Professional Path — Upskill & Advance | {siteName}',
    'seo.description':
      'Upgrade your career with Jetking courses in cloud, cyber security, DevOps and AI — flexible batches, certifications and career support for working professionals.',

    'breadcrumb.name': 'Working Professional',

    'hero.eyebrow': 'For Working Professionals',
    'hero.title.line1': 'Upgrade Your Career.',
    'hero.title.accent': 'Double',
    'hero.title.rest': 'Your Impact.',
    'hero.sub.line1': 'Industry-relevant skills. Hands-on learning.',
    'hero.sub.line2': 'Real career growth.',
    'hero.features.0': 'Practical Learning',
    'hero.features.1': 'Flexible Batches',
    'hero.features.2': 'Career Support',
    'hero.features.3': 'Recognized Certs',
    'hero.cta.label': 'Explore Courses',
    'hero.cta.href': '/courses',
    'hero.link.label': 'Book a free career upgrade session',
    'hero.image': '/professional/hero.webp',
    'hero.image.alt': '{siteName} working professional upskilling for career growth',

    'growth.eyebrow': 'Career progression',
    'growth.title': 'Your Career Growth Path with Jetking',
    'growth.lede':
      'From your current role to your next promotion — five practical milestones that fit around a full-time schedule.',
    'growth.0.title': 'Where You Are',
    'growth.0.detail': 'Current Role',
    'growth.1.title': 'Upskill',
    'growth.1.detail': 'Industry-Relevant Courses',
    'growth.2.title': 'Get Certified',
    'growth.2.detail': 'Build Credibility',
    'growth.3.title': 'Interview Ready',
    'growth.3.detail': 'Expert Training & Mock Interviews',
    'growth.4.title': 'Get Hired',
    'growth.4.detail': 'Better Role. Bigger Package.',

    'programs.title': 'Top Courses for High-Growth Careers',
    'programs.lede': 'Short and professional tracks designed to fit around a full-time job.',
    'programs.viewAll.label': 'View all',
    'programs.viewAll.href': '/courses',
    'programs.track.label': 'top courses',
    'programs.badge': 'Top pick',

    'impact.eyebrow': 'Career outcomes',
    'impact.title.prefix': 'The Impact You Can Expect from',
    'impact.lede':
      'Practical career growth for working professionals who upskill without leaving their current role.',
    'impact.0.value': 'Hands-on',
    'impact.0.label': 'Portfolio-ready lab projects',
    'impact.1.value': 'Certified',
    'impact.1.label': 'Industry credentials included',
    'impact.2.value': 'Placement',
    'impact.2.label': 'Assistance & interview prep',
    'impact.3.value': SINCE_FOUNDED,
    'impact.3.label': 'Training IT talent',

    'flex.title': 'Flexible Learning That Fits Your Life',
    'flex.lede': 'Choose a schedule that works around your job — not the other way around.',
    'flex.0.label': 'Weekend Batches',
    'flex.1.label': 'Evening Batches',
    'flex.2.label': 'Online Live Classes',
    'flex.3.label': 'Career Break Friendly',

    'benefits.title': 'Why Professionals Choose Jetking',
    'benefits.lede': 'What you get when you upskill with a course built for working schedules.',
    'benefits.rail.label': 'Why professionals choose Jetking',
    'benefits.0.title': 'Hands-on Projects',
    'benefits.0.detail': 'Build portfolio-ready work in guided labs — not theory-only sessions.',
    'benefits.1.title': 'Recognized Certifications',
    'benefits.1.detail': 'Industry credentials included to strengthen your professional profile.',
    'benefits.2.title': 'Flexible Batches',
    'benefits.2.detail': 'Weekend and evening options designed around a full-time work schedule.',
    'benefits.3.title': 'Career Counsellors',
    'benefits.3.detail': 'Dedicated guidance on courses, timing, and your next career move.',
    'benefits.4.title': 'Interview Preparation',
    'benefits.4.detail': 'Mock interviews and resume support before you step into hiring loops.',
    'benefits.5.title': 'Hiring Network',
    'benefits.5.detail': 'Access to Jetking’s hiring partners across roles, sectors, and cities.',

    'callout.title': 'Ready to upgrade?',
    'callout.body':
      'Book a free career upgrade session — get a personalised plan without interrupting your work week.',
    'callout.cta.label': 'Book My Session Now',

    'stories.eyebrow': 'Success stories',
    'stories.title': 'Real career transitions',
    'stories.lede': 'Working professionals like you who upskilled without quitting their day job.',
    'stories.carousel.label': 'Success stories',
    'stories.kicker': 'From {from} to {to}',
    'stories.slideLabel': '{name}, {from} to {to}',
    'stories.route': '{from} → {to}',
    'stories.hike.label': '{hike} Salary Hike',
    'stories.0.from': 'System Admin',
    'stories.0.to': 'Cloud Engineer',
    'stories.0.quote':
      'Evening batches meant I could upskill without quitting. Within 8 months I moved to a cloud role with a 70% salary hike.',
    'stories.0.name': 'Rahul M.',
    'stories.0.hike': '70%',
    'stories.1.from': 'IT Support',
    'stories.1.to': 'Cyber Security Analyst',
    'stories.1.quote':
      'The hands-on labs and mock interviews made the career switch feel achievable — not just theoretical.',
    'stories.1.name': 'Priya K.',
    'stories.1.hike': '85%',
    'stories.2.from': 'Network Engineer',
    'stories.2.to': 'DevOps Lead',
    'stories.2.quote':
      'Jetking mapped my existing skills to what hiring managers actually wanted. The DevOps track was spot on.',
    'stories.2.name': 'Vikram S.',
    'stories.2.hike': '60%',

    'partners.title': 'Our Hiring Partners',
    'partners.note':
      'Recruiters featured on jetking.com. Placements are subject to recruitment norms — Jetking does not guarantee placement in any organisation.',
    'partners.pause': 'Pause',
    'partners.play': 'Play',
    'partners.pause.aria': 'Pause scrolling partner logos',
    'partners.play.aria': 'Resume scrolling partner logos',

    'cta.title': 'Ready to take the next step in your career?',
    'cta.lede': 'Book a free career upgrade session with our experts.',
    'cta.features.0': '1:1 Expert Counseling',
    'cta.features.1': 'Personalized Career Plan',
    'cta.features.2': 'Course Recommendation',
    'cta.button.label': 'Book My Session Now',
  },
});
