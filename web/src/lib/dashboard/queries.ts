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
    .order('name', { ascending: true });

  if (groupsError || !groupsData) {
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
    .in('gc_id', gcIds);

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
    .in('gc_id', gcIds)
    .is('deleted_at', null)
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
