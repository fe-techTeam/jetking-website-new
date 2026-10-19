import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminCentresPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="centres" searchParams={searchParams} />;
}
