import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { VisitorForm } from '@/components/visitors/VisitorForm';
import { Loading } from '@/components/ui/spinner';

async function VisitorFormLoader() {
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

  return <VisitorForm groups={groups ?? []} />;
}

export default function NewVisitorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VisitorFormLoader />
    </Suspense>
  );
}
