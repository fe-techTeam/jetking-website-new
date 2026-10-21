
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Clock,
  ChevronRight,
  Compass,
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
  Video,
} from 'lucide-react';
import type { Centre, City, Course } from '@/lib/content/types';
import { centrePath } from '@/lib/centre-path';
import { googleMapsUrl } from '@/lib/maps';
import { siteConfig } from '@/lib/site';
import { breadcrumbSchema, centreSchema, faqSchema } from '@/lib/seo';
import { Breadcrumbs, JsonLd, type Crumb } from '@/components/ui';
import { JumpNav, type JumpItem } from '@/components/JumpNav';
import { CardRail, FaqList, Section, SectionHeader, StatBadges, StepPath, StoryCard } from '@/components/kit';
import { CentreViewTracker } from '@/app/centres/[city]/[slug]/CentreViewTracker';
import { CentreCourseGroups } from '@/components/centres/CentreFeaturedProgrammes';
import { CentreHeroForm } from '@/components/centres/CentreHeroForm';
import { CentreUpdateCard } from '@/components/centres/CentreUpdateCard';
import { CentreGallery, CentreReasons, type GallerySlot, type ReasonTile } from '@/components/centres/CentreExperience';
import { CardSlider } from '@/components/centres/CardSlider';
import { PlacementSlider } from '@/components/centres/PlacementSlider';
import { StickyCentreBar } from '@/components/centres/StickyCentreBar';
import { TrackedAnchor } from '@/components/TrackedAnchor';
import { legacyStats, type NetworkCounts } from '@/lib/brand-facts';
import { fill } from '@/lib/content/copy/define';
import type { centresCopy } from '@/lib/content/copy/pages/centres';

const STAT_ICONS = [Award, Building2, Users, ShieldCheck] as const;
const JOURNEY_ICONS = [BookOpen, Cpu, Trophy, Briefcase, GraduationCap] as const;

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
  copy,
}: {
  copy: typeof centresCopy.defaults;
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
  const eligibility = centre.eligibility ?? [];
  // The programmes fact falls back to the kinds of course on offer when the centre has not set its own wording.
  const hasDegree = offered.some((c) => c.level === 'degree');
  const hasShort = offered.some((c) => c.level !== 'degree');
  const programsFallback =
    hasDegree && hasShort
      ? copy['centreAbout.programsDegreeShort']
      : hasDegree
        ? copy['centreAbout.programsDegree']
        : hasShort
          ? copy['centreAbout.programsShort']
          : '';
  // Until a centre's content is filled in, show visible "To be updated" placeholders so reviewers see what is still needed.
  const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS !== 'false';
  const aboutCells = [
    { label: copy['centreAbout.programs'], value: centre.highlights?.programs || programsFallback, icon: GraduationCap },
    { label: copy['centreAbout.placement'], value: centre.highlights?.placement, icon: Trophy },
    { label: copy['centreAbout.facility'], value: centre.highlights?.facility, icon: Cpu },
    { label: copy['centreAbout.timing'], value: centre.highlights?.timing, icon: Clock },
  ]
    .map((cell) => ({ ...cell, placeholder: !cell.value }))
    .filter((cell) => !cell.placeholder || showPlaceholders)
    .map((cell) => ({ ...cell, value: cell.value || copy['centrePlaceholder.text'] }));
  const journey = centre.journey ?? [];
  const faculty = centre.faculty ?? [];
  const placements = centre.placements ?? [];
  // Highest salaries first. A few records have the company in the name field, so swap those back.
  const looksLikeCompany = (v: string) => /(pvt|ltd|llp|infotech|infosystems|technolog|electronics|solutions|systems)/i.test(v);
  const lpa = (v?: string) => parseFloat(v?.match(/\d+(\.\d+)?/)?.[0] ?? '') || 0;
  const topPlacements = placements
    .map((p) => (looksLikeCompany(p.name) && !looksLikeCompany(p.company) ? { ...p, name: p.company, company: p.name } : p))
    .sort((a, b) => lpa(b.package) - lpa(a.package))
    .slice(0, 15);
  const faqs = centre.faqs ?? [];
  // Stand-in content so a reviewer sees what each section will hold until the centre's own data is entered.
  const placeholderPlacements = showPlaceholders
    ? Array.from({ length: 4 }, () => ({
        name: copy['centrePlaceholder.studentName'],
        company: copy['centrePlaceholder.studentCompany'],
        package: copy['centrePlaceholder.package'],
        placeholder: true,
        placeholderBadge: copy['centrePlaceholder.badge'],
      }))
    : [];
  const realUpdates = [...(centre.updates ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const testimonials = centre.testimonials ?? [];
  const newest = realUpdates.length || !showPlaceholders
    ? realUpdates
    : Array.from({ length: 4 }, () => ({
        title: copy['centrePlaceholder.newsTitle'],
        summary: copy['centrePlaceholder.newsBody'],
        date: '',
        category: copy['centrePlaceholder.badge'],
        placeholder: true,
      }));
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

  // The key roles the page should show; a placeholder card stands in for any that nobody on the record fills.
  const roleChecks = [
    { test: /head|manager|director/i, label: copy['centrePlaceholder.roleHead'] },
    { test: /personal|\bpd\b|soft skill|communication/i, label: copy['centrePlaceholder.rolePd'] },
    { test: /counsel/i, label: copy['centrePlaceholder.roleCounsellor'] },
  ];
  type Person = (typeof cleanFaculty)[number] & { placeholder?: boolean };
  const people: Person[] = [
    ...cleanFaculty,
    ...(showPlaceholders
      ? roleChecks
          .filter((role) => !cleanFaculty.some((m) => role.test.test(m.title)))
          .map((role) => ({ name: role.label, title: copy['centrePlaceholder.badge'], placeholder: true }))
      : []),
  ];

  // Cities have no page of their own — the centres directory, filtered to the city, is the
  // "all centres in {city}" view — so the trail goes straight from Centres to this centre.
  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.centres'], path: '/centres' },
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

  // Reasons to visit: the same four for every centre; a centre may supply its own pictures.
  const reasonPhotos = centre.experiencePhotos ?? {};
  const reasonTiles: ReasonTile[] = [
    {
      title: copy['centreReasons.lab.title'],
      body: copy['centreReasons.lab.body'],
      icon: Cpu,
      photoUrl: reasonPhotos.lab || copy['centreReasons.lab.photo'],
      photoAlt: copy['centreReasons.lab.photoAlt'],
      photoLabel: copy['centreReasons.lab.photoLabel'],
    },
    {
      title: copy['centreReasons.expert.title'],
      body: copy['centreReasons.expert.body'],
      icon: Video,
      photoUrl: reasonPhotos.classroom || copy['centreReasons.classroom.photo'],
      photoAlt: copy['centreReasons.classroom.photoAlt'],
      photoLabel: copy['centreReasons.classroom.photoLabel'],
    },
    {
      title: copy['centreReasons.career.title'],
      body: copy['centreReasons.career.body'],
      icon: Compass,
      photoUrl: reasonPhotos.counselling || copy['centreReasons.counselling.photo'],
      photoAlt: copy['centreReasons.counselling.photoAlt'],
      photoLabel: copy['centreReasons.counselling.photoLabel'],
    },
    {
      title: copy['centreReasons.placement.title'],
      body: copy['centreReasons.placement.body'],
      icon: Briefcase,
      photoUrl: reasonPhotos.mockInterview || copy['centreReasons.mock.photo'],
      photoAlt: copy['centreReasons.mock.photoAlt'],
      photoLabel: copy['centreReasons.mock.photoLabel'],
    },
  ];

  // Gallery: centre CMS pictures first; empty slots fall back to the labelled defaults (or dashed placeholders when those are off).
  const realGallery = (centre.gallery ?? []).filter((g) => g.url).slice(0, 4);
  const galleryDefaults: GallerySlot[] = [0, 1, 2, 3].map((i) => ({
    label: copy[`centreGallery.slot.${i}` as 'centreGallery.slot.0'],
    url: copy[`centreGallery.slot.${i}.photo` as 'centreGallery.slot.0.photo'],
    alt: copy[`centreGallery.slot.${i}.photoAlt` as 'centreGallery.slot.0.photoAlt'],
  }));
  const gallerySlots: GallerySlot[] = showPlaceholders
    ? galleryDefaults.map((slot, i) => ({
        label: realGallery[i]?.caption || slot.label,
        url: realGallery[i]?.url || slot.url,
        alt: realGallery[i]?.caption || slot.alt,
      }))
    : realGallery.length
      ? realGallery.map((g, i) => ({
          label: g.caption || galleryDefaults[i]?.label || copy['centreGallery.slot.0'],
          url: g.url,
          alt: g.caption || galleryDefaults[i]?.alt,
        }))
      : galleryDefaults;
  const hasStoriesSection = testimonials.length > 0 || gallerySlots.length > 0;

  const hasCourses = featured.length > 0 || offered.length > 0;
  const showCoursePlaceholders = !hasCourses && showPlaceholders;
  const hasAdmissions = eligibility.length > 0 || journey.length > 0;
  const jumpItems: JumpItem[] = [
    ...(hasCourses || showCoursePlaceholders ? [{ id: 'centre-courses', label: copy['centreJump.courses'] }] : []),
    ...(hasAdmissions || showPlaceholders ? [{ id: 'centre-admissions', label: copy['centreJump.admissions'] }] : []),
    ...(placements.length || placeholderPlacements.length ? [{ id: 'centre-placements-section', label: copy['centreJump.placements'] }] : []),
    ...(hasStoriesSection ? [{ id: 'centre-stories-section', label: copy['centreJump.stories'] }] : []),
    ...(people.length ? [{ id: 'centre-faculty-section', label: copy['centreJump.faculty'] }] : []),
    ...(newest.length ? [{ id: 'centre-news-section', label: copy['centreJump.news'] }] : []),
    { id: 'centre-visit-section', label: copy['centreJump.visit'] },
    ...(faqs.length || showPlaceholders ? [{ id: 'centre-faq-section', label: copy['centreJump.faqs'] }] : []),
  ];



  // The visit heading keeps the live locality in an accent span, so its template is split around the token.
  const [closingBefore = '', closingAfter = ''] = copy['centreClosing.title'].split('{locality}');

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

      {/* Photo hero: the centre, three reasons to visit, and the enquiry form on the same page */}
      <section className="shell relative pt-5 pb-8 sm:pt-6 sm:pb-10 lg:pb-12" aria-labelledby="centre-hero-heading">
        <div className="centres-detail-hero relative overflow-hidden rounded-[24px] xs:rounded-[28px]">
          <Image
            src={copy['centreHero.image']}
            alt=""
            fill
            priority
            sizes="(min-width: 2560px) 2100px, (min-width: 1920px) 1800px, (min-width: 1536px) 1600px, (min-width: 1280px) 1440px, 100vw"
            className="object-cover object-[center_24%]"
          />
          <div aria-hidden="true" className="centres-detail-wash pointer-events-none absolute inset-0" />

          <div className="relative z-[1] flex flex-col min-[880px]:flex-row min-[880px]:items-center min-[880px]:justify-between min-[880px]:gap-6 lg:gap-8">
            <div className="flex flex-1 flex-col justify-center px-5 py-9 xs:px-8 xs:py-11 sm:px-10 sm:py-12 min-[880px]:max-w-[58%] lg:max-w-[62%] lg:px-12 lg:py-16 xl:px-14">
              <p className="centres-reveal inline-flex w-fit items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-accent-tint)] px-3.5 py-1.5 text-[12px] font-bold tracking-[0.14em] text-[var(--dc-accent-soft)] uppercase">
                {fill(copy['centreHero.region'], { state: centre.state })}
              </p>

              <h1
                id="centre-hero-heading"
                className="page-title centres-reveal centres-reveal-delay-1 mt-4 font-display text-[var(--dc-ink)] uppercase sm:mt-5"
              >
                {siteConfig.name}
                <span className="mt-1 block text-[var(--dc-accent-soft)] sm:mt-1.5">
                  {fill(copy['centreHero.centreTitle'], { locality: centre.locality })}
                </span>
              </h1>

              <p className="centres-reveal centres-reveal-delay-2 mt-5 max-w-[24ch] text-[22px] leading-tight font-bold text-[var(--dc-ink)] sm:text-[26px]">
                {copy['centreHero.tagline']}
              </p>
              <p className="centres-reveal centres-reveal-delay-2 mt-3 max-w-[40ch] text-[15px] leading-[1.6] text-[var(--dc-ink-secondary)] sm:text-[16.5px]">
                {copy['centreHero.sub']}
              </p>
            </div>

            <CentreHeroForm
              centreSlug={centre.slug}
              phone={centre.phone}
              phoneHref={phoneHref}
              programmes={offered.map((c) => ({ slug: c.slug, title: c.title }))}
              titleId="centre-form-heading"
              copy={{
                title: copy['centreForm.title'],
                sub: copy['centreForm.sub'],
                email: copy['centreForm.email'],
                emailPlaceholder: copy['centreForm.emailPlaceholder'],
                programme: copy['centreForm.programme'],
                programmePlaceholder: copy['centreForm.programmePlaceholder'],
                consent: copy['centreForm.consent'],
                submit: copy['centreForm.submit'],
                callPrefix: copy['centreForm.callPrefix'],
              }}
            />
          </div>
        </div>
      </section>

      <JumpNav items={jumpItems} />

      {/* Quick intro to Jetking, with the network in numbers */}
      <Section tone={nextTone()} labelledBy="centre-intro-heading">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 lg:gap-12">
          <div>
            <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['centreIntro.eyebrow']}</p>
            <h2 id="centre-intro-heading" className="section-title mt-2 text-[var(--k-ink)] uppercase">
              {copy['centreIntro.title']} <span className="text-[var(--k-red)]">{copy['centreIntro.titleAccent']}</span>
            </h2>
            <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
              {copy['centreIntro.body']}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[var(--k-line)] shadow-[0_24px_60px_-28px_rgb(0_0_0/0.4)]">
            <Image
              src={copy['centreIntro.image']}
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="mt-8 sm:mt-10">
          <StatBadges
            stats={(() => {
              // As the client laid it out: year founded, "39 centres in 28 cities", enrolled learners, courses on offer.
              const [year, , , courses] = legacyStats(network);
              return [
                { value: year.value, label: year.label, icon: STAT_ICONS[0] },
                { value: String(network.centres), label: fill(copy['centreStats.centresLabel'], { cities: network.cities }), icon: STAT_ICONS[1] },
                { value: copy['centreStats.enrolled.value'] || copy['centrePlaceholder.text'], label: copy['centreStats.enrolled.label'], icon: STAT_ICONS[2] },
                { value: courses.value, label: courses.label, icon: STAT_ICONS[3] },
              ];
            })()}
          />
        </div>
      </Section>

      {/* Why walk into this centre: four reasons (the same for every centre), then this centre's own facts */}
      <Section tone={nextTone()} labelledBy="centre-about-heading">
        <SectionHeader
          id="centre-about-heading"
          eyebrow={copy['centreAbout.eyebrow']}
          title={fill(copy['centreAbout.title'], { locality: centre.locality })}
          lede={copy['centreAbout.lede']}
        />
        <CentreReasons tiles={reasonTiles} showPlaceholders={showPlaceholders} placeholderNote={copy['centreReasons.photoPlaceholder']} />
        {aboutCells.length ? (
          <dl className="kit-card mt-4 grid grid-cols-2 gap-x-5 gap-y-5 p-5 sm:mt-5 sm:p-6 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ '--n': aboutCells.length } as React.CSSProperties}>
            {aboutCells.map(({ label, value, placeholder, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="kit-iconwell shrink-0" aria-hidden="true">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{label}</dt>
                  <dd
                    className={
                      placeholder
                        ? 'mt-0.5 text-[15px] leading-snug font-semibold text-[var(--k-ink-3)] italic'
                        : 'mt-0.5 text-[16px] leading-snug font-extrabold text-[var(--k-ink)]'
                    }
                  >
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        ) : null}
      </Section>

      {/* Courses at this centre */}
      {hasCourses || showCoursePlaceholders ? (
        <Section tone={nextTone()} id="centre-courses" labelledBy="centre-courses-heading" className="scroll-mt-36">
          <SectionHeader
            id="centre-courses-heading"
            eyebrow={copy['centreCourses.eyebrow']}
            title={copy['centreCourses.title']}
            lede={copy['centreCourses.lede']}
          />
          <div className="space-y-10 sm:space-y-12">
            {showCoursePlaceholders ? (
              <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="kit-card flex min-h-[200px] flex-col gap-3 !border-2 !border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)] p-5">
                    <span className="w-fit text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{copy['centrePlaceholder.badge']}</span>
                    <h3 className="text-[17px] font-extrabold text-[var(--k-ink)]">{copy['centrePlaceholder.courseTitle']}</h3>
                    <p className="text-[14px] leading-snug text-[var(--k-ink-2)]">{copy['centrePlaceholder.courseBody']}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <CentreCourseGroups centre={centre} courses={courses} offered={offered} copy={copy} />
            )}
          </div>
        </Section>
      ) : null}

      {/* Admissions and the learning journey */}
      {hasAdmissions ? (
        <Section tone={nextTone()} id="centre-admissions" labelledBy="centre-admissions-heading" className="scroll-mt-36">
          <SectionHeader
            id="centre-admissions-heading"
            eyebrow={copy['centreAdmissions.eyebrow']}
            title={eligibility.length ? copy['centreAdmissions.eligibilityTitle'] : copy['centreAdmissions.journeyTitle']}
            lede={eligibility.length ? undefined : copy['centreAdmissions.journeyLede']}
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
                  {copy['centreAdmissions.journeyTitle']}
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
      ) : showPlaceholders ? (
        <Section tone={nextTone()} id="centre-admissions" labelledBy="centre-admissions-heading" className="scroll-mt-36">
          <SectionHeader
            id="centre-admissions-heading"
            eyebrow={copy['centreAdmissions.eyebrow']}
            title={copy['centreAdmissions.eligibilityTitle']}
          />
          <ul className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {[
              { title: copy['centrePlaceholder.admissionsTitle'], body: copy['centrePlaceholder.admissionsBody'] },
              { title: copy['centrePlaceholder.stepsTitle'], body: copy['centrePlaceholder.stepsBody'] },
            ].map((card) => (
              <li key={card.title} className="kit-card flex flex-col gap-3 !border-2 !border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)] p-5 sm:p-6">
                <span className="w-fit text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{copy['centrePlaceholder.badge']}</span>
                <h3 className="text-[17px] font-extrabold text-[var(--k-ink)]">{card.title}</h3>
                <p className="text-[14px] leading-snug text-[var(--k-ink-2)]">{card.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Placements */}
      {placements.length || placeholderPlacements.length ? (
        <Section tone={nextTone()} id="centre-placements-section" labelledBy="centre-placements" className="scroll-mt-36">
          <SectionHeader id="centre-placements" eyebrow={copy['centrePlacements.eyebrow']} title={copy['centrePlacements.title']} />
          <PlacementSlider items={placements.length ? topPlacements : placeholderPlacements} label={copy['centrePlacements.label']} />
        </Section>
      ) : null}

      {/* Learner experience: pictures of the centre, then student stories */}
      {hasStoriesSection ? (
        <Section tone={nextTone()} id="centre-stories-section" labelledBy="centre-stories" className="scroll-mt-36">
          <SectionHeader id="centre-stories" eyebrow={copy['centreStories.eyebrow']} title={copy['centreStories.title']} />
          {gallerySlots.length ? (
            <CentreGallery slots={gallerySlots} label={copy['centreGallery.label']} note={copy['centreGallery.placeholder']} />
          ) : null}
          {testimonials.length ? (
            <div className={gallerySlots.length ? 'mt-8 sm:mt-10' : ''}>
              <CardSlider label={copy['centreStories.label']} cols={4}>
                {testimonials.map((t) => (
                  <StoryCard key={`${t.name}-${t.quote.slice(0, 24)}`} name={t.name} outcome={t.role ?? ''} quote={t.quote} />
                ))}
              </CardSlider>
            </div>
          ) : showPlaceholders ? (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${gallerySlots.length ? 'mt-8 sm:mt-10' : ''}`}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="kit-card flex flex-col gap-3 !border-2 !border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)] p-5 sm:p-6">
                  <span className="w-fit text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{copy['centrePlaceholder.badge']}</span>
                  <p className="text-[15px] leading-relaxed text-[var(--k-ink-2)] italic">{copy['centrePlaceholder.story']}</p>
                  <p className="mt-auto text-[14px] font-bold text-[var(--k-ink-3)]">{copy['centrePlaceholder.studentName']}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* Key people */}
      {people.length ? (
        <Section tone={nextTone()} id="centre-faculty-section" labelledBy="centre-faculty" className="scroll-mt-36">
          <SectionHeader id="centre-faculty" eyebrow={copy['centreFaculty.eyebrow']} title={copy['centreFaculty.title']} />
          <CardRail label={copy['centreFaculty.label']} cols={3} colsMd={2}>
            {people.map((member) => {
              const rows = [
                { label: copy['centreFaculty.qualification'], value: member.qualification },
                { label: copy['centreFaculty.experience'], value: member.experience },
                { label: copy['centreFaculty.specialisation'], value: member.specialisation },
              ];
              const filled = rows.filter((f) => f.value);
              // With placeholders on, every person shows the three fixed rows; without, only what is filled in,
              // and a record with just a free-text bio keeps showing it.
              const facts = showPlaceholders ? rows : filled;
              const bioLines = !showPlaceholders && !filled.length && member.bio ? facultyBioLines(member.bio) : [];
              return (
                <article
                  key={member.name}
                  className={`kit kit-card flex h-full flex-col gap-4 p-5 sm:p-6${member.placeholder ? ' border-dashed' : ''}`}
                >
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
                      <h3 className="text-[18px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--k-ink)]">
                        {member.name.replace(/\b[a-z]/g, (c) => c.toUpperCase())}
                      </h3>
                      <p className="mt-1 text-[12.5px] font-bold tracking-[0.06em] text-[var(--k-red)] uppercase">{member.title}</p>
                    </div>
                  </div>
                  {facts.length ? (
                    <dl className="space-y-3 border-t border-[var(--k-line)] pt-4 text-[14.5px] leading-relaxed">
                      {facts.map((f) => (
                        <div key={f.label}>
                          <dt className="text-[12.5px] font-bold tracking-[0.06em] text-[var(--k-ink-3)] uppercase">{f.label}</dt>
                          <dd className={f.value ? 'mt-0.5 text-[var(--k-ink-2)]' : 'mt-0.5 text-[var(--k-ink-3)] italic'}>
                            {f.value || copy['centrePlaceholder.text']}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : bioLines.length ? (
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

      {/* What's new at the centre */}
      {newest.length ? (
        <Section tone={nextTone()} id="centre-news-section" labelledBy="centre-news" className="scroll-mt-36">
          <SectionHeader id="centre-news" eyebrow={copy['centreNews.eyebrow']} title={copy['centreNews.title']} />
          <CardSlider label={copy['centreNews.label']} cols={4}>
            {newest.map((u, i) => (
              <CentreUpdateCard key={`${i}-${u.date}-${u.title}`} update={u} readLabel={copy['centreNews.read']} />
            ))}
          </CardSlider>
        </Section>
      ) : null}

      {/* Visit this centre, and the other centres in the city */}
      <Section tone={nextTone()} id="centre-visit-section" labelledBy="centre-visit" className="scroll-mt-36">
        {/* The old "Ready to visit" band is folded in here: one heading, one set of details, one enquire button. */}
        <SectionHeader
          id="centre-visit"
          eyebrow={copy['centreVisit.eyebrow']}
          title={
            <>
              {closingBefore}
              <span className="text-[var(--k-red)]">{centre.locality}</span>
              {closingAfter}
            </>
          }
          lede={copy['centreClosing.body']}
        />
        <div className="kit kit-card grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="p-5 sm:p-7">
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
              {copy['centreVisit.mapsLink']}
              <span className="sr-only"> {copy['centreVisit.newTab']}</span>
            </a>

            <dl className="mt-6 space-y-5 border-t border-[var(--k-line)] pt-6">
              {centre.phone ? (
                <div className="flex gap-3">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.phone']}</dt>
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
              ) : showPlaceholders ? (
                <div className="flex gap-3">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.phone']}</dt>
                    <dd className="mt-0.5 text-[16px] font-semibold text-[var(--k-red)] italic">{copy['centrePlaceholder.text']}</dd>
                  </div>
                </div>
              ) : null}
              {centre.helpline ? (
                <div className="flex gap-3">
                  <Headphones className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.helpline']}</dt>
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
              ) : showPlaceholders ? (
                <div className="flex gap-3">
                  <Headphones className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.helpline']}</dt>
                    <dd className="mt-0.5 text-[16px] font-semibold text-[var(--k-red)] italic">{copy['centrePlaceholder.text']}</dd>
                  </div>
                </div>
              ) : null}
              {centre.email ? (
                <div className="flex gap-3">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.email']}</dt>
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
              ) : showPlaceholders ? (
                <div className="flex gap-3">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                  <div>
                    <dt className="text-[12.5px] font-bold tracking-[0.08em] text-[var(--k-ink-3)] uppercase">{copy['centreVisit.email']}</dt>
                    <dd className="mt-0.5 text-[16px] font-semibold text-[var(--k-red)] italic">{copy['centrePlaceholder.text']}</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#centre-hero-cta" className={primaryBtn}>
                {copy['centreVisit.enquire']}
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </a>
              <Link href={copy['centreVisit.backHref'] as Route} className={outlineBtn}>
                {copy['centreVisit.back']}
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--k-line)] p-5 sm:p-7 lg:border-t-0 lg:border-l">
            <h3 className="text-[20px] font-extrabold text-[var(--k-ink)]">
              {fill(siblings.length ? copy['centreVisit.siblingsTitle'] : copy['centreVisit.onlyTitle'], { city: city.name })}
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
              <p className="mt-3 text-[15px] text-[var(--k-ink-2)]">{fill(copy['centreVisit.onlyText'], { city: city.name })}</p>
            )}
            <Link
              href={cityDirectoryHref}
              className="tap mt-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-[var(--k-red)]"
            >
              {fill(copy['centreVisit.viewAll'], { city: city.name })}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      {faqs.length || showPlaceholders ? (
        <Section tone={nextTone()} id="centre-faq-section" labelledBy="centre-faq" className="scroll-mt-36">
          <SectionHeader id="centre-faq" eyebrow={copy['centreFaq.eyebrow']} title={copy['centreFaq.title']} />
          {faqs.length ? (
            <FaqList items={faqs.map((f) => ({ id: f.question, question: f.question, answer: f.answer }))} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {[copy['centrePlaceholder.faqQuestion'], copy['centrePlaceholder.faqAnswer']].map((text) => (
                <li key={text} className="kit-card flex flex-col gap-2 !border-2 !border-dashed !border-[var(--k-line-strong)] !bg-[var(--k-red-wash)] p-5">
                  <span className="w-fit text-[11px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{copy['centrePlaceholder.badge']}</span>
                  <p className="text-[15px] font-bold text-[var(--k-ink)]">{text}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      <StickyCentreBar anchorId="centre-hero-cta" centreSlug={centre.slug} copy={copy} />
    </div>
  );
}
