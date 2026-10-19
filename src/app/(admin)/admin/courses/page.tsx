import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="courses" searchParams={searchParams} />;
}
