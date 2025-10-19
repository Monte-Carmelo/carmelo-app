'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { GrowthGroupFormData } from '@/components/admin/AdminGrowthGroupForm';

export async function createGrowthGroupAction(data: GrowthGroupFormData) {
  try {
    const supabase = await createSupabaseServerClient();

    // 0. Fetch person_ids for all user_ids
    const allUserIds = [
      data.leaderId,
      ...(data.coLeaderId && data.coLeaderId !== '' ? [data.coLeaderId] : []),
      ...data.supervisorIds,
      ...(data.memberIds || []),
    ];

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, person_id')
      .in('id', allUserIds);

    if (usersError || !usersData) {
      console.error('Error fetching users:', usersError);
      return { error: 'Erro ao buscar dados dos usuários.' };
    }

    const userIdToPersonId = new Map(usersData.map((u) => [u.id, u.person_id]));

    // 1. Create the GC
    const { data: gc, error: gcError } = await supabase
      .from('growth_groups')
      .insert({
        name: data.name,
        mode: data.mode,
        address: data.address || null,
        weekday: data.weekday,
        time: data.time,
        status: 'active',
      })
      .select('id')
      .single();

    if (gcError || !gc) {
      console.error('Error creating GC:', gcError);
      return { error: 'Erro ao criar GC. Verifique os dados e tente novamente.' };
    }

    // 2. Insert participants with roles
    const participants = [];

    // Leader
    const leaderPersonId = userIdToPersonId.get(data.leaderId);
    if (!leaderPersonId) {
      await supabase.from('growth_groups').delete().eq('id', gc.id);
      return { error: 'Líder inválido.' };
    }
    participants.push({
      gc_id: gc.id,
      person_id: leaderPersonId,
      role: 'leader',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    // Co-leader (if provided)
    if (data.coLeaderId && data.coLeaderId !== '') {
      const coLeaderPersonId = userIdToPersonId.get(data.coLeaderId);
      if (coLeaderPersonId) {
        participants.push({
          gc_id: gc.id,
          person_id: coLeaderPersonId,
          role: 'co_leader',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    // Supervisors
    for (const supervisorId of data.supervisorIds) {
      const supervisorPersonId = userIdToPersonId.get(supervisorId);
      if (supervisorPersonId) {
        participants.push({
          gc_id: gc.id,
          person_id: supervisorPersonId,
          role: 'supervisor',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    // Members (if provided)
    if (data.memberIds && data.memberIds.length > 0) {
      for (const memberId of data.memberIds) {
        const memberPersonId = userIdToPersonId.get(memberId);
        if (memberPersonId) {
          participants.push({
            gc_id: gc.id,
            person_id: memberPersonId,
            role: 'member',
            status: 'active',
            joined_at: new Date().toISOString(),
          });
        }
      }
    }

    const { error: participantsError } = await supabase
      .from('growth_group_participants')
      .insert(participants);

    // 3. Rollback if participants insertion failed
    if (participantsError) {
      console.error('Error inserting participants:', participantsError);
      await supabase.from('growth_groups').delete().eq('id', gc.id);
      return { error: 'Erro ao adicionar participantes. Operação cancelada.' };
    }

    revalidatePath('/admin/growth-groups');
    return { success: true, id: gc.id };
  } catch (error) {
    console.error('Unexpected error in createGrowthGroupAction:', error);
    return { error: 'Erro inesperado ao criar GC.' };
  }
}

export async function updateGrowthGroupAction(gcId: string, data: GrowthGroupFormData) {
  try {
    const supabase = await createSupabaseServerClient();

    // 0. Fetch person_ids for all user_ids
    const allUserIds = [
      data.leaderId,
      ...(data.coLeaderId && data.coLeaderId !== '' ? [data.coLeaderId] : []),
      ...data.supervisorIds,
    ];

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, person_id')
      .in('id', allUserIds);

    if (usersError || !usersData) {
      console.error('Error fetching users:', usersError);
      return { error: 'Erro ao buscar dados dos usuários.' };
    }

    const userIdToPersonId = new Map(usersData.map((u) => [u.id, u.person_id]));

    // 1. Update the GC basic info
    const { error: gcError } = await supabase
      .from('growth_groups')
      .update({
        name: data.name,
        mode: data.mode,
        address: data.address || null,
        weekday: data.weekday,
        time: data.time,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gcId);

    if (gcError) {
      console.error('Error updating GC:', gcError);
      return { error: 'Erro ao atualizar GC. Verifique os dados e tente novamente.' };
    }

    // 2. Remove old leadership participants (leader, co_leader, supervisor)
    const { error: deleteError } = await supabase
      .from('growth_group_participants')
      .delete()
      .eq('gc_id', gcId)
      .in('role', ['leader', 'co_leader', 'supervisor']);

    if (deleteError) {
      console.error('Error deleting old participants:', deleteError);
      return { error: 'Erro ao atualizar liderança.' };
    }

    // 3. Insert new leadership participants
    const participants = [];

    // Leader
    const leaderPersonId = userIdToPersonId.get(data.leaderId);
    if (!leaderPersonId) {
      return { error: 'Líder inválido.' };
    }
    participants.push({
      gc_id: gcId,
      person_id: leaderPersonId,
      role: 'leader',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    // Co-leader (if provided)
    if (data.coLeaderId && data.coLeaderId !== '') {
      const coLeaderPersonId = userIdToPersonId.get(data.coLeaderId);
      if (coLeaderPersonId) {
        participants.push({
          gc_id: gcId,
          person_id: coLeaderPersonId,
          role: 'co_leader',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    // Supervisors
    for (const supervisorId of data.supervisorIds) {
      const supervisorPersonId = userIdToPersonId.get(supervisorId);
      if (supervisorPersonId) {
        participants.push({
          gc_id: gcId,
          person_id: supervisorPersonId,
          role: 'supervisor',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    const { error: participantsError } = await supabase
      .from('growth_group_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error inserting participants:', participantsError);
      return { error: 'Erro ao atualizar liderança.' };
    }

    revalidatePath('/admin/growth-groups');
    revalidatePath(`/admin/growth-groups/${gcId}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateGrowthGroupAction:', error);
    return { error: 'Erro inesperado ao atualizar GC.' };
  }
}

export async function multiplyGrowthGroupAction(
  originalGcId: string,
  multiplicationState: {
    newGCs: Array<{
      name: string;
      mode: 'in_person' | 'online' | 'hybrid';
      address?: string;
      leaderId: string;
      supervisorIds: string[];
    }>;
    memberAllocations: Record<string, 'original' | 'new_0' | 'new_1' | 'new_2'>;
    keepOriginalActive: boolean;
    notes?: string;
  }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // TODO: Implement full multiplication logic in T020
    // For now, just return placeholder

    console.log('Multiplying GC:', originalGcId, multiplicationState);

    // Placeholder implementation
    return { success: true, message: 'Funcionalidade em desenvolvimento (T020)' };
  } catch (error) {
    console.error('Unexpected error in multiplyGrowthGroupAction:', error);
    return { error: 'Erro inesperado ao multiplicar GC.' };
  }
}
