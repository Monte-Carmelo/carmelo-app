import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Users, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/spinner';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Agendada', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Realizada', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
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
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-muted-foreground">
            Acompanhe as reuniões registradas recentemente, com destaque para presença de membros e visitantes.
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <Calendar className="mr-2 h-4 w-4" />
            Registrar nova reunião
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="gcId">Filtrar por GC</Label>
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
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma reunião encontrada para o filtro selecionado.</p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => {
            const memberCount = Array.isArray(meeting.meeting_member_attendance)
              ? meeting.meeting_member_attendance.length
              : 0;
            const visitorCount = Array.isArray(meeting.meeting_visitor_attendance)
              ? meeting.meeting_visitor_attendance.length
              : 0;

            const statusCfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.scheduled;

            return (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardDescription className="mb-1">
                        {meeting.growth_groups?.name ?? 'GC desconhecido'}
                      </CardDescription>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{meeting.lesson_title}</CardTitle>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
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
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                        <p className="text-sm">{meeting.comments}</p>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
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
