import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export interface ParticipantView {
  participantId: string;
  gcId: string;
  gcName: string;
  personId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status: Database['public']['Tables']['growth_group_participants']['Row']['status'];
  joinedAt: string;
}

export type ParticipantFilters = {
  gcId?: string;
  role?: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status?: Database['public']['Tables']['growth_group_participants']['Row']['status'] | 'all';
};

export async function listGrowthGroups(
  supabase: SupabaseClient<Database>,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('growth_groups')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listParticipants(
  supabase: SupabaseClient<Database>,
  filters: ParticipantFilters,
): Promise<ParticipantView[]> {
  const query = supabase
    .from('growth_group_participants')
    .select(
      `id, gc_id, person_id, role, status, joined_at,
       growth_groups ( id, name ),
       people:people!growth_group_participants_person_id_fkey ( id, name, email, phone )`,
    )
    .order('joined_at', { ascending: false })
    .limit(50);

  if (filters.gcId) {
    query.eq('gc_id', filters.gcId);
  }

  if (filters.role) {
    query.eq('role', filters.role);
  }

  if (filters.status && filters.status !== 'all') {
    query.eq('status', filters.status);
  } else {
    query.eq('status', 'active');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    participantId: row.id,
    gcId: row.gc_id,
    gcName: row.growth_groups?.name ?? 'GC desconhecido',
    personId: row.person_id,
    name: row.people?.name ?? 'Sem nome',
    email: row.people?.email ?? null,
    phone: row.people?.phone ?? null,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }));
}
