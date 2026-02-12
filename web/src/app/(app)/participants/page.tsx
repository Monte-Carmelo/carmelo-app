import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/types';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ParticipantList } from '@/components/participants/ParticipantList';
import { listGrowthGroups, listParticipants } from '@/lib/api/participants';
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

  const [participants, groups] = await Promise.all([
    listParticipants(supabase, {
      gcId: searchParams.gcId,
      role: searchParams.role,
      status: searchParams.status,
    }),
    listGrowthGroups(supabase),
  ]);

  return <ParticipantList participants={participants} groups={groups} />;
}

export default async function ParticipantsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading message="Carregando..." />}>
      <ParticipantsContent searchParams={resolvedParams} />
    </Suspense>
  );
}
