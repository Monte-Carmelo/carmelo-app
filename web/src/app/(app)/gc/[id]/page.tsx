import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, MapPin, Users, UserCheck, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Agendada', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Realizada', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MODE_NAMES: Record<string, string> = { in_person: 'Presencial', online: 'Online', hybrid: 'Híbrido' };

export default async function GCDetailPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { id: gcId } = await params;

  const [{ data: gc }, { data: participants }, meetingsResult, memberCountRes, visitorCountRes] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id, name, mode, address, weekday, time, status')
      .eq('id', gcId)
      .single(),
    supabase
      .from('growth_group_participants')
      .select('id, role, status, joined_at, people:person_id ( name, email, phone )')
      .eq('gc_id', gcId)
      .eq('status', 'active')
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true }),
    supabase
      .from('meetings')
      .select(
        'id, datetime, lesson_title, comments, status, meeting_member_attendance ( id ), meeting_visitor_attendance ( id )'
      )
      .eq('gc_id', gcId)
      .order('datetime', { ascending: false })
      .limit(5),
    supabase
      .from('growth_group_participants')
      .select('*', { count: 'exact', head: true })
      .eq('gc_id', gcId)
      .eq('status', 'active'),
    supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('gc_id', gcId)
      .eq('status', 'active'),
  ]);

  if (!gc) {
    redirect('/gc');
  }

  const leaderList = (participants ?? []).filter((p) => p.role === 'leader' || p.role === 'co_leader');
  const supervisorList = (participants ?? []).filter((p) => p.role === 'supervisor');
  const memberList = (participants ?? []).filter((p) => p.role === 'member');

  const meetings = meetingsResult.data ?? [];
  const memberCount = memberCountRes.count ?? memberList.length;
  const visitorCount = visitorCountRes.count ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{gc.name}</h1>
            <Badge variant="outline">{gc.status === 'active' ? 'Ativo' : gc.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {MODE_NAMES[gc.mode] ?? gc.mode}
            {gc.weekday !== null ? ` • ${WEEKDAY_NAMES[gc.weekday]}` : ''}
            {gc.time ? ` às ${gc.time.slice(0, 5)}` : ''}
          </p>
          {gc.address ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{gc.address}</span>
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/meetings/new?gcId=${gc.id}`}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Registrar reunião
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modo</CardDescription>
            <CardTitle className="text-xl">{MODE_NAMES[gc.mode] ?? gc.mode}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {gc.weekday !== null ? WEEKDAY_NAMES[gc.weekday] : 'Dia não definido'}
            {gc.time ? ` às ${gc.time.slice(0, 5)}` : ''}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membros ativos</CardDescription>
            <CardTitle className="text-3xl">{memberCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Participantes com status ativo</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitantes ativos</CardDescription>
            <CardTitle className="text-3xl">{visitorCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Visitantes vinculados ao GC</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reuniões recentes</CardDescription>
            <CardTitle className="text-3xl">{meetings.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Últimas 5 reuniões registradas</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liderança e supervisão
            </CardTitle>
            <CardDescription>Quem lidera e supervisiona este GC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Líderes</p>
              <div className="mt-2 space-y-2">
                {leaderList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum líder registrado.</p>
                ) : (
                  leaderList.map((leader) => (
                    <div key={leader.id} className="rounded-lg border p-3">
                      <p className="font-medium">{leader.people?.name ?? 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{leader.people?.email ?? 'Sem email'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Supervisores</p>
              <div className="mt-2 space-y-2">
                {supervisorList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum supervisor registrado.</p>
                ) : (
                  supervisorList.map((sup) => (
                    <div key={sup.id} className="rounded-lg border p-3">
                      <p className="font-medium">{sup.people?.name ?? 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{sup.people?.email ?? 'Sem email'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Membros
            </CardTitle>
            <CardDescription>Participantes ativos deste GC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro ativo cadastrado.</p>
            ) : (
              memberList.map((member) => (
                <div key={member.id} className="rounded-lg border p-3">
                  <p className="font-medium">{member.people?.name ?? 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.people?.email ?? 'Sem email'} • {member.people?.phone ?? 'Sem telefone'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Visitantes
            </CardTitle>
            <CardDescription>Consulte visitantes em /visitors para adicionar ou converter</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A gestão de visitantes é feita na lista geral; este card mostra apenas a contagem ativa ({visitorCount}).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Últimas reuniões
            </CardTitle>
            <CardDescription>Histórico recente com presenças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p>
            ) : (
              meetings.map((meeting) => {
                const memberAttendance = Array.isArray(meeting.meeting_member_attendance)
                  ? meeting.meeting_member_attendance.length
                  : 0;
                const visitorAttendance = Array.isArray(meeting.meeting_visitor_attendance)
                  ? meeting.meeting_visitor_attendance.length
                  : 0;
                const statusCfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.scheduled;
                return (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}/edit`}
                    className="block rounded-lg border p-3 transition hover:bg-muted/50 hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {meeting.lesson_title || 'Reunião'}
                      </p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(meeting.datetime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <span>Membros: {memberAttendance}</span>
                      <span>Visitantes: {visitorAttendance}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
