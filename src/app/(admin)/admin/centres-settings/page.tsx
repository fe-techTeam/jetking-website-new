import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminCentresSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  return <AdminCollectionPage collection="centres_settings" searchParams={searchParams} />;
}
