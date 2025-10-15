import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

interface SearchParams {
  highlight?: string;
}

async function SupervisionContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: roles } = await supabase
    .from('user_gc_roles')
    .select('is_supervisor, is_coordinator, is_admin')
    .eq('user_id', session.user.id)
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
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Supervisão</h1>
        <p className="text-sm text-slate-600">
          Visão consolidada dos Grupos de Crescimento sob sua supervisão direta ou indireta. Utilize os dados para
          acompanhar frequência, crescimento e conversões.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase tracking-wide text-slate-400">Grupos monitorados</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalGroups}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase tracking-wide text-slate-400">Membros ativos</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalMembers}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase tracking-wide text-slate-400">Reuniões este mês</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalMeetingsMonth}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase tracking-wide text-slate-400">Conversões (30 dias)</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalConversions}</p>
        </article>
      </section>

      <section className="grid gap-4">
        {metrics?.length ? (
          metrics.map((metric) => {
            const isHighlighted = metric.gc_id === highlightedGcId;

            return (
              <article
                key={metric.gc_id}
                className={`rounded-2xl border ${
                  isHighlighted ? 'border-primary bg-primary/5' : 'border-slate-200'
                } bg-white p-6 shadow-sm transition`}
              >
                <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{metric.gc_name}</h2>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {metric.total_active_members ?? 0} membros ativos • {metric.unique_visitors_30d ?? 0} visitantes únicos (30d)
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    Conversão: {metric.conversion_rate_pct ?? 0}%
                  </span>
                </header>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Reuniões no mês</dt>
                    <dd className="text-sm font-semibold text-slate-800">{metric.meetings_current_month ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Presença média (30d)</dt>
                    <dd className="text-sm font-semibold text-slate-800">{metric.average_attendance ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Crescimento (30d)</dt>
                    <dd className="text-sm font-semibold text-emerald-600">{metric.growth_30d ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Conversões (30d)</dt>
                    <dd className="text-sm font-semibold text-emerald-600">{metric.conversions_30d ?? 0}</dd>
                  </div>
                  {metric.conversion_rate_pct !== null ? (
                    <div className="col-span-2 md:col-span-4">
                      <dt className="uppercase text-xs tracking-wide text-slate-400">Observações</dt>
                      <dd className="text-sm text-slate-600">
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
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhum grupo disponível para supervisão no momento.
          </div>
        )}
      </section>
    </section>
  );
}

export default function SupervisionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando supervisão...</div>}>
      <SupervisionContent searchParams={searchParams} />
    </Suspense>
  );
}
