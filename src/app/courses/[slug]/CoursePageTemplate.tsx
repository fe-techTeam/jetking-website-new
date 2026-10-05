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
import type { Centre, City, Course, PlacementsPageContent } from '@/lib/content/types';
import { toEnquiryCentres } from '@/lib/enquiry-centres';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { coursesCopy } from '@/lib/content/copy/pages/courses';
import { Breadcrumbs, type Crumb } from '@/components/ui';
import { Disclosure } from '@/components/Disclosure';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';
import { RecruiterMarquee } from '@/components/placements/RecruiterMarquee';
import { BrandTile } from './brand';
import { ZoomImage } from './ZoomImage';
import { SnapSlider } from './SnapSlider';
import { FeeDepthTracker } from './FeeDepthTracker';
import { JumpNav, type JumpItem } from '@/components/JumpNav';
import { CourseCard } from '@/components/CourseCard';
import { EnquiryLink } from '@/components/EnquirySheet';
import { CentrePicker } from './CentrePicker';

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
const STEP_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Icons for the five centre advantages; their titles and text are `courseCentres.advantages.*` copy. */
const CENTRE_ADVANTAGE_ICONS: LucideIcon[] = [Monitor, CalendarDays, Compass, Mic, Users];

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
const ACCENT_TOPS = ['border-t-[var(--cp-red)]', 'border-t-[var(--cp-red)]', 'border-t-[var(--cp-red)]'];
const ACCENT_DOTS = ['bg-[var(--cp-red-fill)] text-white', 'bg-[var(--cp-red-fill)] text-white', 'bg-[var(--cp-red-fill)] text-white'];

const HIGHLIGHT_ACCENTS = [
  'bg-[var(--cp-red-tint)] text-[var(--cp-red)]',
  'bg-[var(--cp-red-tint)] text-[var(--cp-red)]',
  'bg-[var(--cp-red-tint)] text-[var(--cp-red)]',
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

/**
 * Enquiry button that follows the viewport: below lg (phones/tablets, where the banner form is not shown)
 * it opens the in-page enquiry sheet; from lg up it scrolls to the banner form as before.
 */
function EnquireCta({ source, className, children }: { source: string; className: string; children: React.ReactNode }) {
  return (
    <>
      <span className="contents lg:hidden">
        <EnquiryLink source={source} className={className}>
          {children}
        </EnquiryLink>
      </span>
      <span className="hidden lg:contents">
        <a href="#cp-enquiry" className={className}>
          {children}
        </a>
      </span>
    </>
  );
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
  placements,
  copy,
}: {
  copy: typeof coursesCopy.defaults;
  placements: PlacementsPageContent;
  course: Course;
  trail: Crumb[];
  centres: Centre[];
  cities: City[];
  offeringCentres: Centre[];
  related: Course[];
  ownFaqs: Array<{ question: string; answer: string }>;
  feeFaqs: Array<{ question: string; answer: string }>;
}) {
  // Placement figures, process steps and recruiter logos are CMS content (`placements_page`).
  const { processSteps: PROCESS_STEPS, recruiters: RECRUITERS, recruitersDisclaimer: RECRUITERS_DISCLAIMER } = placements;
  const PLACEMENT_PARTNERS = placements.stats.partners;
  const LEARNERS_PLACED = placements.stats.learnersPlaced;
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

  const centreAdvantages = [
    { title: copy['courseCentres.advantages.0.title'], body: copy['courseCentres.advantages.0.body'] },
    { title: copy['courseCentres.advantages.1.title'], body: copy['courseCentres.advantages.1.body'] },
    { title: copy['courseCentres.advantages.2.title'], body: copy['courseCentres.advantages.2.body'] },
    { title: copy['courseCentres.advantages.3.title'], body: copy['courseCentres.advantages.3.body'] },
    { title: copy['courseCentres.advantages.4.title'], body: copy['courseCentres.advantages.4.body'] },
  ].map((a, i) => ({ ...a, icon: CENTRE_ADVANTAGE_ICONS[i]! }));

  const quickFacts: Array<{ title: string; body: string; icon: LucideIcon }> = [
    ...(isDegree
      ? [
          { title: copy['courseFacts.degreeTitle'], body: copy['courseFacts.degreeBody'], icon: GraduationCap },
          { title: copy['courseFacts.learnTitle'], body: copy['courseFacts.learnBody'], icon: Wrench },
          { title: copy['courseFacts.handsOnTitle'], body: copy['courseFacts.handsOnBody'], icon: Monitor },
          { title: copy['courseFacts.placementTitle'], body: fill(copy['courseFacts.placementBody'], { partners: PLACEMENT_PARTNERS }), icon: Briefcase },
        ]
      : [
          { title: course.duration, body: copy['courseFacts.durationBody'], icon: CalendarDays },
          { title: copy['courseFacts.eligibilityTitle'], body: course.eligibility, icon: GraduationCap },
          { title: copy['courseFacts.labsTitle'], body: copy['courseFacts.labsBody'], icon: Monitor },
          { title: copy['courseFacts.supportTitle'], body: copy['courseFacts.supportBody'], icon: Briefcase },
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
      ? { value: String(course.curriculum.length), label: course.curriculum.length === 1 ? copy['courseCurriculum.statTerm'] : copy['courseCurriculum.statTerms'] }
      : { value: String(course.modules.length), label: copy['courseCurriculum.statModules'] },
    course.curriculum?.length ? { value: String(topicCount), label: copy['courseCurriculum.statTopics'] } : { value: course.duration, label: copy['courseCurriculum.statDuration'] },
    projectCount ? { value: String(projectCount), label: copy['courseCurriculum.statProjects'] } : { value: String(course.tools?.length ?? 0), label: copy['courseCurriculum.statTools'] },
    { value: String(course.certifications.length), label: copy['courseCurriculum.statCertifications'] },
  ].filter((st) => st.value !== '0');

  const internshipPoints = (course.highlights ?? []).filter((h) => /intern|placement|offer/i.test(h));

  // Phone/tablet "on this page" strip: only the sections this course actually has, in page order.
  const jumpItems: JumpItem[] = [
    { id: 'cp-why', label: copy['courseJump.overview'] },
    ...(!isDegree && offeringCentres.length ? [{ id: 'cp-centres', label: copy['courseJump.centres'] }] : []),
    { id: 'cp-curriculum', label: copy['courseJump.curriculum'] },
    ...(course.tools?.length ? [{ id: 'cp-tools', label: copy['courseJump.tools'] }] : []),
    ...(course.certifications.length ? [{ id: 'cp-certs', label: copy['courseJump.certifications'] }] : []),
    { id: isDegree ? 'cp-placement' : 'cp-records', label: copy['courseJump.placement'] },
    ...(isDegree && offeringCentres.length ? [{ id: 'cp-centres', label: copy['courseJump.centres'] }] : []),
    ...(ownFaqs.length + feeFaqs.length ? [{ id: 'cp-faqs', label: copy['courseJump.faqs'] }] : []),
  ];

  const centreSection = (
      <section id="cp-centres" className="cp-band-grey cp-section scroll-mt-36 lg:scroll-mt-24">
        <div className="shell">
          <Heading kicker={copy['courseCentres.kicker']}>{isDegree ? copy['courseCentres.degreeTitle'] : copy['courseCentres.shortTitle']}</Heading>
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
              <Image src={copy['courseCentres.image']} alt={copy['courseCentres.imageAlt']} fill sizes="(min-width: 1024px) 26rem, 100vw" className="object-cover" />
            </div>
            <ul className="grid gap-3">
              {centreAdvantages.map((a) => {
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
            <CentrePicker
              copy={copy}
              centreCount={offeringCentres.length}
              fallbackPhone={siteConfig.helpline}
              cities={cityGroups.map((g) => ({
                slug: g.slug,
                name: g.name,
                centres: g.list.map((c) => ({
                  slug: c.slug,
                  name: c.name,
                  locality: c.locality,
                  address: [c.addressLine, c.locality, c.pincode].filter(Boolean).join(', '),
                  phone: c.phone,
                })),
              }))}
            />
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
              sizes="(min-width: 768px) 100vw, 1px"
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
                    {fill(offeringCentres.length === 1 ? copy['courseBanner.centresOne'] : copy['courseBanner.centresMany'], { count: offeringCentres.length })}
                  </a>
                ) : null}
              </div>

              {/* Slide 5: "BCA in" over the specialisation, one short tagline, one Brochure button. */}
              <h1 className="cp-h1 mt-5" style={{ viewTransitionName: `course-${course.slug}` }}>
                {titlePrefix ? <span className="block text-[0.55em] leading-tight font-normal text-[var(--cp-ink-2)]">{fill(copy['courseBanner.prefixIn'], { prefix: titlePrefix })}</span> : null}
                <span className="block text-balance">{titleMain}</span>
              </h1>
              <p className="cp-lede mt-5 max-w-[52ch]">{tagline}</p>

              <div id="course-hero-cta" className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {isDegree ? (
                  <EnquireCta source={`course-${course.slug}-hero`} className="cp-btn">
                    {copy['courseBanner.degreeCta']}
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </EnquireCta>
                ) : (
                  <>
                    <EnquireCta source={`course-${course.slug}-hero`} className="cp-btn">
                      {copy['courseBanner.counsellorCta']}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </EnquireCta>
                    <EnquireCta source={`course-${course.slug}-brochure`} className="cp-btn cp-btn-ghost">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {copy['courseBanner.brochureCta']}
                    </EnquireCta>
                  </>
                )}
              </div>
            </div>

            <aside id="cp-enquiry" aria-labelledby="cp-form-title" className="hidden scroll-mt-24 rounded-[20px] lg:block border border-[var(--cp-line)] bg-[var(--cp-bg)] p-4 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.35)] sm:p-5">
              <h2 id="cp-form-title" className="mb-3 text-[1.0625rem] leading-snug font-bold text-[var(--cp-red)]">
                {copy['courseForm.title']}
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

      <JumpNav items={jumpItems} />

      {/* ── 2. Key programme highlights ─────────────────────────────────── */}
      <section className="shell pt-10 pb-[clamp(2.25rem,5vw,3.5rem)]" aria-label={copy['courseFacts.aria']}>
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
      <section id="cp-why" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        <Heading kicker={isDegree ? copy['courseWhy.degreeKicker'] : copy['courseWhy.shortKicker']}>
          {isDegree ? fill(copy['courseWhy.degreeTitle'], { degree }) : fill(copy['courseWhy.shortTitle'], { label })}
        </Heading>
        {isDegree ? (
          <p className="mt-5 text-[1.125rem] font-bold text-[var(--cp-ink)]">
            {fill(copy['courseWhy.degreeLead'], { degree })}
          </p>
        ) : null}
        {summaryRest ? <p className={`cp-lede max-w-[70ch] ${isDegree ? 'mt-3' : 'mt-5'}`}>{summaryRest}</p> : null}
        <ul className="mt-6 grid gap-3">
          {course.outcomes.map((o) => (
            <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-[var(--cp-ink-2)]">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--cp-red)]" />
              {o}
            </li>
          ))}
        </ul>

        {course.careerRoles?.length ? (
          <div className="mt-12">
            <Heading kicker={copy['courseCareers.kicker']}>{copy['courseCareers.title']}</Heading>
            <ul className="mt-6 flex flex-wrap gap-2">
              {course.careerRoles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-[var(--cp-line)] bg-[var(--cp-grey)] px-3.5 py-1.5 text-[14px] font-bold text-[var(--cp-ink)]"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Slide 2: the "how does placement work" prompt, answered on this page rather than a new one. */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[var(--cp-line)] bg-[var(--cp-grey)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="cp-eyebrow">{copy['coursePlacementPrompt.kicker']}</p>
            <p className="mt-1 text-[17px] font-bold text-[var(--cp-ink)]">{copy['coursePlacementPrompt.title']}</p>
          </div>
          <a href={isDegree ? '#cp-placement' : '#cp-records'} className="cp-btn shrink-0">
            {copy['coursePlacementPrompt.cta']}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Phones/tablets: the enquiry form sits mid-page, after the reader has seen what the course is (the hero offers the
          main action first). From lg up the same form is the banner card above. */}
      <section aria-labelledby="cp-form-title-m" className="shell py-[clamp(2.25rem,5vw,3.5rem)] lg:hidden">
        <div id="cp-enquiry-m" className="cp-card scroll-mt-36 p-5 sm:p-6">
          <h2 id="cp-form-title-m" className="mb-4 text-[1.0625rem] leading-snug font-bold text-[var(--cp-red)]">
            {copy['courseForm.title']}
          </h2>
          <QuickEnquiryForm centres={toEnquiryCentres(centres, cities)} source={`course-${course.slug}-mid`} />
        </div>
      </section>

      {/* Breathing-space photo (slide 3: images between content blocks). */}
      <section className="shell py-[clamp(2.25rem,5vw,3.5rem)]" aria-label={copy['coursePhoto.aria']}>
        <div className="relative min-h-[240px] overflow-hidden rounded-[28px] sm:min-h-[280px]">
          <Image src={copy['coursePhoto.image']} alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-[center_25%]" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0f1115]/95 via-[#0f1115]/80 to-[#0f1115]/10" />
          <div className="relative flex min-h-[inherit] max-w-xl flex-col justify-center gap-4 p-7 sm:p-10">
            <span className="cp-eyebrow !text-white/80">{copy['coursePhoto.kicker']}</span>
            <p className="text-2xl leading-tight font-bold text-white sm:text-3xl">
              {copy['coursePhoto.text']}
            </p>
            <EnquireCta source={`course-${course.slug}-photo`} className="cp-btn cp-btn-light self-start">
              {copy['coursePhoto.cta']}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </EnquireCta>
          </div>
        </div>
      </section>

      {isDegree ? (
        <>
      {/* ── 4. Course highlights (internship & placement points sit in the same band) ── */}
      {course.highlights?.length ? (
        <section className="cp-band-grey cp-section">
          <div className="shell">
            <Heading kicker={copy['courseHighlights.kicker']}>{copy['courseHighlights.title']}</Heading>
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
                <h3 className="cp-h3 mt-10">{copy['courseHighlights.internshipTitle']}</h3>
                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {internshipPoints.map((item) => (
                    <li key={item} className={`flex gap-4 rounded-2xl p-5 bg-[var(--cp-grey)]`}>
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
            <Heading kicker={copy['courseUniversity.kicker']}>
              {course.university ? fill(copy['courseUniversity.titleWith'], { university: course.university }) : copy['courseUniversity.titleWithout']}
            </Heading>
            {universityLogo ? (
              <div className="mt-8 inline-flex rounded-2xl border border-[var(--cp-line)] bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- local partner logo */}
                <img src={universityLogo} alt={fill(copy['courseUniversity.logoAlt'], { university: course.university ?? '' })} className="h-14 w-auto object-contain" />
              </div>
            ) : null}
            <p className="cp-lede mt-6 max-w-[56ch]">
              {course.university
                ? fill(copy['courseUniversity.bodyWith'], { university: course.university })
                : copy['courseUniversity.bodyWithout']}
            </p>
            <ul className="mt-5 grid gap-2.5">
              {[copy['courseUniversity.points.0'], copy['courseUniversity.points.1']].map((t) => (
                <li key={t} className="flex gap-2.5 text-[15px] text-[var(--cp-ink-2)]">
                  <BadgeCheck className="mt-px h-[18px] w-[18px] shrink-0 text-[var(--cp-red)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <figure className="rounded-[24px] bg-[var(--cp-grey)] p-4 sm:p-6">
            <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element -- local SVG specimen */}
              <img src={copy['courseUniversity.specimenImage']} alt={copy['courseUniversity.specimenAlt']} className="h-full w-full object-contain" />
            </div>
            <figcaption className="mt-3 text-[13px] text-[var(--cp-muted)]">
              {copy['courseUniversity.specimenCaption']}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── 6. Your learning journey ────────────────────────────────────── */}
      {course.phases?.length ? (
        <section className="cp-section">
          <div className="shell">
            <Heading kicker={copy['courseJourney.kicker']}>{copy['courseJourney.title']}</Heading>
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
      <section id="cp-curriculum" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        <div className="flex items-baseline justify-between gap-4">
          <Heading kicker={copy['courseCurriculum.kicker']}>{copy['courseCurriculum.title']}</Heading>
          <span className="shrink-0 text-[13px] font-bold text-[var(--cp-muted)]">
            {course.curriculum?.length
              ? fill(copy['courseCurriculum.topics'], { count: course.curriculum.reduce((n, t) => n + t.items.length, 0) })
              : fill(copy['courseCurriculum.modules'], { count: course.modules.length })}
          </span>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {curriculumStats.map((stat) => (
            <li key={stat.label} className={`rounded-2xl p-4 text-center ${'bg-[var(--cp-grey)]'}`}>
              <span className="block text-3xl leading-none font-bold text-[var(--cp-ink)]">{stat.value}</span>
              <span className="mt-1.5 block text-[12.5px] font-bold tracking-[0.06em] text-[var(--cp-muted)] uppercase">{stat.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-[var(--cp-line)]">
          {course.curriculum?.length
            ? course.curriculum.map((term, i) => (
                <Disclosure key={term.title} tone="flush" defaultOpen={i === 0} summary={term.title} meta={fill(copy['courseCurriculum.topics'], { count: term.items.length })}>
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
                <Disclosure key={m} tone="flush" defaultOpen={i === 0} summary={m} meta={fill(copy['courseCurriculum.moduleLabel'], { number: String(i + 1).padStart(2, '0') })}>
                  <p className="text-[15px] text-[var(--cp-ink-2)]">
                    {copy['courseCurriculum.moduleBody']}
                  </p>
                </Disclosure>
              ))}
        </div>
      </section>

      {/* ── 8. Tools & technologies — all logos in two lines on a light band ─ */}
      {course.tools?.length ? (
        <section id="cp-tools" className="cp-band-grey cp-section scroll-mt-36 lg:scroll-mt-24">
          <div className="shell">
            <Heading kicker={copy['courseTools.kicker']}>{copy['courseTools.title']}</Heading>
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
        <section id="cp-certs" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
          <Heading kicker={copy['courseCerts.kicker']}>{copy['courseCerts.title']}</Heading>
          <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {course.certifications.map((cert) => (
              <li key={cert}>
                <BrandTile name={cert} />
              </li>
            ))}
          </ul>
          {course.certificateImage ? (
            <figure className="mt-10 grid items-center gap-6 rounded-[20px] bg-[var(--cp-grey)] p-5 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-10 sm:p-8">
              <ZoomImage
                src={course.certificateImage.url}
                alt={course.certificateImage.alt}
                caption={copy['courseCerts.specimenCaption']}
                labels={{ enlarge: copy['courseCerts.enlarge'], enlargeLabel: copy['courseCerts.enlargeLabel'], close: copy['courseCerts.close'] }}
              />
              <figcaption>
                <p className="cp-h2 flex items-center gap-3">
                  <Award className="h-7 w-7 shrink-0 text-[var(--cp-red)]" aria-hidden="true" />
                  {copy['courseCerts.cardTitle']}
                </p>
                <p className="mt-3 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--cp-ink-2)]">
                  {copy['courseCerts.cardBody']}
                </p>
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {isDegree ? (
        <>
      {/* ── 10. How placement works (kept on this page) ─────────────────── */}
      <section id="cp-placement" className="cp-band-grey cp-section scroll-mt-36 lg:scroll-mt-24">
        <div className="shell">
          <Heading kicker={copy['coursePlacement.kicker']}>{fill(copy['coursePlacement.title'], { steps: STEP_WORDS[PROCESS_STEPS.length] ?? PROCESS_STEPS.length })}</Heading>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((s, i) => (
              <li key={s.step} className="cp-card flex items-center gap-4 p-4 sm:block sm:p-5">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--cp-red-tint)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local icon */}
                  <img src={STEP_ICONS[i % STEP_ICONS.length]} alt="" className="h-7 w-7" />
                  <span className="absolute -top-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--cp-red-fill)] text-[12px] font-bold text-white">{s.step}</span>
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
      <section id="cp-records" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        {/* Slide 10: stat beside the heading, four learner cards per scroll, no testimonials.
            No learner photos are in the repo yet, so a monogram stands in until they are supplied. */}
        <SnapSlider
          label={copy['courseRecords.carouselLabel']}
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
              <Heading kicker={copy['courseRecords.kicker']}>{copy['courseRecords.title']}</Heading>
            </>
          }
        >
          {placedLearners.map((c) => (
            <li
              key={c.name}
              className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-[#a50d13] to-[#7a0d12] p-4 text-center text-white sm:p-5"
            >
              <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-white ring-4 ring-white/30">
                <Image src={c.photoUrl} alt={fill(copy['courseRecords.imageAlt'], { name: c.name, company: c.company })} fill sizes="80px" className="object-cover" />
              </span>
              <p className="mt-4 text-[17px] font-bold">{c.name}</p>
              <span aria-hidden="true" className="my-3 h-px w-10 bg-white/40" />
              <p className="text-[12px] font-bold tracking-[0.1em] text-white/80 uppercase">{copy['courseRecords.placedAt']}</p>
              <p className="mt-1 text-[15px] font-bold text-white">{c.company}</p>
            </li>
          ))}
        </SnapSlider>

        <div className="mt-14 border-t border-[var(--cp-line)] pt-10">
          <h3 className="cp-h3">{copy['courseRecords.partnersTitle']}</h3>
          <RecruiterMarquee items={RECRUITERS} />
          <p className="mt-4 text-[14px] text-[var(--cp-muted)]">{RECRUITERS_DISCLAIMER}</p>
        </div>
      </section>

      {isDegree ? centreSection : null}

      {/* ── 13. Call to action ──────────────────────────────────────────── */}
      <section className="cp-section shell">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--cp-line)] bg-[var(--cp-bg)] p-6 shadow-[0_20px_50px_-30px_rgba(17,24,39,0.4)] sm:p-10">
          <span aria-hidden="true" className="absolute -right-10 -bottom-16 hidden h-56 w-56 rounded-full bg-[var(--cp-red-fill)] sm:block" />
          <span aria-hidden="true" className="absolute right-24 -bottom-24 hidden h-48 w-48 rounded-full bg-[var(--cp-grey)] sm:block" />
          <div className="relative max-w-xl">
            <h2 className="cp-h2">{copy['courseClosing.title']}</h2>
            <p className="cp-lede mt-3">{copy['courseClosing.body']}</p>
            <EnquireCta source={`course-${course.slug}-closing`} className="cp-btn mt-6">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {copy['courseClosing.cta']}
            </EnquireCta>
            <p className="mt-5 text-[14.5px] text-[var(--cp-ink-2)]">
              {copy['courseClosing.speak']}{' '}
              <a href={`tel:${siteConfig.helpline}`} className="font-bold underline">
                {siteConfig.helpline}
              </a>{' '}
              {copy['courseClosing.orEmail']}{' '}
              <a href={`mailto:${copy['courseClosing.email']}`} className="tap inline-flex items-center gap-1 font-bold underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {copy['courseClosing.email']}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── 14. FAQs, similar courses ───────────────────────────────────── */}
      {ownFaqs.length + feeFaqs.length ? (
        <section id="cp-faqs" className="shell scroll-mt-36 py-[clamp(2.25rem,5vw,3.5rem)] lg:scroll-mt-24">
          <Heading kicker={copy['courseFaq.kicker']}>{copy['courseFaq.title']}</Heading>
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
              <Heading kicker={copy['courseRelated.kicker']}>{copy['courseRelated.title']}</Heading>
              <Link href="/courses" className="tap inline-flex min-h-6 items-center gap-1.5 text-[14px] font-bold text-[var(--cp-red)]">
                {copy['courseRelated.catalogueLink']}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <CourseCard course={item} surface="course-related" cta={copy['courseRelated.viewCourse']} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
