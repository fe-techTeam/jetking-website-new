import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminFaqsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="faqs" searchParams={searchParams} />;
}
