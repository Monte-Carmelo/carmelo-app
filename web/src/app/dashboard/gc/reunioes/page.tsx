import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ScheduleMeetingForm } from '@/components/gc/schedule-meeting-form';
import { createMeeting } from '@/lib/supabase/mutations/meetings';
import { redirect } from 'next/navigation';

export default async function ScheduleMeetingPage() {
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
    growthGroups?.map((row) => {
      const gcData = row.growth_groups && typeof row.growth_groups === 'object' && 'id' in row.growth_groups ? row.growth_groups : null;
      return {
        id: gcData?.id ?? '',
        name: gcData && 'name' in gcData ? (gcData.name as string) : 'GC sem nome',
      };
    }) ?? [];

  // Buscar lições do catálogo (opcional)
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title')
    .order('title');

  const lessonTemplates = lessons ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <ScheduleMeetingForm
        userId={user.id}
        growthGroups={groups}
        lessonTemplates={lessonTemplates}
        onSubmit={async (input) => {
          'use server';
          const supabaseAction = await createSupabaseServerClient();
          return await createMeeting(supabaseAction, input);
        }}
      />
    </div>
  );
}
