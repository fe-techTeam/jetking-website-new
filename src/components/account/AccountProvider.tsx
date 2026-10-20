'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteAccount } from './use-site-account';
import type { SiteUser } from '@/lib/users/types';
import { SiteAuthDialog, type AuthMode } from './SiteAuthDialog';

interface AccountContextValue {
  /** The signed-in visitor, or `null` for a guest. */
  user: SiteUser | null;
  /** False until the first "who am I" answer, so callers don't flash a Log in button at a signed-in user. */
  ready: boolean;
  /** Opens the site's Log in / Sign up dialog. */
  openAuth: (mode?: AuthMode) => void;
  logout: () => Promise<void>;
}

const noop: AccountContextValue = {
  user: null,
  ready: true,
  openAuth: () => undefined,
  logout: async () => undefined,
};

const AccountContext = createContext<AccountContextValue>(noop);

/** The site's account state. Outside the provider it reads as a guest, so a component never has to guard for it. */
export function useAccount(): AccountContextValue {
  return useContext(AccountContext);
}

/**
 * Shared visitor account for the public site. Inert on /admin (staff use a
 * different login). On /chatbot the Jetking AI UI drives the same `/api/users/auth`
 * session via `use-chat-account`, so this provider stays off there to avoid two
 * auth dialogs — the cookie is still shared.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = !pathname.startsWith('/admin') && !pathname.startsWith('/chatbot');
  const account = useSiteAccount({ enabled });
  const [dialog, setDialog] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: 'login' });

  const { user, ready, logout } = account;
  const openAuth = useCallback((mode: AuthMode = 'login') => setDialog({ open: true, mode }), []);

  const value = useMemo<AccountContextValue>(
    () => ({ user, ready, openAuth, logout }),
    [user, ready, openAuth, logout],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
      {enabled && dialog.open ? (
        <SiteAuthDialog
          mode={dialog.mode}
          onModeChange={(mode) => setDialog({ open: true, mode })}
          onClose={() => setDialog((d) => ({ ...d, open: false }))}
          account={account}
        />
      ) : null}
    </AccountContext.Provider>
  );
}
