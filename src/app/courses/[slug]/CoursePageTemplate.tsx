import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Download,
  Compass,
  GraduationCap,
  Mail,
  MapPin,
  Mic,
  Monitor,
  Phone,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Centre, City, Course } from '@/lib/content/types';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { siteConfig } from '@/lib/site';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { Disclosure } from '@/components/Disclosure';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';
import { PROCESS_STEPS, RECRUITERS, RECRUITERS_DISCLAIMER } from '@/components/placements/data';
import { RecruiterMarquee } from '@/components/placements/RecruiterMarquee';
import { BrandTile } from './brand';
import { ZoomImage } from './ZoomImage';
import { SnapSlider } from './SnapSlider';
import { FeeDepthTracker } from './FeeDepthTracker';

/*
 * Course page template (degree and short-term) — built from the client's "Website Design Feedback" deck.
 * Section order is the client's flow, top to bottom:
 *   1 Banner + enquiry form · 2 Key highlights · 3 Why this degree & why now (+ careers)
 *   4 Course highlights · 5 About the university · 6 Learning journey · 7 Curriculum
 *   8 Tools · 9 Certifications · 10 How placement works · 11 Placement records
 *   12 Jetking Centre advantage + centre list · 13 Call to action · 14 FAQs & similar courses
 * Everything stays on this one page (placement and centre discovery no longer click away).
 * The old shared "Why choose Jetking" block is intentionally gone — it moves to Home / brand story.
 */

/** Figures the client supplied in the feedback deck (slides 2 and 10). */
const PLACEMENT_PARTNERS = '5000+';
const LEARNERS_PLACED = { value: '3586', label: 'Learners placed in 2025' };

const CENTRE_ADVANTAGES: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'Instructor-led physical labs',
    body: 'Practise on real hardware, networks and cloud set-ups with an instructor beside you.',
    icon: Monitor,
  },
  {
    title: 'Faculty access 7 days a week',
    body: 'Walk in or book a slot any day to clear doubts before they pile up.',
    icon: CalendarDays,
  },
  {
    title: 'Career guidance from your Centre Manager',
    body: 'One-on-one planning for electives, certifications, internships and interview readiness.',
    icon: Compass,
  },
  {
    title: 'In-person master sessions',
    body: 'Sessions at the centre with industry practitioners and university faculty.',
    icon: Mic,
  },
  {
    title: 'Meet and learn with peers',
    body: 'Study groups, project teams and hackathons with batchmates from your own city.',
    icon: Users,
  },
];

const STEP_ICONS = [
  '/placements/icons/04_complete_training.svg',
  '/placements/icons/05_biodata_preparation.svg',
  '/placements/icons/06_mock_interviews.svg',
  '/placements/icons/07_student_interviews.svg',
  '/placements/icons/08_appointment_letter.svg',
];

const UNIVERSITY_LOGOS: Array<{ match: RegExp; src: string }> = [
  { match: /yenepoya/i, src: '/university-partners/yenepoya.png' },
];

/** Cycled across journey / stat cards so the page carries red, yellow and blue, not red alone. */
const ACCENT_TOPS = ['border-t-[var(--cp-red)]', 'border-t-[var(--cp-yellow)]', 'border-t-[var(--cp-blue)]'];
const ACCENT_DOTS = ['bg-[var(--cp-red-fill)] text-white', 'bg-[var(--cp-yellow)] text-[#111827]', 'bg-[var(--cp-blue-fill)] text-white'];

const HIGHLIGHT_ACCENTS = [
  'bg-[var(--cp-red-tint)] text-[var(--cp-red)]',
  'bg-[var(--cp-yellow-tint)] text-[var(--cp-yellow-ink)]',
  'bg-[var(--cp-sky)] text-[var(--cp-blue)]',
  'bg-[var(--cp-grey)] text-[var(--cp-ink)]',
];

function Heading({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div>
      {kicker ? <span className="cp-eyebrow">{kicker}</span> : null}
      <h2 className="cp-h2 mt-1.5 text-balance">{children}</h2>
    </div>
  );
}

/** "BCA in Cloud Computing & Cyber Security" → "BCA". */
function degreeName(title: string) {
  return (title.split(/\s+in\s+/i)[0] ?? title).trim();
}

export function CoursePageTemplate({
  course,
  trail,
  centres,
  cities,
  offeringCentres,
  related,
  ownFaqs,
  feeFaqs,
}: {
  course: Course;
  trail: Crumb[];
  centres: Centre[];
  cities: City[];
  offeringCentres: Centre[];
  related: Course[];
  ownFaqs: Array<{ question: string; answer: string }>;
  feeFaqs: Array<{ question: string; answer: string }>;
}) {
  const isDegree = course.level === 'degree';
  const titleParts = course.title.split(/\s+in\s+/i);
  const titlePrefix = isDegree && titleParts.length > 1 ? titleParts[0] : '';
  const titleMain = titlePrefix ? titleParts.slice(1).join(' in ') : course.title;
  // First sentence of the summary is the banner tagline; the remainder moves to the "why" section so no copy is lost.
  const sentenceEnd = course.summary.search(/\.\s/);
  const tagline = sentenceEnd > 0 ? course.summary.slice(0, sentenceEnd + 1) : course.summary;
  const summaryRest = sentenceEnd > 0 ? course.summary.slice(sentenceEnd + 1).trim() : '';
  const degree = degreeName(course.title);
  const universityLogo = course.university
    ? UNIVERSITY_LOGOS.find((u) => u.match.test(course.university!))?.src
    : undefined;

  // City → centre names, so the centre list is readable on this page without opening /centres.
  const cityName = new Map(cities.map((c) => [c.slug, c.name]));
  const byCity = new Map<string, Centre[]>();
  for (const centre of offeringCentres) {
    byCity.set(centre.citySlug, [...(byCity.get(centre.citySlug) ?? []), centre]);
  }
  const cityGroups = [...byCity.entries()]
    .map(([slug, list]) => ({ slug, name: cityName.get(slug) ?? slug, list }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const quickFacts: Array<{ title: string; body: string; icon: LucideIcon }> = [
    ...(isDegree
      ? [
          { title: 'Degree', body: 'From Top University', icon: GraduationCap },
          { title: 'Learn', body: 'In demand skills & Tech Tools', icon: Wrench },
          { title: 'Hands on Skills', body: 'with Lab & Project Works', icon: Monitor },
          { title: 'Placement', body: `in Top Companies, ${PLACEMENT_PARTNERS} partners`, icon: Briefcase },
        ]
      : [
          { title: course.duration, body: 'Course duration', icon: CalendarDays },
          { title: 'Eligibility', body: course.eligibility, icon: GraduationCap },
          { title: 'Hands-on labs', body: 'Practical learning at your centre', icon: Monitor },
          { title: 'Placement support', body: 'Career assistance', icon: Briefcase },
        ]),
  ];

  // Placed learners come from the centre pages' own published records (name, company and portrait together),
  // offering centres first; only entries that have a photo, de-duplicated by name.
  const placedLearners = (() => {
    const seen = new Set<string>();
    const out: Array<{ name: string; company: string; photoUrl: string }> = [];
    for (const c of [...offeringCentres, ...centres]) {
      for (const pl of c.placements ?? []) {
        const key = pl.name.trim().toLowerCase();
        if (!pl.photoUrl || !pl.name.trim() || !pl.company.trim() || seen.has(key)) continue;
        seen.add(key);
        out.push({ name: pl.name.trim(), company: pl.company.trim(), photoUrl: pl.photoUrl });
        if (out.length >= 16) return out;
      }
    }
    return out;
  })();

  const label = isDegree ? degree : course.shortTitle || course.title;

  const topicCount = course.curriculum?.reduce((n, t) => n + t.items.length, 0) ?? 0;
  const projectCount = course.curriculum?.reduce((n, t) => n + t.items.filter((i) => /^project/i.test(i)).length, 0) ?? 0;
  const curriculumStats = [
    course.curriculum?.length
      ? { value: String(course.curriculum.length), label: course.curriculum.length === 1 ? 'Term' : 'Terms' }
      : { value: String(course.modules.length), label: 'Modules' },
    course.curriculum?.length ? { value: String(topicCount), label: 'Topics' } : { value: course.duration, label: 'Duration' },
    projectCount ? { value: String(projectCount), label: 'Projects' } : { value: String(course.tools?.length ?? 0), label: 'Tools' },
    { value: String(course.certifications.length), label: 'Certifications' },
  ].filter((st) => st.value !== '0');

  const internshipPoints = (course.highlights ?? []).filter((h) => /intern|placement|offer/i.test(h));

  const centreSection = (
      <section id="cp-centres" className="cp-band-grey cp-section scroll-mt-24">
        <div className="shell">
          <Heading kicker="The Jetking centre advantage">{isDegree ? 'A mini campus near your home' : 'Your learning journey, with a mini campus near your home'}</Heading>
          {!isDegree && course.phases?.length ? (
            <ol className="mt-8 grid gap-4 lg:grid-cols-3">
              {course.phases.map((phase, i) => (
                <li key={phase.title} className={`cp-card border-t-4 p-6 ${ACCENT_TOPS[i % 3]}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold ${ACCENT_DOTS[i % 3]}`}>{i + 1}</span>
                  <h3 className="cp-h3 mt-4">{phase.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--cp-ink-2)]">{phase.description}</p>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center lg:gap-12">
            <div className="relative aspect-[412/280] overflow-hidden rounded-[24px] border-4 border-[var(--cp-red)]">
              <Image src="/courses/centre-advantage.jpg" alt="Learners and a mentor working together in a Jetking lab" fill sizes="(min-width: 1024px) 26rem, 100vw" className="object-cover" />
            </div>
            <ul className="grid gap-3">
              {CENTRE_ADVANTAGES.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.title} className="cp-card flex items-center gap-4 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="cp-h3">{a.title}</h3>
                      <p className="mt-1 text-[14px] leading-snug text-[var(--cp-muted)]">{a.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {offeringCentres.length ? (
            <div className="cp-card mt-12 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[1.375rem] leading-tight font-bold text-[var(--cp-ink)]">
                  Available at <span className="text-[var(--cp-red)]">{offeringCentres.length}</span>{' '}
                  {offeringCentres.length === 1 ? 'centre' : 'centres'}
                </p>
                <p className="mt-1 text-[15px] text-[var(--cp-ink-2)]">
                  Across {cityGroups.length} {cityGroups.length === 1 ? 'city' : 'cities'} — pick a location that works for you.
                </p>
              </div>
              <Link href="/centres" className="cp-btn shrink-0">
                Browse centres
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
  );

  return (
    <div className="cp">
      {/* ── 1. Top banner with enquiry form ─────────────────────────────── */}
      <section className="cp-band-sky relative overflow-hidden pt-6 pb-10 sm:pt-8 lg:pb-14">
        {course.heroImage ? (
          <>
            <Image
              src={course.heroImage.url}
              alt={course.heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="hidden object-cover object-right md:block"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 hidden bg-gradient-to-r from-[var(--cp-sky)] from-35% via-[var(--cp-sky)]/80 to-transparent md:block"
            />
          </>
        ) : null}
        <div className="shell relative">
          <Breadcrumbs trail={trail} />
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-start lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--cp-red-fill)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-white uppercase">
                  {course.level}
                </span>
                <span className="rounded-full bg-[var(--cp-bg)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--cp-ink)] uppercase">
                  {course.duration}
                </span>
                {offeringCentres.length ? (
                  <a
                    href="#cp-centres"
                    className="tap inline-flex items-center gap-1 rounded-full bg-[var(--cp-bg)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--cp-ink)] uppercase"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {offeringCentres.length} {offeringCentres.length === 1 ? 'centre' : 'centres'}
                  </a>
                ) : null}
              </div>

              {/* Slide 5: "BCA in" over the specialisation, one short tagline, one Brochure button. */}
              <h1 className="cp-h1 mt-5" style={{ viewTransitionName: `course-${course.slug}` }}>
                {titlePrefix ? <span className="block text-[0.55em] leading-tight font-normal text-[var(--cp-ink-2)]">{titlePrefix} in</span> : null}
                <span className="block text-balance">{titleMain}</span>
              </h1>
              <p className="cp-lede mt-5 max-w-[52ch]">{tagline}</p>

              <div id="course-hero-cta" className="mt-7 flex flex-wrap gap-3">
                {isDegree ? (
                  <a href="#cp-enquiry" className="cp-btn">
                    Brochure
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <>
                    <a href="#cp-enquiry" className="cp-btn">
                      Talk to a Counsellor
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a href="#cp-enquiry" className="cp-btn cp-btn-ghost">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download Brochure
                    </a>
                  </>
                )}
              </div>
            </div>

            <aside id="cp-enquiry" aria-labelledby="cp-form-title" className="scroll-mt-24 rounded-[20px] border border-[var(--cp-line)] bg-[var(--cp-bg)] p-4 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.35)] sm:p-5">
              <h2 id="cp-form-title" className="mb-3 text-[1.0625rem] leading-snug font-bold text-[var(--cp-red)]">
                Sign up for a free career counselling session!
              </h2>
              <QuickEnquiryForm
                centres={toEnquiryCentres(centres, cities)}
                source={`course-${course.slug}-banner`}
                compact
              />
            </aside>
          </div>
        </div>
      </section>

      {/* ── 2. Key programme highlights ─────────────────────────────────── */}
      <section className="shell pt-10" aria-label="Programme at a glance">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickFacts.map((fact, i) => {
            const Icon = fact.icon;
            return (
              <li key={fact.title} className="cp-card flex flex-col items-start gap-3 p-4 sm:flex-row sm:gap-4 sm:p-5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${HIGHLIGHT_ACCENTS[i]}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="cp-h3">{fact.title}</p>
                  <p className="mt-0.5 text-[14px] leading-snug text-[var(--cp-muted)]">{fact.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 3. Why this degree & why now (job roles) ────────────────────── */}
      <section className="cp-section shell">
        <Heading kicker={isDegree ? 'Why now' : 'Industry demand'}>
          {isDegree ? `Why ${degree} and why now` : `Industry demand for ${label} professionals`}
        </Heading>
        {isDegree ? (
          <p className="mt-5 text-[1.125rem] font-bold text-[var(--cp-ink)]">
            {degree} is one of the most in-demand degrees for India’s tech workforce.
          </p>
        ) : null}
        {summaryRest ? <p className={`cp-lede max-w-[70ch] ${isDegree ? 'mt-3' : 'mt-5'}`}>{summaryRest}</p> : null}
        <ul className="mt-6 grid gap-3">
          {course.outcomes.map((o) => (
            <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-[var(--cp-ink-2)]">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--cp-yellow)]" />
              {o}
            </li>
          ))}
        </ul>

        {course.careerRoles?.length ? (
          <div className="mt-12">
            <Heading kicker="Careers">What career this Program can provide</Heading>
            <ul className="mt-6 flex flex-wrap gap-2">
              {course.careerRoles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-[var(--cp-line)] bg-[var(--cp-sky)] px-3.5 py-1.5 text-[13.5px] font-bold text-[var(--cp-ink)]"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Slide 2: the "how does placement work" prompt, answered on this page rather than a new one. */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[var(--cp-line)] bg-[var(--cp-yellow-tint)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="cp-eyebrow">Placement</p>
            <p className="mt-1 text-[17px] font-bold text-[var(--cp-ink)]">Want to know how our Placement works?</p>
          </div>
          <a href={isDegree ? '#cp-placement' : '#cp-records'} className="cp-btn shrink-0">
            See placement support
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Breathing-space photo (slide 3: images between content blocks). */}
      <section className="shell pb-[clamp(2.5rem,6vw,4.5rem)]" aria-label="Learn by doing">
        <div className="relative min-h-[240px] overflow-hidden rounded-[28px] sm:min-h-[280px]">
          <Image src="/home/journey-student-v2.jpg" alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-[center_25%]" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0f1115]/95 via-[#0f1115]/80 to-[#0f1115]/10" />
          <div className="relative flex min-h-[inherit] max-w-xl flex-col justify-center gap-4 p-7 sm:p-10">
            <span className="cp-eyebrow !text-[var(--cp-yellow)]">Learn by doing</span>
            <p className="text-2xl leading-tight font-bold text-white sm:text-3xl">
              Labs with mentors beside you, and a placement team behind you.
            </p>
            <a href="#cp-enquiry" className="cp-btn cp-btn-yellow self-start">
              Talk to a counsellor
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {isDegree ? (
        <>
      {/* ── 4. Course highlights (internship & placement points sit in the same band) ── */}
      {course.highlights?.length ? (
        <section className="cp-band-grey cp-section">
          <div className="shell">
            <Heading kicker="Course highlights">What makes this degree different</Heading>
            {course.highlights.some((h) => !internshipPoints.includes(h)) ? (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {course.highlights.filter((h) => !internshipPoints.includes(h)).map((item, i) => (
                  <li key={item} className="cp-card flex gap-4 p-5">
                    <span
                      aria-hidden="true"
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold ${HIGHLIGHT_ACCENTS[i % 3]}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[15px] leading-snug text-[var(--cp-ink-2)]">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {internshipPoints.length ? (
              <>
                <h3 className="cp-h3 mt-10">Internship &amp; placement opportunities</h3>
                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {internshipPoints.map((item, i) => (
                    <li key={item} className={`flex gap-4 rounded-2xl p-5 ${i % 2 ? 'bg-[var(--cp-sky)]' : 'bg-[var(--cp-yellow-tint)]'}`}>
                      <Briefcase className="mt-0.5 h-6 w-6 shrink-0 text-[var(--cp-red)]" aria-hidden="true" />
                      <span className="text-[15px] leading-snug font-bold text-[var(--cp-ink)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── 5. About the university ─────────────────────────────────────── */}
      <section className="cp-section shell">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <Heading kicker="About the university">
              {course.university ? `Your degree from ${course.university}` : 'A degree from our university partner'}
            </Heading>
            {universityLogo ? (
              <div className="mt-8 inline-flex rounded-2xl border border-[var(--cp-line)] bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- local partner logo */}
                <img src={universityLogo} alt={`${course.university} logo`} className="h-14 w-auto object-contain" />
              </div>
            ) : null}
            <p className="cp-lede mt-6 max-w-[56ch]">
              {course.university
                ? `You study at a Jetking centre and graduate with a university-awarded degree from ${course.university}, with Jetking's lab work, certifications and placement support built in.`
                : 'You study at a Jetking centre and graduate with a UGC-recognised degree awarded by our university partner, with Jetking’s lab work, certifications and placement support built in.'}
            </p>
            <ul className="mt-5 grid gap-2.5">
              {['Recognised degree awarded by the university', 'Jetking labs, mentors and master sessions at your centre'].map((t) => (
                <li key={t} className="flex gap-2.5 text-[15px] text-[var(--cp-ink-2)]">
                  <BadgeCheck className="mt-px h-[18px] w-[18px] shrink-0 text-[var(--cp-blue)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <figure className="rounded-[24px] bg-[var(--cp-yellow-tint)] p-4 sm:p-6">
            <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element -- local SVG specimen */}
              <img src="/courses/sample-degree.svg" alt="Sample degree certificate" className="h-full w-full object-contain" />
            </div>
            <figcaption className="mt-3 text-[13px] text-[var(--cp-muted)]">
              Illustrative sample — the actual degree is issued by the university.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── 6. Your learning journey ────────────────────────────────────── */}
      {course.phases?.length ? (
        <section className="cp-band-sky cp-section">
          <div className="shell">
            <Heading kicker="Your learning journey">From first lab to first job</Heading>
            <ol className="mt-8 grid gap-4 lg:grid-cols-3">
              {course.phases.map((phase, i) => (
                <li key={phase.title} className={`cp-card relative border-t-4 p-6 ${ACCENT_TOPS[i % 3]}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold ${ACCENT_DOTS[i % 3]}`}>
                    {i + 1}
                  </span>
                  <h3 className="cp-h3 mt-4">{phase.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--cp-ink-2)]">{phase.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

        </>
      ) : null}

      {!isDegree ? centreSection : null}

      {/* ── 7. Curriculum ───────────────────────────────────────────────── */}
      <section className="cp-section shell">
        <div className="flex items-baseline justify-between gap-4">
          <Heading kicker="Curriculum">What you will study</Heading>
          <span className="shrink-0 text-[13px] font-bold text-[var(--cp-muted)]">
            {course.curriculum?.length
              ? `${course.curriculum.reduce((n, t) => n + t.items.length, 0)} topics`
              : `${course.modules.length} modules`}
          </span>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {curriculumStats.map((stat, i) => (
            <li key={stat.label} className={`rounded-2xl p-4 text-center ${['bg-[var(--cp-red-tint)]', 'bg-[var(--cp-yellow-tint)]', 'bg-[var(--cp-sky)]', 'bg-[var(--cp-grey)]'][i % 4]}`}>
              <span className="block text-3xl leading-none font-bold text-[var(--cp-ink)]">{stat.value}</span>
              <span className="mt-1.5 block text-[12.5px] font-bold tracking-[0.06em] text-[var(--cp-muted)] uppercase">{stat.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-[var(--cp-line)]">
          {course.curriculum?.length
            ? course.curriculum.map((term, i) => (
                <Disclosure key={term.title} tone="flush" defaultOpen={i === 0} summary={term.title} meta={`${term.items.length} topics`}>
                  <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {term.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[14.5px] text-[var(--cp-ink-2)]">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cp-red)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Disclosure>
              ))
            : course.modules.map((m, i) => (
                <Disclosure key={m} tone="flush" defaultOpen={i === 0} summary={m} meta={`Module ${String(i + 1).padStart(2, '0')}`}>
                  <p className="text-[15px] text-[var(--cp-ink-2)]">
                    Taught in person at your centre, with lab work and assessment built into the module.
                  </p>
                </Disclosure>
              ))}
        </div>
      </section>

      {/* ── 8. Tools & technologies — all logos in two lines on a light band ─ */}
      {course.tools?.length ? (
        <section className="cp-band-sky cp-section">
          <div className="shell">
            <Heading kicker="Tools & technologies">Tools you will work with</Heading>
            <ul className="cp-two-lines mt-8">
              {course.tools.map((tool) => (
                <li key={tool}>
                  <BrandTile name={tool} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 9. Industry certifications ──────────────────────────────────── */}
      {course.certifications.length ? (
        <section className="cp-section shell">
          <Heading kicker="Industry certifications">Certifications you can prepare for</Heading>
          <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {course.certifications.map((cert) => (
              <li key={cert}>
                <BrandTile name={cert} />
              </li>
            ))}
          </ul>
          {course.certificateImage ? (
            <figure className="mt-10 grid items-center gap-6 rounded-[20px] bg-[var(--cp-sky)] p-5 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-10 sm:p-8">
              <ZoomImage src={course.certificateImage.url} alt={course.certificateImage.alt} caption="Jetking certificate specimen" />
              <figcaption>
                <p className="cp-h2 flex items-center gap-3">
                  <Award className="h-7 w-7 shrink-0 text-[var(--cp-yellow-ink)]" aria-hidden="true" />
                  Jetking Certificate
                </p>
                <p className="mt-3 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--cp-ink-2)]">
                  Awarded in your name on successful completion of the programme. Select the specimen to see it at full size.
                </p>
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {isDegree ? (
        <>
      {/* ── 10. How placement works (kept on this page) ─────────────────── */}
      <section id="cp-placement" className="cp-band-yellow cp-section scroll-mt-24">
        <div className="shell">
          <Heading kicker="How placement works">Five steps from classroom to offer</Heading>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((s, i) => (
              <li key={s.step} className="cp-card flex items-center gap-4 p-4 sm:block sm:p-5">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--cp-red-tint)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local icon */}
                  <img src={STEP_ICONS[i]} alt="" className="h-7 w-7" />
                  <span className="absolute -top-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--cp-red-fill)] text-[11px] font-bold text-white">{s.step}</span>
                </span>
                <div>
                  <h3 className="cp-h3 sm:mt-4">{s.title}</h3>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--cp-muted)] sm:mt-1.5">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
        </>
      ) : null}

      {/* ── 11. Placement records — 4 learner cards per scroll, no testimonials ─── */}
      <section id="cp-records" className="cp-section shell scroll-mt-24">
        {/* Slide 10: stat beside the heading, four learner cards per scroll, no testimonials.
            No learner photos are in the repo yet, so a monogram stands in until they are supplied. */}
        <SnapSlider
          label="Placed learners"
          aside={
            <div className="flex flex-row items-center gap-4 rounded-2xl bg-[var(--cp-red-tint)] p-5 lg:flex-col lg:items-start lg:justify-center lg:gap-5">
              <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--cp-red-fill)] text-white">
                <Users className="h-6 w-6" />
              </span>
              <p>
                <span className="block text-4xl leading-none font-bold text-[var(--cp-red)]">{LEARNERS_PLACED.value}</span>
                <span className="mt-2 block text-[14px] leading-snug font-bold text-[var(--cp-ink)]">{LEARNERS_PLACED.label}</span>
              </p>
            </div>
          }
          header={
            <>
              <Heading kicker="Placement records">Our alumni are in top companies &amp; growing fast</Heading>
            </>
          }
        >
          {placedLearners.map((c) => (
            <li
              key={c.name}
              className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-[#a50d13] to-[#7a0d12] p-4 text-center text-white sm:p-5"
            >
              <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-white ring-4 ring-white/30">
                <Image src={c.photoUrl} alt={`${c.name}, placed at ${c.company}`} fill sizes="80px" className="object-cover" />
              </span>
              <p className="mt-4 text-[17px] font-bold">{c.name}</p>
              <span aria-hidden="true" className="my-3 h-px w-10 bg-white/40" />
              <p className="text-[11px] font-bold tracking-[0.1em] text-white/70 uppercase">Placed at</p>
              <p className="mt-1 text-[15px] font-bold text-[var(--cp-yellow)]">{c.company}</p>
            </li>
          ))}
        </SnapSlider>

        <div className="mt-14 border-t border-[var(--cp-line)] pt-10">
          <h3 className="cp-h3">Brands that are our placement partners</h3>
          <RecruiterMarquee items={RECRUITERS} />
          <p className="mt-4 text-[12.5px] text-[var(--cp-muted)]">{RECRUITERS_DISCLAIMER}</p>
        </div>
      </section>

      {isDegree ? centreSection : null}

      {/* ── 13. Call to action ──────────────────────────────────────────── */}
      <section className="cp-section shell">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--cp-line)] bg-[var(--cp-bg)] p-6 shadow-[0_20px_50px_-30px_rgba(17,24,39,0.4)] sm:p-10">
          <span aria-hidden="true" className="absolute -right-10 -bottom-16 hidden h-56 w-56 rounded-full bg-[var(--cp-yellow)] sm:block" />
          <span aria-hidden="true" className="absolute right-24 -bottom-24 hidden h-48 w-48 rounded-full bg-[var(--cp-blue)] opacity-90 sm:block" />
          <div className="relative max-w-xl">
            <h2 className="cp-h2">Got more questions? Talk to us</h2>
            <p className="cp-lede mt-3">Connect with our advisors and get your queries resolved.</p>
            <a href="#cp-enquiry" className="cp-btn mt-6">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Contact us
            </a>
            <p className="mt-5 text-[14.5px] text-[var(--cp-ink-2)]">
              Speak with our expert{' '}
              <a href={`tel:${siteConfig.helpline}`} className="font-bold underline">
                {siteConfig.helpline}
              </a>{' '}
              or email{' '}
              <a href="mailto:info@jetking.com" className="inline-flex items-center gap-1 font-bold underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                info@jetking.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── 14. FAQs, similar courses ───────────────────────────────────── */}
      {ownFaqs.length + feeFaqs.length ? (
        <section className="shell pb-[clamp(2.5rem,6vw,4.5rem)]">
          <Heading kicker="FAQs">Frequently asked questions</Heading>
          <div className="mt-8 border-t border-[var(--cp-line)]">
            {ownFaqs.map((faq) => (
              <Disclosure key={faq.question} tone="flush" summary={faq.question}>
                <p className="measure text-[15px]">{faq.answer}</p>
              </Disclosure>
            ))}
            {/* The fees / placement answers: reading this block is the `fee-depth` signal. */}
            <div id="course-fee-faqs">
              {feeFaqs.map((faq) => (
                <Disclosure key={faq.question} tone="flush" summary={faq.question}>
                  <p className="measure text-[15px]">{faq.answer}</p>
                </Disclosure>
              ))}
            </div>
          </div>
          {feeFaqs.length ? <FeeDepthTracker targetId="course-fee-faqs" courseSlug={course.slug} /> : null}
        </section>
      ) : null}

      {related.length ? (
        <section className="cp-band-grey cp-section">
          <div className="shell">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <Heading kicker="Similar courses">Explore more courses</Heading>
              <Link href="/courses" className="tap inline-flex min-h-6 items-center gap-1.5 text-[14px] font-bold text-[var(--cp-red)]">
                Full catalogue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/courses/${item.slug}`} className="cp-card group block h-full overflow-hidden transition-shadow hover:shadow-lg">
                    {item.heroImage ? (
                      <div className="relative aspect-[16/9]">
                        <Image src={item.heroImage.url} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <span className="text-[12px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">
                        {item.level} · {item.duration}
                      </span>
                      <h3 className="cp-h3 mt-2">{item.shortTitle}</h3>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--cp-red)]">
                        View course
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
