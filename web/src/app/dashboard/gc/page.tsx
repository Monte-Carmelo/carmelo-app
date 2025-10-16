import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { GCDashboard } from '@/components/gc/gc-dashboard';
import { getGrowthGroups, getUpcomingMeetings, getUserGCIds } from '@/lib/supabase/queries/gc-dashboard';
import { redirect } from 'next/navigation';

export default async function GCDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Buscar IDs dos GCs do usuário
  const gcIds = await getUserGCIds(supabase, user.id);

  // Buscar dados dos GCs e próximas reuniões em paralelo
  const [groups, upcomingMeetings] = await Promise.all([
    getGrowthGroups(supabase, gcIds),
    getUpcomingMeetings(supabase, gcIds),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <GCDashboard groups={groups} upcomingMeetings={upcomingMeetings} />
      </div>
    </div>
  );
}
