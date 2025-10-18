import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { Loading } from '@/components/ui/spinner';

type UserRoleRow = Database['public']['Views']['user_gc_roles']['Row'];

type UserDetailRow = {
  id: string;
  person_id: string;
  people: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

async function AdminUsersContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [rolesResult, userDetailsResult] = await Promise.all([
    supabase
      .from('user_gc_roles')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('users')
      .select('id, person_id, people:person_id ( id, name, email, phone )')
      .is('deleted_at', null),
  ]);

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  if (userDetailsResult.error) {
    throw userDetailsResult.error;
  }

  const detailsMap = new Map(
    (userDetailsResult.data as UserDetailRow[]).map((row) => [row.id, row.people]),
  );

  const summaries = (rolesResult.data as UserRoleRow[]).map((user) => {
    const person = user.user_id ? detailsMap.get(user.user_id) : null;

    return {
      id: user.user_id ?? '',
      name: person?.name ?? user.name ?? 'Sem nome',
      email: person?.email ?? user.email,
      phone: person?.phone ?? null,
      isAdmin: user.is_admin ?? false,
      isLeader: user.is_leader ?? false,
      isSupervisor: user.is_supervisor ?? false,
      isCoordinator: user.is_coordinator ?? false,
      gcsLed: user.gcs_led ?? 0,
      gcsSupervised: user.gcs_supervised ?? 0,
      directSubordinates: user.direct_subordinates ?? 0,
    };
  });

  return <AdminUserList currentUserId={session.user.id} users={summaries} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading message="Carregando..." />}>
      <AdminUsersContent />
    </Suspense>
  );
}
