import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminPlacementsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="placements" searchParams={searchParams} />;
}
