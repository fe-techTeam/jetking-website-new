import { content } from '@/lib/content';
import { franchiseCopy } from '@/lib/content/copy/pages/franchise';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';
import { breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { loadHomeData } from '@/components/home/data';
import { FranchiseLandingLight } from '@/components/franchise/FranchiseLandingLight';
import { FranchiseViewTracker } from './FranchiseViewTracker';

export async function generateMetadata() {
  return pageMetadata(franchiseCopy, '/franchise');
}

export default async function FranchisePage() {
  const copy = await loadCopy(franchiseCopy);
  const home = await loadHomeData();
  const faqs = await content.listFaqs();
  const franchiseVariant =
    home.variants.find((v) => v.id === 'franchise') ??
    home.variants.find((v) => v.id === 'default') ??
    home.variants[0];
  const testimonials = franchiseVariant?.testimonials ?? [];
  const franchiseFaqs = faqs.filter((f) => f.topic === 'franchise');

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: copy['breadcrumb.name'], path: '/franchise' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <FranchiseViewTracker />
      <FranchiseLandingLight copy={copy} testimonials={testimonials} faqs={franchiseFaqs} />
    </>
  );
}
