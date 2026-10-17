import { AdminCollectionPage } from '../AdminCollectionPage';

export default function AdminChatbotKnowledgePage({ searchParams }: { searchParams: Promise<{ open?: string; question?: string }> }) {
  return <AdminCollectionPage collection="chatbot_knowledge" searchParams={searchParams} />;
}
