import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminUserProfileForm } from '@/components/admin/AdminUserProfileForm';
import { AdminUserAssignments } from '@/components/admin/AdminUserAssignments';

interface AdminUserPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type UserRow = {
  id: string;
  person_id: string;
  is_admin: boolean;
  hierarchy_parent_id: string | null;
  people: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignments: {
    id: string;
    gc_id: string;
    role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
    status: Database['public']['Tables']['growth_group_participants']['Row']['status'];
    deleted_at: string | null;
    growth_groups: {
      id: string;
      name: string;
    } | null;
  }[];
};

type RoleRow = Database['public']['Views']['user_gc_roles']['Row'];

type GrowthGroupRow = Database['public']['Tables']['growth_groups']['Row'];

async function AdminUserDetailContent({ userId, searchParams }: { userId: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [userResult, groupsResult, rolesResult] = await Promise.all([
    supabase
      .from('users')
      .select(
        `id, person_id, is_admin, hierarchy_parent_id,
         people:person_id ( id, name, email, phone ),
         assignments:growth_group_participants!growth_group_participants_person_id_fkey (
           id, gc_id, role, status, deleted_at,
           growth_groups ( id, name )
         )`
      )
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('growth_groups')
      .select('id, name, status')
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    supabase
      .from('user_gc_roles')
      .select('*')
      .order('name', { ascending: true }),
  ]);

  if (userResult.error) {
    throw userResult.error;
  }

  if (!userResult.data) {
    notFound();
  }

  const user = userResult.data as UserRow;
  const person = user.people;

  if (!person) {
    throw new Error('Registro de pessoa não encontrado para o usuário.');
  }

  if (groupsResult.error) {
    throw groupsResult.error;
  }

  if (rolesResult.error) {
    throw rolesResult.error;
  }

  const activeAssignments = (user.assignments ?? [])
    .filter((assignment) => assignment.status === 'active' && assignment.deleted_at === null)
    .map((assignment) => ({
      assignmentId: assignment.id,
      gcId: assignment.gc_id,
      gcName: assignment.growth_groups?.name ?? 'GC desconhecido',
      role: assignment.role as 'leader' | 'co_leader' | 'supervisor' | 'member',
    }));

  const availableGroups = (groupsResult.data as GrowthGroupRow[]).map((group) => ({
    id: group.id,
    name: group.name,
  }));

  const roleRows = rolesResult.data as RoleRow[];
  const roleSummary = roleRows.find((row) => row.user_id === userId);
  const supervisors = roleRows.map((row) => ({ id: row.user_id ?? '', name: row.name ?? 'Sem nome' }));

  const roleBadges: string[] = [];
  if (user.is_admin) roleBadges.push('Admin');
  if (roleSummary?.is_leader) roleBadges.push('Líder');
  if (roleSummary?.is_supervisor) roleBadges.push('Supervisor');
  if (roleSummary?.is_coordinator) roleBadges.push('Coordenador');

  const resolvedParams = await searchParams;
  const createdRecently = resolvedParams.created === 'true';

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{person.name}</h1>
          <p className="text-sm text-slate-600">
            {person.email ?? 'Sem e-mail'} • {person.phone ?? 'Sem telefone'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {roleBadges.length ? roleBadges.map((badge) => (
            <span key={badge} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-primary">
              {badge}
            </span>
          )) : (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-slate-600">
              Sem papéis atribuídos
            </span>
          )}
        </div>
        {roleSummary ? (
          <dl className="grid gap-4 text-xs text-slate-500 md:grid-cols-3">
            <div>
              <dt className="uppercase tracking-wide">GCs liderados</dt>
              <dd className="text-sm font-semibold text-slate-800">{roleSummary.gcs_led}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">GCs supervisionados</dt>
              <dd className="text-sm font-semibold text-slate-800">{roleSummary.gcs_supervised}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Subordinados diretos</dt>
              <dd className="text-sm font-semibold text-slate-800">{roleSummary.direct_subordinates}</dd>
            </div>
          </dl>
        ) : null}
        {createdRecently ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Usuário criado com sucesso. Defina papéis e permissões conforme necessário.
          </div>
        ) : null}
      </header>

      <AdminUserProfileForm
        userId={user.id}
        initialValues={{
          name: person.name,
          email: person.email,
          phone: person.phone,
          isAdmin: user.is_admin,
          hierarchyParentId: user.hierarchy_parent_id,
        }}
        supervisors={supervisors}
      />

      <AdminUserAssignments
        userId={user.id}
        assignments={activeAssignments}
        availableGroups={availableGroups}
      />
    </section>
  );
}

export default async function AdminUserDetailPage({ params, searchParams }: AdminUserPageProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando usuário...</div>}>
      <AdminUserDetailContent userId={resolvedParams.id} searchParams={searchParams} />
    </Suspense>
  );
}
