import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminPoliciesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="policies" searchParams={searchParams} />;
}
