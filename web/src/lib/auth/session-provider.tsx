'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionProvider as SessionContextProvider, type SessionContextValue } from './session-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

type UserRoles = Database['public']['Views']['user_gc_roles']['Row'] | null;

interface SessionProviderProps {
  initialUser: User;
  initialRoles: UserRoles;
  children: React.ReactNode;
}

export function SessionProvider({ initialUser, initialRoles, children }: SessionProviderProps) {
  const [user, setUser] = useState<User>(initialUser);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!currentSession) {
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      roles: initialRoles,
    }),
    [initialRoles, user],
  );

  return <SessionContextProvider value={value}>{children}</SessionContextProvider>;
}
