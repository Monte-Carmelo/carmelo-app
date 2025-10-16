import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { GCEditForm } from '@/components/gc/GCEditForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function GCEditContent({ gcId }: { gcId: string }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

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
    .eq('id', session.user.id)
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
    .in('role', ['leader', 'co_leader', 'supervisor'])
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
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <GCEditContent gcId={id} />
    </Suspense>
  );
}
