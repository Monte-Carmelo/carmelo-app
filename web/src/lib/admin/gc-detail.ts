import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { gcHealthFromLastMeeting, type GcHealth } from './gc-health';

export type AdminGcLeader = { name: string; trainee: boolean };

export type AdminGcHistoryItem = {
  id: string;
  title: string;
  date: string;
  present: number;
  total: number;
};

export type AdminGcDetail = {
  id: string;
  name: string;
  mode: string;
  status: string;
  weekday: number | null;
  time: string | null;
  address: string | null;
  leaders: AdminGcLeader[];
  supervisors: string[];
  memberCount: number;
  peopleCount: number;
  health: GcHealth;
  lastMeetingDate: string | null;
  /** Taxa de presença (%) dos últimos encontros, em ordem cronológica */
  attendanceSeries: number[];
  /** Variação em pontos percentuais (primeiro → último encontro) */
  attendanceDeltaPp: number | null;
  averageAttendancePct: number | null;
  nextMeeting: { id: string; lessonTitle: string; datetime: string } | null;
  history: AdminGcHistoryItem[];
};

export async function getAdminGcDetail(
  supabase: SupabaseClient<Database>,
  gcId: string,
): Promise<AdminGcDetail | null> {
  const { data: gc } = await supabase
    .from('growth_groups')
    .select('id, name, mode, status, weekday, time, address')
    .eq('id', gcId)
    .maybeSingle();

  if (!gc) return null;

  const { data: participantRows } = await supabase
    .from('growth_group_participants')
    .select('role, people(name)')
    .eq('gc_id', gcId)
    .eq('status', 'active')
    .is('deleted_at', null);

  const participants = (participantRows ?? []) as Array<{
    role: string;
    people?: { name?: string | null } | null;
  }>;

  const leaders: AdminGcLeader[] = participants
    .filter((p) => p.role === 'leader')
    .map((p) => ({ name: p.people?.name ?? 'Líder', trainee: false }));
  const supervisors = participants
    .filter((p) => p.role === 'supervisor')
    .map((p) => p.people?.name ?? 'Supervisor');
  const memberCount = participants.filter((p) => p.role === 'member').length;
  const peopleCount = participants.length;

  const nowIso = new Date().toISOString();

  const [{ data: pastMeetings }, { data: futureMeetings }] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, lesson_title, datetime')
      .eq('gc_id', gcId)
      .is('deleted_at', null)
      .lte('datetime', nowIso)
      .order('datetime', { ascending: false })
      .limit(12),
    supabase
      .from('meetings')
      .select('id, lesson_title, datetime')
      .eq('gc_id', gcId)
      .is('deleted_at', null)
      .eq('status', 'scheduled')
      .gte('datetime', nowIso)
      .order('datetime', { ascending: true })
      .limit(1),
  ]);

  const past = (pastMeetings ?? []) as Array<{ id: string; lesson_title: string; datetime: string }>;
  const pastIds = past.map((m) => m.id);

  const presentByMeeting = new Map<string, number>();
  if (pastIds.length > 0) {
    const { data: attendance } = await supabase
      .from('meeting_member_attendance')
      .select('meeting_id')
      .in('meeting_id', pastIds);
    for (const row of (attendance ?? []) as Array<{ meeting_id: string }>) {
      presentByMeeting.set(row.meeting_id, (presentByMeeting.get(row.meeting_id) ?? 0) + 1);
    }
  }

  // Quem se espera no encontro: membros + líderes (supervisores acompanham vários GCs)
  const attendingBase = Math.max(1, memberCount + leaders.length);

  const chronological = [...past].reverse(); // mais antigo → mais recente
  const attendanceSeries = chronological.map((m) =>
    Math.round(((presentByMeeting.get(m.id) ?? 0) / attendingBase) * 100),
  );
  const attendanceDeltaPp =
    attendanceSeries.length >= 2
      ? attendanceSeries[attendanceSeries.length - 1] - attendanceSeries[0]
      : null;
  const averageAttendancePct =
    attendanceSeries.length > 0
      ? Math.round(attendanceSeries.reduce((sum, v) => sum + v, 0) / attendanceSeries.length)
      : null;

  const lastMeetingDate = past[0]?.datetime ?? null;

  const history: AdminGcHistoryItem[] = past.slice(0, 5).map((m) => ({
    id: m.id,
    title: m.lesson_title,
    date: m.datetime,
    present: presentByMeeting.get(m.id) ?? 0,
    total: attendingBase,
  }));

  const next = (futureMeetings ?? [])[0] as
    | { id: string; lesson_title: string; datetime: string }
    | undefined;

  return {
    id: gc.id,
    name: gc.name,
    mode: gc.mode,
    status: gc.status,
    weekday: gc.weekday,
    time: gc.time,
    address: gc.address,
    leaders,
    supervisors,
    memberCount,
    peopleCount,
    health: gcHealthFromLastMeeting(lastMeetingDate),
    lastMeetingDate,
    attendanceSeries,
    attendanceDeltaPp,
    averageAttendancePct,
    nextMeeting: next
      ? { id: next.id, lessonTitle: next.lesson_title, datetime: next.datetime }
      : null,
    history,
  };
}
