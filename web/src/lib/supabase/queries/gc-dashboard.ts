import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type GrowthGroupDashboardData = {
  id: string;
  name: string;
  mode: string;
  address: string | null;
  weekday: number | null;
  time: string | null;
  status: string;
  memberCount: number;
  visitorCount: number;
};

export type UpcomingMeeting = {
  id: string;
  gc_id: string;
  lesson_title: string;
  datetime: string;
  comments: string | null;
  gc_name: string;
};

export type GCMember = {
  id: string;
  person_id: string;
  name: string;
  role: string;
  status: string;
};

export type GCVisitor = {
  id: string;
  person_id: string;
  name: string;
  visit_count: number;
  status: string;
  first_visit_date: string;
};

/**
 * Busca os IDs dos GCs associados ao usuário (como líder ou participante ativo)
 */
export async function getUserGCIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('growth_group_participants')
    .select('gc_id')
    .eq('person_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user GC IDs:', error);
    return [];
  }

  return data.map((row) => row.gc_id);
}

/**
 * Busca informações dos GCs do usuário
 */
export async function getGrowthGroups(
  supabase: SupabaseClient<Database>,
  gcIds: string[]
): Promise<GrowthGroupDashboardData[]> {
  if (gcIds.length === 0) return [];

  const { data: groups, error: groupsError } = await supabase
    .from('growth_groups')
    .select('*')
    .in('id', gcIds)
    .neq('status', 'inactive')
    .order('name');

  if (groupsError) {
    console.error('Error fetching growth groups:', groupsError);
    return [];
  }

  // Para cada GC, buscar contagem de membros e visitantes
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const [{ count: memberCount }, { count: visitorCount }] = await Promise.all([
        supabase
          .from('growth_group_participants')
          .select('*', { count: 'exact', head: true })
          .eq('gc_id', group.id)
          .eq('status', 'active'),
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
        memberCount: memberCount ?? 0,
        visitorCount: visitorCount ?? 0,
      };
    })
  );

  return groupsWithCounts;
}

/**
 * Busca próximas reuniões dos GCs do usuário
 */
export async function getUpcomingMeetings(
  supabase: SupabaseClient<Database>,
  gcIds: string[]
): Promise<UpcomingMeeting[]> {
  if (gcIds.length === 0) return [];

  const { data, error } = await supabase
    .from('meetings')
    .select('id, gc_id, lesson_title, datetime, comments, growth_groups(name)')
    .in('gc_id', gcIds)
    .gte('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching upcoming meetings:', error);
    return [];
  }

  return data.map((meeting) => {
    const gcData = meeting.growth_groups && typeof meeting.growth_groups === 'object' && 'name' in meeting.growth_groups ? meeting.growth_groups : null;
    return {
      id: meeting.id,
      gc_id: meeting.gc_id,
      lesson_title: meeting.lesson_title,
      datetime: meeting.datetime,
      comments: meeting.comments,
      gc_name: gcData?.name ?? 'GC sem nome',
    };
  });
}

/**
 * Busca membros de um GC específico
 */
export async function getGCMembers(
  supabase: SupabaseClient<Database>,
  gcId: string
): Promise<GCMember[]> {
  const { data, error } = await supabase
    .from('growth_group_participants')
    .select('id, person_id, role, status, people(id, name)')
    .eq('gc_id', gcId)
    .eq('status', 'active')
    .order('role', { ascending: true });

  if (error) {
    console.error('Error fetching GC members:', error);
    return [];
  }

  return data.map((row) => {
    const personData = row.people && typeof row.people === 'object' && 'name' in row.people ? row.people : null;
    return {
      id: row.id,
      person_id: row.person_id,
      name: personData?.name ?? 'Sem nome',
      role: row.role,
      status: row.status,
    };
  });
}

/**
 * Busca visitantes de um GC específico
 */
export async function getGCVisitors(
  supabase: SupabaseClient<Database>,
  gcId: string
): Promise<GCVisitor[]> {
  const { data, error } = await supabase
    .from('visitors')
    .select('id, person_id, visit_count, status, first_visit_date, people(id, name)')
    .eq('gc_id', gcId)
    .eq('status', 'active')
    .order('first_visit_date', { ascending: false });

  if (error) {
    console.error('Error fetching GC visitors:', error);
    return [];
  }

  return data.map((row) => {
    const personData = row.people && typeof row.people === 'object' && 'name' in row.people ? row.people : null;
    return {
      id: row.id,
      person_id: row.person_id,
      name: personData?.name ?? 'Sem nome',
      visit_count: row.visit_count,
      status: row.status,
      first_visit_date: row.first_visit_date,
    };
  });
}
