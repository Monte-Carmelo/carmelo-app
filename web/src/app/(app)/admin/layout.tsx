import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminShell } from '@/components/admin/AdminShell';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.user.id)
    .maybeSingle() as { data: { is_admin: boolean } | null };

  if (!user?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <AdminShell>
      {children}
      <Toaster />
    </AdminShell>
  );
}
