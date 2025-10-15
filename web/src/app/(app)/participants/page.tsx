import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/types';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ParticipantList } from '@/components/participants/ParticipantList';

type SearchParams = {
  gcId?: string;
  role?: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status?: Database['public']['Tables']['growth_group_participants']['Row']['status'] | 'all';
};

async function ParticipantsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const params = supabase
    .from('growth_group_participants')
    .select(
      `id, gc_id, role, status, joined_at,
       growth_groups ( id, name ),
       people:people!growth_group_participants_person_id_fkey ( name, email, phone )`
    )
    .order('joined_at', { ascending: false })
    .limit(50);

  if (searchParams.gcId) {
    params.eq('gc_id', searchParams.gcId);
  }

  if (searchParams.role) {
    params.eq('role', searchParams.role);
  }

  if (searchParams.status && searchParams.status !== 'all') {
    params.eq('status', searchParams.status);
  } else {
    params.eq('status', 'active');
  }

  const [participantsResult, groupsResult] = await Promise.all([
    params,
    supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  if (participantsResult.error) {
    throw participantsResult.error;
  }

  const participantViews = (participantsResult.data ?? []).map((row) => ({
    participantId: row.id,
    gcId: row.gc_id,
    gcName: row.growth_groups?.name ?? 'GC desconhecido',
    personId: row.people?.id ?? '',
    name: row.people?.name ?? 'Sem nome',
    email: row.people?.email ?? null,
    phone: row.people?.phone ?? null,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }));

  return <ParticipantList participants={participantViews} groups={groupsResult.data ?? []} />;
}

export default function ParticipantsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando participantes...</div>}>
      <ParticipantsContent searchParams={searchParams} />
    </Suspense>
  );
}
