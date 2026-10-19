import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminInvestorsPagePage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="investors_page" searchParams={searchParams} />;
}
