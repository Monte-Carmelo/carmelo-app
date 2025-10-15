'use client';

import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export interface SessionContextValue {
  session: Session;
  roles: Database['public']['Views']['user_gc_roles']['Row'] | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  value: SessionContextValue;
  children: React.ReactNode;
}

export function SessionProvider({ value, children }: SessionProviderProps) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider.');
  }

  return context;
}
