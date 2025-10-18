import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ParticipantForm } from '@/components/participants/ParticipantForm';
import { Loading } from '@/components/ui/spinner';

async function ParticipantFormLoader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: groups, error } = await supabase
    .from('growth_groups')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return <ParticipantForm groups={groups ?? []} />;
}

export default function NewParticipantPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ParticipantFormLoader />
    </Suspense>
  );
}
