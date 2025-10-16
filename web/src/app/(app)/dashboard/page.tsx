import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, TrendingUp, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

async function DashboardContent() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: metrics, error } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .order('gc_name', { ascending: true });

  if (error) {
    throw error;
  }

  if (!metrics?.length) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Nenhum grupo disponível no momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Acompanhe presença, crescimento e conversões dos seus Grupos de Crescimento.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <Link key={metric.gc_id} href={`/gc/${metric.gc_id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{metric.gc_name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {metric.total_active_members ?? 0} membros ativos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Reuniões (mês)</span>
                  </div>
                  <span className="font-semibold">{metric.meetings_current_month ?? 0}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Presença média (30d)</span>
                  <span className="font-semibold">{metric.average_attendance ?? 0}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    <span>Novos membros (30d)</span>
                  </div>
                  <Badge variant="default">{metric.growth_30d ?? 0}</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Conversões (30d)</span>
                  </div>
                  <Badge variant="default">{metric.conversions_30d ?? 0}</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de conversão</span>
                  <span className="font-semibold">{metric.conversion_rate_pct ?? 0}%</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visitantes únicos (30d)</span>
                  <span className="font-semibold">{metric.unique_visitors_30d ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
