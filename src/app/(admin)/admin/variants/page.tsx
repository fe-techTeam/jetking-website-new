import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminVariantsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="homepage_variants" searchParams={searchParams} />;
}
