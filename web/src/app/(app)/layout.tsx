import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session-context';
import { AppShell } from '@/components/layout/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Use getUser() for secure authentication check
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  // Get additional user data
  const supabase = await createSupabaseServerClient();
  const { data: roles } = await supabase
    .from('user_gc_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Create session-compatible object for context
  const sessionValue = {
    session: {
      user: JSON.parse(JSON.stringify(user)),
      access_token: '', // Not needed for most operations
      refresh_token: '',
      expires_at: 0,
      expires_in: 0,
      token_type: 'bearer',
    },
    roles: roles ?? null,
  } as const;

  return (
    <SessionProvider value={sessionValue}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

