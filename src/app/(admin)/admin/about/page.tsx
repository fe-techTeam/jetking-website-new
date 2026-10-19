import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminAboutPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="about_page" searchParams={searchParams} />;
}
