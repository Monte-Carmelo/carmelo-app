import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, House, Plus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getParticipantManagementScope, listGrowthGroups } from '@/lib/api/participants';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SectionRow } from '@/components/ui/section-row';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Loading } from '@/components/ui/spinner';

type SearchParams = { gcId?: string };

type Meeting = {
  id: string;
  gc_id: string | null;
  datetime: string;
  lesson_title: string;
  status: string;
  growth_groups?: { name?: string | null } | null;
  meeting_member_attendance?: { id: string }[] | null;
};

const SP = 'America/Sao_Paulo';

function presentCount(m: Meeting) {
  return Array.isArray(m.meeting_member_attendance) ? m.meeting_member_attendance.length : 0;
}

function parts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: SP }).replace('.', ''),
    day: d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: SP }),
    month: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: SP }).replace('.', ''),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: SP }),
  };
}

function MeetingRow({
  meeting,
  tone,
  showGc,
}: {
  meeting: Meeting;
  tone: 'next' | 'upcoming' | 'past';
  showGc: boolean;
}) {
  const p = parts(meeting.datetime);
  const present = presentCount(meeting);
  const registered = present > 0 || meeting.status === 'completed';
  const chipClass =
    tone === 'next'
      ? 'bg-brand text-white shadow-brand'
      : tone === 'upcoming'
        ? 'bg-brand-soft text-brand-soft-fg'
        : 'bg-paper-deep text-slate-500';

  return (
    <Link href={`/meetings/${meeting.id}`} className="flex items-stretch gap-3.5">
      <div
        className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${chipClass}`}
      >
        <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-80">
          {p.weekday}
        </span>
        <span className="my-1 text-[22px] font-bold leading-none">{p.day}</span>
        <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] opacity-80">
          {p.month}
        </span>
      </div>
      <div className="min-w-0 flex-1 rounded-card bg-white px-4 py-3 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/40">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-medium leading-none text-muted-foreground">{p.time}</span>
          {tone === 'next' && <Badge variant="info">É o próximo</Badge>}
          {tone === 'past' &&
            (registered ? (
              <Badge variant="success">
                {present} {present === 1 ? 'presente' : 'presentes'}
              </Badge>
            ) : (
              <Badge variant="warn">Registrar presença</Badge>
            ))}
        </div>
        <h4 className="truncate text-[14.5px] font-bold leading-tight text-foreground">
          {meeting.lesson_title}
        </h4>
        {showGc && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <House className="h-3 w-3 shrink-0" />
            {meeting.growth_groups?.name ?? 'GC'}
          </p>
        )}
      </div>
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

  // Escopo de permissão: admin vê tudo; demais veem só os GCs que gerenciam
  // (líder ou supervisor) — mesma regra de getParticipantManagementScope.
  const scope = await getParticipantManagementScope(supabase, user.id);
  const groups = scope.isAdmin
    ? await listGrowthGroups(supabase)
    : await listGrowthGroups(supabase, { gcIds: scope.managedGcIds });

  const accessible = new Set(groups.map((g) => g.id));
  const requested = searchParams.gcId;
  let selectedGcId: string | null;
  if (requested && requested !== 'all' && accessible.has(requested)) {
    selectedGcId = requested;
  } else if (requested === 'all') {
    selectedGcId = null;
  } else {
    // Sem parâmetro (ex.: vindo da tab bar): abre no GC do usuário quando há só um.
    selectedGcId = groups.length === 1 ? groups[0].id : null;
  }

  const hasScope = scope.isAdmin || groups.length > 0;

  let upcoming: Meeting[] = [];
  let past: Meeting[] = [];
  if (hasScope) {
    const baseSelect =
      'id, gc_id, datetime, lesson_title, status, growth_groups ( name ), meeting_member_attendance ( id )';

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

    // Escopo aplicado em ambas as queries (admin sem escopo vê tudo)
    if (selectedGcId) {
      upcomingQuery.eq('gc_id', selectedGcId);
      pastQuery.eq('gc_id', selectedGcId);
    } else if (!scope.isAdmin) {
      upcomingQuery.in('gc_id', scope.managedGcIds);
      pastQuery.in('gc_id', scope.managedGcIds);
    }

    const [upcomingResult, pastResult] = await Promise.all([upcomingQuery, pastQuery]);

    if (upcomingResult.error) throw upcomingResult.error;
    if (pastResult.error) throw pastResult.error;
    upcoming = (upcomingResult.data ?? []) as Meeting[];
    past = (pastResult.data ?? []) as Meeting[];
  }

  const selectedGroup = selectedGcId ? (groups.find((g) => g.id === selectedGcId) ?? null) : null;
  const showGc = selectedGcId === null && groups.length > 1;
  const eyebrow =
    selectedGroup?.name ??
    (groups.length === 1 ? groups[0].name : scope.isAdmin ? 'Todos os GCs' : 'Seus GCs');
  const allLabel = scope.isAdmin ? 'Todos os GCs' : 'Todos os meus GCs';
  const newMeetingHref = selectedGcId ? `/meetings/new?gcId=${selectedGcId}` : '/meetings/new';
  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
      <ScreenHeader
        eyebrow={eyebrow}
        title="Encontros"
        subtitle="Próximos encontros e o histórico de presença."
        action={
          <Button asChild>
            <Link href={newMeetingHref}>
              <Plus className="h-4 w-4" />
              Novo encontro
            </Link>
          </Button>
        }
      />

      {groups.length > 1 && (
        <form className="mt-2 flex flex-wrap items-end gap-3 rounded-card bg-white p-4 shadow-sm">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="gcId" className="text-xs font-semibold text-muted-foreground">
              Filtrar por GC
            </Label>
            <Select name="gcId" defaultValue={selectedGcId ?? 'all'}>
              <SelectTrigger id="gcId">
                <SelectValue placeholder={allLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{allLabel}</SelectItem>
                {groups.map((group) => (
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

      {!hasScope ? (
        <div className="pt-4">
          <EmptyState
            icon={<Calendar />}
            title="Você ainda não administra encontros"
            text="Quando a liderança te vincular a um GC como líder ou supervisor, os encontros aparecem aqui."
          />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<Calendar />}
          title="Nenhum encontro ainda"
          text="Marque o primeiro encontro pra começar a registrar presença e visitantes."
          action={
            <Button asChild>
              <Link href={newMeetingHref}>
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
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    tone={index === 0 ? 'next' : 'upcoming'}
                    showGc={showGc}
                  />
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
            <div className="space-y-3">
              {past.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} tone="past" showGc={showGc} />
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
