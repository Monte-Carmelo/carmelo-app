import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session-provider';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const { data: roles } = await supabase
    .from('user_gc_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <SessionProvider initialUser={user} initialRoles={roles ?? null}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
