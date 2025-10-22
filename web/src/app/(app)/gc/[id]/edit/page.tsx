import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { GCEditForm } from '@/components/gc/GCEditForm';
import { Loading } from '@/components/ui/spinner';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function GCEditContent({ gcId }: { gcId: string }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  // Buscar informações do GC
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .select('*')
    .eq('id', gcId)
    .single();

  if (gcError || !gc) {
    notFound();
  }

  // Buscar person_id do usuário logado
  const { data: currentUser } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', user.id)
    .single();

  const currentPersonId = currentUser?.person_id;

  if (!currentPersonId) {
    // Usuário não encontrado
    redirect('/dashboard');
  }

  // Verificar se o usuário é líder ou supervisor do GC
  const { data: participant } = await supabase
    .from('growth_group_participants')
    .select('role')
    .eq('gc_id', gcId)
    .eq('person_id', currentPersonId)
    .in('role', ['leader', 'leader', 'supervisor'])
    .eq('status', 'active')
    .single();

  if (!participant) {
    // Usuário não tem permissão para editar
    redirect(`/gc/${gcId}`);
  }

  return <GCEditForm gc={gc} />;
}

export default async function GCEditPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <GCEditContent gcId={id} />
    </Suspense>
  );
}
