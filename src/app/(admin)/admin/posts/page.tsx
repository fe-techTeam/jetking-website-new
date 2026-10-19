import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminPostsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="posts" searchParams={searchParams} />;
}
