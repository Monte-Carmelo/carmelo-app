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

type GrowthGroupOption = {
  id: string;
  name: string;
};

type ListGrowthGroupsOptions = {
  gcIds?: string[];
};

type ListParticipantsOptions = {
  gcIds?: string[];
};

export type ParticipantManagementScope = {
  isAdmin: boolean;
  personId: string | null;
  managedGcIds: string[];
};

export async function listGrowthGroups(
  supabase: SupabaseClient<Database>,
  options?: ListGrowthGroupsOptions,
): Promise<GrowthGroupOption[]> {
  if (options?.gcIds && options.gcIds.length === 0) {
    return [];
  }

  const query = supabase
    .from('growth_groups')
    .select('id, name')
    .neq('status', 'inactive');

  if (options?.gcIds) {
    query.in('id', options.gcIds);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getParticipantManagementScope(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ParticipantManagementScope> {
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('person_id, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !userRow) {
    return {
      isAdmin: false,
      personId: null,
      managedGcIds: [],
    };
  }

  if (userRow.is_admin) {
    return {
      isAdmin: true,
      personId: userRow.person_id,
      managedGcIds: [],
    };
  }

  if (!userRow.person_id) {
    return {
      isAdmin: false,
      personId: null,
      managedGcIds: [],
    };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('growth_group_participants')
    .select('gc_id')
    .eq('person_id', userRow.person_id)
    .eq('status', 'active')
    .in('role', ['leader', 'supervisor'])
    .is('deleted_at', null);

  if (assignmentsError || !assignments?.length) {
    return {
      isAdmin: false,
      personId: userRow.person_id,
      managedGcIds: [],
    };
  }

  const managedGcIds = [...new Set(assignments.map((assignment) => assignment.gc_id))];
  const activeManagedGroups = await listGrowthGroups(supabase, { gcIds: managedGcIds });

  return {
    isAdmin: false,
    personId: userRow.person_id,
    managedGcIds: activeManagedGroups.map((group) => group.id),
  };
}

export async function listParticipants(
  supabase: SupabaseClient<Database>,
  filters: ParticipantFilters,
  options?: ListParticipantsOptions,
): Promise<ParticipantView[]> {
  if (options?.gcIds && options.gcIds.length === 0) {
    return [];
  }

  const query = supabase
    .from('growth_group_participants')
    .select(
      `id, gc_id, person_id, role, status, joined_at,
       growth_groups!inner ( id, name, status ),
       people:people!growth_group_participants_person_id_fkey ( id, name, email, phone )`,
    )
    .is('deleted_at', null)
    .neq('growth_groups.status', 'inactive')
    .order('joined_at', { ascending: false })
    .limit(50);

  if (options?.gcIds) {
    query.in('gc_id', options.gcIds);
  }

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
