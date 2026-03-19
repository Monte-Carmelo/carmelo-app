import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type AppSupabaseClient = SupabaseClient<Database>;

export interface ReportsMetrics {
  totalGcs: number;
  activeGcs: number;
  totalMembers: number;
  activeMembers: number;
  totalVisitors: number;
  conversionRate: number;
}

export interface GrowthData {
  month: string;
  members: number;
  gcs: number;
}

export interface DistributionData {
  name: string;
  value: number;
}

export interface TopGCData {
  name: string;
  members: number;
}

export interface AttendanceMetrics {
  totalMeetings: number;
  totalAttendances: number;
  totalPossibleAttendances: number;
  overallAttendanceRate: number;
  mostAttendedGC: string;
  leastAttendedGC: string;
  topAttendee: string;
  lowAttendee: string;
}

export interface GCAttendance {
  gcName: string;
  totalMeetings: number;
  totalAttendances: number;
  attendanceRate: number;
  membersCount: number;
}

export interface MemberAttendance {
  memberName: string;
  gcName: string;
  attendedMeetings: number;
  totalMeetings: number;
  attendanceRate: number;
}

export interface ConversionMetrics {
  totalVisitors: number;
  convertedVisitors: number;
  conversionRate: number;
  avgConversionTime: number;
  conversionsThisMonth: number;
  topConvertingGC: string;
  totalConversionsAllTime: number;
}

export interface MonthlyConversions {
  month: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

export interface GCConversions {
  gcName: string;
  totalVisitors: number;
  conversions: number;
  conversionRate: number;
}

export interface RecentConversion {
  visitorName: string;
  gcName: string;
  conversionDate: string;
  timeAsVisitor: number;
}

export interface MonthlyGrowth {
  month: string;
  newMembers: number;
  totalMembers: number;
  newGCs: number;
  totalGCs: number;
  multiplications: number;
}

export interface GrowthMetrics {
  totalMembers: number;
  newMembersThisMonth: number;
  totalGCs: number;
  newGCsThisMonth: number;
  totalMultiplications: number;
  multiplicationsThisMonth: number;
  avgMembersPerGC: number;
  growthRate: number;
}

export const ADMIN_REPORT_PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
  { value: 'all', label: 'Todo o período' },
] as const;

export const ATTENDANCE_REPORT_PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
] as const;

export const CONVERSION_REPORT_PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
] as const;

export const GROWTH_REPORT_PERIOD_OPTIONS = [
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
  { value: '730', label: 'Últimos 2 anos' },
] as const;

export function resolveReportPeriod(
  rawPeriod: string | string[] | undefined,
  allowedPeriods: readonly { value: string }[],
  fallback: string,
) {
  const value = Array.isArray(rawPeriod) ? rawPeriod[0] : rawPeriod;
  return allowedPeriods.some((option) => option.value === value) ? value! : fallback;
}

const formatMonthLabel = (date: Date) => {
  const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  return formatted.replace('.', '').replace(' de ', '/');
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthBuckets = (start: Date, end: Date) => {
  const buckets: { key: string; label: string; date: Date }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endCursor) {
    buckets.push({
      key: getMonthKey(cursor),
      label: formatMonthLabel(cursor),
      date: new Date(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

function calculateGrowthRate(data: MonthlyGrowth[]) {
  if (data.length < 2) {
    return 0;
  }

  const firstMonth = data[0];
  const lastMonth = data[data.length - 1];
  const memberGrowth = lastMonth.totalMembers - firstMonth.totalMembers;
  const growthRate = firstMonth.totalMembers > 0
    ? (memberGrowth / firstMonth.totalMembers) * 100
    : 0;

  return Math.round(growthRate * 10) / 10;
}

export async function getAdminReportsDashboardData(
  supabase: AppSupabaseClient,
  selectedPeriod: string,
): Promise<{
  metrics: ReportsMetrics;
  growthData: GrowthData[];
  distributionData: DistributionData[];
  topGCsData: TopGCData[];
}> {
  const now = new Date();
  const isAllPeriod = selectedPeriod === 'all';
  const days = isAllPeriod ? null : parseInt(selectedPeriod, 10);
  const startDate = isAllPeriod ? null : new Date(now.getTime() - (days ?? 0) * 24 * 60 * 60 * 1000);
  const startDateIso = startDate?.toISOString() ?? null;

  const membersPeriodQuery = supabase
    .from('growth_group_participants')
    .select('joined_at')
    .is('deleted_at', null);

  const gcsPeriodQuery = supabase
    .from('growth_groups')
    .select('created_at')
    .is('deleted_at', null);

  const visitorsQuery = supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true });

  const convertedVisitorsQuery = supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'converted');

  if (startDateIso) {
    membersPeriodQuery.gte('joined_at', startDateIso);
    gcsPeriodQuery.gte('created_at', startDateIso);
    visitorsQuery.gte('created_at', startDateIso);
    convertedVisitorsQuery.gte('created_at', startDateIso);
  }

  const [
    totalGcsResult,
    activeGcsResult,
    totalMembersResult,
    activeMembersResult,
    visitorsResult,
    convertedVisitorsResult,
    modeDistributionResult,
    topGCsResult,
    membersPeriodResult,
    gcsPeriodResult,
  ] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('growth_group_participants')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('growth_group_participants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
    visitorsQuery,
    convertedVisitorsQuery,
    supabase
      .from('growth_groups')
      .select('mode')
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select(`
        name,
        growth_group_participants!inner(id, status, deleted_at)
      `)
      .eq('status', 'active')
      .is('deleted_at', null)
      .eq('growth_group_participants.status', 'active')
      .is('growth_group_participants.deleted_at', null),
    membersPeriodQuery,
    gcsPeriodQuery,
  ]);

  const error =
    totalGcsResult.error ||
    activeGcsResult.error ||
    totalMembersResult.error ||
    activeMembersResult.error ||
    visitorsResult.error ||
    convertedVisitorsResult.error ||
    modeDistributionResult.error ||
    topGCsResult.error ||
    membersPeriodResult.error ||
    gcsPeriodResult.error;

  if (error) {
    throw error;
  }

  const totalGcs = totalGcsResult.count || 0;
  const activeGcs = activeGcsResult.count || 0;
  const totalMembers = totalMembersResult.count || 0;
  const activeMembers = activeMembersResult.count || 0;
  const totalVisitors = visitorsResult.count || 0;
  const convertedVisitors = convertedVisitorsResult.count || 0;

  const metrics: ReportsMetrics = {
    totalGcs,
    activeGcs,
    totalMembers,
    activeMembers,
    totalVisitors,
    conversionRate: totalVisitors > 0 ? convertedVisitors / totalVisitors : 0,
  };

  const modeCounts = ((modeDistributionResult.data ?? []) as Array<{ mode?: string | null }>).reduce(
    (acc, gc) => {
      const mode = gc.mode || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const distributionData: DistributionData[] = Object.entries(modeCounts).map(([mode, count]) => ({
    name:
      mode === 'in_person'
        ? 'Presencial'
        : mode === 'online'
          ? 'Online'
          : mode === 'hybrid'
            ? 'Híbrido'
            : 'Outro',
    value: count,
  }));

  const topGCsData: TopGCData[] = ((topGCsResult.data ?? []) as Array<{
    name?: string | null;
    growth_group_participants?: unknown[];
  }>)
    .map((gc) => ({
      name: gc.name || 'Sem nome',
      members: gc.growth_group_participants?.length || 0,
    }))
    .sort((a, b) => b.members - a.members)
    .slice(0, 10);

  const memberDates = (membersPeriodResult.data ?? [])
    .map((row) => row.joined_at)
    .filter((date): date is string => Boolean(date));
  const gcDates = (gcsPeriodResult.data ?? [])
    .map((row) => row.created_at)
    .filter((date): date is string => Boolean(date));

  const growthStartDate = (() => {
    if (startDate) {
      return startDate;
    }

    const timestamps = [...memberDates, ...gcDates]
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getTime());

    return timestamps.length > 0
      ? new Date(Math.min(...timestamps))
      : new Date(now.getFullYear(), now.getMonth(), 1);
  })();

  const monthBuckets = buildMonthBuckets(growthStartDate, now);
  const membersByMonth = new Map<string, number>();
  const gcsByMonth = new Map<string, number>();

  memberDates.forEach((date) => {
    const key = getMonthKey(new Date(date));
    membersByMonth.set(key, (membersByMonth.get(key) || 0) + 1);
  });

  gcDates.forEach((date) => {
    const key = getMonthKey(new Date(date));
    gcsByMonth.set(key, (gcsByMonth.get(key) || 0) + 1);
  });

  const baselineMembers = startDate ? Math.max(0, totalMembers - memberDates.length) : 0;
  const baselineGcs = startDate ? Math.max(0, totalGcs - gcDates.length) : 0;
  let runningMembers = baselineMembers;
  let runningGcs = baselineGcs;

  const growthData: GrowthData[] = monthBuckets.map((bucket) => {
    runningMembers += membersByMonth.get(bucket.key) || 0;
    runningGcs += gcsByMonth.get(bucket.key) || 0;

    return {
      month: bucket.label,
      members: runningMembers,
      gcs: runningGcs,
    };
  });

  return {
    metrics,
    growthData,
    distributionData,
    topGCsData,
  };
}

export async function getAttendanceReportData(
  supabase: AppSupabaseClient,
  selectedPeriod: string,
): Promise<{
  metrics: AttendanceMetrics;
  gcAttendanceData: GCAttendance[];
  memberAttendanceData: MemberAttendance[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(selectedPeriod, 10));
  const startDateIso = startDate.toISOString();

  const [meetingsResult, attendancesResult, gcMembersResult, gcInfoResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, gc_id, datetime')
      .gte('datetime', startDateIso)
      .is('deleted_at', null),
    supabase
      .from('meeting_member_attendance')
      .select(`
        id,
        participant_id,
        meetings!inner(id, gc_id, datetime, deleted_at)
      `)
      .gte('meetings.datetime', startDateIso)
      .is('meetings.deleted_at', null),
    supabase
      .from('growth_group_participants')
      .select(`
        id,
        gc_id,
        people ( name )
      `)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('id, name')
      .eq('status', 'active')
      .is('deleted_at', null),
  ]);

  const error =
    meetingsResult.error ||
    attendancesResult.error ||
    gcMembersResult.error ||
    gcInfoResult.error;

  if (error) {
    throw error;
  }

  const meetings = (meetingsResult.data ?? []) as Array<{ id: string; gc_id: string | null }>;
  const attendances = (attendancesResult.data ?? []) as Array<{
    participant_id: string | null;
    meetings?: { gc_id?: string | null } | null;
  }>;
  const members = (gcMembersResult.data ?? []) as Array<{
    id: string;
    gc_id: string | null;
    people?: { name?: string | null } | null;
  }>;
  const gcs = (gcInfoResult.data ?? []) as Array<{ id: string; name: string }>;

  const gcNameById = new Map(gcs.map((gc) => [gc.id, gc.name]));
  const meetingCountByGc = new Map<string, number>();
  const attendanceCountByGc = new Map<string, number>();
  const attendanceCountByParticipant = new Map<string, number>();

  meetings.forEach((meeting) => {
    if (!meeting.gc_id) {
      return;
    }
    meetingCountByGc.set(meeting.gc_id, (meetingCountByGc.get(meeting.gc_id) || 0) + 1);
  });

  attendances.forEach((attendance) => {
    const gcId = attendance.meetings?.gc_id;
    if (!gcId) {
      return;
    }

    attendanceCountByGc.set(gcId, (attendanceCountByGc.get(gcId) || 0) + 1);

    if (attendance.participant_id) {
      attendanceCountByParticipant.set(
        attendance.participant_id,
        (attendanceCountByParticipant.get(attendance.participant_id) || 0) + 1,
      );
    }
  });

  const membersByGc = new Map<string, number>();
  const memberInfoById = new Map<string, { name: string; gcId: string; gcName: string }>();

  members.forEach((member) => {
    if (!member.gc_id || !member.id) {
      return;
    }

    membersByGc.set(member.gc_id, (membersByGc.get(member.gc_id) || 0) + 1);
    memberInfoById.set(member.id, {
      name: member.people?.name || 'Membro',
      gcId: member.gc_id,
      gcName: gcNameById.get(member.gc_id) || 'GC desconhecido',
    });
  });

  const gcIds = new Set<string>([
    ...gcNameById.keys(),
    ...meetingCountByGc.keys(),
    ...membersByGc.keys(),
  ]);

  const gcAttendanceData: GCAttendance[] = Array.from(gcIds).map((gcId) => {
    const totalMeetings = meetingCountByGc.get(gcId) || 0;
    const totalAttendances = attendanceCountByGc.get(gcId) || 0;
    const membersCount = membersByGc.get(gcId) || 0;
    const possible = totalMeetings * membersCount;

    return {
      gcName: gcNameById.get(gcId) || 'GC desconhecido',
      totalMeetings,
      totalAttendances,
      attendanceRate: possible > 0 ? (totalAttendances / possible) * 100 : 0,
      membersCount,
    };
  });

  const memberAttendanceData: MemberAttendance[] = Array.from(memberInfoById.entries()).map(
    ([memberId, info]) => {
      const attendedMeetings = attendanceCountByParticipant.get(memberId) || 0;
      const totalMeetings = meetingCountByGc.get(info.gcId) || 0;

      return {
        memberName: info.name,
        gcName: info.gcName,
        attendedMeetings,
        totalMeetings,
        attendanceRate: totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 100 : 0,
      };
    },
  );

  const totalMeetings = meetings.length;
  const totalAttendances = attendances.length;
  const totalPossibleAttendances = Array.from(gcIds).reduce((acc, gcId) => {
    return acc + (membersByGc.get(gcId) || 0) * (meetingCountByGc.get(gcId) || 0);
  }, 0);

  const filteredGcAttendance = gcAttendanceData.filter((gc) => gc.totalMeetings > 0 && gc.membersCount > 0);
  const membersWithMeetings = memberAttendanceData.filter((member) => member.totalMeetings > 0);

  return {
    metrics: {
      totalMeetings,
      totalAttendances,
      totalPossibleAttendances,
      overallAttendanceRate: totalPossibleAttendances > 0
        ? Math.round((totalAttendances / totalPossibleAttendances) * 1000) / 10
        : 0,
      mostAttendedGC: filteredGcAttendance.slice().sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.gcName || '',
      leastAttendedGC: filteredGcAttendance.slice().sort((a, b) => a.attendanceRate - b.attendanceRate)[0]?.gcName || '',
      topAttendee: membersWithMeetings.slice().sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.memberName || '',
      lowAttendee: membersWithMeetings.slice().sort((a, b) => a.attendanceRate - b.attendanceRate)[0]?.memberName || '',
    },
    gcAttendanceData,
    memberAttendanceData,
  };
}

export async function getConversionsReportData(
  supabase: AppSupabaseClient,
  selectedPeriod: string,
): Promise<{
  metrics: ConversionMetrics;
  monthlyData: MonthlyConversions[];
  gcConversionData: GCConversions[];
  recentConversions: RecentConversion[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(selectedPeriod, 10));
  const startDateIso = startDate.toISOString();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    visitorsResult,
    conversionsAllResult,
    conversionsThisMonthResult,
    recentConversionsResult,
  ] = await Promise.all([
    supabase
      .from('visitors')
      .select(`
        id,
        gc_id,
        status,
        created_at,
        converted_at,
        first_visit_date,
        people ( name ),
        growth_groups ( name )
      `)
      .gte('created_at', startDateIso),
    supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'converted'),
    supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'converted')
      .gte('converted_at', thisMonthStart.toISOString()),
    supabase
      .from('visitors')
      .select(`
        id,
        status,
        created_at,
        converted_at,
        first_visit_date,
        people ( name ),
        growth_groups ( name )
      `)
      .eq('status', 'converted')
      .not('converted_at', 'is', null)
      .order('converted_at', { ascending: false })
      .limit(5),
  ]);

  const error =
    visitorsResult.error ||
    conversionsAllResult.error ||
    conversionsThisMonthResult.error ||
    recentConversionsResult.error;

  if (error) {
    throw error;
  }

  const visitors = (visitorsResult.data ?? []) as Array<{
    gc_id: string | null;
    status: string;
    created_at: string | null;
    converted_at: string | null;
    first_visit_date: string | null;
    people?: { name?: string | null } | null;
    growth_groups?: { name?: string | null } | null;
  }>;

  const convertedVisitors = visitors.filter((visitor) => visitor.status === 'converted' && visitor.converted_at);
  const totalVisitors = visitors.length;
  const convertedCount = convertedVisitors.length;

  const conversionDays = convertedVisitors
    .map((visitor) => {
      const start = visitor.first_visit_date || visitor.created_at;
      if (!start || !visitor.converted_at) {
        return null;
      }

      const diffMs = new Date(visitor.converted_at).getTime() - new Date(start).getTime();
      return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    })
    .filter((value): value is number => value !== null);

  const gcTotals = new Map<string, { name: string; total: number; conversions: number }>();
  visitors.forEach((visitor) => {
    if (!visitor.gc_id) {
      return;
    }

    const gcName = visitor.growth_groups?.name || 'GC desconhecido';
    const entry = gcTotals.get(visitor.gc_id) || { name: gcName, total: 0, conversions: 0 };
    entry.total += 1;

    if (visitor.status === 'converted') {
      entry.conversions += 1;
    }

    gcTotals.set(visitor.gc_id, entry);
  });

  const gcConversionData: GCConversions[] = Array.from(gcTotals.values()).map((entry) => ({
    gcName: entry.name,
    totalVisitors: entry.total,
    conversions: entry.conversions,
    conversionRate: entry.total > 0 ? (entry.conversions / entry.total) * 100 : 0,
  }));

  const monthBuckets = buildMonthBuckets(startDate, now);
  const visitorsByMonth = new Map<string, number>();
  const conversionsByMonth = new Map<string, number>();

  visitors.forEach((visitor) => {
    if (!visitor.created_at) {
      return;
    }
    const key = getMonthKey(new Date(visitor.created_at));
    visitorsByMonth.set(key, (visitorsByMonth.get(key) || 0) + 1);
  });

  convertedVisitors.forEach((visitor) => {
    if (!visitor.converted_at) {
      return;
    }
    const key = getMonthKey(new Date(visitor.converted_at));
    conversionsByMonth.set(key, (conversionsByMonth.get(key) || 0) + 1);
  });

  const monthlyData: MonthlyConversions[] = monthBuckets.map((bucket) => {
    const visitorsInMonth = visitorsByMonth.get(bucket.key) || 0;
    const conversionsInMonth = conversionsByMonth.get(bucket.key) || 0;

    return {
      month: bucket.label,
      visitors: visitorsInMonth,
      conversions: conversionsInMonth,
      conversionRate: visitorsInMonth > 0 ? (conversionsInMonth / visitorsInMonth) * 100 : 0,
    };
  });

  const recentConversions: RecentConversion[] = ((recentConversionsResult.data ?? []) as Array<{
    created_at: string | null;
    converted_at: string | null;
    first_visit_date: string | null;
    people?: { name?: string | null } | null;
    growth_groups?: { name?: string | null } | null;
  }>).map((conversion) => {
    const start = conversion.first_visit_date || conversion.created_at;
    const convertedAt = conversion.converted_at ? new Date(conversion.converted_at) : null;
    const startDateValue = start ? new Date(start) : null;
    const diffMs = convertedAt && startDateValue
      ? convertedAt.getTime() - startDateValue.getTime()
      : 0;

    return {
      visitorName: conversion.people?.name || 'Visitante',
      gcName: conversion.growth_groups?.name || 'GC desconhecido',
      conversionDate: convertedAt ? convertedAt.toLocaleDateString('pt-BR') : '-',
      timeAsVisitor: convertedAt && startDateValue
        ? Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
        : 0,
    };
  });

  return {
    metrics: {
      totalVisitors,
      convertedVisitors: convertedCount,
      conversionRate: totalVisitors > 0 ? Math.round((convertedCount / totalVisitors) * 1000) / 10 : 0,
      avgConversionTime: conversionDays.length > 0
        ? Math.round(conversionDays.reduce((acc, value) => acc + value, 0) / conversionDays.length)
        : 0,
      conversionsThisMonth: conversionsThisMonthResult.count || 0,
      topConvertingGC: gcConversionData.slice().sort((a, b) => b.conversions - a.conversions)[0]?.gcName || 'Sem dados',
      totalConversionsAllTime: conversionsAllResult.count || 0,
    },
    monthlyData,
    gcConversionData,
    recentConversions,
  };
}

export async function getGrowthReportData(
  supabase: AppSupabaseClient,
  selectedPeriod: string,
): Promise<{
  metrics: GrowthMetrics;
  monthlyData: MonthlyGrowth[];
}> {
  const now = new Date();
  const days = parseInt(selectedPeriod, 10);
  const periodStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const periodStartIso = periodStartDate.toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalMembersResult,
    newMembersResult,
    totalGCsResult,
    newGCsResult,
    multiplicationsResult,
    newMultiplicationsResult,
    membersPeriodResult,
    gcsPeriodResult,
    multiplicationsPeriodResult,
  ] = await Promise.all([
    supabase
      .from('growth_group_participants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('growth_group_participants')
      .select('id', { count: 'exact', head: true })
      .gte('joined_at', thisMonthStart.toISOString())
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart.toISOString())
      .eq('status', 'active')
      .is('deleted_at', null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('gc_multiplication_events').select('id', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gc_multiplication_events')
      .select('id', { count: 'exact', head: true })
      .gte('multiplied_at', thisMonthStart.toISOString()),
    supabase
      .from('growth_group_participants')
      .select('joined_at')
      .eq('status', 'active')
      .gte('joined_at', periodStartIso)
      .is('deleted_at', null),
    supabase
      .from('growth_groups')
      .select('created_at')
      .eq('status', 'active')
      .gte('created_at', periodStartIso)
      .is('deleted_at', null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('gc_multiplication_events')
      .select('multiplied_at')
      .gte('multiplied_at', periodStartIso),
  ]);

  const error =
    totalMembersResult.error ||
    newMembersResult.error ||
    totalGCsResult.error ||
    newGCsResult.error ||
    multiplicationsResult.error ||
    newMultiplicationsResult.error ||
    membersPeriodResult.error ||
    gcsPeriodResult.error ||
    multiplicationsPeriodResult.error;

  if (error) {
    throw error;
  }

  const totalMembers = totalMembersResult.count || 0;
  const totalGCs = totalGCsResult.count || 0;

  const memberDates = (membersPeriodResult.data ?? [])
    .map((row) => row.joined_at)
    .filter((date): date is string => Boolean(date));
  const gcDates = (gcsPeriodResult.data ?? [])
    .map((row) => row.created_at)
    .filter((date): date is string => Boolean(date));
  const multiplicationDates = ((multiplicationsPeriodResult.data ?? []) as Array<{ multiplied_at?: string | null }>)
    .map((row) => row.multiplied_at)
    .filter((date): date is string => Boolean(date));

  const membersByMonth = new Map<string, number>();
  const gcsByMonth = new Map<string, number>();
  const multiplicationsByMonth = new Map<string, number>();

  memberDates.forEach((date) => {
    const key = getMonthKey(new Date(date));
    membersByMonth.set(key, (membersByMonth.get(key) || 0) + 1);
  });

  gcDates.forEach((date) => {
    const key = getMonthKey(new Date(date));
    gcsByMonth.set(key, (gcsByMonth.get(key) || 0) + 1);
  });

  multiplicationDates.forEach((date) => {
    const key = getMonthKey(new Date(date));
    multiplicationsByMonth.set(key, (multiplicationsByMonth.get(key) || 0) + 1);
  });

  const baselineMembers = Math.max(0, totalMembers - memberDates.length);
  const baselineGcs = Math.max(0, totalGCs - gcDates.length);
  let runningMembers = baselineMembers;
  let runningGcs = baselineGcs;

  const monthlyData: MonthlyGrowth[] = buildMonthBuckets(periodStartDate, now).map((bucket) => {
    const newMembers = membersByMonth.get(bucket.key) || 0;
    const newGCs = gcsByMonth.get(bucket.key) || 0;
    runningMembers += newMembers;
    runningGcs += newGCs;

    return {
      month: bucket.label,
      newMembers,
      totalMembers: runningMembers,
      newGCs,
      totalGCs: runningGcs,
      multiplications: multiplicationsByMonth.get(bucket.key) || 0,
    };
  });

  return {
    metrics: {
      totalMembers,
      newMembersThisMonth: newMembersResult.count || 0,
      totalGCs,
      newGCsThisMonth: newGCsResult.count || 0,
      totalMultiplications: multiplicationsResult.count || 0,
      multiplicationsThisMonth: newMultiplicationsResult.count || 0,
      avgMembersPerGC: totalGCs > 0 ? Math.round(totalMembers / totalGCs) : 0,
      growthRate: calculateGrowthRate(monthlyData),
    },
    monthlyData,
  };
}
