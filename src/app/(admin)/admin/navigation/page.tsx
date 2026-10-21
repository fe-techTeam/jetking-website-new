import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminNavigationPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="site_navigation" searchParams={searchParams} />;
}
