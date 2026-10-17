import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminLogoListsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="logo_lists" searchParams={searchParams} />;
}
