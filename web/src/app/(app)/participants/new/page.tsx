import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ParticipantForm } from '@/components/participants/ParticipantForm';
import { Loading } from '@/components/ui/spinner';

type SearchParams = {
  gcId?: string;
};

export async function ParticipantFormLoader({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const { data: groups, error } = await supabase
    .from('growth_groups')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return <ParticipantForm groups={groups ?? []} preselectedGcId={searchParams.gcId} />;
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
