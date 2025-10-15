import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session-context';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: roles } = await supabase
    .from('user_gc_roles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const sessionValue = {
    session: JSON.parse(JSON.stringify(session)),
    roles: roles ?? null,
  } as const;

  return (
    <SessionProvider value={sessionValue}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

