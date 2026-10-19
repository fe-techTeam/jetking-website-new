import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminTrustSignalsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="trust_signals" searchParams={searchParams} />;
}
