import { Suspense } from 'react';
import Link from 'next/link';
import { Users, Building, UserPlus, Calendar, ArrowRight } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminMetricsCard } from '@/components/admin/AdminMetricsCard';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { Loading } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RecentActivity = {
  id: string;
  action: string;
  details: string;
  createdAt: string;
};

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function AdminDashboardContent() {
  const supabase = await createSupabaseServerClient();

  // Fetch metrics in parallel
  const [
    usersResult,
    gcsResult,
    membersResult,
    visitorsResult,
    recentUsersResult,
    recentGcsResult,
    recentMeetingsResult,
    recentVisitorsResult,
    recentLessonsResult,
    recentSeriesResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('growth_group_participants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('users')
      .select('id, created_at, people(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('growth_groups')
      .select('id, created_at, name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('meetings')
      .select('id, created_at, lesson_title, growth_groups(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('visitors')
      .select('id, created_at, people(name), growth_groups(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('lessons')
      .select('id, created_at, title')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('lesson_series')
      .select('id, created_at, name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const metrics = {
    totalUsers: usersResult.count ?? 0,
    activeGcs: gcsResult.count ?? 0,
    activeMembers: membersResult.count ?? 0,
    activeVisitors: visitorsResult.count ?? 0,
  };

  const recentActivities: RecentActivity[] = [
    ...((recentUsersResult.data ?? []).map((user) => ({
      id: `user-${user.id}`,
      action: 'Novo usuário cadastrado',
      details: ((user as { people?: { name?: string } | null }).people?.name ?? 'Usuário sem nome'),
      createdAt: user.created_at,
    }))),
    ...((recentGcsResult.data ?? []).map((gc) => ({
      id: `gc-${gc.id}`,
      action: 'Novo GC criado',
      details: gc.name,
      createdAt: gc.created_at,
    }))),
    ...((recentMeetingsResult.data ?? []).map((meeting) => ({
      id: `meeting-${meeting.id}`,
      action: 'Reunião registrada',
      details: `${meeting.lesson_title} • ${(meeting as { growth_groups?: { name?: string } | null }).growth_groups?.name ?? 'GC não identificado'}`,
      createdAt: meeting.created_at,
    }))),
    ...((recentVisitorsResult.data ?? []).map((visitor) => ({
      id: `visitor-${visitor.id}`,
      action: 'Novo visitante registrado',
      details: `${(visitor as { people?: { name?: string } | null }).people?.name ?? 'Visitante sem nome'} • ${(visitor as { growth_groups?: { name?: string } | null }).growth_groups?.name ?? 'GC não identificado'}`,
      createdAt: visitor.created_at,
    }))),
    ...((recentLessonsResult.data ?? []).map((lesson) => ({
      id: `lesson-${lesson.id}`,
      action: 'Nova lição criada',
      details: lesson.title,
      createdAt: lesson.created_at,
    }))),
    ...((recentSeriesResult.data ?? []).map((series) => ({
      id: `series-${series.id}`,
      action: 'Nova série criada',
      details: series.name,
      createdAt: series.created_at,
    }))),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-600 mt-1">Visão geral e métricas do sistema</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricsCard
          title="Total de Usuários"
          value={metrics.totalUsers}
          icon={Users}
          description="Usuários cadastrados no sistema"
        />
        <AdminMetricsCard
          title="GCs Ativos"
          value={metrics.activeGcs}
          icon={Building}
          description="Grupos de crescimento ativos"
        />
        <AdminMetricsCard
          title="Membros Ativos"
          value={metrics.activeMembers}
          icon={Users}
          description="Membros participando de GCs"
        />
        <AdminMetricsCard
          title="Visitantes Ativos"
          value={metrics.activeVisitors}
          icon={UserPlus}
          description="Visitantes em acompanhamento"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as funcionalidades mais usadas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gerenciar Usuários
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/growth-groups">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Gerenciar GCs
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/lessons">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Gerenciar Lições
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma atividade recente encontrada.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">{activity.details}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatActivityDate(activity.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading message="Carregando dashboard..." />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
