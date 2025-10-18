import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/spinner';

type GCData = {
  id: string;
  name: string;
  mode: string;
  address: string | null;
  weekday: number | null;
  time: string | null;
  status: string;
  memberCount: number;
  visitorCount: number;
  userRole: string;
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const MODE_NAMES: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
};

const ROLE_NAMES: Record<string, string> = {
  leader: 'Líder',
  co_leader: 'Co-líder',
  supervisor: 'Supervisor',
  member: 'Membro',
};

async function GCListContent() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar person_id do usuário
  const { data: currentUser } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', session.user.id)
    .single();

  const currentPersonId = currentUser?.person_id;

  if (!currentPersonId) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Você não está associado a um perfil</CardTitle>
            <CardDescription>
              Entre em contato com o administrador do sistema.
            </CardDescription>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Buscar GCs do usuário através da tabela growth_group_participants
  const { data: participations } = await supabase
    .from('growth_group_participants')
    .select('gc_id, role')
    .eq('person_id', currentPersonId)
    .eq('status', 'active');

  const gcIds = participations?.map((p) => p.gc_id) ?? [];

  // Criar mapa de gc_id -> role para facilitar o acesso
  const gcRoleMap = new Map(participations?.map((p) => [p.gc_id, p.role]) ?? []);

  if (gcIds.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Meus Grupos de Crescimento</h1>
          <p className="text-muted-foreground">Gerencie seus GCs, reuniões e membros</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Você não está associado a nenhum GC</CardTitle>
            <CardDescription>
              Entre em contato com seu coordenador para ser adicionado a um Grupo de Crescimento.
            </CardDescription>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Buscar informações dos GCs
  const { data: groups } = await supabase
    .from('growth_groups')
    .select('*')
    .in('id', gcIds)
    .order('name');

  const gcs = groups ?? [];

  // Para cada GC, buscar contagem de membros e visitantes
  const gcsWithCounts: GCData[] = await Promise.all(
    gcs.map(async (gc) => {
      const [{ count: memberCount }, { count: visitorCount }] = await Promise.all([
        supabase
          .from('growth_group_participants')
          .select('*', { count: 'exact', head: true })
          .eq('gc_id', gc.id)
          .eq('status', 'active'),
        supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true })
          .eq('gc_id', gc.id)
          .eq('status', 'active'),
      ]);

      return {
        id: gc.id,
        name: gc.name,
        mode: gc.mode,
        address: gc.address,
        weekday: gc.weekday,
        time: gc.time,
        status: gc.status,
        memberCount: memberCount ?? 0,
        visitorCount: visitorCount ?? 0,
        userRole: gcRoleMap.get(gc.id) ?? 'member',
      };
    })
  );

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Meus Grupos de Crescimento</h1>
          <p className="text-muted-foreground">Gerencie seus GCs, reuniões e membros</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <Calendar className="mr-2 h-4 w-4" />
            Registrar reunião
          </Link>
        </Button>
      </div>

      {/* Grid de GCs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gcsWithCounts.map((gc) => (
          <Card key={gc.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-xl">{gc.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {MODE_NAMES[gc.mode] || gc.mode}
                  </CardDescription>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {ROLE_NAMES[gc.userRole] || gc.userRole}
                    </Badge>
                  </div>
                </div>
                <Badge
                  variant={
                    gc.status === 'active'
                      ? 'default'
                      : gc.status === 'multiplying'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {gc.status === 'active' ? 'Ativo' : gc.status === 'multiplying' ? 'Multiplicando' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do GC */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {gc.weekday !== null && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {WEEKDAY_NAMES[gc.weekday]} {gc.time ? `às ${gc.time.slice(0, 5)}` : ''}
                    </span>
                  </div>
                )}
                {gc.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{gc.address}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Estatísticas */}
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold">{gc.memberCount}</p>
                  <p className="text-xs text-muted-foreground">Membros</p>
                </div>
                <Separator orientation="vertical" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold">{gc.visitorCount}</p>
                  <p className="text-xs text-muted-foreground">Visitantes</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/gc/${gc.id}`}>Ver detalhes</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href={`/meetings/new?gcId=${gc.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Nova reunião
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function GCPage() {
  return (
    <Suspense fallback={<Loading message="Carregando grupos..." />}>
      <GCListContent />
    </Suspense>
  );
}
