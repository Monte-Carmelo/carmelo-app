'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SessionProvider as SessionContextProvider, type SessionContextValue } from './session-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

type UserRoles = Database['public']['Views']['user_gc_roles']['Row'] | null;

interface SessionProviderProps {
  initialSession: Session;
  initialRoles: UserRoles;
  children: React.ReactNode;
}

export function SessionProvider({ initialSession, initialRoles, children }: SessionProviderProps) {
  const [session, setSession] = useState<Session>(initialSession);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      roles: initialRoles,
    }),
    [initialRoles, session],
  );

  return <SessionContextProvider value={value}>{children}</SessionContextProvider>;
}
