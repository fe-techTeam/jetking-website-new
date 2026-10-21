import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { ResetPasswordForm } from './ResetPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await buildMetadata(
      { title: 'Choose a new password', description: 'Set a new password for your Jetking account.', noindex: true },
      '/account/reset-password',
    )),
    // The link carries a one-time token: never leak it to another site through the Referer header.
    referrer: 'no-referrer',
  };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <section className="shell pt-12 pb-20 sm:pt-16">
      <h1 className="page-title-sm font-display text-foreground">Choose a new password</h1>
      <ResetPasswordForm token={typeof token === 'string' ? token : ''} />
    </section>
  );
}
