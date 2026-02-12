import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export interface VisitorView {
  id: string;
  gcId: string;
  gcName: string;
  personId: string;
  name: string;
  email: string | null;
  status: Database['public']['Tables']['visitors']['Row']['status'];
  visitCount: number;
  lastVisitDate: string | null;
}

export type VisitorFilters = {
  status?: Database['public']['Tables']['visitors']['Row']['status'] | 'all';
};

export async function listVisitors(
  supabase: SupabaseClient<Database>,
  filters: VisitorFilters,
): Promise<VisitorView[]> {
  const visitorsQuery = supabase
    .from('visitors')
    .select(
      `id, gc_id, status, visit_count, last_visit_date,
       people:person_id ( id, name, email ),
       growth_groups ( name )`,
    )
    .order('last_visit_date', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    visitorsQuery.eq('status', filters.status);
  }

  const { data, error } = await visitorsQuery;

  if (error) {
    throw error;
  }

  return (data ?? []).map((visitor) => ({
    id: visitor.id,
    gcId: visitor.gc_id,
    gcName: visitor.growth_groups?.name ?? 'GC desconhecido',
    personId: visitor.people?.id ?? '',
    name: visitor.people?.name ?? 'Sem nome',
    email: visitor.people?.email ?? null,
    status: visitor.status,
    visitCount: visitor.visit_count,
    lastVisitDate: visitor.last_visit_date,
  }));
}

export async function convertVisitorToParticipant(
  supabase: SupabaseClient<Database>,
  visitor: VisitorView,
  convertedByUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const { data: participantData, error: participantError } = await supabase
    .from('growth_group_participants')
    .upsert(
      {
        gc_id: visitor.gcId,
        person_id: visitor.personId,
        role: 'member',
        status: 'active',
        joined_at: now,
        converted_from_visitor_id: visitor.id,
        added_by_user_id: convertedByUserId,
      },
      {
        onConflict: 'gc_id,person_id,role',
        ignoreDuplicates: false,
      },
    )
    .select('id')
    .single();

  if (participantError || !participantData) {
    return {
      success: false,
      error: participantError?.message ?? 'Não foi possível converter visitante.',
    };
  }

  const { error: updateVisitorError } = await supabase
    .from('visitors')
    .update({
      status: 'converted',
      converted_at: now,
      converted_by_user_id: convertedByUserId,
      converted_to_participant_id: participantData.id,
    })
    .eq('id', visitor.id);

  if (updateVisitorError) {
    return {
      success: false,
      error: 'Conversão parcial: visitante não atualizado.',
    };
  }

  const { error: eventError } = await supabase.from('visitor_conversion_events').insert({
    visitor_id: visitor.id,
    participant_id: participantData.id,
    person_id: visitor.personId,
    gc_id: visitor.gcId,
    converted_at: now,
    converted_by_user_id: convertedByUserId,
    conversion_source: 'manual',
  });

  if (eventError) {
    return {
      success: false,
      error: 'Conversão registrada, mas não foi possível logar o evento.',
    };
  }

  return { success: true };
}
