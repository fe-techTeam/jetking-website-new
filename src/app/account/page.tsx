import type { Metadata } from 'next';
import { buildMetadata, pathForcedNoindex } from '@/lib/seo';
import { AccountView } from './AccountView';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: 'Your Jetking Account',
      description: 'Your Jetking details and saved Jetking AI chats.',
      noindex: await pathForcedNoindex('/account'),
    },
    '/account',
  );
}

export default function AccountPage() {
  return (
    <section className="shell pt-12 pb-20 sm:pt-16">
      <h1 className="page-title-sm font-display text-foreground">
        Your account
      </h1>
      <AccountView />
    </section>
  );
}
