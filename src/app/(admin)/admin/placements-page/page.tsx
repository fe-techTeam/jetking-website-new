import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminPlacementsPagePage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="placements_page" searchParams={searchParams} />;
}
