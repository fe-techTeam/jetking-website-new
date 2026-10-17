import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminFacultyPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="faculty" searchParams={searchParams} />;
}
