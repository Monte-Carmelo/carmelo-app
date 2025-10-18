import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { UserPlus, Users } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { Database } from '@/lib/supabase/types';
import { VisitorsList, type VisitorView } from '@/components/visitors/VisitorsList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/spinner';

type SearchParams = {
  status?: Database['public']['Tables']['visitors']['Row']['status'] | 'all';
};

async function VisitorsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
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

  // Only filter by status if it's not 'all'
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Visitantes</h1>
          <p className="text-muted-foreground">
            Gerencie visitantes ativos, acompanhe visitas e realize conversões manuais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/visitors/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar visitante
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/participants/new">
              <Users className="mr-2 h-4 w-4" />
              Cadastrar participante
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="status">Filtrar por status</Label>
              <Select name="status" defaultValue={searchParams.status && searchParams.status !== 'all' ? searchParams.status : 'all'}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="outline">
              Aplicar filtro
            </Button>
          </form>
        </CardContent>
      </Card>

      <VisitorsList visitors={visitorViews} />
    </section>
  );
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading message="Carregando visitantes..." />}>
      <VisitorsContent searchParams={resolvedParams} />
    </Suspense>
  );
}
