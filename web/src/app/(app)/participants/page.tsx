import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/types';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ParticipantList } from '@/components/participants/ParticipantList';
import { getParticipantManagementScope, listGrowthGroups, listParticipants } from '@/lib/api/participants';
import { Loading } from '@/components/ui/spinner';

type SearchParams = {
  gcId?: string;
  role?: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status?: Database['public']['Tables']['growth_group_participants']['Row']['status'] | 'all';
};

async function ParticipantsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const scope = await getParticipantManagementScope(supabase, user.id);
  const groupOptions = await listGrowthGroups(
    supabase,
    scope.isAdmin ? undefined : { gcIds: scope.managedGcIds },
  );
  const allowedGcIds = groupOptions.map((group) => group.id);

  const participants = await listParticipants(
    supabase,
    {
      gcId: searchParams.gcId,
      role: searchParams.role,
      status: searchParams.status,
    },
    scope.isAdmin ? undefined : { gcIds: allowedGcIds },
  );

  return <ParticipantList participants={participants} groups={groupOptions} />;
}

export default async function ParticipantsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading message="Carregando..." />}>
      <ParticipantsContent searchParams={resolvedParams} />
    </Suspense>
  );
}
