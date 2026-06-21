import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminUserList, type AdminUserSummary } from '@/components/admin/AdminUserList';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { Loading } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';

async function AdminUsersContent() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const [rolesResult, phonesResult] = await Promise.all([
    supabase
      .from('user_gc_roles')
      .select(
        'user_id, name, email, is_admin, is_leader, is_supervisor, is_coordinator, gcs_led, gcs_supervised, direct_subordinates',
      )
      .order('name', { ascending: true }),
    supabase
      .from('users')
      .select('id, people:person_id ( phone )')
      .is('deleted_at', null),
  ]);

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  if (phonesResult.error) {
    throw phonesResult.error;
  }

  const phoneByUserId = new Map(
    (phonesResult.data || [])
      .filter((u) => Boolean(u.id))
      .map((u) => {
        const people = u.people as { phone?: string | null } | null;
        return [u.id, people?.phone ?? null] as [string, string | null];
      }),
  );

  const users: AdminUserSummary[] = (rolesResult.data || [])
    .filter((row) => Boolean(row.user_id))
    .map((row) => ({
      id: row.user_id as string,
      name: row.name || 'Nome não definido',
      email: row.email || null,
      phone: phoneByUserId.get(row.user_id as string) ?? null,
      isAdmin: row.is_admin ?? false,
      isLeader: row.is_leader ?? false,
      isSupervisor: row.is_supervisor ?? false,
      isCoordinator: row.is_coordinator ?? false,
      gcsLed: row.gcs_led ?? 0,
      gcsSupervised: row.gcs_supervised ?? 0,
      directSubordinates: row.direct_subordinates ?? 0,
    }));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <ScreenHeader
        eyebrow="Gestão"
        title="Usuários"
        subtitle="Pessoas com acesso ao sistema e seus papéis"
        action={
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </Link>
        }
      />

      <AdminUserList currentUserId={user.id} users={users} />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Loading message="Carregando usuários..." />}>
      <AdminUsersContent />
    </Suspense>
  );
}
