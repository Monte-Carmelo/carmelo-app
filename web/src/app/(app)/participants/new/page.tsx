import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ParticipantForm } from '@/components/participants/ParticipantForm';
import { Loading } from '@/components/ui/spinner';
import { getParticipantManagementScope, listGrowthGroups } from '@/lib/api/participants';

type SearchParams = {
  gcId?: string;
};

async function ParticipantFormLoader({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const scope = await getParticipantManagementScope(supabase, user.id);
  const groups = await listGrowthGroups(
    supabase,
    scope.isAdmin ? undefined : { gcIds: scope.managedGcIds },
  );
  const preselectedGcId = groups.some((group) => group.id === searchParams.gcId)
    ? searchParams.gcId
    : undefined;

  return <ParticipantForm groups={groups} preselectedGcId={preselectedGcId} />;
}

export default async function NewParticipantPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading />}>
      <ParticipantFormLoader searchParams={resolvedParams} />
    </Suspense>
  );
}
