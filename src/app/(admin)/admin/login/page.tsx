import { adminLogin, isAdminAuthenticated } from '../actions';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { BookOpenCheck, History, ShieldCheck, Users } from 'lucide-react';
import { isDatabaseConfigured } from '@/lib/auth/users';
import { LoginForm } from './LoginForm';

const HIGHLIGHTS = [
  { icon: BookOpenCheck, title: 'Content', text: 'Courses, centres, posts and FAQs, published to the live site.' },
  { icon: Users, title: 'Leads', text: 'Every enquiry in one pipeline, scoped to the centre.' },
  { icon: ShieldCheck, title: 'Access', text: 'Role-based accounts for admins, editors and centre staff.' },
  { icon: History, title: 'Audit', text: 'A record of every save, status change and team change.' },
];

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin' as Route);
  const multiUser = isDatabaseConfigured();

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel — dark chrome carries the identity; the form stays on calm white. */}
      <section
        aria-label="Jetking Admin Console"
        className="adm-hero flex flex-col justify-between gap-10 rounded-none! shadow-none! px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14"
      >
        <span className="adm-sidebar-mark w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
          <img
            src="/brand/jetking-wordmark.png"
            alt="Jetking"
            draggable={false}
            className="h-6 w-auto shrink-0 select-none object-contain"
          />
        </span>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.12em] text-white/85 uppercase">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f97066]" />
            Admin Console
          </p>
          <p className="mt-5 max-w-md text-[1.75rem] leading-[1.1] font-extrabold tracking-[-0.03em] text-white sm:text-[2.25rem] lg:text-[2.5rem]">
            Everything behind the Jetking website, in one place.
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
            Manage content, centres, leads and platform operations.
          </p>

          <ul className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/10 text-white">
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-3 text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-[13px] leading-snug text-white/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">&copy; {new Date().getFullYear()} Jetking. Staff access only.</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <p className="adm-eyebrow">Welcome back</p>
          <h1 className="adm-title mt-3">Sign in to Admin</h1>
          <p className="mt-2 text-sm text-foreground-secondary">
            {multiUser ? 'Sign in with your staff account.' : 'Enter the staff password to continue.'}
          </p>

          <LoginForm action={adminLogin} multiUser={multiUser} />
        </div>
      </section>
    </div>
  );
}
