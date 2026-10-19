import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="announcements" searchParams={searchParams} />;
}
