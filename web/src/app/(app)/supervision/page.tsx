import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Loading } from '@/components/ui/spinner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface SearchParams {
  highlight?: string;
}

async function SupervisionContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { data: roles } = await supabase
    .from('user_gc_roles')
    .select('is_supervisor, is_coordinator, is_admin')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!roles?.is_supervisor && !roles?.is_coordinator && !roles?.is_admin) {
    redirect('/dashboard');
  }

  const { data: metrics, error } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .order('gc_name', { ascending: true });

  if (error) {
    throw error;
  }

  const totalGroups = metrics?.length ?? 0;
  const totalMembers = metrics?.reduce((acc, metric) => acc + (metric.total_active_members ?? 0), 0) ?? 0;
  const totalMeetingsMonth = metrics?.reduce((acc, metric) => acc + (metric.meetings_current_month ?? 0), 0) ?? 0;
  const totalConversions = metrics?.reduce((acc, metric) => acc + (metric.conversions_30d ?? 0), 0) ?? 0;

  const highlightedGcId = searchParams.highlight;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <ScreenHeader
        title="Supervisão"
        subtitle="Visão consolidada dos Grupos de Crescimento sob sua supervisão direta ou indireta. Utilize os dados para acompanhar frequência, crescimento e conversões."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile value={totalGroups} label="Grupos monitorados" />
        <StatTile value={totalMembers} label="Membros ativos" />
        <StatTile value={totalMeetingsMonth} label="Reuniões este mês" />
        <StatTile value={totalConversions} label="Conversões (30 dias)" />
      </section>

      <section className="grid gap-4">
        {metrics?.length ? (
          metrics.map((metric) => {
            const isHighlighted = metric.gc_id === highlightedGcId;

            return (
              <article
                key={metric.gc_id}
                className={`rounded-card bg-white p-6 shadow-sm transition ${
                  isHighlighted ? 'ring-2 ring-primary' : ''
                }`}
              >
                <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{metric.gc_name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {metric.total_active_members ?? 0} membros ativos • {metric.unique_visitors_30d ?? 0} visitantes únicos (30d)
                    </p>
                  </div>
                  <Badge className="self-start md:self-auto">
                    Conversão: {metric.conversion_rate_pct ?? 0}%
                  </Badge>
                </header>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">Reuniões no mês</dt>
                    <dd className="mt-0.5 text-sm font-bold text-foreground">{metric.meetings_current_month ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">Presença média (30d)</dt>
                    <dd className="mt-0.5 text-sm font-bold text-foreground">{metric.average_attendance ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">Crescimento (30d)</dt>
                    <dd className="mt-0.5 text-sm font-bold text-success">{metric.growth_30d ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">Conversões (30d)</dt>
                    <dd className="mt-0.5 text-sm font-bold text-success">{metric.conversions_30d ?? 0}</dd>
                  </div>
                  {metric.conversion_rate_pct !== null ? (
                    <div className="col-span-2 md:col-span-4">
                      <dt className="text-[11px] font-medium text-muted-foreground">Observações</dt>
                      <dd className="mt-0.5 text-sm text-muted-foreground">
                        {metric.conversion_rate_pct >= 30
                          ? 'Conversão acima da média — parabenize a equipe.'
                          : metric.conversion_rate_pct === 0
                            ? 'Sem conversões recentes; incentive estratégias com visitantes.'
                            : 'Conversão consistente. Continue monitorando.'}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })
        ) : (
          <EmptyState
            sunken
            title="Nenhum grupo disponível para supervisão no momento."
          />
        )}
      </section>
    </section>
  );
}

export default async function SupervisionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading />}>
      <SupervisionContent searchParams={resolvedParams} />
    </Suspense>
  );
}
