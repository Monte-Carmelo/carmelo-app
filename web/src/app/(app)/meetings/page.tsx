import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Users, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Loading } from '@/components/ui/spinner';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'danger' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  completed: { label: 'Realizada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

type SearchParams = {
  gcId?: string;
};

async function MeetingsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const meetingsQuery = supabase
    .from('meetings')
    .select(
      `id, gc_id, datetime, lesson_title, comments, status,
       growth_groups ( name ),
       meeting_member_attendance ( id ),
       meeting_visitor_attendance ( id )`
    )
    .is('deleted_at', null)
    .order('datetime', { ascending: false })
    .limit(20);

  if (searchParams.gcId && searchParams.gcId !== 'all') {
    meetingsQuery.eq('gc_id', searchParams.gcId);
  }

  const [groupsResult, meetingsResult] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true }),
    meetingsQuery,
  ]);

  if (meetingsResult.error) {
    throw meetingsResult.error;
  }

  const filteredMeetings = meetingsResult.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 bg-background px-4 py-10">
      <ScreenHeader
        className="flex-col gap-4 md:flex-row md:items-start"
        title="Reuniões"
        subtitle="Acompanhe as reuniões registradas recentemente, com destaque para presença de membros e visitantes."
        action={
          <Button asChild>
            <Link href="/meetings/new">
              <Calendar className="mr-2 h-4 w-4" />
              Registrar nova reunião
            </Link>
          </Button>
        }
      />

      <div className="rounded-card bg-white p-5 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="gcId" className="text-xs font-semibold text-muted-foreground">
              Filtrar por GC
            </Label>
            <Select name="gcId" defaultValue={searchParams.gcId ?? 'all'}>
              <SelectTrigger id="gcId">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(groupsResult.data ?? []).map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Aplicar filtro
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {filteredMeetings.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="Nenhuma reunião encontrada para o filtro selecionado."
          />
        ) : (
          filteredMeetings.map((meeting) => {
            const memberCount = Array.isArray(meeting.meeting_member_attendance)
              ? meeting.meeting_member_attendance.length
              : 0;
            const visitorCount = Array.isArray(meeting.meeting_visitor_attendance)
              ? meeting.meeting_visitor_attendance.length
              : 0;

            const statusCfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.scheduled;
            const meetingDate = new Date(meeting.datetime);
            const weekdayLabel = meetingDate
              .toLocaleDateString('pt-BR', { weekday: 'short' })
              .replace('.', '');
            const monthLabel = meetingDate
              .toLocaleDateString('pt-BR', { month: 'short' })
              .replace('.', '');

            return (
              <div key={meeting.id} className="flex items-stretch gap-3">
                <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-brand-soft py-2 text-brand-soft-fg">
                  <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-75">
                    {weekdayLabel}
                  </span>
                  <span className="text-[22px] font-bold leading-none">
                    {meetingDate.getDate()}
                  </span>
                  <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-75">
                    {monthLabel}
                  </span>
                </div>

                <div className="min-w-0 flex-1 rounded-card bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-muted-foreground">
                    {meeting.growth_groups?.name ?? 'GC desconhecido'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="text-[14.5px] font-bold leading-tight text-foreground">
                      {meeting.lesson_title}
                    </div>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {meetingDate.toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
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
                    {meeting.comments ? (
                      <div className="col-span-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Comentários</p>
                        <p className="text-sm text-foreground">{meeting.comments}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  return (
    <Suspense fallback={<Loading />}>
      <MeetingsContent searchParams={resolvedParams} />
    </Suspense>
  );
}
