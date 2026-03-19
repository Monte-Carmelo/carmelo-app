import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type UpdateGrowthGroupInput = {
  gcId: string;
  name: string;
  mode: Database['public']['Tables']['growth_groups']['Row']['mode'];
  address?: string | null;
  weekday?: number | null;
  time?: string | null;
  status: Database['public']['Tables']['growth_groups']['Row']['status'];
};

export type UpdateGrowthGroupResult = {
  success: boolean;
  error?: string;
};

export async function updateGrowthGroup(
  supabase: SupabaseClient<Database>,
  input: UpdateGrowthGroupInput,
): Promise<UpdateGrowthGroupResult> {
  const { error } = await supabase
    .from('growth_groups')
    .update({
      name: input.name.trim(),
      mode: input.mode,
      address: input.address?.trim() || null,
      weekday: input.weekday ?? null,
      time: input.time || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.gcId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}
