import { requireAccess } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { isDatabaseConfigured } from '@/lib/db/client';
import { listUnanswered } from '../chatbot/actions';
import { QuestionsList } from './QuestionsList';

export const metadata = { title: 'Unanswered questions | Jetking Admin' };
export const dynamic = 'force-dynamic';

export default async function UnansweredPage() {
  await requireAccess('chatbot', 'view');
  const open = await listUnanswered(false);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Chatbot"
        title="Unanswered questions"
        description="Questions visitors asked that nothing on the website answered. Each one is a gap: add the answer to the right page, or write a Custom answer here and rebuild the assistant’s knowledge."
      />
      {isDatabaseConfigured() ? (
        <QuestionsList initial={open} />
      ) : (
        <p className="adm-card mt-6 p-5 text-sm text-foreground-secondary">Unanswered questions are stored in the database — set DATABASE_URL to collect them.</p>
      )}
    </div>
  );
}
