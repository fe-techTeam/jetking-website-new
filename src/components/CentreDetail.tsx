
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Award,
  Building2,
  ChevronRight,
  GraduationCap,
  Headphones,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Centre, City, Course } from '@/lib/content/types';
import { centrePath } from '@/lib/centre-path';
import { googleMapsUrl } from '@/lib/maps';
import { siteConfig } from '@/lib/site';
import { breadcrumbSchema, centreSchema, faqSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { CentreViewTracker } from '@/app/centres/[city]/[slug]/CentreViewTracker';
import { CentreCatalogueProgrammes, CentreFeaturedProgrammes } from '@/components/centres/CentreFeaturedProgrammes';
import { CentreTestimonialSlider } from '@/components/centres/CentreTestimonialSlider';
import { TrackedAnchor } from '@/components/TrackedAnchor';
import { legacyStats, type NetworkCounts } from '@/lib/brand-facts';

const STAT_ICONS = [Award, Building2, Users, ShieldCheck] as const;

/** Centre programme titles and catalogue titles differ in case and "&"/"and"; compare loosely. */
function normaliseTitle(title: string) {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

/**
 * Centre detail — flat `/centres/{slug}` page.
 * Visual language aligned with `/student`: cinematic hero, why-band,
 * interactive programme cards, and polished content sections.
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

  return (
    <div className="centres-page relative">
      <JsonLd
        data={[
          centreSchema(centre, city.name),
          breadcrumbSchema(trail),
          ...(faqs.length ? [faqSchema(faqs)] : []),
        ]}
      />
      <CentreViewTracker slug={centre.slug} name={centre.name} city={city.slug} />

      {/* Breadcrumb */}
      <div className="shell pt-5 sm:pt-6 lg:pt-8">
        <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--centres-ink-muted)]">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {trail.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                {i === trail.length - 1 ? (
                  <span className="text-[var(--centres-ink-secondary)]">{crumb.name}</span>
                ) : (
                  <Link
                    href={crumb.path as Route}
                    className="tap transition-colors hover:text-[var(--centres-accent-soft)]"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Cinematic hero */}
      <section className="shell relative pt-5 pb-8 sm:pt-6 sm:pb-10 lg:pb-12">
        <div className="centres-detail-hero relative min-h-[min(78vw,440px)] overflow-hidden rounded-[24px] xs:min-h-[400px] xs:rounded-[28px] sm:min-h-[460px] sm:rounded-[32px] lg:min-h-[520px]">
          <Image
            src="/home/journey-explore-v2.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_24%]"
          />
          <div aria-hidden="true" className="centres-detail-wash pointer-events-none absolute inset-0" />

          <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end px-6 py-9 xs:px-8 xs:py-11 sm:justify-center sm:px-10 sm:py-14 lg:max-w-[58%] lg:px-12 lg:py-16 xl:px-14">
            <p className="centres-reveal inline-flex w-fit items-center gap-2 rounded-full border border-[var(--centres-hairline)] bg-[var(--centres-accent-tint)] px-3.5 py-1.5 text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
              {siteConfig.name}
              <span aria-hidden="true" className="text-[var(--centres-ink-muted)]">
                ·
              </span>
              <span className="tracking-[0.08em] normal-case">{city.name}</span>
            </p>

            <h1 className="centres-reveal centres-reveal-delay-1 mt-4 font-display text-[32px] leading-[1.06] font-extrabold tracking-[-0.035em] text-[var(--centres-ink)] xs:text-[38px] sm:mt-5 sm:text-[46px] lg:text-[52px]">
              {centre.name}
              {heroAccent ? (
                <span className="mt-1 block text-[var(--centres-accent-soft)] sm:mt-1.5">
                  {heroAccent}
                </span>
              ) : null}
            </h1>

            {centre.headline ? (
              <p className="centres-reveal centres-reveal-delay-2 mt-4 max-w-[42ch] text-[15px] leading-snug font-semibold text-[var(--centres-ink-secondary)] sm:text-[17px]">
                {centre.headline}
              </p>
            ) : null}

            <p className="centres-reveal centres-reveal-delay-2 mt-4 max-w-[46ch] text-[14.5px] leading-[1.65] text-[var(--centres-ink-secondary)] line-clamp-4 sm:mt-5 sm:text-[15.5px]">
              {introCopy}
            </p>

            <div className="centres-reveal centres-reveal-delay-3 mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={`/enquiry?centre=${centre.slug}` as Route}
                className="group/cta inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--centres-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                Enquire at this centre
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </Link>

              {phoneHref ? (
                <TrackedAnchor
                  href={phoneHref}
                  event="phone_clicked"
                  props={{ centre_slug: centre.slug, type: 'hero' }}
                  className="group/call inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-[var(--centres-accent)] bg-transparent px-5 py-3 text-[15px] font-bold text-[var(--centres-accent-soft)] transition-colors hover:bg-[var(--centres-accent-tint)]"
                >
                  <Phone className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Call {centre.phone}
                </TrackedAnchor>
              ) : null}
            </div>

            <div className="centres-reveal centres-reveal-delay-3 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-[var(--centres-ink-muted)] sm:mt-7">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--centres-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                {localityCityLabel}
              </span>
              <span className="hidden h-3.5 w-px bg-white/20 sm:block" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap
                  className="h-3.5 w-3.5 text-[var(--centres-accent-soft)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {featured.length || offered.length} courses
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why / legacy stats */}
      {showStats ? (
        <section className="shell py-10 sm:py-12 lg:py-14" aria-label="Jetking at a glance">
          <div className="centres-why overflow-hidden rounded-[24px] px-5 py-8 xs:rounded-[28px] sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
              <div className="max-w-md">
                <p className="text-[12px] font-bold tracking-[0.16em] text-[var(--centres-accent-soft)] uppercase">
                  Why Jetking
                </p>
                <h2 className="mt-2 font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[28px]">
                  Learn where industry{' '}
                  <span className="text-[var(--centres-accent-soft)]">actually trains</span>
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6 lg:flex-1">
                {legacyStats(network).map((stat, index) => {
                  const Icon = STAT_ICONS[index] ?? Award;
                  return (
                    <div key={stat.label} className="text-center sm:text-left">
                      <Icon
                        className="mx-auto h-5 w-5 text-[var(--centres-accent-soft)] sm:mx-0"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <dt className="sr-only">{stat.label}</dt>
                      <dd>
                        <span className="numeral mt-2 block font-display text-[22px] leading-none font-extrabold text-[var(--centres-ink)] sm:text-[26px]">
                          {stat.value}
                        </span>
                        <span className="mt-1.5 block text-[12px] leading-snug text-[var(--centres-ink-secondary)]">
                          {stat.label}
                        </span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell py-10 sm:py-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0 space-y-8">
            {/* Featured programmes — student-style course cards */}
            <CentreFeaturedProgrammes
              programmes={featured}
              courses={courses}
              centreSlug={centre.slug}
            />

            {eligibility.length ? (
              <section className="centres-card rounded-[20px] p-5 sm:rounded-[24px] sm:p-7" aria-labelledby="centre-elig">
                <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                  Admissions
                </p>
                <h2
                  id="centre-elig"
                  className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[24px]"
                >
                  Who can apply
                </h2>
                <div className="mt-6 space-y-6">
                  {eligibility.map((block) => (
                    <div key={block.title}>
                      <h3 className="text-[13px] font-bold tracking-[0.06em] text-[var(--centres-accent-soft)] uppercase">
                        {block.title}
                      </h3>
                      <ul className="mt-3 space-y-2.5">
                        {block.items.map((item) => (
                          <li
                            key={item.slice(0, 48)}
                            className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--centres-ink-secondary)]"
                          >
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--centres-accent-soft)]"
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {journey.length ? (
              <section className="centres-card rounded-[20px] p-5 sm:rounded-[24px] sm:p-7" aria-labelledby="centre-journey">
                <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                  Roadmap
                </p>
                <h2
                  id="centre-journey"
                  className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[24px]"
                >
                  Your transformation journey
                </h2>
                <p className="mt-2 text-[14px] text-[var(--centres-ink-muted)]">
                  From beginner to job-ready, step by step.
                </p>
                <ol className="mt-6 space-y-5">
                  {journey.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        className="numeral grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--centres-accent-soft)]/35 bg-[var(--centres-accent-tint)] text-[13px] font-bold text-[var(--centres-accent-soft)]"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-[var(--centres-ink)]">{step.title}</h3>
                        <ul className="mt-2 space-y-1.5">
                          {step.items.map((item) => (
                            <li
                              key={item}
                              className="text-[13.5px] leading-relaxed text-[var(--centres-ink-secondary)]"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/* Catalogue programmes — same card format as student / featured */}
            {featured.length && !moreCourses.length ? null : (
              <CentreCatalogueProgrammes
                courses={featured.length ? moreCourses : offered}
                title={featured.length ? 'More courses at this centre' : 'Courses offered'}
              />
            )}

            {cleanFaculty.length ? (
              <section aria-labelledby="centre-faculty">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                      Mentors
                    </p>
                    <h2
                      id="centre-faculty"
                      className="mt-1.5 font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[28px]"
                    >
                      Our faculty
                    </h2>
                  </div>
                  <span className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--centres-ink-muted)] uppercase">
                    {cleanFaculty.length}
                  </span>
                </div>
                <ul
                  className={`grid gap-4 ${
                    cleanFaculty.length === 1 ? 'w-full max-w-sm' : 'sm:grid-cols-2'
                  }`}
                >
                  {cleanFaculty.map((member) => {
                    const bioLines = member.bio ? facultyBioLines(member.bio) : [];
                    return (
                      <li key={member.name} className="min-w-0">
                        <article className="relative h-full">
                          <div className="centres-clip-shell centres-clip-interactive group/fac">
                            <div className="centres-clip-card flex h-full flex-col overflow-hidden">
                              <div className="flex items-center gap-4 px-4 pt-4 max-sm:pb-1 sm:flex-col sm:gap-0 sm:px-5 sm:pt-6">
                                <div className="centres-clip-media relative h-20 w-20 shrink-0 overflow-hidden sm:h-32 sm:w-32">
                                  {member.photoUrl ? (
                                    <Image
                                      src={member.photoUrl}
                                      alt={member.name}
                                      fill
                                      sizes="128px"
                                      className="object-cover object-top transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/fac:scale-[1.03]"
                                    />
                                  ) : (
                                    <div className="grid h-full w-full place-items-center">
                                      <Users
                                        className="h-10 w-10 text-[var(--centres-accent-soft)] opacity-70"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 sm:mt-4 sm:text-center">
                                  <h3 className="font-display text-[17px] leading-snug font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[18px]">
                                    {member.name}
                                  </h3>
                                  <p className="mt-1 text-[12px] font-bold tracking-[0.06em] text-[var(--centres-accent-soft)] uppercase sm:mt-1.5">
                                    {member.title}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
                                {bioLines.length ? (
                                  <ul className="mt-3 w-full space-y-2 border-t border-[var(--centres-hairline)]/50 pt-3 text-left sm:mt-4">
                                    {bioLines.map((line) => (
                                      <li
                                        key={line.slice(0, 40)}
                                        className="text-[13px] leading-relaxed text-[var(--centres-ink-secondary)]"
                                      >
                                        {line}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {placements.length ? (
              <section aria-labelledby="centre-placements">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                      Outcomes
                    </p>
                    <h2
                      id="centre-placements"
                      className="mt-1.5 font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[28px]"
                    >
                      Recent placements
                    </h2>
                  </div>
                  <span className="numeral text-[12px] font-bold tracking-[0.1em] text-[var(--centres-ink-muted)] uppercase">
                    {placements.length}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {placements.slice(0, 12).map((p) => (
                    <li key={`${p.name}-${p.company}`} className="min-w-0">
                      <article className="relative h-full">
                        <div className="centres-clip-shell centres-clip-interactive group/place">
                          <div className="centres-clip-card flex h-full flex-col overflow-hidden">
                            <div className="flex justify-center pt-4 pb-1 sm:pt-6">
                              <div className="centres-clip-media relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden sm:h-28 sm:w-28">
                                {p.photoUrl ? (
                                  <Image
                                    src={p.photoUrl}
                                    alt={p.name}
                                    fill
                                    sizes="112px"
                                    className="object-cover object-top transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/place:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center">
                                    <span className="font-display text-[20px] font-extrabold text-[var(--centres-accent-soft)]">
                                      {p.name
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((w) => w[0])
                                        .join('')
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col items-center px-3 pt-2.5 pb-3.5 text-center sm:px-5 sm:pt-3 sm:pb-5">
                              <h3 className="font-display text-[14.5px] leading-snug font-extrabold tracking-[-0.02em] break-words text-[var(--centres-ink)] sm:text-[17px]">
                                {p.name}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[var(--centres-ink-muted)] sm:mt-1.5 sm:text-[13px]">
                                {p.company}
                              </p>
                              {p.package && /\d/.test(p.package) ? (
                                <span className="numeral mt-auto pt-3 text-[12px] font-bold tracking-[0.04em] text-[var(--centres-accent-soft)]">
                                  {p.package}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {testimonials.length ? (
              <section aria-labelledby="centre-stories">
                <div className="mb-5">
                  <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                    Voices
                  </p>
                  <h2
                    id="centre-stories"
                    className="mt-1.5 font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[28px]"
                  >
                    Student stories
                  </h2>
                </div>
                <CentreTestimonialSlider testimonials={testimonials} />
              </section>
            ) : null}

            {faqs.length ? (
              <section className="centres-card rounded-[20px] p-5 sm:rounded-[24px] sm:p-7" aria-labelledby="centre-faq">
                <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-accent-soft)] uppercase">
                  Help
                </p>
                <h2
                  id="centre-faq"
                  className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[24px]"
                >
                  Frequently asked questions
                </h2>
                <div className="mt-4 divide-y divide-[var(--centres-accent-soft)]/14">
                  {faqs.map((faq) => (
                    <details key={faq.question} className="group py-4">
                      <summary className="cursor-pointer list-none text-[15px] font-bold text-[var(--centres-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-3">
                          {faq.question}
                          <span
                            aria-hidden="true"
                            className="centres-faq-toggle mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--centres-hairline)] bg-[var(--centres-accent-tint)] text-[var(--centres-accent-soft)]"
                          >
                            <span className="centres-faq-toggle-icon" />
                          </span>
                        </span>
                      </summary>
                      <p className="mt-3 text-[14px] leading-relaxed text-[var(--centres-ink-secondary)]">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {siblings.length ? (
              <section className="centres-card rounded-[20px] p-5 sm:rounded-[24px] sm:p-7">
                <h2 className="font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[22px]">
                  Other centres in {city.name}
                </h2>
                <ul className="mt-4 space-y-1">
                  {siblings.map((sib) => (
                    <li key={sib.slug}>
                      <Link
                        href={centrePath(sib.slug) as Route}
                        className="group/sib flex items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-[var(--centres-accent-soft)]/6"
                      >
                        <span>
                          <span className="block text-[14px] font-bold text-[var(--centres-ink)] group-hover/sib:text-[var(--centres-accent-soft)]">
                            {sib.name}
                          </span>
                          <span className="text-[12.5px] text-[var(--centres-ink-muted)]">
                            {sib.locality}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-[var(--centres-accent-soft)]"
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={cityDirectoryHref}
                  className="tap mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--centres-accent-soft)]"
                >
                  View all {city.name} centres
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                </Link>
              </section>
            ) : (
              <div>
                <Link
                  href={cityDirectoryHref}
                  className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--centres-accent-soft)]"
                >
                  View all {city.name} centres
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* Sticky visit panel */}
          <aside className="centres-card self-start overflow-hidden rounded-[22px] lg:sticky lg:top-28">
            <div className="border-b border-[var(--centres-accent-soft)]/18 bg-linear-160 from-[var(--centres-accent)]/18 to-transparent to-70% px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--centres-ink-muted)] uppercase">
                Visit this centre
              </p>
              <p className="mt-2 font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)]">
                {centre.locality}
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <address className="flex gap-3 text-[14px] leading-relaxed text-[var(--centres-ink-secondary)] not-italic">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--centres-accent-soft)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
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
                className="tap mt-3 ml-7 inline-flex items-center gap-1.5 rounded-full border border-[var(--centres-hairline)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--centres-accent-soft)] transition-colors hover:border-[var(--centres-accent-soft)] hover:bg-[var(--centres-accent-tint)]"
              >
                <Navigation className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                Open in Google Maps
                <span className="sr-only"> (opens in a new tab)</span>
              </a>

              {centre.phone ? (
                <div className="mt-5 flex gap-3 border-t border-[var(--centres-accent-soft)]/18 pt-5">
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--centres-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--centres-ink-muted)] uppercase">
                      Phone
                    </p>
                    {phoneHref ? (
                      <TrackedAnchor
                        href={phoneHref}
                        event="phone_clicked"
                        props={{ centre_slug: centre.slug }}
                        className="tap numeral mt-0.5 block text-[15px] font-semibold text-[var(--centres-ink)] transition-colors hover:text-[var(--centres-accent-soft)]"
                      >
                        {centre.phone}
                      </TrackedAnchor>
                    ) : (
                      <p className="numeral mt-0.5 text-[15px] font-semibold text-[var(--centres-ink)]">
                        {centre.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {centre.helpline ? (
                <div className="mt-4 flex gap-3">
                  <Headphones
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--centres-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--centres-ink-muted)] uppercase">
                      Admissions helpline
                    </p>
                    {helplineHref ? (
                      <TrackedAnchor
                        href={helplineHref}
                        event="phone_clicked"
                        props={{ centre_slug: centre.slug, type: 'helpline' }}
                        className="tap numeral mt-0.5 block text-[15px] font-semibold text-[var(--centres-ink)] transition-colors hover:text-[var(--centres-accent-soft)]"
                      >
                        {centre.helpline}
                      </TrackedAnchor>
                    ) : (
                      <p className="numeral mt-0.5 text-[15px] font-semibold text-[var(--centres-ink)]">
                        {centre.helpline}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {centre.email ? (
                <div className="mt-4 flex gap-3">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--centres-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--centres-ink-muted)] uppercase">
                      Email
                    </p>
                    <a
                      href={`mailto:${centre.email}`}
                      className="tap mt-0.5 block text-[15px] font-semibold text-[var(--centres-ink)] transition-colors hover:text-[var(--centres-accent-soft)]"
                    >
                      {centre.email}
                    </a>
                  </div>
                </div>
              ) : null}

              <Link
                href={`/enquiry?centre=${centre.slug}` as Route}
                className="group/enq mt-7 inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-full bg-[var(--centres-accent)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700"
              >
                <span>Enquire about this centre</span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/enq:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </Link>

              <Link
                href={'/centres' as Route}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--centres-hairline)] px-5 py-2.5 text-[14px] font-bold text-[var(--centres-ink)] transition-colors hover:border-[var(--centres-accent-soft)]/70 hover:bg-[var(--centres-accent-tint)]"
              >
                Back to all centres
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom CTA band */}
      <section className="shell py-14 sm:py-16 lg:py-20">
        <div className="centres-cta-band relative overflow-hidden rounded-[24px] px-6 py-10 xs:rounded-[28px] sm:px-10 sm:py-12 lg:px-12">
          <span
            aria-hidden="true"
            className="centres-float-chip absolute top-6 right-6 hidden items-center gap-2 rounded-2xl px-3.5 py-2 text-[12px] font-bold text-[var(--centres-accent-soft)] sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Placement support
          </span>
          <h2 className="max-w-[20ch] font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--centres-ink)] sm:text-[32px]">
            Ready to visit{' '}
            <span className="text-[var(--centres-accent-soft)]">{centre.locality}</span>?
          </h2>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-[var(--centres-ink-secondary)]">
            Talk to a counsellor about batches, fees and the right course for your goals at this
            centre.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/enquiry?centre=${centre.slug}` as Route}
              className="group/cta inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--centres-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
            >
              Book a counselling call
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </Link>
            {phoneHref ? (
              <TrackedAnchor
                href={phoneHref}
                event="phone_clicked"
                props={{ centre_slug: centre.slug, type: 'footer' }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--centres-hairline)] px-5 py-3 text-[14.5px] font-bold text-[var(--centres-ink)] transition-colors hover:border-[var(--centres-accent-soft)]/60 hover:bg-[var(--centres-accent-tint)]"
              >
                <Phone className="h-4 w-4 text-[var(--centres-accent-soft)]" strokeWidth={2} aria-hidden="true" />
                {centre.phone}
              </TrackedAnchor>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
