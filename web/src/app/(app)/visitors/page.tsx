import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { Database } from '@/lib/supabase/types';
import { VisitorsList, type VisitorView } from '@/components/visitors/VisitorsList';

type SearchParams = {
  status?: Database['public']['Tables']['visitors']['Row']['status'] | 'all';
};

async function VisitorsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const visitorsQuery = supabase
    .from('visitors')
    .select(
      `id, gc_id, status, visit_count, last_visit_date,
       people:person_id ( id, name, email ),
       growth_groups ( name )`
    )
    .order('last_visit_date', { ascending: false });

  if (searchParams.status && searchParams.status !== 'all') {
    visitorsQuery.eq('status', searchParams.status);
  }

  const { data: visitors, error } = await visitorsQuery;

  if (error) {
    throw error;
  }

  const visitorViews: VisitorView[] = (visitors ?? []).map((visitor) => ({
    id: visitor.id,
    gcId: visitor.gc_id,
    gcName: visitor.growth_groups?.name ?? 'GC desconhecido',
    personId: visitor.people?.id ?? '',
    name: visitor.people?.name ?? 'Sem nome',
    email: visitor.people?.email ?? null,
    status: visitor.status,
    visitCount: visitor.visit_count,
    lastVisitDate: visitor.last_visit_date,
  }));

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Visitantes</h1>
          <p className="text-sm text-slate-600">Gerencie visitantes ativos, acompanhe visitas e realize conversões manuais.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/visitors/new"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Adicionar visitante
          </Link>
          <Link
            href="/participants/new"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cadastrar participante
          </Link>
        </div>
      </header>

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filtrar por status
          <select
            name="status"
            defaultValue={searchParams.status ?? 'all'}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="converted">Convertidos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Aplicar filtro
        </button>
      </form>

      <VisitorsList visitors={visitorViews} />
    </section>
  );
}

export default function VisitorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <VisitorsContent searchParams={searchParams} />
    </Suspense>
  );
}
