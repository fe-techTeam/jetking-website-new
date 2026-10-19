import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { JsonLd, type Crumb } from '@/components/ui';
import { notFound } from 'next/navigation';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { legalCopy } from '@/lib/content/copy/pages/legal';
import { loadCopy } from '@/lib/content/copy/load';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(legalCopy);
  return buildMetadata(
    {
      title: copy['privacy.seo.title'],
      description: copy['privacy.seo.description'],
    },
    '/privacy-policy',
  );
}

export default async function PrivacyPolicyPage() {
  const copy = await loadCopy(legalCopy);
  const trail: Crumb[] = [
    { name: copy['labels.breadcrumbHome'], path: '/' },
    { name: copy['privacy.breadcrumb'], path: '/privacy-policy' },
  ];
  // Legal wording is CMS content (`legal_documents`); the in-repo copy is the fallback.
  const doc = await content.getLegalDocument('privacy-policy');
  if (!doc) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <LegalDocument
        doc={doc}
        trail={trail}
        path="/privacy-policy"
        intro={copy['privacy.intro']}
        copy={copy}
      />
    </>
  );
}
