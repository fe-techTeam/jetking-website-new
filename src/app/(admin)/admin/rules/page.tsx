import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminRulesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="persona_rules" searchParams={searchParams} />;
}
