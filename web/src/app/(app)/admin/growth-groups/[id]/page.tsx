import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminGrowthGroupEditClient } from './AdminGrowthGroupEditClient';
import { Loading } from '@/components/ui/spinner';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function AdminGrowthGroupEditContent({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch the GC with participants
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .select(`
      id,
      name,
      mode,
      status,
      address,
      weekday,
      time,
      growth_group_participants (
        id,
        role,
        status,
        person_id
      )
    `)
    .eq('id', id)
    .single();

  if (gcError || !gc) {
    notFound();
  }

  // Fetch all users for selects (with person_id mapping)
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      person_id,
      people:person_id (
        name
      )
    `)
    .is('deleted_at', null)
    .order('people(name)', { ascending: true });

  if (usersError) {
    throw usersError;
  }

  const users = (usersData || [])
    .filter((u) => u.people)
    .map((u) => ({
      id: u.id,
      name: u.people!.name,
    }));

  // Create person_id to user_id mapping
  const personIdToUserId = new Map(
    (usersData || []).map((u) => [u.person_id, u.id])
  );

  // Extract leader and supervisor IDs from participants
  const participants = gc.growth_group_participants || [];
  const leaderIds = participants
    .filter((p) => p.role === 'leader')
    .map((p) => personIdToUserId.get(p.person_id))
    .filter((id): id is string => !!id);
  const supervisorIds = participants
    .filter((p) => p.role === 'supervisor')
    .map((p) => personIdToUserId.get(p.person_id))
    .filter((id): id is string => !!id);

  const gcData = {
    id: gc.id,
    name: gc.name,
    mode: gc.mode as 'in_person' | 'online' | 'hybrid',
    address: gc.address || '',
    weekday: gc.weekday,
    time: gc.time || '',
    leaderIds,
    supervisorIds,
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Editar Grupo de Crescimento</h1>
        <p className="text-slate-600 mt-1">Atualize as informações do GC</p>
      </div>

      <AdminGrowthGroupEditClient gc={gcData} users={users} />
    </div>
  );
}

export default function AdminGrowthGroupEditPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando GC..." />}>
      <AdminGrowthGroupEditContent params={params} />
    </Suspense>
  );
}
