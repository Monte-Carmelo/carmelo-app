import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type LeaderGrowthGroup = {
  id: string;
  name: string;
  mode: string;
  address: string | null;
  weekday: number | null;
  time: string | null;
  status: string;
  userRole: string;
  memberCount: number;
  visitorCount: number;
};

export type LeaderUpcomingMeeting = {
  id: string;
  gcId: string;
  gcName: string;
  lessonTitle: string;
  datetime: string;
  comments: string | null;
};

export type LeaderDashboardMetrics = {
  meetingsCurrentMonth: number;
  averageAttendance: number;
  conversions30d: number;
  conversionRatePct: number;
};

export type LeaderDashboardData = {
  groups: LeaderGrowthGroup[];
  upcomingMeetings: LeaderUpcomingMeeting[];
  metrics: LeaderDashboardMetrics;
};

const EMPTY_LEADER_DASHBOARD_METRICS: LeaderDashboardMetrics = {
  meetingsCurrentMonth: 0,
  averageAttendance: 0,
  conversions30d: 0,
  conversionRatePct: 0,
};

export function getEmptyLeaderDashboardData(): LeaderDashboardData {
  return {
    groups: [],
    upcomingMeetings: [],
    metrics: EMPTY_LEADER_DASHBOARD_METRICS,
  };
}

async function getCurrentPersonId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.person_id) {
    return null;
  }

  return data.person_id;
}

export async function getLeaderDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LeaderDashboardData> {
  const personId = await getCurrentPersonId(supabase, userId);
  if (!personId) {
    return getEmptyLeaderDashboardData();
  }

  const { data: participations, error: participationsError } = await supabase
    .from('growth_group_participants')
    .select('gc_id, role')
    .eq('person_id', personId)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (participationsError || !participations?.length) {
    return getEmptyLeaderDashboardData();
  }

  const gcIds = participations.map((row) => row.gc_id);
  const gcRoleMap = new Map(participations.map((row) => [row.gc_id, row.role]));

  const { data: groupsData, error: groupsError } = await supabase
    .from('growth_groups')
    .select('id, name, mode, address, weekday, time, status')
    .in('id', gcIds)
    .neq('status', 'inactive')
    .order('name', { ascending: true });

  if (groupsError || !groupsData) {
    return getEmptyLeaderDashboardData();
  }

  const activeGcIds = groupsData.map((group) => group.id);

  if (activeGcIds.length === 0) {
    return getEmptyLeaderDashboardData();
  }

  const groups: LeaderGrowthGroup[] = await Promise.all(
    groupsData.map(async (group) => {
      const [{ count: memberCount }, { count: visitorCount }] = await Promise.all([
        supabase
          .from('growth_group_participants')
          .select('*', { count: 'exact', head: true })
          .eq('gc_id', group.id)
          .eq('status', 'active')
          .is('deleted_at', null),
        supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true })
          .eq('gc_id', group.id)
          .eq('status', 'active'),
      ]);

      return {
        id: group.id,
        name: group.name,
        mode: group.mode,
        address: group.address,
        weekday: group.weekday,
        time: group.time,
        status: group.status,
        userRole: gcRoleMap.get(group.id) ?? 'member',
        memberCount: memberCount ?? 0,
        visitorCount: visitorCount ?? 0,
      };
    }),
  );

  const { data: metricsRows } = await supabase
    .from('dashboard_metrics')
    .select('meetings_current_month, average_attendance, conversions_30d, conversion_rate_pct')
    .in('gc_id', activeGcIds);

  const metrics: LeaderDashboardMetrics = {
    meetingsCurrentMonth: (metricsRows ?? []).reduce(
      (total, row) => total + (row.meetings_current_month ?? 0),
      0,
    ),
    averageAttendance:
      (metricsRows ?? []).length > 0
        ? (metricsRows ?? []).reduce(
            (total, row) => total + (row.average_attendance ?? 0),
            0,
          ) / (metricsRows ?? []).length
        : 0,
    conversions30d: (metricsRows ?? []).reduce(
      (total, row) => total + (row.conversions_30d ?? 0),
      0,
    ),
    conversionRatePct:
      (metricsRows ?? []).length > 0
        ? (metricsRows ?? []).reduce(
            (total, row) => total + (row.conversion_rate_pct ?? 0),
            0,
          ) / (metricsRows ?? []).length
        : 0,
  };

  const { data: meetingsData } = await supabase
    .from('meetings')
    .select('id, gc_id, lesson_title, datetime, comments, growth_groups(name)')
    .in('gc_id', activeGcIds)
    .is('deleted_at', null)
    .eq('status', 'scheduled')
    .gte('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(6);

  const upcomingMeetings: LeaderUpcomingMeeting[] = (meetingsData ?? []).map((meeting) => {
    const group = meeting.growth_groups;
    const gcName =
      group && typeof group === 'object' && 'name' in group && typeof group.name === 'string'
        ? group.name
        : 'GC';

    return {
      id: meeting.id,
      gcId: meeting.gc_id,
      gcName,
      lessonTitle: meeting.lesson_title,
      datetime: meeting.datetime,
      comments: meeting.comments,
    };
  });

  return {
    groups,
    upcomingMeetings,
    metrics,
  };
}

export type LeaderHomeGc = {
  id: string;
  name: string;
  mode: string;
  weekday: number | null;
  time: string | null;
  memberCount: number;
  visitorCount: number;
};

export type LeaderHomeData = {
  leaderName: string | null;
  /** GCs que a pessoa lidera (role=leader) — para administração direta na Home */
  ledGcs: LeaderHomeGc[];
  nextMeeting: {
    id: string;
    gcId: string;
    gcName: string;
    lessonTitle: string;
    datetime: string;
    weekday: number | null;
    time: string | null;
    address: string | null;
    memberCount: number;
  } | null;
  /** Nomes (até 6) dos membros do GC do próximo encontro, para a pilha de avatares */
  memberNames: string[];
  currentSeries: {
    name: string;
    currentOrder: number;
    totalLessons: number;
    nextLessonTitle: string | null;
  } | null;
};

/**
 * Dados da Home do líder no layout do kit (claude design): hero do próximo
 * encontro + pilha de avatares + progresso da série atual.
 */
export async function getLeaderHomeData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LeaderHomeData> {
  const personId = await getCurrentPersonId(supabase, userId);

  let leaderName: string | null = null;
  if (personId) {
    const { data: person } = await supabase
      .from('people')
      .select('name')
      .eq('id', personId)
      .maybeSingle();
    leaderName = person?.name ?? null;
  }

  const empty: LeaderHomeData = {
    leaderName,
    ledGcs: [],
    nextMeeting: null,
    memberNames: [],
    currentSeries: null,
  };

  if (!personId) return empty;

  const { data: participations } = await supabase
    .from('growth_group_participants')
    .select('gc_id, role')
    .eq('person_id', personId)
    .eq('status', 'active')
    .is('deleted_at', null);

  const gcIds = (participations ?? []).map((row) => row.gc_id);
  if (gcIds.length === 0) return empty;

  // GCs que a pessoa lidera (role=leader) — para administração direta na Home
  const ledGcIds = Array.from(
    new Set((participations ?? []).filter((row) => row.role === 'leader').map((row) => row.gc_id)),
  );
  let ledGcs: LeaderHomeGc[] = [];
  if (ledGcIds.length > 0) {
    const { data: gcRows } = await supabase
      .from('growth_groups')
      .select('id, name, mode, weekday, time, status')
      .in('id', ledGcIds)
      .neq('status', 'inactive')
      .order('name', { ascending: true });
    ledGcs = await Promise.all(
      (
        (gcRows ?? []) as Array<{
          id: string;
          name: string;
          mode: string;
          weekday: number | null;
          time: string | null;
        }>
      ).map(async (g) => {
        const [{ count: memberCount }, { count: visitorCount }] = await Promise.all([
          supabase
            .from('growth_group_participants')
            .select('*', { count: 'exact', head: true })
            .eq('gc_id', g.id)
            .eq('status', 'active')
            .is('deleted_at', null),
          supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('gc_id', g.id)
            .eq('status', 'active'),
        ]);
        return {
          id: g.id,
          name: g.name,
          mode: g.mode,
          weekday: g.weekday,
          time: g.time,
          memberCount: memberCount ?? 0,
          visitorCount: visitorCount ?? 0,
        };
      }),
    );
  }

  const { data: meetingRows } = await supabase
    .from('meetings')
    .select('id, gc_id, lesson_title, lesson_template_id, datetime, growth_groups(name, weekday, time, address)')
    .in('gc_id', gcIds)
    .is('deleted_at', null)
    .eq('status', 'scheduled')
    .gte('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(1);

  const meeting = meetingRows?.[0];
  if (!meeting) return { ...empty, ledGcs };

  const gc = (meeting.growth_groups ?? null) as {
    name?: string | null;
    weekday?: number | null;
    time?: string | null;
    address?: string | null;
  } | null;

  const { data: memberRows, count: memberCount } = await supabase
    .from('growth_group_participants')
    .select('people(name)', { count: 'exact' })
    .eq('gc_id', meeting.gc_id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .limit(6);

  const memberNames = ((memberRows ?? []) as Array<{ people?: { name?: string | null } | null }>)
    .map((row) => row.people?.name ?? null)
    .filter((name): name is string => Boolean(name));

  let currentSeries: LeaderHomeData['currentSeries'] = null;
  if (meeting.lesson_template_id) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('series_id, order_in_series, lesson_series(name)')
      .eq('id', meeting.lesson_template_id)
      .maybeSingle();

    const seriesId = (lesson as { series_id?: string | null } | null)?.series_id ?? null;
    if (seriesId) {
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('series_id', seriesId)
        .is('deleted_at', null);

      const seriesRel = (lesson as { lesson_series?: { name?: string | null } | null } | null)
        ?.lesson_series;

      currentSeries = {
        name: seriesRel?.name ?? 'Série atual',
        currentOrder:
          (lesson as { order_in_series?: number | null } | null)?.order_in_series ?? 1,
        totalLessons: totalLessons ?? 0,
        nextLessonTitle: meeting.lesson_title,
      };
    }
  }

  return {
    leaderName,
    ledGcs,
    nextMeeting: {
      id: meeting.id,
      gcId: meeting.gc_id,
      gcName: gc?.name ?? 'GC',
      lessonTitle: meeting.lesson_title,
      datetime: meeting.datetime,
      weekday: gc?.weekday ?? null,
      time: gc?.time ?? null,
      address: gc?.address ?? null,
      memberCount: memberCount ?? memberNames.length,
    },
    memberNames,
    currentSeries,
  };
}
