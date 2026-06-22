import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Check, House, NotebookPen, Plus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SectionRow } from '@/components/ui/section-row';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Loading } from '@/components/ui/spinner';

type SearchParams = { gcId?: string };

type MeetingRow = {
  id: string;
  gc_id: string | null;
  datetime: string;
  lesson_title: string;
  status: string;
  growth_groups?: { name?: string | null } | null;
  meeting_member_attendance?: { id: string }[] | null;
  meeting_visitor_attendance?: { id: string }[] | null;
};

const SP = 'America/Sao_Paulo';

function presentCount(m: MeetingRow) {
  return Array.isArray(m.meeting_member_attendance) ? m.meeting_member_attendance.length : 0;
}

function parts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: SP }).replace('.', ''),
    day: d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: SP }),
    month: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: SP }).replace('.', ''),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: SP }),
    shortDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: SP }).replace('.', ''),
  };
}

function UpcomingRow({ meeting, isNext }: { meeting: MeetingRow; isNext: boolean }) {
  const p = parts(meeting.datetime);
  return (
    <Link href={`/meetings/${meeting.id}`} className="flex items-stretch gap-3.5">
      <div
        className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${
          isNext ? 'bg-brand text-white shadow-brand' : 'bg-brand-soft text-brand-soft-fg'
        }`}
      >
        <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-75">
          {p.weekday}
        </span>
        <span className="my-1 text-[22px] font-bold leading-none">{p.day}</span>
        <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-75">
          {p.month}
        </span>
      </div>
      <div className="min-w-0 flex-1 rounded-card bg-white px-4 py-3 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/40">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-medium leading-none text-muted-foreground">{p.time}</span>
          {isNext && <Badge variant="info">É o próximo</Badge>}
        </div>
        <h4 className="truncate text-[14.5px] font-bold leading-tight text-foreground">
          {meeting.lesson_title}
        </h4>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <House className="h-3 w-3 shrink-0" />
          {meeting.growth_groups?.name ?? 'GC'}
        </p>
      </div>
    </Link>
  );
}

function PastRow({ meeting }: { meeting: MeetingRow }) {
  const p = parts(meeting.datetime);
  const present = presentCount(meeting);
  const registered = present > 0 || meeting.status === 'completed';
  return (
    <Link href={`/meetings/${meeting.id}`} className="block">
      <ListItem
        className="transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
        leading={
          <Avatar soft={registered ? 'paper' : 'warn'} size="md" aria-hidden>
            {registered ? <Check className="h-5 w-5" /> : <NotebookPen className="h-5 w-5" />}
          </Avatar>
        }
        title={meeting.lesson_title}
        subtitle={`${meeting.growth_groups?.name ?? 'GC'} · ${p.shortDate}`}
        trailing={
          registered ? (
            <Badge variant="success">{present} {present === 1 ? 'presente' : 'presentes'}</Badge>
          ) : (
            <Badge variant="warn">Registrar presença</Badge>
          )
        }
      />
    </Link>
  );
}

async function MeetingsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const gcFilter = searchParams.gcId && searchParams.gcId !== 'all' ? searchParams.gcId : null;

  const baseSelect =
    'id, gc_id, datetime, lesson_title, status, growth_groups ( name ), meeting_member_attendance ( id ), meeting_visitor_attendance ( id )';

  const upcomingQuery = supabase
    .from('meetings')
    .select(baseSelect)
    .is('deleted_at', null)
    .eq('status', 'scheduled')
    .gte('datetime', nowIso)
    .order('datetime', { ascending: true })
    .limit(10);

  const pastQuery = supabase
    .from('meetings')
    .select(baseSelect)
    .is('deleted_at', null)
    .lt('datetime', nowIso)
    .order('datetime', { ascending: false })
    .limit(15);

  if (gcFilter) {
    upcomingQuery.eq('gc_id', gcFilter);
    pastQuery.eq('gc_id', gcFilter);
  }

  const [groupsResult, upcomingResult, pastResult] = await Promise.all([
    supabase.from('growth_groups').select('id, name').order('name', { ascending: true }),
    upcomingQuery,
    pastQuery,
  ]);

  if (upcomingResult.error) throw upcomingResult.error;
  if (pastResult.error) throw pastResult.error;

  const upcoming = (upcomingResult.data ?? []) as MeetingRow[];
  const past = (pastResult.data ?? []) as MeetingRow[];
  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
      <ScreenHeader
        eyebrow="Seu GC"
        title="Encontros"
        subtitle="Próximos encontros e o histórico de presença."
        action={
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="h-4 w-4" />
              Novo encontro
            </Link>
          </Button>
        }
      />

      {(groupsResult.data?.length ?? 0) > 1 && (
        <form className="mt-2 flex flex-wrap items-end gap-3 rounded-card bg-white p-4 shadow-sm">
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
            Aplicar
          </Button>
        </form>
      )}

      {isEmpty ? (
        <EmptyState
          icon={<Calendar />}
          title="Nenhum encontro ainda"
          text="Marque o primeiro encontro pra começar a registrar presença e visitantes."
          action={
            <Button asChild>
              <Link href="/meetings/new">
                <Plus className="h-4 w-4" />
                Novo encontro
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <SectionRow title="Próximos" />
              <div className="space-y-3">
                {upcoming.map((meeting, index) => (
                  <UpcomingRow key={meeting.id} meeting={meeting} isNext={index === 0} />
                ))}
              </div>
            </>
          )}

          <SectionRow title="Anteriores" />
          {past.length === 0 ? (
            <div className="rounded-card bg-white px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
              Nenhum encontro anterior registrado.
            </div>
          ) : (
            <div className="space-y-2">
              {past.map((meeting) => (
                <PastRow key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-4" />
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
