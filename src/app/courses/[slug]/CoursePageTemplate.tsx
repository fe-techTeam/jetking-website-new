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
import { FaqList } from '@/components/kit';
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
import { isSectionVisible } from '@/lib/content/copy/sections';

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

/** Icons for the five centre advantages; their titles and text are `courseCentres.advantages.*` copy. */
const CENTRE_ADVANTAGE_ICONS: LucideIcon[] = [Monitor, CalendarDays, Compass, Mic, Users];

const UNIVERSITY_LOGOS: Array<{ match: RegExp; key: 'courseUniversity.yenepoya.logo' }> = [
  { match: /yenepoya/i, key: 'courseUniversity.yenepoya.logo' },
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
      <h2 className="cp-h2 mt-2.5 text-balance">{children}</h2>
    </div>
  );
}

/** "BCA in Cloud Computing & Cyber Security" → "BCA". */
/** A labelled stand-in for a sample document that has not been supplied yet. */
function SamplePlaceholder({ label, badge, className }: { label: string; badge: string; className: string }) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--cp-red)] bg-[var(--cp-red-tint)] p-4 text-center ${className}`}>
      <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">{badge}</span>
      <span className="text-[14px] leading-snug font-bold text-[var(--cp-ink)]">{label}</span>
    </div>
  );
}

/** A dashed "To be updated" tile for a small piece of content (a tool, a certification, a question) that has not been supplied yet. */
function PlaceholderTile({ label, badge }: { label: string; badge: string }) {
  return (
    <div className="flex h-full min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--cp-red)] bg-[var(--cp-red-tint)] p-3 text-center">
      <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">{badge}</span>
      <span className="text-[12.5px] leading-snug font-bold text-[var(--cp-ink)]">{label}</span>
    </div>
  );
}

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
  const { recruiters: RECRUITERS, recruitersDisclaimer: RECRUITERS_DISCLAIMER } = placements;
  const PLACEMENT_PARTNERS = placements.stats.partners;
  const LEARNERS_PLACED = placements.stats.learnersPlaced;
  const isDegree = course.level === 'degree';
  // Until a programme's own content is entered, show visible "To be updated" boxes so the client sees what is still needed.
  const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS !== 'false';
  const whyNow =
    course.whyNow ??
    (isDegree && showPlaceholders
      ? {
          intro: copy['coursePlaceholder.whyIntro'],
          headline: copy['coursePlaceholder.whyHeadline'],
          points: [copy['coursePlaceholder.whyPoint'], copy['coursePlaceholder.whyPoint']],
          demandValue: copy['coursePlaceholder.demandValue'],
          demandLabel: copy['coursePlaceholder.demandLabel'],
          demandSource: copy['coursePlaceholder.demandSource'],
        }
      : undefined);
  const whyNowIsPlaceholder = !course.whyNow && Boolean(whyNow);
  const titleParts = course.title.split(/\s+in\s+/i);
  const titlePrefix = isDegree && titleParts.length > 1 ? titleParts[0] : '';
  const titleMain = titlePrefix ? titleParts.slice(1).join(' in ') : course.title;
  // "Cloud Computing & Cyber Security" breaks onto two lines at the ampersand.
  const titleLines = titleMain.split(/\s+&\s+/);
  // First sentence of the summary is the banner tagline; the remainder moves to the "why" section so no copy is lost.
  const sentenceEnd = course.summary.search(/\.\s/);
  const tagline = sentenceEnd > 0 ? course.summary.slice(0, sentenceEnd + 1) : course.summary;
  const summaryRest = sentenceEnd > 0 ? course.summary.slice(sentenceEnd + 1).trim() : '';
  const degree = degreeName(course.title);
  const universityLogoHit = course.university ? UNIVERSITY_LOGOS.find((u) => u.match.test(course.university!)) : undefined;
  const universityLogo = universityLogoHit ? copy[universityLogoHit.key] : undefined;

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

  // A tool that is also one of the certifications below ("AWS", "CEH", "Red Hat"...) is shown once, in the certifications.
  const brandKey = (v: string) => v.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
  const certKeys = [...course.certifications.map(brandKey), ...(course.certifications.some((c) => /cisco/i.test(c)) ? ['ccna'] : [])];
  const toolsOnly = (course.tools ?? []).filter((tool) => {
    const k = brandKey(tool);
    return !certKeys.some((c) => c && (c === k || (k.length >= 3 && c.includes(k)) || (c.length >= 3 && k.includes(c))));
  });

  const topicCount = course.curriculum?.reduce((n, t) => n + t.items.length, 0) ?? 0;
  const projectCount = course.curriculum?.reduce((n, t) => n + t.items.filter((i) => /^project/i.test(i)).length, 0) ?? 0;
  const curriculumStats = [
    course.curriculum?.length
      ? { value: String(course.curriculum.length), label: !isDegree ? copy['courseCurriculum.statModules'] : course.curriculum.length === 1 ? copy['courseCurriculum.statTerm'] : copy['courseCurriculum.statTerms'] }
      : { value: String(course.modules.length), label: copy['courseCurriculum.statModules'] },
    course.curriculum?.length ? { value: String(topicCount), label: copy['courseCurriculum.statTopics'] } : { value: course.duration, label: copy['courseCurriculum.statDuration'] },
    projectCount ? { value: String(projectCount), label: copy['courseCurriculum.statProjects'] } : { value: String(toolsOnly.length), label: copy['courseCurriculum.statTools'] },
    { value: String(course.certifications.length), label: copy['courseCurriculum.statCertifications'] },
  ].filter((st) => st.value !== '0');

  const internshipPoints0 = (course.highlights ?? []).filter((h) => /intern|placement|offer/i.test(h));
  const internshipPoints = internshipPoints0.length ? internshipPoints0 : showPlaceholders ? [copy['coursePlaceholder.internship'], copy['coursePlaceholder.internship']] : [];
  const internshipIsPlaceholder = internshipPoints0.length === 0 && internshipPoints.length > 0;

  const show = (id: string) => isSectionVisible(copy, id);

  // Phone/tablet "on this page" strip: only the sections this course actually has, in page order.
  const jumpItems: JumpItem[] = [
    ...(show('courseWhy') ? [{ id: 'cp-why', label: copy['courseJump.overview'] }] : []),
    ...(show('courseCurriculum') ? [{ id: 'cp-curriculum', label: copy['courseJump.curriculum'] }] : []),
    ...(show('courseTools') && (toolsOnly.length || showPlaceholders) ? [{ id: 'cp-tools', label: copy['courseJump.tools'] }] : []),
    ...(show('courseCerts') && (course.certifications.length || showPlaceholders) ? [{ id: 'cp-certs', label: copy['courseJump.certifications'] }] : []),
    ...(show('courseRecords') ? [{ id: 'cp-records', label: copy['courseJump.placement'] }] : []),
    ...(show('courseCentres') ? [{ id: 'cp-centres', label: copy['courseJump.centres'] }] : []),
    ...(show('courseFaqs') && (ownFaqs.length + feeFaqs.length || showPlaceholders) ? [{ id: 'cp-faqs', label: copy['courseJump.faqs'] }] : []),
  ];

  const centreSection = (
      <section id="cp-centres" className="cp-band-grey cp-section scroll-mt-36 lg:scroll-mt-24">
        <div className="shell">
          {isDegree ? (
            <>
              <Heading kicker={copy['courseCentres.programmeKicker']}>{copy['courseCentres.programmeTitle']}</Heading>
              <p className="cp-lede mt-4 max-w-[68ch]">{copy['courseCentres.programmeNote']}</p>
            </>
          ) : (
            <Heading kicker={copy['courseCentres.kicker']}>{copy['courseCentres.degreeTitle']}</Heading>
          )}

          <div className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative min-h-[200px] overflow-hidden rounded-[20px] border border-[var(--cp-line)] lg:max-h-[24rem] shadow-[0_1px_2px_rgb(16_24_40/0.04),0_8px_24px_-12px_rgb(16_24_40/0.14)] sm:min-h-[320px] lg:min-h-full">
              <Image src={copy['courseCentres.image']} alt={copy['courseCentres.imageAlt']} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {centreAdvantages.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.title} className="cp-card flex items-start gap-3.5 p-4 sm:p-5 sm:last:odd:col-span-2">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                      <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="cp-h3">{a.title}</h3>
                      <p className="mt-1 text-[14px] leading-snug text-[var(--cp-ink-2)]">{a.body}</p>
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
          ) : showPlaceholders ? (
            <div className="mt-8">
              <PlaceholderTile label={copy['coursePlaceholder.centres']} badge={copy['coursePlaceholder.badge']} />
            </div>
          ) : null}
        </div>
      </section>
  );

  return (
    <div className="cp">
      {/* ── 1. Top banner with enquiry form ─────────────────────────────── */}
      {show('courseHero') ? (
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
          <div className="mt-7 grid gap-8 min-[880px]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] min-[880px]:items-start min-[880px]:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_minmax(0,24rem)] xl:gap-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--cp-red-fill)] px-3.5 text-[12px] font-bold tracking-[0.08em] text-white uppercase">
                  {course.level}
                </span>
                <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--cp-bg)] px-3.5 text-[12px] font-bold tracking-[0.08em] text-[var(--cp-ink)] uppercase">
                  {course.duration}
                </span>
                {offeringCentres.length ? (
                  <a
                    href="#cp-centres"
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[var(--cp-bg)] px-3.5 text-[12px] font-bold tracking-[0.08em] text-[var(--cp-ink)] uppercase"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {fill(offeringCentres.length === 1 ? copy['courseBanner.centresOne'] : copy['courseBanner.centresMany'], { count: offeringCentres.length })}
                  </a>
                ) : null}
              </div>

              {/* Slide 5: "BCA in" over the specialisation, one short tagline, one Brochure button. */}
              <h1 className="cp-h1 mt-5" style={{ viewTransitionName: `course-${course.slug}` }}>
                {titlePrefix ? <span className="block text-[0.55em] leading-tight font-normal text-[var(--cp-ink-2)]">{fill(copy['courseBanner.prefixIn'], { prefix: titlePrefix })}</span> : null}
                {titleLines.length === 2 ? (
                  <>
                    <span className="block">{titleLines[0]}</span>
                    <span className="block">&amp; {titleLines[1]}</span>
                  </>
                ) : (
                  <span className="block text-balance">{titleMain}</span>
                )}
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

            {/* A clear, unblurred face between the programme name and the form (wide screens). */}
            <div className="relative hidden aspect-[3/4] w-56 shrink-0 self-center overflow-hidden rounded-[24px] border-4 border-white shadow-[0_18px_40px_-20px_rgba(17,24,39,0.45)] xl:block">
              <Image src={copy['courseBanner.faceImage']} alt={copy['courseBanner.faceAlt']} fill priority sizes="224px" className="object-cover object-top" />
            </div>

            {show('courseEnquiry') ? (
            <aside id="cp-enquiry" aria-labelledby="cp-form-title" className="hidden scroll-mt-24 rounded-[20px] border border-[var(--cp-line)] bg-[var(--cp-bg)] p-4 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.35)] min-[880px]:block sm:p-5">
              <h2 id="cp-form-title" className="mb-3 text-[1.0625rem] leading-snug font-bold text-[var(--cp-red)]">
                {copy['courseForm.title']}
              </h2>
              <QuickEnquiryForm
                centres={toEnquiryCentres(centres, cities)}
                source={`course-${course.slug}-banner`}
                compact
              />
            </aside>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}

      {jumpItems.length ? <JumpNav items={jumpItems} /> : null}

      {/* ── 2. Key programme highlights ─────────────────────────────────── */}
      {show('courseFacts') ? (
      <section className="shell pt-10 pb-[clamp(2.25rem,5vw,3.5rem)]" aria-label={copy['courseFacts.aria']}>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {quickFacts.map((fact, i) => {
            const Icon = fact.icon;
            return (
              <li key={fact.title} className="cp-card flex flex-col items-start gap-2.5 p-3.5 xs:gap-3 xs:p-4 sm:flex-row sm:gap-4 sm:p-5">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl xs:h-11 xs:w-11 ${HIGHLIGHT_ACCENTS[i]}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="cp-h3">{fact.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[var(--cp-muted)] xs:text-[14px]">{fact.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      ) : null}

      {/* ── 3. Why this degree & why now (job roles) ────────────────────── */}
      {show('courseWhy') ? (
      <section id="cp-why" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        {whyNow ? (
          <div className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-stretch md:gap-10 lg:gap-14">
            <div>
              <Heading kicker={copy['courseWhy.degreeKicker']}>{fill(copy['courseWhy.degreeTitle'], { degree })}</Heading>
              {whyNowIsPlaceholder ? (
                <span className="mt-4 inline-flex rounded-full border border-dashed border-[var(--cp-red)] bg-[var(--cp-red-tint)] px-3 py-1 text-[12px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">
                  {copy['coursePlaceholder.badge']}
                </span>
              ) : null}
              <p className={`cp-lede mt-5 max-w-[62ch] ${whyNowIsPlaceholder ? 'italic' : ''}`}>{whyNow.intro}</p>
              <p className="mt-6 text-[1.25rem] leading-snug font-bold text-[var(--cp-ink)] sm:text-[1.375rem]">{whyNow.headline}</p>
              <ul className="mt-5 grid gap-3">
                {whyNow.points.map((point, i) => (
                  <li key={`${i}-${point}`} className="cp-card flex items-start gap-3.5 p-3.5 sm:gap-4 sm:p-5">
                    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                      <BadgeCheck className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="pt-1.5 text-[15.5px] leading-relaxed text-[var(--cp-ink-2)]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="flex">
              <div className={`flex w-full flex-col justify-center rounded-[24px] bg-[var(--cp-red-fill)] p-7 text-white sm:p-10 ${whyNowIsPlaceholder ? 'outline-2 -outline-offset-8 outline-dashed outline-white/40' : ''}`}>
                <p className="text-[13px] font-bold tracking-[0.12em] text-white/80 uppercase">{copy['courseWhy.demandKicker']}</p>
                <p className={`mt-4 leading-none font-extrabold tracking-[-0.03em] ${whyNowIsPlaceholder ? 'text-[2.5rem] sm:text-[3.25rem]' : 'text-[4.25rem] sm:text-[5.5rem]'}`}>{whyNow.demandValue}</p>
                <p className="mt-4 text-[1.25rem] leading-snug font-bold sm:text-[1.5rem]">{whyNow.demandLabel}</p>
                <p className="mt-8 border-t border-white/25 pt-4 text-[12px] text-white/75">{whyNow.demandSource}</p>
              </div>
            </aside>
          </div>
        ) : (
        <div className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-start md:gap-10 lg:gap-14">
          <div>
            <Heading kicker={isDegree ? copy['courseWhy.degreeKicker'] : copy['courseWhy.shortKicker']}>
              {isDegree ? fill(copy['courseWhy.degreeTitle'], { degree }) : fill(copy['courseWhy.shortTitle'], { label })}
            </Heading>
            {isDegree ? (
              <p className="mt-5 text-[1.125rem] leading-snug font-bold text-[var(--cp-ink)]">
                {fill(copy['courseWhy.degreeLead'], { degree })}
              </p>
            ) : null}
            {summaryRest ? <p className={`cp-lede max-w-[62ch] ${isDegree ? 'mt-3' : 'mt-5'}`}>{summaryRest}</p> : null}
            <ul className="mt-7 grid gap-3">
              {course.outcomes.map((o) => (
                <li key={o} className="cp-card flex items-start gap-3.5 p-3.5 sm:gap-4 sm:p-5">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                    <BadgeCheck className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span className="pt-1.5 text-[15.5px] leading-relaxed text-[var(--cp-ink-2)]">{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
            {showPlaceholders ? (
              <div className="flex flex-col justify-center rounded-[24px] bg-[var(--cp-red-fill)] p-7 text-white outline-2 -outline-offset-8 outline-dashed outline-white/40 sm:p-8">
                <p className="text-[13px] font-bold tracking-[0.12em] text-white/80 uppercase">{copy['courseWhy.demandKicker']}</p>
                <p className="mt-4 text-[2.5rem] leading-none font-extrabold tracking-[-0.03em] sm:text-[3.25rem]">{copy['coursePlaceholder.demandValue']}</p>
                <p className="mt-4 text-[1.125rem] leading-snug font-bold sm:text-[1.25rem]">{copy['coursePlaceholder.demandLabel']}</p>
                <p className="mt-6 border-t border-white/25 pt-4 text-[12px] text-white/75">{copy['coursePlaceholder.demandSource']}</p>
              </div>
            ) : null}
            {course.careerRoles?.length ? (
              <div className="cp-card p-6 sm:p-7">
                <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                  <Briefcase className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <p className="cp-eyebrow mt-5">{copy['courseCareers.kicker']}</p>
                <h3 className="cp-h2 mt-2 !text-[1.375rem] !leading-snug">{copy['courseCareers.title']}</h3>
                <ul className="mt-5 flex flex-wrap gap-2">
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
            ) : showPlaceholders ? (
              <PlaceholderTile label={copy['coursePlaceholder.careerRoles']} badge={copy['coursePlaceholder.badge']} />
            ) : null}

            {/* Slide 2: the "how does placement work" prompt, answered on this page rather than a new one. */}
            <div className="flex flex-col gap-4 rounded-[20px] bg-[var(--cp-red-fill)] p-6 text-white sm:p-7">
              <div>
                <p className="text-[13px] font-bold tracking-[0.12em] text-white/80 uppercase">{copy['coursePlacementPrompt.kicker']}</p>
                <p className="mt-2 text-[1.25rem] leading-snug font-bold">{copy['coursePlacementPrompt.title']}</p>
              </div>
              <a
                href="#cp-records"
                className="tap inline-flex min-h-12 items-center justify-between gap-3 self-start rounded-full bg-white py-2 pr-2 pl-5 text-[15px] font-bold text-[var(--cp-red)]"
              >
                {copy['coursePlacementPrompt.cta']}
                <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-[var(--cp-red-tint)]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </div>
          </aside>
        </div>
        )}
      </section>
      ) : null}
      {/* Phones/tablets: the enquiry form sits mid-page, after the reader has seen what the course is (the hero offers the
          main action first). From lg up the same form is the banner card above. */}
      {show('courseEnquiry') ? (
      <section aria-labelledby="cp-form-title-m" className="shell py-[clamp(2.25rem,5vw,3.5rem)] lg:hidden">
        <div id="cp-enquiry-m" className="cp-card scroll-mt-36 p-5 sm:p-6">
          <h2 id="cp-form-title-m" className="mb-4 text-[1.0625rem] leading-snug font-bold text-[var(--cp-red)]">
            {copy['courseForm.title']}
          </h2>
          <QuickEnquiryForm centres={toEnquiryCentres(centres, cities)} source={`course-${course.slug}-mid`} />
        </div>
      </section>
      ) : null}

      {/* Every course: the internship and placement points, in one prominent box (a placeholder until the programme's own points are entered). */}
      {internshipPoints.length ? (
        show('courseInternship') ? (
        <section className="shell py-[clamp(2.25rem,5vw,3.5rem)]" aria-labelledby="cp-intern-title">
          <div className="relative min-h-[280px] overflow-hidden rounded-[28px] sm:min-h-[320px]">
            <Image src={copy['coursePhoto.image']} alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-[center_30%]" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0f1115]/95 via-[#0f1115]/90 to-[#0f1115]/80" />
            <div className="relative p-7 sm:p-10">
              <span className="cp-eyebrow !text-white/80">{copy['courseInternship.kicker']}</span>
              <h2 id="cp-intern-title" className="mt-2 text-2xl leading-tight font-bold text-white sm:text-3xl">
                {copy['courseInternship.title']}
                {internshipIsPlaceholder ? (
                  <span className="ml-3 inline-flex translate-y-[-2px] rounded-full border border-dashed border-white/60 px-3 py-1 align-middle text-[12px] font-bold tracking-[0.08em] uppercase">
                    {copy['coursePlaceholder.badge']}
                  </span>
                ) : null}
              </h2>
              <ul className="mt-7 grid gap-4 md:grid-cols-2">
                {internshipPoints.map((item, i) => (
                  <li key={`${i}-${item}`} className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 sm:p-6">
                    <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--cp-red-fill)] text-white">
                      <Briefcase className="h-6 w-6" strokeWidth={1.9} />
                    </span>
                    <span className={`pt-1 text-[1.0625rem] leading-snug font-bold text-white sm:text-[1.125rem] ${internshipIsPlaceholder ? 'italic opacity-90' : ''}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        ) : null
      ) : show('coursePhoto') ? (
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
      ) : null}

      {isDegree && show('courseUniversity') ? (
        <>
      {/* The numbered 'what makes this degree different' band is gone: its points repeated the facts strip, the university
          block and the certifications below. The internship and placement points live in the box above. */}

      {/* ── 5. About the university ─────────────────────────────────────── */}
      <section className="cp-section shell">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10 lg:gap-14">
          <div>
            <Heading kicker={copy['courseUniversity.kicker']}>
              {course.university ? fill(copy['courseUniversity.titleWith'], { university: course.university }) : copy['courseUniversity.titleWithout']}
            </Heading>
            {universityLogo ? (
              <div className="mt-8 inline-flex rounded-2xl border border-[var(--cp-line)] bg-[var(--cp-grey)] p-4">
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
              {[fill(copy['courseUniversity.points.0'], { degree }), copy['courseUniversity.points.1']].map((t) => (
                <li key={t} className="flex gap-2.5 text-[15px] text-[var(--cp-ink-2)]">
                  <BadgeCheck className="mt-px h-[18px] w-[18px] shrink-0 text-[var(--cp-red)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] bg-[var(--cp-grey)] p-4 sm:p-6">
            <div className={`grid items-start gap-4 sm:gap-5 ${course.jetkingCertificateImage || showPlaceholders ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.78fr)]' : ''}`}>
              {course.certificateImage ? (
                <figure>
                  <ZoomImage
                    src={course.certificateImage.url}
                    alt={course.certificateImage.alt}
                    caption={copy['courseUniversity.degreeCaption']}
                    labels={{ enlarge: copy['courseCerts.enlarge'], enlargeLabel: copy['courseCerts.enlargeLabel'], close: copy['courseCerts.close'] }}
                  />
                  <figcaption className="mt-2.5 text-[13px] leading-snug font-bold text-[var(--cp-ink)]">{copy['courseUniversity.degreeCaption']}</figcaption>
                </figure>
              ) : showPlaceholders ? (
                <SamplePlaceholder label={copy['coursePlaceholder.degreeSample']} badge={copy['coursePlaceholder.badge']} className="aspect-[3/4]" />
              ) : null}
              {course.jetkingCertificateImage ? (
                <figure>
                  <ZoomImage
                    src={course.jetkingCertificateImage.url}
                    alt={course.jetkingCertificateImage.alt}
                    caption={copy['courseUniversity.jetkingCaption']}
                    aspect="aspect-[4/3]"
                    labels={{ enlarge: copy['courseCerts.enlarge'], enlargeLabel: copy['courseCerts.enlargeLabel'], close: copy['courseCerts.close'] }}
                  />
                  <figcaption className="mt-2.5 text-[13px] leading-snug font-bold text-[var(--cp-ink)]">{copy['courseUniversity.jetkingCaption']}</figcaption>
                </figure>
              ) : showPlaceholders ? (
                <SamplePlaceholder label={copy['coursePlaceholder.jetkingSample']} badge={copy['coursePlaceholder.badge']} className="aspect-[4/3]" />
              ) : null}
            </div>
          </div>
        </div>
      </section>


        </>
      ) : null}

      {/* ── 6. Your learning journey (every course; placeholder phases until the programme's own are entered) ── */}
      {show('courseJourney') && (course.phases?.length || showPlaceholders) ? (
        <section className="cp-section">
          <div className="shell">
            <Heading kicker={copy['courseJourney.kicker']}>{copy['courseJourney.title']}</Heading>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {(course.phases?.length ? course.phases : [null, null, null]).map((phase, i) => (
                <li key={phase ? phase.title : `ph-${i}`} className={`cp-card relative border-t-4 p-6 ${ACCENT_TOPS[i % 3]} ${phase ? '' : 'border-dashed'}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold ${ACCENT_DOTS[i % 3]}`}>
                    {i + 1}
                  </span>
                  {phase ? null : (
                    <span className="mt-3 inline-flex rounded-full border border-dashed border-[var(--cp-red)] bg-[var(--cp-red-tint)] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">{copy['coursePlaceholder.badge']}</span>
                  )}
                  <h3 className="cp-h3 mt-4">{phase ? phase.title : copy['coursePlaceholder.phaseTitle']}</h3>
                  <p className={`mt-2 text-[14.5px] leading-relaxed text-[var(--cp-ink-2)] ${phase ? '' : 'italic'}`}>{phase ? phase.description : copy['coursePlaceholder.phaseBody']}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── 7. Curriculum ───────────────────────────────────────────────── */}
      {show('courseCurriculum') ? (
      <section id="cp-curriculum" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        <div className="flex items-baseline justify-between gap-4">
          <Heading kicker={copy['courseCurriculum.kicker']}>{copy['courseCurriculum.title']}</Heading>
          <span className="shrink-0 text-[13px] font-bold text-[var(--cp-muted)]">
            {course.curriculum?.length
              ? fill(copy['courseCurriculum.topics'], { count: course.curriculum.reduce((n, t) => n + t.items.length, 0) })
              : fill(copy['courseCurriculum.modules'], { count: course.modules.length })}
          </span>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
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
      ) : null}

      {/* ── 8. Tools & technologies — all logos in two lines on a light band ─ */}
      {show('courseTools') && (toolsOnly.length || showPlaceholders) ? (
        <section id="cp-tools" className="cp-band-grey cp-section scroll-mt-36 lg:scroll-mt-24">
          <div className="shell">
            <Heading kicker={copy['courseTools.kicker']}>{copy['courseTools.title']}</Heading>
            <ul className="mt-8 grid grid-cols-2 gap-2.5 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
              {toolsOnly.length
                ? toolsOnly.map((tool) => (
                    <li key={tool}>
                      <BrandTile name={tool} />
                    </li>
                  ))
                : Array.from({ length: 6 }, (_, i) => (
                    <li key={`tool-ph-${i}`}>
                      <PlaceholderTile label={copy['coursePlaceholder.tool']} badge={copy['coursePlaceholder.badge']} />
                    </li>
                  ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 9. Industry certifications ──────────────────────────────────── */}
      {show('courseCerts') && (course.certifications.length || showPlaceholders) ? (
        <section id="cp-certs" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
          <Heading kicker={copy['courseCerts.kicker']}>{copy['courseCerts.title']}</Heading>
          <ul className="mt-8 grid grid-cols-2 gap-2.5 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {course.certifications.length
              ? course.certifications.map((cert) => (
                  <li key={cert}>
                    <BrandTile name={cert} />
                  </li>
                ))
              : Array.from({ length: 6 }, (_, i) => (
                  <li key={`cert-ph-${i}`}>
                    <PlaceholderTile label={copy['coursePlaceholder.cert']} badge={copy['coursePlaceholder.badge']} />
                  </li>
                ))}
          </ul>
          {course.certificateImage && !isDegree ? (
            <figure className="cp-card mt-10 grid items-center gap-6 overflow-hidden p-5 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-10 sm:p-8 lg:gap-14">
              <ZoomImage
                src={course.certificateImage.url}
                alt={course.certificateImage.alt}
                caption={copy['courseCerts.specimenCaption']}
                labels={{ enlarge: copy['courseCerts.enlarge'], enlargeLabel: copy['courseCerts.enlargeLabel'], close: copy['courseCerts.close'] }}
              />
              <figcaption>
                <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                  <Award className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <p className="cp-h2 mt-5">{copy['courseCerts.cardTitle']}</p>
                <p className="mt-3 max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--cp-ink-2)]">
                  {copy['courseCerts.cardBody']}
                </p>
                <EnquireCta source={`course-${course.slug}-certificate`} className="cp-btn mt-7">
                  {copy['courseBanner.counsellorCta']}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </EnquireCta>
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {/* The five-step placement process used to sit here; it repeated the placement support point in the Internship and
          Placements box, so it is gone. */}

      {/* ── 11. Placement records — 4 learner cards per scroll, no testimonials ─── */}
      {show('courseRecords') ? (
      <section id="cp-records" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
        {/* Slide 10: stat beside the heading, four learner cards per scroll, no testimonials.
            No learner photos are in the repo yet, so a monogram stands in until they are supplied. */}
        <SnapSlider
          label={copy['courseRecords.carouselLabel']}
          aside={
            <div className="flex flex-row items-center gap-4 rounded-[20px] bg-[var(--cp-red-fill)] p-5 text-white lg:flex-col lg:items-start lg:justify-center lg:gap-5 lg:p-6">
              <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">
                <Users className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <p>
                <span className="block text-6xl leading-none font-extrabold tracking-[-0.03em] lg:text-7xl">{LEARNERS_PLACED.value}</span>
                <span className="mt-3 block text-[15px] leading-snug font-bold text-white">{LEARNERS_PLACED.label}</span>
              </p>
            </div>
          }
          header={
            <>
              <Heading kicker={copy['courseRecords.kicker']}>{copy['courseRecords.title']}</Heading>
            </>
          }
        >
          {(placedLearners.length ? placedLearners : showPlaceholders ? Array.from({ length: 4 }, () => null) : []).map((c, idx) => c === null ? (
            <li key={`ph-${idx}`} className="cp-card flex flex-col items-center border-2 !border-dashed p-4 text-center sm:p-5">
              <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--cp-red)] uppercase">{copy['coursePlaceholder.badge']}</span>
              <span className="mt-3 grid h-20 w-20 place-items-center rounded-full bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                <Users className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <p className="mt-4 text-[17px] font-bold text-[var(--cp-ink)]">{copy['coursePlaceholder.learnerName']}</p>
              <span aria-hidden="true" className="my-3 h-px w-10 bg-[var(--cp-line)]" />
              <p className="text-[12px] font-bold tracking-[0.1em] text-[var(--cp-muted)] uppercase">{copy['courseRecords.placedAt']}</p>
              <p className="mt-1 text-[15px] font-bold text-[var(--cp-red)]">{copy['coursePlaceholder.learnerCompany']}</p>
            </li>
          ) : (
            <li
              key={c.name}
              className="cp-card flex flex-col items-center p-4 text-center sm:p-5"
            >
              <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-[var(--cp-grey)] ring-4 ring-[var(--cp-red-tint)]">
                <Image src={c.photoUrl} alt={fill(copy['courseRecords.imageAlt'], { name: c.name, company: c.company })} fill sizes="80px" className="object-cover" />
              </span>
              <p className="mt-4 text-[17px] font-bold text-[var(--cp-ink)]">{c.name}</p>
              <span aria-hidden="true" className="my-3 h-px w-10 bg-[var(--cp-line)]" />
              <p className="text-[12px] font-bold tracking-[0.1em] text-[var(--cp-muted)] uppercase">{copy['courseRecords.placedAt']}</p>
              <p className="mt-1 text-[15px] font-bold text-[var(--cp-red)]">{c.company}</p>
            </li>
          )
          )}
        </SnapSlider>

        <div className="mt-14 border-t border-[var(--cp-line)] pt-10">
          <h3 className="cp-h3">{copy['courseRecords.partnersTitle']}</h3>
          <RecruiterMarquee items={RECRUITERS} />
          <p className="mt-4 text-[14px] text-[var(--cp-muted)]">{RECRUITERS_DISCLAIMER}</p>
        </div>
      </section>
      ) : null}

      {show('courseCentres') ? centreSection : null}

      {/* ── 13. Call to action ──────────────────────────────────────────── */}
      {show('courseClosing') ? (
      <section className="cp-section shell">
        <div className="cp-card overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,min(24rem,42%))]">
          <div className="p-6 sm:p-10">
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
              <a href={`mailto:${copy['courseClosing.email']}`} className="tap inline-flex min-h-11 items-center gap-1 font-bold underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {copy['courseClosing.email']}
              </a>
            </p>
          </div>
          <div className="relative aspect-[4/3] md:self-center">
            <Image src={copy['courseClosing.image']} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-center" />
          </div>
        </div>
      </section>
      ) : null}

      {/* ── 14. FAQs, similar courses ───────────────────────────────────── */}
      {show('courseFaqs') && (ownFaqs.length + feeFaqs.length || showPlaceholders) ? (
        <section id="cp-faqs" className="cp-section shell scroll-mt-36 lg:scroll-mt-24">
          <Heading kicker={copy['courseFaq.kicker']}>{copy['courseFaq.title']}</Heading>
          <div className="mt-8">
            {!ownFaqs.length && !feeFaqs.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                <li><PlaceholderTile label={copy['coursePlaceholder.faqQuestion']} badge={copy['coursePlaceholder.badge']} /></li>
                <li><PlaceholderTile label={copy['coursePlaceholder.faqAnswer']} badge={copy['coursePlaceholder.badge']} /></li>
              </ul>
            ) : null}
            {ownFaqs.length ? <FaqList items={ownFaqs.map((f) => ({ id: f.question, question: f.question, answer: f.answer }))} /> : null}
            {/* The fees / placement answers: reading this block is the `fee-depth` signal. */}
            <div id="course-fee-faqs">{feeFaqs.length ? <FaqList continued startAt={ownFaqs.length + 1} items={feeFaqs.map((f) => ({ id: f.question, question: f.question, answer: f.answer }))} /> : null}</div>
          </div>
          {feeFaqs.length ? <FeeDepthTracker targetId="course-fee-faqs" courseSlug={course.slug} /> : null}
        </section>
      ) : null}

      {show('courseRelated') && related.length ? (
        <section className="cp-band-grey cp-section">
          <div className="shell">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <Heading kicker={copy['courseRelated.kicker']}>{copy['courseRelated.title']}</Heading>
              <Link href="/courses" className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--cp-red)]">
                {copy['courseRelated.catalogueLink']}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((item) => (
                <li key={item.slug} className="min-w-0">
                  <CourseCard course={item} surface="course-related" compact cta={copy['courseRelated.viewCourse']} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
