import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { loadHomeData } from '@/components/home/data';
import { FranchiseLandingLight } from '@/components/franchise/FranchiseLandingLight';
import { FranchiseViewTracker } from './FranchiseViewTracker';

export const metadata: Metadata = buildMetadata(
  {
    title: `Own a Jetking Franchise | India's Leading IT Training Brand`,
    description:
      'Build your future with a Jetking IT training franchise. Established brand, proven business model, end-to-end support, and attractive ROI. Investment from ₹15 Lakhs.',
  },
  '/franchise',
);

export default async function FranchisePage() {
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
    { name: 'Franchise', path: '/franchise' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <FranchiseViewTracker />
      <FranchiseLandingLight testimonials={testimonials} faqs={franchiseFaqs} />
    </>
  );
}
