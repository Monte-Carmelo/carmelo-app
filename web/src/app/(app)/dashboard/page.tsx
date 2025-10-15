import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

async function DashboardContent() {
  const supabase = createSupabaseServerClient();

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
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Nenhum grupo disponível no momento.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Acompanhe presença, crescimento e conversões dos seus Grupos de Crescimento.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <article key={metric.gc_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{metric.gc_name}</h2>
                <p className="text-xs uppercase tracking-wide text-slate-400">{metric.total_active_members ?? 0} membros ativos</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Reuniões (mês)</dt>
                <dd className="font-semibold text-slate-800">{metric.meetings_current_month ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Presença média (30d)</dt>
                <dd className="font-semibold text-slate-800">{metric.average_attendance ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Novo membros (30d)</dt>
                <dd className="font-semibold text-emerald-600">{metric.growth_30d ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Conversões (30d)</dt>
                <dd className="font-semibold text-emerald-600">{metric.conversions_30d ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Taxa de conversão</dt>
                <dd className="font-semibold text-slate-800">{metric.conversion_rate_pct ?? 0}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>Visitantes únicos (30d)</dt>
                <dd className="font-semibold text-slate-800">{metric.unique_visitors_30d ?? 0}</dd>
              </div>
            </dl>
          </article>
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
