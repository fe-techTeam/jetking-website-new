import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminLegalPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="legal_documents" searchParams={searchParams} />;
}
