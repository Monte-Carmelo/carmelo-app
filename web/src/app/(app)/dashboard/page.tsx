import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Users, BookOpen, UserCheck, UserPlus } from 'lucide-react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { LeaderDashboardOverview } from '@/components/dashboard/LeaderDashboardOverview';
import { getEmptyLeaderDashboardData, getLeaderDashboardData } from '@/lib/dashboard/queries';

export default async function DashboardPage() {
  const navigationItems = [
    { title: 'GC', icon: Users, href: '/gc', description: 'Grupos de Crescimento' },
    { title: 'Lições', icon: BookOpen, href: '/lessons', description: 'Catálogo de lições e séries' },
    { title: 'Participantes', icon: UserCheck, href: '/participants', description: 'Membros dos grupos' },
    { title: 'Visitantes', icon: UserPlus, href: '/visitors', description: 'Visitantes e interessados' },
  ];
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const dashboardData = user
    ? await getLeaderDashboardData(supabase, user.id)
    : getEmptyLeaderDashboardData();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <span className="eyebrow">Igreja Monte Carmelo</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Bem-vindo
          </h1>
        </header>
        <DashboardGrid items={navigationItems} />
        <LeaderDashboardOverview data={dashboardData} />
      </div>
    </main>
  );
}
