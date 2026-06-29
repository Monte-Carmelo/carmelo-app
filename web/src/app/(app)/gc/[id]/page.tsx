import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, ChevronRight, Crown, HandHeart, MapPin, Pencil, UserPlus, Users } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListGroup, ListItem } from '@/components/ui/list-item';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionRow } from '@/components/ui/section-row';

type PageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'danger' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  completed: { label: 'Realizada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
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

  const [{ data: gc }, { data: participants }, meetingsResult, memberCountRes, visitorsRes] = await Promise.all([
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
      .select('id, visit_count, status, people:person_id ( name )')
      .eq('gc_id', gcId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  if (!gc) {
    redirect('/gc');
  }

  const leaderList = (participants ?? []).filter((p) => p.role === 'leader');
  const supervisorList = (participants ?? []).filter((p) => p.role === 'supervisor');
  const memberList = (participants ?? []).filter((p) => p.role === 'member');

  const meetings = meetingsResult.data ?? [];
  const memberCount = memberCountRes.count ?? memberList.length;
  const visitors = (visitorsRes.data ?? []) as Array<{
    id: string;
    visit_count: number | null;
    people?: { name?: string | null } | null;
  }>;
  const visitorCount = visitors.length;

  const newMeetingHref = `/meetings/new?gcId=${gc.id}`;
  const addMemberHref = `/participants/new?gcId=${gc.id}`;
  const allParticipantsHref = `/participants?gcId=${gc.id}`;
  const addVisitorHref = `/visitors/new?gcId=${gc.id}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-3">
        <ScreenHeader
          className="flex-col gap-4 sm:flex-row"
          eyebrow="Seu Grupo de Crescimento"
          title={gc.name}
          subtitle={
            <>
              {MODE_NAMES[gc.mode] ?? gc.mode}
              {gc.weekday !== null ? ` • ${WEEKDAY_NAMES[gc.weekday]}` : ''}
              {gc.time ? ` às ${gc.time.slice(0, 5)}` : ''}
            </>
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={newMeetingHref}>
                  <Calendar className="h-4 w-4" />
                  Registrar reunião
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/gc/${gc.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Editar GC
                </Link>
              </Button>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={gc.status === 'active' ? 'success' : 'neutral'} dot>
            {gc.status === 'active' ? 'Ativo' : gc.status}
          </Badge>
          {gc.address ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{gc.address}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          { href: newMeetingHref, icon: Calendar, label: 'Registrar reunião', sub: 'Marcar data e tema', tile: 'bg-brand-soft text-brand-soft-fg' },
          { href: addMemberHref, icon: Users, label: 'Adicionar membro', sub: 'Vincular pessoa ao GC', tile: 'bg-sage/35 text-forest' },
          { href: addVisitorHref, icon: UserPlus, label: 'Adicionar visitante', sub: 'Registrar quem chegou', tile: 'bg-clay/[0.18] text-[#8A4A2C]' },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-card bg-white p-4 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.tile}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-tight text-foreground">{a.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{a.sub}</span>
              </span>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-slate-400" />
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-card bg-white px-4 py-3.5 shadow-sm">
          <span className="text-[22px] font-bold leading-tight text-forest">{MODE_NAMES[gc.mode] ?? gc.mode}</span>
          <span className="text-[11px] font-medium leading-snug text-muted-foreground">Modo</span>
          <span className="text-[11px] leading-snug text-muted-foreground">
            {gc.weekday !== null ? WEEKDAY_NAMES[gc.weekday] : 'Dia não definido'}
            {gc.time ? ` às ${gc.time.slice(0, 5)}` : ''}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-card bg-white px-4 py-3.5 shadow-sm">
          <span className="text-[22px] font-bold leading-tight text-brand">{memberCount}</span>
          <span className="text-[11px] font-medium leading-snug text-muted-foreground">Membros ativos</span>
          <span className="text-[11px] leading-snug text-muted-foreground">Participantes com status ativo</span>
        </div>
        <div className="flex flex-col gap-1 rounded-card bg-white px-4 py-3.5 shadow-sm">
          <span className="text-[22px] font-bold leading-tight text-clay">{visitorCount}</span>
          <span className="text-[11px] font-medium leading-snug text-muted-foreground">Visitantes ativos</span>
          <span className="text-[11px] leading-snug text-muted-foreground">Visitantes vinculados ao GC</span>
        </div>
        <div className="flex flex-col gap-1 rounded-card bg-white px-4 py-3.5 shadow-sm">
          <span className="text-[22px] font-bold leading-tight text-forest">{meetings.length}</span>
          <span className="text-[11px] font-medium leading-snug text-muted-foreground">Reuniões recentes</span>
          <span className="text-[11px] leading-snug text-muted-foreground">Últimas 5 reuniões registradas</span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <SectionRow title="Liderança e supervisão" />
          <p className="-mt-1 pb-3 text-[13px] leading-relaxed text-muted-foreground">
            Quem lidera e supervisiona este GC
          </p>
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Líderes</p>
              <div className="mt-2">
                {leaderList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum líder registrado.</p>
                ) : (
                  <ListGroup>
                    {leaderList.map((leader) => (
                      <ListItem
                        key={leader.id}
                        grouped
                        leading={<Avatar name={leader.people?.name ?? 'Sem nome'} />}
                        title={leader.people?.name ?? 'Sem nome'}
                        subtitle={leader.people?.email ?? 'Sem email'}
                        trailing={
                          <Badge variant="sage">
                            <Crown className="h-3 w-3" />
                            Líder
                          </Badge>
                        }
                      />
                    ))}
                  </ListGroup>
                )}
              </div>
            </div>
            <div>
              <p className="eyebrow">Supervisores</p>
              <div className="mt-2">
                {supervisorList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum supervisor registrado.</p>
                ) : (
                  <ListGroup>
                    {supervisorList.map((sup) => (
                      <ListItem
                        key={sup.id}
                        grouped
                        leading={<Avatar name={sup.people?.name ?? 'Sem nome'} />}
                        title={sup.people?.name ?? 'Sem nome'}
                        subtitle={sup.people?.email ?? 'Sem email'}
                        trailing={<Badge variant="clay">Supervisor</Badge>}
                      />
                    ))}
                  </ListGroup>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <SectionRow title="Membros" action={<Link href={addMemberHref}>+ Adicionar</Link>} />
          <p className="-mt-1 pb-3 text-[13px] leading-relaxed text-muted-foreground">
            Participantes ativos deste GC
          </p>
          {memberList.length === 0 ? (
            <EmptyState
              sunken
              icon={<Users />}
              title="Nenhum membro ativo cadastrado."
              action={
                <Button asChild size="sm">
                  <Link href={addMemberHref}>
                    <Users className="h-4 w-4" />
                    Adicionar membro
                  </Link>
                </Button>
              }
            />
          ) : (
            <ListGroup>
              {memberList.map((member) => (
                <ListItem
                  key={member.id}
                  grouped
                  leading={<Avatar name={member.people?.name ?? 'Sem nome'} />}
                  title={member.people?.name ?? 'Sem nome'}
                  subtitle={
                    <>
                      {member.people?.email ?? 'Sem email'} • {member.people?.phone ?? 'Sem telefone'}
                    </>
                  }
                />
              ))}
            </ListGroup>
          )}
          <Link
            href={allParticipantsHref}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-fast hover:text-brand-hover"
          >
            Gerir todos os participantes
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <SectionRow title="Visitantes" action={<Link href={addVisitorHref}>+ Adicionar</Link>} />
          <p className="-mt-1 pb-3 text-[13px] leading-relaxed text-muted-foreground">
            Visitantes ativos vinculados a este GC
          </p>
          {visitors.length === 0 ? (
            <EmptyState
              sunken
              icon={<UserPlus />}
              title="Nenhum visitante ativo."
              text="Quando alguém novo chegar a um encontro, registre aqui."
              action={
                <Button asChild size="sm">
                  <Link href={addVisitorHref}>
                    <UserPlus className="h-4 w-4" />
                    Adicionar visitante
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <ListGroup>
                {visitors.slice(0, 8).map((visitor) => (
                  <ListItem
                    key={visitor.id}
                    grouped
                    leading={
                      <Avatar soft="sage" aria-hidden>
                        <HandHeart className="h-5 w-5" />
                      </Avatar>
                    }
                    title={visitor.people?.name ?? 'Sem nome'}
                    subtitle={`${visitor.visit_count ?? 0} ${(visitor.visit_count ?? 0) === 1 ? 'visita' : 'visitas'}`}
                    trailing={<Badge variant="sage">Visitante</Badge>}
                  />
                ))}
              </ListGroup>
              <Link
                href="/visitors"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-fast hover:text-brand-hover"
              >
                Gerir visitantes e conversões
                <ChevronRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <div className="min-w-0">
          <SectionRow title="Últimas reuniões" action={<Link href={`/meetings?gcId=${gc.id}`}>Ver todas</Link>} />
          <p className="-mt-1 pb-3 text-[13px] leading-relaxed text-muted-foreground">
            Histórico recente com presenças
          </p>
          {meetings.length === 0 ? (
            <EmptyState
              sunken
              icon={<Calendar />}
              title="Nenhuma reunião registrada."
              action={
                <Button asChild size="sm">
                  <Link href={newMeetingHref}>
                    <Calendar className="h-4 w-4" />
                    Registrar reunião
                  </Link>
                </Button>
              }
            />
          ) : (
            <ListGroup>
              {meetings.map((meeting) => {
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
                    href={`/meetings/${meeting.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
                  >
                    <Avatar soft="paper">
                      <Calendar className="h-5 w-5" />
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[14.5px] font-bold leading-tight text-foreground">
                          {meeting.lesson_title || 'Reunião'}
                        </p>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(meeting.datetime).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>Membros: {memberAttendance}</span>
                        <span>Visitantes: {visitorAttendance}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </ListGroup>
          )}
        </div>
      </section>
    </main>
  );
}
