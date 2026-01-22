import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { AdminUserCreateForm } from '@/components/admin/AdminUserCreateForm';
import { Loading } from '@/components/ui/spinner';

async function AdminNewUserContent() {
  const user = await getAuthenticatedUser();

  if (!user) {
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
