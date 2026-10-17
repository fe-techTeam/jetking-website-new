import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminCitiesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="cities" searchParams={searchParams} />;
}
