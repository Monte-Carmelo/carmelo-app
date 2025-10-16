import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AddVisitorForm } from '@/components/gc/add-visitor-form';
import { addVisitor } from '@/lib/supabase/mutations/visitors';
import { redirect } from 'next/navigation';

export default async function AddVisitorPage({
  searchParams,
}: {
  searchParams: { gcId?: string };
}) {
  const supabase = await createSupabaseServerClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Buscar GCs do usuário para o formulário
  const { data: growthGroups } = await supabase
    .from('growth_group_participants')
    .select('gc_id, growth_groups(id, name)')
    .eq('person_id', user.id)
    .eq('status', 'active');

  const groups =
    growthGroups?.map((row: any) => ({
      id: row.growth_groups?.id ?? '',
      name: row.growth_groups?.name ?? 'GC sem nome',
    })) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <AddVisitorForm
        growthGroups={groups}
        preselectedGcId={searchParams.gcId}
        onSubmit={async (input) => {
          'use server';
          const supabaseAction = await createSupabaseServerClient();
          return await addVisitor(supabaseAction, input);
        }}
      />
    </div>
  );
}
