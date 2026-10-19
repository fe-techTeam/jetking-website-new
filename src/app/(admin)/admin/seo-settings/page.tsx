import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminSeoSettingsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="seo_settings" searchParams={searchParams} />;
}
