import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { JsonLd, type Crumb } from '@/components/ui';
import { notFound } from 'next/navigation';
import { content } from '@/lib/content';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { legalCopy } from '@/lib/content/copy/pages/legal';
import { loadCopy } from '@/lib/content/copy/load';
import { seoFromCopy } from '@/lib/content/copy/seo';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(legalCopy);
  return buildMetadata(seoFromCopy(copy, undefined, 'enrollment.seo'), '/enrollment-terms-and-conditions');
}

export default async function EnrollmentTermsPage() {
  const copy = await loadCopy(legalCopy);
  const trail: Crumb[] = [
    { name: copy['labels.breadcrumbHome'], path: '/' },
    { name: copy['enrollment.breadcrumb'], path: '/enrollment-terms-and-conditions' },
  ];
  // Legal wording is CMS content (`legal_documents`); the in-repo copy is the fallback.
  const doc = await content.getLegalDocument('enrollment-terms-and-conditions');
  if (!doc) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <LegalDocument
        doc={doc}
        trail={trail}
        path="/enrollment-terms-and-conditions"
        intro={copy['enrollment.intro']}
        copy={copy}
      />
    </>
  );
}
