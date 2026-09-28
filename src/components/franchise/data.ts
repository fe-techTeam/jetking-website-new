/**
 * Franchise page content — split out of FranchiseLandingLight.tsx so it can
 * be imported by scripts/export-site-corpus.mts (a plain Node/tsx script,
 * run under `--conditions=react-server`) without pulling in lucide-react
 * icon components — those use React context internals unavailable under
 * that condition — or the component's next/image, next/link etc. imports,
 * which only resolve inside the Next.js runtime.
 *
 * Deliberately no `icon` fields here: icons are purely decorative and
 * irrelevant to the chatbot's text index. FranchiseLandingLight pairs each
 * entry with its icon by index when rendering — see the *_ICONS arrays
 * there.
 *
 * Also lets the chatbot's knowledge index draw on this real
 * franchise-operations copy — previously invisible to it entirely, same gap
 * the About/Placements pages had.
 */

export const WHY_STATS = [
  { value: '100+', label: 'Successful Entrepreneurs' },
  { value: '11+ Lakh', label: 'Students Trained' },
  { value: 'Pan-India', label: 'Centre Network' },
  { value: '78+', label: 'Years of Brand Legacy' },
  { value: 'Awarded', label: 'Franchise Support' },
] as const;

export const JUMP_START = [
  {
    title: 'Manpower Support',
    detail:
      'Regular training courses keep your team engaged and ready to perform every day.',
  },
  {
    title: 'Hassle-Free Operations',
    detail:
      'Online systems cover A–Z of centre management so you always know what needs attention.',
  },
  {
    title: 'Advertising & Marketing',
    detail:
      'Local marketing, PR and digital campaigns build strong awareness in your territory.',
  },
  {
    title: 'Start-Up Launch',
    detail:
      'Location, design, construction, hiring and training — we help you open at peak readiness.',
  },
] as const;

export const LAUNCH_STEPS = [
  {
    step: '01',
    title: 'Pre-launch',
    body: 'Location, interiors, recruitment, branding and technical setup before you open doors.',
  },
  {
    step: '02',
    title: 'Launch',
    body: 'Kick-starter plan, staff training, launch promotions and media coverage.',
  },
  {
    step: '03',
    title: 'Training',
    body: 'Tech training, quality management, online courses and courseware support.',
  },
  {
    step: '04',
    title: 'Ongoing',
    body: 'Daily sales support, ERP & LMS, recruitment help and annual partner meets.',
  },
] as const;

export const MARKET_STATS = [
  {
    value: '3.5M',
    label: 'Cloud & cyber talent shortage projected globally',
  },
  {
    value: '59%',
    label: 'Organisations at risk from cybersecurity staff gaps',
  },
  {
    value: '80%',
    label: 'Of Indian graduates struggle to become job-ready',
  },
  {
    value: '70%',
    label: 'Of students say vocational training helps get jobs',
  },
] as const;

export const COURSES = [
  {
    title: 'Career Courses',
    body: 'Diplomas in Cloud Computing, Cyber Security and Metaverse Design.',
  },
  {
    title: 'Graduation Courses',
    body: 'BCA pathways in Cloud, Cyber Security and Blockchain.',
  },
  {
    title: 'Certifications',
    body: 'Ethical Hacking, CCNA, Linux and other in-demand credentials.',
  },
] as const;

export const FRANCHISE_INVESTMENT = {
  capacityBands: ['UPTO 50 L', 'UPTO 1 CR', 'UPTO 3 CR'],
  contactEmail: 'franchise@jetking.com',
} as const;
