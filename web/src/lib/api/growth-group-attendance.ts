import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type AttendanceMemberOption = {
  id: string;
  name: string;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
};

export type AttendanceVisitorOption = {
  id: string;
  name: string;
};

export type GrowthGroupAttendanceOptions = {
  members: AttendanceMemberOption[];
  visitors: AttendanceVisitorOption[];
};

export async function listGrowthGroupAttendanceOptions(
  supabase: SupabaseClient<Database>,
  gcId: string,
): Promise<GrowthGroupAttendanceOptions> {
  const [{ data: memberRows, error: memberError }, { data: visitorRows, error: visitorError }] =
    await Promise.all([
      supabase
        .from('growth_group_participants')
        .select('id, role, people:person_id ( id, name )')
        .eq('gc_id', gcId)
        .eq('status', 'active')
        .in('role', ['member', 'leader'])
        .order('role', { ascending: true }),
      supabase
        .from('visitors')
        .select('id, people:person_id ( id, name )')
        .eq('gc_id', gcId)
        .eq('status', 'active')
        .order('first_visit_date', { ascending: false }),
    ]);

  if (memberError) {
    throw memberError;
  }

  if (visitorError) {
    throw visitorError;
  }

  return {
    members: (memberRows ?? []).map((row) => ({
      id: row.id,
      name: row.people?.name ?? 'Sem nome',
      role: row.role,
    })),
    visitors: (visitorRows ?? []).map((row) => ({
      id: row.id,
      name: row.people?.name ?? 'Sem nome',
    })),
  };
}
