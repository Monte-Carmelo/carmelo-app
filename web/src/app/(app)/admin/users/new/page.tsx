import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminUserCreateForm } from '@/components/admin/AdminUserCreateForm';
import { Loading } from '@/components/ui/spinner';

async function AdminNewUserContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <AdminUserCreateForm />;
}

export default function AdminNewUserPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminNewUserContent />
    </Suspense>
  );
}
