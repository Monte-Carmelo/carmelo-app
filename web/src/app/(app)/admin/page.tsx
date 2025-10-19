import { Suspense } from 'react';
import Link from 'next/link';
import { Users, Building, UserPlus, Calendar, ArrowRight } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminMetricsCard } from '@/components/admin/AdminMetricsCard';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { Loading } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function AdminDashboardContent() {
  const supabase = await createSupabaseServerClient();

  // Fetch metrics in parallel
  const [usersResult, gcsResult, membersResult, visitorsResult] = await Promise.all([
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
  ]);

  const metrics = {
    totalUsers: usersResult.count ?? 0,
    activeGcs: gcsResult.count ?? 0,
    activeMembers: membersResult.count ?? 0,
    activeVisitors: visitorsResult.count ?? 0,
  };

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

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Em desenvolvimento...</p>
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
