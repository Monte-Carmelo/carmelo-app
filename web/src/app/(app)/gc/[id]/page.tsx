import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, UserPlus, Edit, ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function GCDetailsContent({ gcId }: { gcId: string }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar informações do GC
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .select('*')
    .eq('id', gcId)
    .single();

  if (gcError || !gc) {
    notFound();
  }

  // Buscar líderes e supervisores do GC
  const { data: leaders } = await supabase
    .from('growth_group_participants')
    .select('id, role, person_id, people!inner(name)')
    .eq('gc_id', gcId)
    .in('role', ['leader', 'co_leader'])
    .eq('status', 'active');

  const { data: supervisors } = await supabase
    .from('growth_group_participants')
    .select('id, role, person_id, people!inner(name)')
    .eq('gc_id', gcId)
    .eq('role', 'supervisor')
    .eq('status', 'active');

  // Buscar últimas reuniões com presença
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      id,
      datetime,
      lesson_title,
      comments,
      meeting_member_attendance (
        id,
        participant:growth_group_participants!inner (
          id,
          person:people!inner (name)
        )
      ),
      meeting_visitor_attendance (
        id,
        visitor:visitors!inner (
          id,
          person:people!inner (name)
        )
      )
    `)
    .eq('gc_id', gcId)
    .order('datetime', { ascending: false })
    .limit(10);

  const meetingsList = meetings ?? [];

  // Verificar permissões do usuário
  // Primeiro, buscar o person_id do usuário logado
  const { data: currentUser } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', session.user.id)
    .single();

  const currentPersonId = currentUser?.person_id;

  const isLeader = leaders?.some((l) => l.person_id === currentPersonId);
  const isSupervisor = supervisors?.some((s) => s.person_id === currentPersonId);
  const canEdit = isLeader || isSupervisor;

  // Formatar dia da semana (0=Domingo, 6=Sábado)
  const weekdayMap: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
  };

  // Formatar modo
  const modeMap: Record<string, string> = {
    in_person: 'Presencial',
    online: 'Online',
    hybrid: 'Híbrido',
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{gc.name}</h1>
          <p className="text-muted-foreground">Detalhes e histórico do Grupo de Crescimento</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/gc/${gcId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Modo</p>
              <Badge variant="secondary">{modeMap[gc.mode] ?? gc.mode}</Badge>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dia da semana</p>
              <p className="font-semibold">{gc.weekday !== null ? weekdayMap[gc.weekday] : 'Não definido'}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Horário</p>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <p className="font-semibold">{gc.time}</p>
              </div>
            </div>

            {gc.address && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-semibold">{gc.address}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={gc.status === 'active' ? 'default' : 'secondary'}>
                {gc.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Liderança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liderança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Líderes</p>
              {leaders && leaders.length > 0 ? (
                leaders.map((leader) => (
                  <div key={leader.id} className="flex items-center justify-between">
                    <p className="font-medium">
                      {leader.people.name}
                    </p>
                    <Badge variant="outline">
                      {leader.role === 'leader' ? 'Principal' : 'Co-líder'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum líder cadastrado</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Supervisores</p>
              {supervisors && supervisors.length > 0 ? (
                supervisors.map((supervisor) => (
                  <p key={supervisor.id} className="font-medium">
                    {supervisor.people.name}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum supervisor cadastrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas reuniões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Últimas Reuniões
            </CardTitle>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/meetings/new?gcId=${gcId}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nova reunião
                </Link>
              </Button>
            )}
          </div>
          <CardDescription>
            Histórico das últimas {meetingsList.length} reuniões com presença de membros e visitantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetingsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhuma reunião registrada ainda.</p>
              </div>
            ) : (
              meetingsList.map((meeting) => {
                const memberCount = Array.isArray(meeting.meeting_member_attendance)
                  ? meeting.meeting_member_attendance.length
                  : 0;
                const visitorCount = Array.isArray(meeting.meeting_visitor_attendance)
                  ? meeting.meeting_visitor_attendance.length
                  : 0;

                const cardContent = (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{meeting.lesson_title}</CardTitle>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(meeting.datetime).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>Membros presentes</span>
                          </div>
                          <Badge variant="secondary">{memberCount}</Badge>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <UserPlus className="h-3 w-3" />
                            <span>Visitantes presentes</span>
                          </div>
                          <Badge variant="secondary">{visitorCount}</Badge>
                        </div>

                        {meeting.comments && (
                          <div className="col-span-2 space-y-1 md:col-span-1">
                            <p className="text-xs text-muted-foreground">Comentários</p>
                            <p className="text-sm">{meeting.comments}</p>
                          </div>
                        )}
                      </div>

                      {/* Lista de presentes */}
                      {(memberCount > 0 || visitorCount > 0) && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-2">
                            {memberCount > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Membros:</p>
                                <div className="flex flex-wrap gap-1">
                                  {meeting.meeting_member_attendance.map((attendance) => (
                                    <Badge key={attendance.id} variant="outline" className="text-xs">
                                      {attendance.participant.person.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {visitorCount > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Visitantes:</p>
                                <div className="flex flex-wrap gap-1">
                                  {meeting.meeting_visitor_attendance.map((attendance) => (
                                    <Badge key={attendance.id} variant="outline" className="text-xs">
                                      {attendance.visitor.person.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </>
                );

                return canEdit ? (
                  <Link key={meeting.id} href={`/meetings/${meeting.id}/edit`} className="block transition-all hover:opacity-75">
                    <Card className="cursor-pointer hover:shadow-md">
                      {cardContent}
                    </Card>
                  </Link>
                ) : (
                  <Card key={meeting.id}>
                    {cardContent}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default async function GCDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <GCDetailsContent gcId={id} />
    </Suspense>
  );
}
