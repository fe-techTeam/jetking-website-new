import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Award, BadgeCheck, Download, Mail, MapPin, Phone, Users } from 'lucide-react';
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
import { JumpNav, type JumpItem } from '@/components/JumpNav';
import { CourseCard } from '@/components/CourseCard';
import { EnquiryLink } from '@/components/EnquirySheet';
import { BrandTile } from './brand';
import { ZoomImage } from './ZoomImage';
import { SnapSlider } from './SnapSlider';
import { CentrePicker } from './CentrePicker';
import { FeeDepthTracker } from './FeeDepthTracker';

/*
 * Course page — template B ("studio"). Same CMS content as the standard template, composed for a premium,
 * spacious read (benchmarked against Simplilearn / Careers360 course pages, which are dense and list-like):
 *   mesh-gradient hero + glass facts · floating "by the numbers" card · big-type overview ·
 *   sticky-heading curriculum · editorial career rows · placement proof · centres · FAQ · closing CTA.
 * Sections render only when the course has the data, exactly like the standard template.
 */

function Heading({ index, kicker, children, light = false }: { index: string; kicker?: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div>
      <span className={`cpb-index ${light ? '!text-white/70' : ''}`}>
        {[index, kicker].filter(Boolean).join(' · ')}
      </span>
      <h2 className={`cpb-h2 mt-5 text-balance ${light ? '!text-white' : ''}`}>{children}</h2>
    </div>
  );
}

/** "BCA in Cloud Computing & Cyber Security" → "BCA". */
function degreeName(title: string) {
  return (title.split(/\s+in\s+/i)[0] ?? title).trim();
}

/** Opens the enquiry sheet below lg; scrolls to the hero form from lg up. */
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

export function CoursePageTemplateB({
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
  const { recruiters: RECRUITERS, recruitersDisclaimer: RECRUITERS_DISCLAIMER } = placements;
  const LEARNERS_PLACED = placements.stats.learnersPlaced;
  const isDegree = course.level === 'degree';
  const degree = degreeName(course.title);
  const label = isDegree ? degree : course.shortTitle || course.title;

  const sentenceEnd = course.summary.search(/\.\s/);
  const tagline = sentenceEnd > 0 ? course.summary.slice(0, sentenceEnd + 1) : course.summary;
  const summaryRest = sentenceEnd > 0 ? course.summary.slice(sentenceEnd + 1).trim() : '';

  const cityName = new Map(cities.map((c) => [c.slug, c.name]));
  const byCity = new Map<string, Centre[]>();
  for (const centre of offeringCentres) byCity.set(centre.citySlug, [...(byCity.get(centre.citySlug) ?? []), centre]);
  const cityGroups = [...byCity.entries()]
    .map(([slug, list]) => ({ slug, name: cityName.get(slug) ?? slug, list }))
    .sort((a, b) => a.name.localeCompare(b.name));

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

  const topicCount = course.curriculum?.reduce((n, t) => n + t.items.length, 0) ?? 0;
  const termCount = course.curriculum?.length ?? 0;
  const hasCurriculum = Boolean(termCount || course.modules.length);
  const hasTools = Boolean(course.tools?.length);
  const hasCerts = course.certifications.length > 0;
  const hasFaqs = ownFaqs.length + feeFaqs.length > 0;
  const hasRoles = Boolean(course.careerRoles?.length);

  const heroFacts: Array<{ label: string; value: string }> = [
    { label: 'Duration', value: course.duration },
    { label: 'Eligibility', value: course.eligibility },
    ...(course.university ? [{ label: 'Awarded by', value: course.university }] : []),
  ].filter((f) => f.value);

  // "By the numbers": only figures the course data actually supports.
  const numbers: Array<{ value: string; label: string }> = [
    { value: course.duration, label: 'Programme length' },
    ...(termCount ? [{ value: String(termCount), label: isDegree ? (termCount === 1 ? copy['courseCurriculum.statTerm'] : copy['courseCurriculum.statTerms']) : copy['courseCurriculum.statModules'] }] : []),
    ...(topicCount ? [{ value: String(topicCount), label: copy['courseCurriculum.statTopics'] }] : []),
    ...(hasTools ? [{ value: String(course.tools!.length), label: copy['courseCurriculum.statTools'] }] : []),
    ...(hasCerts ? [{ value: String(course.certifications.length), label: copy['courseCurriculum.statCertifications'] }] : []),
    ...(offeringCentres.length ? [{ value: String(offeringCentres.length), label: 'Centres offering it' }] : []),
  ].slice(0, 6);

  const sections: JumpItem[] = [
    { id: 'cp-why', label: copy['courseJump.overview'] },
    ...(hasCurriculum ? [{ id: 'cp-curriculum', label: copy['courseJump.curriculum'] }] : []),
    ...(hasTools ? [{ id: 'cp-tools', label: copy['courseJump.tools'] }] : []),
    ...(hasCerts ? [{ id: 'cp-certs', label: copy['courseJump.certifications'] }] : []),
    ...(hasRoles ? [{ id: 'cp-careers', label: copy['courseCareers.kicker'] }] : []),
    { id: 'cp-records', label: copy['courseJump.placement'] },
    ...(offeringCentres.length ? [{ id: 'cp-centres', label: copy['courseJump.centres'] }] : []),
    ...(hasFaqs ? [{ id: 'cp-faqs', label: copy['courseJump.faqs'] }] : []),
  ];

  return (
    <div className="cp">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="cpb-mesh relative overflow-hidden pt-6 pb-28 text-white sm:pt-8 lg:pb-40">
        {course.heroImage ? (
          <>
            <Image src={course.heroImage.url} alt={course.heroImage.alt} fill priority sizes="(min-width: 768px) 100vw, 1px" className="hidden object-cover object-right opacity-50 md:block" />
            <span aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-[var(--cp-black)] from-35% via-[var(--cp-black)]/75 to-transparent md:block" />
          </>
        ) : null}

        <div className="shell relative">
          <div className="[&_a]:!text-white/70 [&_li]:!text-white/70 [&_span]:!text-white/70">
            <Breadcrumbs trail={trail} />
          </div>
          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-16">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[var(--cp-red-fill)] px-3.5 py-1.5 text-[12px] font-bold tracking-[0.1em] uppercase">{course.level}</span>
                {offeringCentres.length ? (
                  <a href="#cp-centres" className="cpb-glass tap inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold tracking-[0.1em] uppercase">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {fill(offeringCentres.length === 1 ? copy['courseBanner.centresOne'] : copy['courseBanner.centresMany'], { count: offeringCentres.length })}
                  </a>
                ) : null}
              </div>

              <h1 className="cpb-display mt-7 text-balance !text-white" style={{ viewTransitionName: `course-${course.slug}` }}>
                {course.title}
              </h1>
              <p className="mt-7 max-w-[50ch] text-[1.1875rem] leading-relaxed text-white/80">{tagline}</p>

              <div id="course-hero-cta" className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
                <EnquireCta source={`course-${course.slug}-hero`} className="cp-btn !min-h-14 !px-8">
                  {isDegree ? copy['courseBanner.degreeCta'] : copy['courseBanner.counsellorCta']}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </EnquireCta>
                <EnquireCta source={`course-${course.slug}-brochure`} className="cp-btn cp-btn-light !min-h-14 !px-8">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {copy['courseBanner.brochureCta']}
                </EnquireCta>
              </div>

              <dl className="mt-12 grid gap-x-10 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
                {heroFacts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11.5px] font-bold tracking-[0.12em] text-white/55 uppercase">{f.label}</dt>
                    <dd className="mt-2 max-w-[34ch] text-[15px] leading-snug font-semibold text-white">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside id="cp-enquiry" aria-labelledby="cp-form-title" className="hidden scroll-mt-24 rounded-[24px] border border-[var(--cp-line)] bg-[var(--cp-bg)] p-6 text-[var(--cp-ink)] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.65)] lg:block">
              <h2 id="cp-form-title" className="mb-4 text-[1.125rem] leading-snug font-bold text-[var(--cp-red)]">
                {copy['courseForm.title']}
              </h2>
              <QuickEnquiryForm centres={toEnquiryCentres(centres, cities)} source={`course-${course.slug}-banner`} compact />
            </aside>
          </div>
        </div>
      </section>

      {/* ── By the numbers: floats over the hero edge ───────────────────── */}
      <div className="shell relative z-10 -mt-16 lg:-mt-24">
        <ul className="cp-card grid grid-cols-2 gap-y-8 p-6 sm:p-9 md:grid-cols-3 lg:flex lg:justify-between lg:gap-8 lg:p-12">
          {numbers.map((n) => (
            <li key={n.label} className="lg:min-w-0 lg:flex-1 lg:border-l lg:border-[var(--cp-line)] lg:pl-8 lg:first:border-l-0 lg:first:pl-0">
              <span className="block text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)] leading-none font-extrabold tracking-tight text-[var(--cp-ink)]">{n.value}</span>
              <span className="mt-3 block text-[12.5px] font-bold tracking-[0.1em] text-[var(--cp-muted)] uppercase">{n.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <JumpNav items={sections} />

      {/* ── 01 Overview ────────────────────────────────────────────────── */}
      <section id="cp-why" className="cpb-section shell scroll-mt-36 lg:scroll-mt-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Heading index="01" kicker={isDegree ? copy['courseWhy.degreeKicker'] : copy['courseWhy.shortKicker']}>
              {isDegree ? fill(copy['courseWhy.degreeTitle'], { degree }) : fill(copy['courseWhy.shortTitle'], { label })}
            </Heading>
            {summaryRest ? <p className="cp-lede mt-7 max-w-[46ch] !text-[1.1875rem]">{summaryRest}</p> : null}
            <EnquireCta source={`course-${course.slug}-overview`} className="cp-btn mt-9">
              {copy['courseBanner.counsellorCta']}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </EnquireCta>
          </div>
          <ol className="grid">
            {course.outcomes.map((o, i) => (
              <li key={o} className="flex items-start gap-6 border-t border-[var(--cp-line)] py-8 first:border-t-0 first:pt-0 sm:gap-8">
                <span aria-hidden="true" className="w-12 shrink-0 text-[2.25rem] leading-none font-extrabold text-[var(--cp-red)]/25 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pt-1 text-[1.1875rem] leading-relaxed font-medium text-[var(--cp-ink)]">{o}</span>
              </li>
            ))}
          </ol>
        </div>

        {course.highlights?.length ? (
          <ul className="mt-20 grid gap-5 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
            {course.highlights.map((h) => (
              <li key={h} className="cp-card cpb-lift flex flex-col gap-5 p-7 sm:p-8">
                <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                  <BadgeCheck className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <span className="text-[16px] leading-relaxed text-[var(--cp-ink-2)]">{h}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Phones/tablets: the form sits mid-page; from lg up it is the hero card. */}
      <section aria-labelledby="cp-form-title-m" className="shell pb-16 lg:hidden">
        <div id="cp-enquiry-m" className="cp-card scroll-mt-36 p-6 sm:p-8">
          <h2 id="cp-form-title-m" className="mb-4 text-[1.125rem] leading-snug font-bold text-[var(--cp-red)]">
            {copy['courseForm.title']}
          </h2>
          <QuickEnquiryForm centres={toEnquiryCentres(centres, cities)} source={`course-${course.slug}-mid`} />
        </div>
      </section>

      {/* ── Learning journey (degree) ───────────────────────────────────── */}
      {isDegree && course.phases?.length ? (
        <section className="cp-band-grey cpb-section">
          <div className="shell">
            <Heading index="02" kicker={copy['courseJourney.kicker']}>
              {copy['courseJourney.title']}
            </Heading>
            <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-0">
              {course.phases.map((phase, i) => (
                <li key={phase.title} className="relative md:border-t-2 md:border-[var(--cp-line)] md:pt-10 md:pr-10">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--cp-red-fill)] text-[16px] font-bold text-white md:absolute md:-top-6 md:left-0">{i + 1}</span>
                  <h3 className="cp-h3 mt-5 !text-[1.25rem] md:mt-0">{phase.title}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[var(--cp-ink-2)]">{phase.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── Curriculum: sticky heading + roomy accordion ────────────────── */}
      {hasCurriculum ? (
        <section id="cp-curriculum" className="cpb-section shell scroll-mt-36 lg:scroll-mt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Heading index={isDegree && course.phases?.length ? '03' : '02'} kicker={copy['courseCurriculum.kicker']}>
                {copy['courseCurriculum.title']}
              </Heading>
              <p className="mt-7 text-[1.0625rem] font-bold text-[var(--cp-muted)]">
                {termCount ? fill(copy['courseCurriculum.topics'], { count: topicCount }) : fill(copy['courseCurriculum.modules'], { count: course.modules.length })}
              </p>
            </div>
            <ol className="grid gap-5">
              {(termCount ? course.curriculum!.map((t) => ({ title: t.title, items: t.items })) : course.modules.map((m) => ({ title: m, items: [] as string[] }))).map((term, i) => (
                <li key={term.title} className="cp-card px-6 sm:px-8">
                  <Disclosure
                    tone="flush"
                    defaultOpen={i === 0}
                    summary={term.title}
                    meta={term.items.length ? fill(copy['courseCurriculum.topics'], { count: term.items.length }) : fill(copy['courseCurriculum.moduleLabel'], { number: String(i + 1).padStart(2, '0') })}
                  >
                    {term.items.length ? (
                      <ul className="flex flex-wrap gap-2.5 pb-2">
                        {term.items.map((item) => (
                          <li key={item} className="rounded-full bg-[var(--cp-grey)] px-4 py-2 text-[14px] text-[var(--cp-ink-2)]">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] text-[var(--cp-ink-2)]">{copy['courseCurriculum.moduleBody']}</p>
                    )}
                  </Disclosure>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── Tools ───────────────────────────────────────────────────────── */}
      {hasTools ? (
        <section id="cp-tools" className="cp-band-grey cpb-section scroll-mt-36 lg:scroll-mt-24">
          <div className="shell">
            <Heading index="" kicker={copy['courseTools.kicker']}>
              {copy['courseTools.title']}
            </Heading>
            <ul className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-6">
              {course.tools!.map((tool) => (
                <li key={tool} className="cpb-lift rounded-[20px]">
                  <BrandTile name={tool} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Certifications ──────────────────────────────────────────────── */}
      {hasCerts ? (
        <section id="cp-certs" className="cpb-section shell scroll-mt-36 lg:scroll-mt-24">
          <Heading index="" kicker={copy['courseCerts.kicker']}>
            {copy['courseCerts.title']}
          </Heading>
          <ul className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-6">
            {course.certifications.map((cert) => (
              <li key={cert} className="cpb-lift rounded-[20px]">
                <BrandTile name={cert} />
              </li>
            ))}
          </ul>
          {course.certificateImage ? (
            <figure className="cp-card mt-16 grid items-center gap-10 overflow-hidden p-6 sm:grid-cols-[minmax(0,24rem)_1fr] sm:p-12 lg:gap-20">
              <ZoomImage
                src={course.certificateImage.url}
                alt={course.certificateImage.alt}
                caption={copy['courseCerts.specimenCaption']}
                labels={{ enlarge: copy['courseCerts.enlarge'], enlargeLabel: copy['courseCerts.enlargeLabel'], close: copy['courseCerts.close'] }}
              />
              <figcaption>
                <Award className="h-10 w-10 text-[var(--cp-red)]" strokeWidth={1.5} aria-hidden="true" />
                <p className="cpb-h2 mt-6 !text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)]">{copy['courseCerts.cardTitle']}</p>
                <p className="mt-4 max-w-[46ch] text-[1.125rem] leading-relaxed text-[var(--cp-ink-2)]">{copy['courseCerts.cardBody']}</p>
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {/* ── Careers: editorial rows on a dark band ──────────────────────── */}
      {hasRoles ? (
        <section id="cp-careers" className="cpb-mesh cpb-section scroll-mt-36 text-white lg:scroll-mt-24">
          <div className="shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
            <Heading light index="" kicker={copy['courseCareers.kicker']}>
              {copy['courseCareers.title']}
            </Heading>
            <ul>
              {course.careerRoles!.map((role) => (
                <li key={role} className="group flex items-center justify-between gap-6 border-t border-white/15 py-6 last:border-b sm:py-7">
                  <span className="text-[clamp(1.25rem,1rem+1.1vw,1.875rem)] leading-tight font-bold">{role}</span>
                  <ArrowUpRight className="h-6 w-6 shrink-0 text-white/40 transition-colors group-hover:text-[var(--cp-red-bright)]" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Placement proof ─────────────────────────────────────────────── */}
      <section id="cp-records" className="cpb-section shell scroll-mt-36 lg:scroll-mt-24">
        {placedLearners.length ? (
          <SnapSlider
            label={copy['courseRecords.carouselLabel']}
            aside={
              <div className="cp-card flex flex-row items-center gap-5 p-7 lg:flex-col lg:items-start lg:justify-center lg:gap-6">
                <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--cp-red-tint)] text-[var(--cp-red)]">
                  <Users className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <p>
                  <span className="block text-5xl leading-none font-extrabold text-[var(--cp-red)]">{LEARNERS_PLACED.value}</span>
                  <span className="mt-3 block text-[15px] leading-snug font-bold text-[var(--cp-ink)]">{LEARNERS_PLACED.label}</span>
                </p>
              </div>
            }
            header={
              <Heading index="" kicker={copy['courseRecords.kicker']}>
                {copy['courseRecords.title']}
              </Heading>
            }
          >
            {placedLearners.map((c) => (
              <li key={c.name} className="cp-card cpb-lift flex flex-col items-center p-6 text-center sm:p-7">
                <span className="relative block h-24 w-24 overflow-hidden rounded-full bg-[var(--cp-grey)] ring-4 ring-[var(--cp-red-tint)]">
                  <Image src={c.photoUrl} alt={fill(copy['courseRecords.imageAlt'], { name: c.name, company: c.company })} fill sizes="96px" className="object-cover" />
                </span>
                <p className="mt-5 text-[18px] font-bold text-[var(--cp-ink)]">{c.name}</p>
                <span aria-hidden="true" className="my-4 h-px w-10 bg-[var(--cp-line)]" />
                <p className="text-[12px] font-bold tracking-[0.1em] text-[var(--cp-muted)] uppercase">{copy['courseRecords.placedAt']}</p>
                <p className="mt-1.5 text-[16px] font-bold text-[var(--cp-red)]">{c.company}</p>
              </li>
            ))}
          </SnapSlider>
        ) : (
          <Heading index="" kicker={copy['courseRecords.kicker']}>
            {copy['courseRecords.title']}
          </Heading>
        )}
        <div className="mt-20 border-t border-[var(--cp-line)] pt-12">
          <h3 className="cp-h3">{copy['courseRecords.partnersTitle']}</h3>
          <RecruiterMarquee items={RECRUITERS} />
          <p className="mt-5 text-[14px] text-[var(--cp-muted)]">{RECRUITERS_DISCLAIMER}</p>
        </div>
      </section>

      {/* ── Centres ─────────────────────────────────────────────────────── */}
      {offeringCentres.length ? (
        <section id="cp-centres" className="cp-band-grey cpb-section scroll-mt-36 lg:scroll-mt-24">
          <div className="shell">
            <Heading index="" kicker={copy['courseCentres.kicker']}>
              {copy['courseCentres.degreeTitle']}
            </Heading>
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
          </div>
        </section>
      ) : null}

      {/* ── FAQs: sticky heading + list ─────────────────────────────────── */}
      {hasFaqs ? (
        <section id="cp-faqs" className="cpb-section shell scroll-mt-36 lg:scroll-mt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Heading index="" kicker={copy['courseFaq.kicker']}>
                {copy['courseFaq.title']}
              </Heading>
            </div>
            <div>
              {ownFaqs.length ? <FaqList items={ownFaqs.map((f) => ({ id: f.question, question: f.question, answer: f.answer }))} /> : null}
              <div id="course-fee-faqs">
                {feeFaqs.length ? <FaqList continued startAt={ownFaqs.length + 1} items={feeFaqs.map((f) => ({ id: f.question, question: f.question, answer: f.answer }))} /> : null}
              </div>
            </div>
          </div>
          {feeFaqs.length ? <FeeDepthTracker targetId="course-fee-faqs" courseSlug={course.slug} /> : null}
        </section>
      ) : null}

      {/* ── Closing call to action ──────────────────────────────────────── */}
      <section className="shell pb-[clamp(4rem,9vw,8rem)]">
        <div className="cpb-mesh relative overflow-hidden rounded-[32px] px-7 py-14 text-white sm:px-16 sm:py-24">
          <div className="relative max-w-2xl">
            <h2 className="cpb-h2 !text-white">{copy['courseClosing.title']}</h2>
            <p className="mt-6 text-[1.1875rem] leading-relaxed text-white/80">{copy['courseClosing.body']}</p>
            <EnquireCta source={`course-${course.slug}-closing`} className="cp-btn cp-btn-light !min-h-14 mt-9 !px-8">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {copy['courseClosing.cta']}
            </EnquireCta>
            <p className="mt-7 text-[15px] text-white/80">
              {copy['courseClosing.speak']}{' '}
              <a href={`tel:${siteConfig.helpline}`} className="font-bold text-white underline">
                {siteConfig.helpline}
              </a>{' '}
              {copy['courseClosing.orEmail']}{' '}
              <a href={`mailto:${copy['courseClosing.email']}`} className="tap inline-flex min-h-11 items-center gap-1 font-bold text-white underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {copy['courseClosing.email']}
              </a>
            </p>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="cp-band-grey cpb-section">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Heading index="" kicker={copy['courseRelated.kicker']}>
                {copy['courseRelated.title']}
              </Heading>
              <Link href="/courses" className="tap inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-[var(--cp-red)] sm:min-h-6">
                {copy['courseRelated.catalogueLink']}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <li key={item.slug}>
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
