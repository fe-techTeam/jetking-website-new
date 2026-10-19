import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminChatbotSettingsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <AdminCollectionPage collection="chatbot_settings" searchParams={searchParams} />;
}
