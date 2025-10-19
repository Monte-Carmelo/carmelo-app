import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminGrowthGroupFormClient } from './AdminGrowthGroupFormClient';
import { Loading } from '@/components/ui/spinner';

async function AdminGrowthGroupNewContent() {
  const supabase = await createSupabaseServerClient();

  // Fetch users for selects
  const { data: usersData, error } = await supabase
    .from('users')
    .select(`
      id,
      people:person_id (
        name
      )
    `)
    .is('deleted_at', null)
    .order('people(name)', { ascending: true });

  if (error) {
    throw error;
  }

  const users = (usersData || [])
    .filter((u) => u.people)
    .map((u) => ({
      id: u.id,
      name: u.people!.name,
    }));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Novo Grupo de Crescimento</h1>
        <p className="text-slate-600 mt-1">Preencha os dados para criar um novo GC</p>
      </div>

      <AdminGrowthGroupFormClient users={users} />
    </div>
  );
}

export default function AdminGrowthGroupNewPage() {
  return (
    <Suspense fallback={<Loading message="Carregando formulário..." />}>
      <AdminGrowthGroupNewContent />
    </Suspense>
  );
}
