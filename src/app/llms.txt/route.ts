import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { FOUNDED_YEAR } from '@/lib/brand-facts';
import { absoluteUrl, siteConfig } from '@/lib/site';

/**
 * /llms.txt (llmstxt.org): a plain-Markdown brief that AI assistants and answer engines read
 * to understand the site and pick the right page to cite. Generated from the content source,
 * like sitemap.xml, so it cannot drift from what the site actually publishes. It states only
 * what the pages themselves state: no fees, salaries or placement percentages.
 */
export const dynamic = 'force-static';

const LEVEL_LABEL = {
  degree: 'Degree',
  diploma: 'Diploma',
  certification: 'Certification',
  short: 'Short course',
} as const;

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

export async function GET() {
  const [courses, centres, cities, faqs] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listCities(),
    content.listFaqs(),
  ]);

  const cityName = new Map(cities.map((city) => [city.slug, city]));
  const centresByCity = new Map<string, typeof centres>();
  for (const centre of centres) {
    const list = centresByCity.get(centre.citySlug) ?? [];
    list.push(centre);
    centresByCity.set(centre.citySlug, list);
  }
  const cityGroups = [...centresByCity.entries()].sort(([a], [b]) =>
    (cityName.get(a)?.name ?? a).localeCompare(cityName.get(b)?.name ?? b),
  );

  const lines: string[] = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.description}`,
    '',
    `${siteConfig.name} (${siteConfig.legalName}) is an Indian IT training institute founded in ${FOUNDED_YEAR}. ` +
      `It runs ${centres.length} learning centres in ${centresByCity.size} cities and offers ${courses.length} programmes, ` +
      'from 3-year BCA degrees to short certification courses, with placement assistance.',
    '',
    'Key facts:',
    `- Founded: ${FOUNDED_YEAR}`,
    `- Legal name: ${siteConfig.legalName}`,
    `- Centres: ${centres.length} in ${centresByCity.size} cities across India`,
    '- Subjects: cloud computing, cyber security, ethical hacking, networking, IT infrastructure, DevOps, data analytics, AI',
    '- Delivery: offline at Jetking centres or hybrid, with lab work',
    '- Fees: vary by centre and intake; EMI options exist. Exact fees come from a counsellor, not the website.',
    `- National helpline: ${siteConfig.helpline}`,
    `- Enquiries: ${absoluteUrl('/enquiry')}`,
    '',
    '## Courses',
    '',
    ...courses.map(
      (course) =>
        `- [${course.title}](${absoluteUrl(`/courses/${course.slug}`)}): ${LEVEL_LABEL[course.level]}, ${course.duration}. ` +
        oneLine(course.seo.description) +
        (course.eligibility && !/eligib/i.test(course.seo.description)
          ? ` Eligibility: ${oneLine(course.eligibility)}`
          : ''),
    ),
    '',
    '## Centres',
    '',
    ...cityGroups.map(([citySlug, list]) => {
      const city = cityName.get(citySlug);
      const links = list.map((centre) => `[${centre.name}](${absoluteUrl(centrePath(centre.slug))})`).join(', ');
      return `- ${city?.name ?? citySlug}${city?.state ? `, ${city.state}` : ''}: ${links}`;
    }),
    '',
    '## Key pages',
    '',
    `- [All courses](${absoluteUrl('/courses')}): the full catalogue, filterable by level and subject`,
    `- [Find a centre](${absoluteUrl('/centres')}): every centre with address, phone and courses offered`,
    `- [Placement support](${absoluteUrl('/placements')}): what placement assistance includes`,
    `- [For students](${absoluteUrl('/student')}): choosing a first IT course and career path`,
    `- [For parents](${absoluteUrl('/parent')}): placements, fees and what to ask an institute`,
    `- [For working professionals](${absoluteUrl('/professional')}): upskilling and career switches`,
    `- [About Jetking](${absoluteUrl('/about-us')}): history and leadership`,
    `- [Franchise](${absoluteUrl('/franchise')}): opening a Jetking centre`,
    `- [Investors](${absoluteUrl('/investors')}): SEBI LODR disclosures, results and reports`,
    `- [FAQ](${absoluteUrl('/faq')}): answers to common questions`,
    `- [Blog](${absoluteUrl('/blog')}): career guidance and IT explainers`,
    '',
    '## Frequently asked questions',
    '',
    ...faqs.flatMap((faq) => [`### ${oneLine(faq.question)}`, '', oneLine(faq.answer), '']),
    '## Optional',
    '',
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`,
    `- [Privacy policy](${absoluteUrl('/privacy-policy')})`,
    `- [Terms and conditions](${absoluteUrl('/terms-conditions')})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
