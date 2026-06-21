import { Suspense } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  HeartHandshake,
  Sparkles,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionRow } from '@/components/ui/section-row';
import { ListItem } from '@/components/ui/list-item';
import { Avatar } from '@/components/ui/avatar';
import { KpiCard } from '@/components/ui/kpi-card';
import { Loading } from '@/components/ui/spinner';

const DAY_MS = 24 * 60 * 60 * 1000;

function greetingFor(now: Date) {
  const hour = Number(
    now.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }),
  );
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(fullName: string | null | undefined) {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

function weeksSince(dateIso: string | null, now: Date) {
  if (!dateIso) return null;
  const diff = now.getTime() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diff / (7 * DAY_MS)));
}

function relativeDate(dateIso: string, now: Date) {
  const diffDays = Math.floor((now.getTime() - new Date(dateIso).getTime()) / DAY_MS);
  if (diffDays <= 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  return new Date(dateIso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

async function countMultiplications(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sinceIso: string,
): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from('gc_multiplication_events')
      .select('id', { count: 'exact', head: true })
      .gte('multiplied_at', sinceIso);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

type AttentionAlert = {
  id: string;
  tone: 'warn' | 'info';
  title: string;
  subtitle: string;
  href: string;
};

async function AdminDashboardContent() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser();
  const now = new Date();
  const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const since120Iso = new Date(now.getTime() - 120 * DAY_MS).toISOString();
  const since90Iso = new Date(now.getTime() - 90 * DAY_MS).toISOString();

  const [
    gcsActiveResult,
    membersActiveResult,
    visitorsActiveResult,
    gcsThisMonthResult,
    membersThisMonthResult,
    visitorsThisMonthResult,
    activeGcsResult,
    recentMeetingsResult,
    awaitingVisitorsResult,
    profileResult,
    multiplications90,
  ] = await Promise.all([
    supabase.from('growth_groups').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
    supabase.from('growth_group_participants').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
    supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('growth_groups').select('id', { count: 'exact', head: true }).gte('created_at', monthStartIso).is('deleted_at', null),
    supabase.from('growth_group_participants').select('id', { count: 'exact', head: true }).gte('joined_at', monthStartIso).eq('status', 'active').is('deleted_at', null),
    supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('created_at', monthStartIso),
    supabase.from('growth_groups').select('id, name').eq('status', 'active').is('deleted_at', null),
    supabase
      .from('meetings')
      .select('gc_id, datetime, lesson_title, growth_groups(name)')
      .gte('datetime', since120Iso)
      .is('deleted_at', null)
      .order('datetime', { ascending: false }),
    supabase
      .from('visitors')
      .select('id, people(name)')
      .eq('status', 'active')
      .is('gc_id', null)
      .order('created_at', { ascending: false }),
    user
      ? supabase.from('users').select('people(name)').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    countMultiplications(supabase, since90Iso),
  ]);

  const metrics = {
    activeGcs: gcsActiveResult.count ?? 0,
    activeMembers: membersActiveResult.count ?? 0,
    activeVisitors: visitorsActiveResult.count ?? 0,
    newGcs: gcsThisMonthResult.count ?? 0,
    newMembers: membersThisMonthResult.count ?? 0,
    newVisitors: visitorsThisMonthResult.count ?? 0,
  };

  const pastorName =
    firstName((profileResult.data as { people?: { name?: string } | null } | null)?.people?.name) ??
    null;

  // ── Latest meeting per GC (from the 120-day window) ──────────────────────
  const recentMeetings = (recentMeetingsResult.data ?? []) as Array<{
    gc_id: string | null;
    datetime: string | null;
    lesson_title: string | null;
    growth_groups?: { name?: string | null } | null;
  }>;
  const lastMeetingByGc = new Map<string, string>();
  for (const meeting of recentMeetings) {
    if (meeting.gc_id && meeting.datetime && !lastMeetingByGc.has(meeting.gc_id)) {
      lastMeetingByGc.set(meeting.gc_id, meeting.datetime);
    }
  }

  const activeGcs = (activeGcsResult.data ?? []) as Array<{ id: string; name: string }>;
  const staleGcs = activeGcs
    .map((gc) => ({ gc, weeks: weeksSince(lastMeetingByGc.get(gc.id) ?? null, now) }))
    // weeks === null → no meeting in 120 days (very silent); treat as most stale
    .map((entry) => ({ ...entry, sortWeeks: entry.weeks ?? 99 }))
    .filter((entry) => entry.sortWeeks >= 3)
    .sort((a, b) => b.sortWeeks - a.sortWeeks)
    .slice(0, 4);

  const awaitingVisitors = (awaitingVisitorsResult.data ?? []) as Array<{
    id: string;
    people?: { name?: string | null } | null;
  }>;

  const alerts: AttentionAlert[] = [];
  for (const { gc, weeks } of staleGcs) {
    alerts.push({
      id: `gc-${gc.id}`,
      tone: 'warn',
      title: gc.name,
      subtitle:
        weeks === null
          ? 'Sem encontro registrado nos últimos meses'
          : `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} sem encontro registrado`,
      href: `/admin/growth-groups/${gc.id}/edit`,
    });
  }
  if (awaitingVisitors.length > 0) {
    alerts.push({
      id: 'awaiting-visitors',
      tone: 'info',
      title: `${awaitingVisitors.length} ${awaitingVisitors.length === 1 ? 'visitante aguardando' : 'visitantes aguardando'} designação`,
      subtitle: 'Conecte cada um a um GC próximo da residência',
      href: '/visitors',
    });
  }

  // ── Recent meetings feed ─────────────────────────────────────────────────
  const meetingsFeed = recentMeetings.slice(0, 5);

  return (
    <div className="space-y-2">
      <ScreenHeader
        eyebrow={`${greetingFor(now)}${pastorName ? `, ${pastorName}` : ''}`}
        title="Sua igreja em um relance"
        subtitle={`${metrics.activeGcs} GCs ativos · ${metrics.activeMembers} pessoas em comunhão`}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-4 lg:grid-cols-4">
        <KpiCard
          label="GCs ativos"
          value={metrics.activeGcs}
          delta={metrics.newGcs > 0 ? `+${metrics.newGcs} este mês` : 'estável'}
          deltaTone={metrics.newGcs > 0 ? 'success' : 'neutral'}
          deltaDirection={metrics.newGcs > 0 ? 'up' : 'none'}
        />
        <KpiCard
          label="Pessoas em GCs"
          value={metrics.activeMembers}
          delta={metrics.newMembers > 0 ? `+${metrics.newMembers} este mês` : 'estável'}
          deltaTone={metrics.newMembers > 0 ? 'success' : 'neutral'}
          deltaDirection={metrics.newMembers > 0 ? 'up' : 'none'}
        />
        <KpiCard
          label="Visitantes ativos"
          value={metrics.activeVisitors}
          delta={metrics.newVisitors > 0 ? `+${metrics.newVisitors} este mês` : 'estável'}
          deltaTone={metrics.newVisitors > 0 ? 'success' : 'neutral'}
          deltaDirection={metrics.newVisitors > 0 ? 'up' : 'none'}
        />
        <KpiCard
          label="Multiplicações"
          value={multiplications90 ?? '—'}
          delta={multiplications90 != null ? 'em 90 dias' : 'sem registro'}
          deltaTone="neutral"
          deltaIcon={multiplications90 ? <Sparkles className="h-3 w-3" aria-hidden /> : undefined}
        />
      </div>

      {/* Attention */}
      <SectionRow title="Precisa da sua atenção" />
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-card bg-white px-4 py-4 shadow-sm">
          <Avatar soft="brand" size="md" aria-hidden>
            <HeartHandshake className="h-5 w-5" />
          </Avatar>
          <div className="min-w-0">
            <h4 className="text-[14.5px] font-bold leading-tight text-foreground">
              Tudo em ordem por aqui
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nenhum GC silencioso e nenhum visitante esperando. Bom trabalho de cuidado.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Link key={alert.id} href={alert.href} className="block">
              <ListItem
                className="transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
                leading={
                  <Avatar soft={alert.tone === 'warn' ? 'warn' : 'brand'} size="md" aria-hidden>
                    {alert.tone === 'warn' ? (
                      <TriangleAlert className="h-5 w-5" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                  </Avatar>
                }
                title={alert.title}
                subtitle={alert.subtitle}
                caret
              />
            </Link>
          ))}
        </div>
      )}

      {/* Recent meetings */}
      <SectionRow
        title="Atividade recente"
        action={<Link href="/admin/reports">Ver relatórios</Link>}
      />
      {meetingsFeed.length === 0 ? (
        <div className="rounded-card bg-white px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum encontro registrado nos últimos meses.
        </div>
      ) : (
        <div className="space-y-2">
          {meetingsFeed.map((meeting, index) => (
            <ListItem
              key={`${meeting.gc_id ?? 'gc'}-${index}`}
              leading={
                <Avatar soft="paper" size="md" aria-hidden>
                  <CalendarClock className="h-5 w-5" />
                </Avatar>
              }
              title={meeting.lesson_title ?? 'Encontro registrado'}
              subtitle={`${meeting.growth_groups?.name ?? 'GC'} · ${
                meeting.datetime ? relativeDate(meeting.datetime, now) : ''
              }`}
            />
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading message="Carregando painel…" />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
