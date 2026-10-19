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
      title: copy['terms.seo.title'],
      description: copy['terms.seo.description'],
    },
    '/terms-conditions',
  );
}

export default async function TermsConditionsPage() {
  const copy = await loadCopy(legalCopy);
  const trail: Crumb[] = [
    { name: copy['labels.breadcrumbHome'], path: '/' },
    { name: copy['terms.breadcrumb'], path: '/terms-conditions' },
  ];
  // Legal wording is CMS content (`legal_documents`); the in-repo copy is the fallback.
  const doc = await content.getLegalDocument('terms-conditions');
  if (!doc) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <LegalDocument
        doc={doc}
        trail={trail}
        path="/terms-conditions"
        intro={copy['terms.intro']}
        copy={copy}
      />
    </>
  );
}
