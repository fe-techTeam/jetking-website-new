
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  Cpu,
  GraduationCap,
  Headphones,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import type { Centre, City, Course } from '@/lib/content/types';
import { centrePath } from '@/lib/centre-path';
import { googleMapsUrl } from '@/lib/maps';
import { siteConfig } from '@/lib/site';
import { breadcrumbSchema, centreSchema, faqSchema } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { JumpNav, type JumpItem } from '@/components/JumpNav';
import { CardRail, Section, SectionHeader, StatBadges, StepPath, StoryCard } from '@/components/kit';
import { CentreViewTracker } from '@/app/centres/[city]/[slug]/CentreViewTracker';
import { CentreCatalogueProgrammes, CentreFeaturedProgrammes } from '@/components/centres/CentreFeaturedProgrammes';
import { StickyCentreBar } from '@/components/centres/StickyCentreBar';
import { TrackedAnchor } from '@/components/TrackedAnchor';
import { legacyStats, type NetworkCounts } from '@/lib/brand-facts';

const STAT_ICONS = [Award, Building2, Users, ShieldCheck] as const;
const JOURNEY_ICONS = [BookOpen, Cpu, Trophy, Briefcase, GraduationCap] as const;

/** Centre programme titles and catalogue titles differ in case and "&"/"and"; compare loosely. */
function normaliseTitle(title: string) {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

/**
 * Centre detail — flat `/centres/{slug}` page.
 * Built on the component kit like the other pages: a photo hero, then sections that alternate
 * tint and plain tones, a jump bar and call/enquire bar on phones, and a wash closing band.
 */
export function CentreDetail({
  centre,
  city,
  courses,
  siblingCentres = [],
  canonicalPath,
  network,
}: {
  centre: Centre;
  city: City;
  courses: Course[];
  siblingCentres?: Centre[];
  canonicalPath: string;
  network: NetworkCounts;
}) {
  const offered = courses.filter((c) => centre.coursesOffered.includes(c.slug));
  const siblings = siblingCentres.filter((c) => c.slug !== centre.slug);
  const phoneHref = centre.phone
    ? `tel:${centre.phone.replace(/[^\d+]/g, '').split('/')[0]}`
    : null;
  const helplineHref = centre.helpline
    ? `tel:${centre.helpline.replace(/[^\d+]/g, '')}`
    : null;

  const featured = centre.featuredProgrammes ?? [];
  const featuredTitles = new Set(featured.map((p) => normaliseTitle(p.title)));
  const moreCourses = offered.filter((c) => !featuredTitles.has(normaliseTitle(c.title)));
  const eligibility = centre.eligibility ?? [];
  const journey = centre.journey ?? [];
  const faculty = centre.faculty ?? [];
  const placements = centre.placements ?? [];
  const faqs = centre.faqs ?? [];
  const testimonials = centre.testimonials ?? [];
  const showStats = featured.length > 0 || Boolean(centre.headline) || Boolean(centre.body);
  /*
   * A handful of centres (Balasore, Orai) sit in a city of the same name — and
   * Delhi is both a city and its own state — so `locality`/`city.name` (and
   * sometimes `city.name`/`city.state`) can be identical strings. Anywhere
   * those two would otherwise print back to back (e.g. "Balasore, Balasore"),
   * collapse to the one distinct value instead.
   */
  const localitySameAsCity =
    centre.locality.trim().toLowerCase() === city.name.trim().toLowerCase();
  const localityCityLabel = localitySameAsCity
    ? city.name
    : `${centre.locality}, ${city.name}`;
  const introCopy =
    centre.body ??
    centre.intro ??
    `IT training centre in ${localityCityLabel}. Cloud, cyber security and BCA courses with placement support.`;
  const heroAccent = centre.name.toLowerCase().includes(centre.locality.toLowerCase())
    ? (localitySameAsCity ? null : city.name)
    : centre.locality;
  const cleanFaculty = faculty.filter(
    (m) =>
      m.name.length > 2 &&
      m.name.length < 48 &&
      !/Join millions|successful achievers|12 Lakh|Students Got|Enquire|Contact/i.test(m.name),
  );

  function facultyBioLines(bio: string): string[] {
    const labeled = bio
      .split(/(?=(?:Qualification|Exp\.?|Experience|Certification|Certified)[:\s-])/i)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 2);
    if (labeled.length > 1) return labeled;
    return [bio.replace(/\s+/g, ' ').trim()];
  }

  // Cities have no page of their own — the centres directory, filtered to the city, is the
  // "all centres in {city}" view — so the trail goes straight from Centres to this centre.
  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Centres', path: '/centres' },
    { name: centre.name, path: canonicalPath },
  ];
  const cityDirectoryHref = `/centres?q=${encodeURIComponent(city.name)}` as Route;

  /*
   * The stored address line usually already ends in "…, Locality, City, State", so printing
   * locality / city / state again underneath repeated them. Only add the parts it lacks.
   */
  const addressLower = centre.addressLine.toLowerCase();
  const inAddress = (part: string) => addressLower.includes(part.trim().toLowerCase());
  const missingPlace = [...new Set([centre.locality, city.name])].filter((part) => part && !inAddress(part));
  const addressTail = [inAddress(centre.state) ? '' : centre.state, centre.pincode].filter(Boolean).join(' ');
  const addressLines = [centre.addressLine];
  if (missingPlace.length) addressLines.push(missingPlace.join(', '));
  if (addressTail) {
    if (addressLines.length === 1) addressLines[0] = `${addressLines[0]} ${addressTail}`;
    else addressLines.push(addressTail);
  }

  // Tones alternate down the page whatever sections a centre has; the closing band is always the wash.
  let toneIndex = 0;
  const nextTone = (): 'tint' | 'plain' => (toneIndex++ % 2 === 0 ? 'tint' : 'plain');

  const hasCourses = featured.length > 0 || offered.length > 0;
  const hasAdmissions = eligibility.length > 0 || journey.length > 0;
  const jumpItems: JumpItem[] = [
    ...(hasCourses ? [{ id: 'centre-courses', label: 'Courses' }] : []),
    ...(hasAdmissions ? [{ id: 'centre-admissions', label: 'Admissions' }] : []),
    ...(cleanFaculty.length ? [{ id: 'centre-faculty-section', label: 'Faculty' }] : []),
    ...(placements.length ? [{ id: 'centre-placements-section', label: 'Placements' }] : []),
    ...(testimonials.length ? [{ id: 'centre-stories-section', label: 'Stories' }] : []),
    ...(faqs.length ? [{ id: 'centre-faq-section', label: 'FAQs' }] : []),
    { id: 'centre-visit-section', label: 'Visit' },
  ];

  const primaryBtn =
    'dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]';
  const outlineBtn =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--k-line-strong)] bg-[var(--k-bg)] px-6 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)]';

  return (
    <div className="relative">
      <JsonLd
        data={[
          centreSchema(centre, city.name),
          breadcrumbSchema(trail),
          ...(faqs.length ? [faqSchema(faqs)] : []),
        ]}
      />
      <CentreViewTracker slug={centre.slug} name={centre.name} city={city.slug} />

      <div className="shell pt-5 sm:pt-6 lg:pt-8">
        <Breadcrumbs trail={trail} />
      </div>

      {/* Photo hero */}
      <section className="shell relative pt-5 pb-8 sm:pt-6 sm:pb-10 lg:pb-12">
        <div className="centres-detail-hero relative min-h-[min(78vw,440px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[28px] lg:min-h-[520px]">
          <Image
            src="/home/journey-explore-v2.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
            className="object-cover object-[center_24%]"
          />
          <div aria-hidden="true" className="centres-detail-wash pointer-events-none absolute inset-0" />

          <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-9 xs:px-8 xs:py-11 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[58%] lg:px-12 lg:py-16 xl:px-14">
            <p className="centres-reveal inline-flex w-fit items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[12px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)] uppercase">
              {siteConfig.name}
              <span aria-hidden="true" className="text-[var(--dc-ink-muted)]">
                ·
              </span>
              <span className="tracking-[0.08em] normal-case">{city.name}</span>
            </p>

            <h1 className="page-title centres-reveal centres-reveal-delay-1 mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
              {centre.name}
              {heroAccent ? (
                <span className="mt-1 block text-[var(--dc-accent-soft)] sm:mt-1.5">{heroAccent}</span>
              ) : null}
            </h1>

            {centre.headline ? (
              <p className="centres-reveal centres-reveal-delay-2 mt-4 max-w-[42ch] text-[15px] leading-snug font-semibold text-[var(--dc-ink-secondary)] sm:text-[17px]">
                {centre.headline}
              </p>
            ) : null}

            <p className="centres-reveal centres-reveal-delay-2 mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] line-clamp-4 sm:mt-5 sm:text-[15.5px]">
              {introCopy}
            </p>

            <div
              id="centre-hero-cta"
              className="centres-reveal centres-reveal-delay-3 mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <Link href={`/enquiry?centre=${centre.slug}` as Route} className={primaryBtn}>
                Enquire at this centre
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>

              {phoneHref ? (
                <TrackedAnchor
                  href={phoneHref}
                  event="phone_clicked"
                  props={{ centre_slug: centre.slug, type: 'hero' }}
                  className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border-2 border-[var(--dc-accent)] bg-transparent px-5 text-[15px] font-bold text-[var(--dc-accent-soft)] transition-colors hover:bg-[var(--dc-accent-tint)]"
                >
                  <Phone className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Call {centre.phone}
                </TrackedAnchor>
              ) : null}
            </div>

            <div className="centres-reveal centres-reveal-delay-3 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-[var(--dc-ink-muted)] sm:mt-7">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--dc-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                {localityCityLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[var(--dc-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                {featured.length || offered.length} courses
              </span>
            </div>
          </div>
        </div>
      </section>

      <JumpNav items={jumpItems} />

      {/* Why Jetking, in numbers */}
      {showStats ? (
        <Section tone={nextTone()} labelledBy="centre-why-heading">
          <SectionHeader
            id="centre-why-heading"
            eyebrow="Why Jetking"
            title={
              <>
                Learn where industry <span className="text-[var(--k-red)]">actually trains</span>
              </>
            }
          />
          <StatBadges
            stats={legacyStats(network).map((stat, index) => ({
              value: stat.value,
              label: stat.label,
              icon: STAT_ICONS[index] ?? Award,
            }))}
          />
        </Section>
      ) : null}

      {/* Courses at this centre */}
      {hasCourses ? (
        <Section tone={nextTone()} id="centre-courses" labelledBy="centre-courses-heading" className="scroll-mt-36">
          <SectionHeader
            id="centre-courses-heading"
            eyebrow="At this centre"
            title="Courses at this centre"
            lede="Classroom and lab training, with placement support. Pick a course to see its curriculum, fees and certifications."
          />
          <div className="space-y-10 sm:space-y-12">
            <CentreFeaturedProgrammes programmes={featured} courses={courses} centreSlug={centre.slug} />
            {featured.length && !moreCourses.length ? null : (
              <CentreCatalogueProgrammes
                courses={featured.length ? moreCourses : offered}
                title={featured.length ? 'More courses at this centre' : 'Courses offered'}
              />
            )}
          </div>
        </Section>
      ) : null}

      {/* Admissions and the learning journey */}
      {hasAdmissions ? (
        <Section tone={nextTone()} id="centre-admissions" labelledBy="centre-admissions-heading" className="scroll-mt-36">
          <SectionHeader
            id="centre-admissions-heading"
            eyebrow="Admissions"
            title={eligibility.length ? 'Who can apply' : 'Your transformation journey'}
            lede={eligibility.length ? undefined : 'From beginner to job-ready, step by step.'}
          />
          {eligibility.length ? (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {eligibility.map((block) => (
                <article key={block.title} className="kit kit-card p-5 sm:p-6">
                  <h3 className="text-[13px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{block.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {block.items.map((item) => (
                      <li key={item.slice(0, 48)} className="flex gap-3 text-[15px] leading-relaxed text-[var(--k-ink-2)]">
                        <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--k-red-fill)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}

          {journey.length ? (
            <div className={eligibility.length ? 'mt-14 sm:mt-16' : ''}>
              {eligibility.length ? (
                <h3 className="mb-8 text-center text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:mb-10 sm:text-[26px]">
                  Your transformation journey
                </h3>
              ) : null}
              <StepPath
                steps={journey.map((step, i) => ({
                  icon: JOURNEY_ICONS[i % JOURNEY_ICONS.length]!,
                  title: step.title,
                  body: (
                    <ul className="space-y-1.5 lg:text-left">
                      {step.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                }))}
              />
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* Faculty */}
      {cleanFaculty.length ? (
        <Section tone={nextTone()} id="centre-faculty-section" labelledBy="centre-faculty" className="scroll-mt-36">
          <SectionHeader id="centre-faculty" eyebrow="Mentors" title="Our faculty" />
          <CardRail label="Faculty" cols={3} colsMd={2}>
            {cleanFaculty.map((member) => {
              const bioLines = member.bio ? facultyBioLines(member.bio) : [];
              return (
                <article key={member.name} className="kit kit-card flex h-full flex-col gap-4 p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--k-red-wash)]">
                      {member.photoUrl ? (
                        <Image src={member.photoUrl} alt={member.name} fill sizes="80px" className="object-cover object-top" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-[var(--k-red)]">
                          <Users className="h-8 w-8" strokeWidth={1.6} aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[18px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--k-ink)]">{member.name}</h3>
                      <p className="mt-1 text-[12.5px] font-bold tracking-[0.06em] text-[var(--k-red)] uppercase">{member.title}</p>
                    </div>
                  </div>
                  {bioLines.length ? (
                    <ul className="space-y-2 border-t border-[var(--k-line)] pt-4 text-[14.5px] leading-relaxed text-[var(--k-ink-2)]">
                      {bioLines.map((line) => (
                        <li key={line.slice(0, 40)}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </CardRail>
        </Section>
      ) : null}

      {/* Placements */}
      {placements.length ? (
        <Section tone={nextTone()} id="centre-placements-section" labelledBy="centre-placements" className="scroll-mt-36">
          <SectionHeader id="centre-placements" eyebrow="Outcomes" title="Recent placements" />
          <CardRail label="Recent placements" cols={4} colsMd={3}>
            {placements.slice(0, 12).map((p) => (
              <article key={`${p.name}-${p.company}`} className="kit kit-card flex h-full flex-col items-center gap-3 p-5 text-center sm:p-6">
                <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--k-red-wash)]">
                  {p.photoUrl ? (
                    <Image src={p.photoUrl} alt={p.name} fill sizes="80px" className="object-cover object-top" />
                  ) : (
                    <span className="text-[20px] font-extrabold text-[var(--k-red)]">
                      {p.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </span>
                <h3 className="text-[16.5px] leading-snug font-extrabold break-words text-[var(--k-ink)]">{p.name}</h3>
                <p className="line-clamp-2 text-[14px] leading-snug text-[var(--k-ink-3)]">{p.company}</p>
                {p.package && /\d/.test(p.package) ? (
                  <span className="numeral mt-auto rounded-full bg-[var(--k-red-wash)] px-3 py-1 text-[12.5px] font-bold text-[var(--k-red)]">
                    {p.package}
                  </span>
                ) : null}
              </article>
            ))}
          </CardRail>
        </Section>
      ) : null}

      {/* Student stories */}
      {testimonials.length ? (
        <Section tone={nextTone()} id="centre-stories-section" labelledBy="centre-stories" className="scroll-mt-36">
          <SectionHeader id="centre-stories" eyebrow="Voices" title="Student stories" />
          <CardRail label="Student stories" cols={3} colsMd={2}>
            {testimonials.map((t) => (
              <StoryCard key={`${t.name}-${t.quote.slice(0, 24)}`} name={t.name} outcome={t.role ?? ''} quote={t.quote} />
            ))}
          </CardRail>
        </Section>
      ) : null}

      {/* FAQ */}
      {faqs.length ? (
        <Section tone={nextTone()} id="centre-faq-section" labelledBy="centre-faq" className="scroll-mt-36">
          <SectionHeader id="centre-faq" eyebrow="Help" title="Frequently asked questions" />
          <div className="kit kit-card divide-y divide-[var(--k-line)] px-5 sm:px-7">
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="cursor-pointer list-none py-4 text-[16px] font-bold text-[var(--k-ink)] marker:content-none sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="centres-faq-toggle mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--k-line-strong)] bg-[var(--k-red-wash)] text-[var(--k-red)]"
                    >
                      <span className="centres-faq-toggle-icon" />
                    </span>
                  </span>
                </summary>
                <p className="-mt-1 max-w-[70ch] pb-4 text-[15px] leading-relaxed text-[var(--k-ink-2)] sm:pb-5">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Visit this centre, and the other centres in the city */}
      <Section tone={nextTone()} id="centre-visit-section" labelledBy="centre-visit" className="scroll-mt-36">
        <SectionHeader id="centre-visit" eyebrow="Visit" title={`Visit ${centre.locality}`} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="kit kit-card p-5 sm:p-7">
            <address className="flex gap-3 text-[15px] leading-relaxed text-[var(--k-ink-2)] not-italic">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
              <span>
                {addressLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </span>
            </address>

            <a
              href={googleMapsUrl(centre)}
              target="_blank"
              rel="noopener noreferrer"
              className="tap mt-4 ml-8 inline-flex items-center gap-1.5 rounded-full border border-[var(--k-line-strong)] px-4 py-2 text-[14px] font-bold text-[var(--k-red)] transition-colors hover:border-[var(--k-red)]"
            >
              <Navigation className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              Open in Google Maps
              <span className="sr-only"> (opens in a new tab)</span>
            </a>

            <dl className="mt-6 space-y-5 border-t border-[var(--k-line)] pt-6">
              {centre.phone ? (
                <div className="flex gap-3">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">Phone</dt>
                    <dd>
                      {phoneHref ? (
                        <TrackedAnchor
                          href={phoneHref}
                          event="phone_clicked"
                          props={{ centre_slug: centre.slug }}
                          className="tap numeral mt-0.5 block text-[16px] font-semibold text-[var(--k-ink)] hover:text-[var(--k-red)]"
                        >
                          {centre.phone}
                        </TrackedAnchor>
                      ) : (
                        <span className="numeral mt-0.5 block text-[16px] font-semibold text-[var(--k-ink)]">{centre.phone}</span>
                      )}
                    </dd>
                  </div>
                </div>
              ) : null}
              {centre.helpline ? (
                <div className="flex gap-3">
                  <Headphones className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">Admissions helpline</dt>
                    <dd>
                      {helplineHref ? (
                        <TrackedAnchor
                          href={helplineHref}
                          event="phone_clicked"
                          props={{ centre_slug: centre.slug, type: 'helpline' }}
                          className="tap numeral mt-0.5 block text-[16px] font-semibold text-[var(--k-ink)] hover:text-[var(--k-red)]"
                        >
                          {centre.helpline}
                        </TrackedAnchor>
                      ) : (
                        <span className="numeral mt-0.5 block text-[16px] font-semibold text-[var(--k-ink)]">{centre.helpline}</span>
                      )}
                    </dd>
                  </div>
                </div>
              ) : null}
              {centre.email ? (
                <div className="flex gap-3">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${centre.email}`}
                        className="tap mt-0.5 block text-[16px] font-semibold break-all text-[var(--k-ink)] hover:text-[var(--k-red)]"
                      >
                        {centre.email}
                      </a>
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={`/enquiry?centre=${centre.slug}` as Route} className={primaryBtn}>
                Enquire about this centre
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>
              <Link href={'/centres' as Route} className={outlineBtn}>
                Back to all centres
              </Link>
            </div>
          </div>

          <div className="kit kit-card p-5 sm:p-7">
            <h3 className="text-[20px] font-extrabold text-[var(--k-ink)]">
              {siblings.length ? `Other centres in ${city.name}` : `Centres in ${city.name}`}
            </h3>
            {siblings.length ? (
              <ul className="mt-4 divide-y divide-[var(--k-line)]">
                {siblings.map((sib) => (
                  <li key={sib.slug}>
                    <Link
                      href={centrePath(sib.slug) as Route}
                      className="group/sib flex items-center justify-between gap-3 py-3.5"
                    >
                      <span>
                        <span className="block text-[15.5px] font-bold text-[var(--k-ink)] group-hover/sib:text-[var(--k-red)]">
                          {sib.name}
                        </span>
                        <span className="text-[13.5px] text-[var(--k-ink-3)]">{sib.locality}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--k-red)]" strokeWidth={2.25} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[15px] text-[var(--k-ink-2)]">This is the only Jetking centre in {city.name}.</p>
            )}
            <Link
              href={cityDirectoryHref}
              className="tap mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-[var(--k-red)]"
            >
              View all {city.name} centres
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Closing band */}
      <Section tone="wash" labelledBy="centre-cta-heading">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 id="centre-cta-heading" className="section-title text-[var(--k-ink)]">
              Ready to visit <span className="text-[var(--k-red)]">{centre.locality}</span>?
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              Talk to a counsellor about batches, fees and the right course for your goals at this centre.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={`/enquiry?centre=${centre.slug}` as Route} className={primaryBtn}>
              Book a counselling call
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
            {phoneHref ? (
              <TrackedAnchor
                href={phoneHref}
                event="phone_clicked"
                props={{ centre_slug: centre.slug, type: 'footer' }}
                className={outlineBtn}
              >
                <Phone className="h-4 w-4 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                {centre.phone}
              </TrackedAnchor>
            ) : null}
          </div>
        </div>
      </Section>

      <StickyCentreBar anchorId="centre-hero-cta" centreSlug={centre.slug} phoneHref={phoneHref} />
    </div>
  );
}
