import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminUserCreateForm } from '@/components/admin/AdminUserCreateForm';

async function AdminNewUserContent() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: supervisorRows, error } = await supabase
    .from('user_gc_roles')
    .select('user_id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  const supervisors = (supervisorRows ?? []).map((row) => ({
    id: row.user_id,
    name: row.name,
  }));

  return <AdminUserCreateForm supervisors={supervisors} />;
}

export default function AdminNewUserPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando formulário...</div>}>
      <AdminNewUserContent />
    </Suspense>
  );
}
