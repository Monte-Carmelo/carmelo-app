'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { GrowthGroupFormData } from '@/components/admin/AdminGrowthGroupForm';

export async function createGrowthGroupAction(data: GrowthGroupFormData) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: 'Não autenticado.' };
    }

    const supabase = await createSupabaseServerClient();

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

    // Leaders (all leaders have equal authority)
    for (const leaderId of data.leaderIds) {
      participants.push({
        gc_id: gc.id,
        person_id: leaderId,
        role: 'leader',
        status: 'active',
        joined_at: new Date().toISOString(),
      });
    }

    // Supervisors
    for (const supervisorId of data.supervisorIds) {
      participants.push({
        gc_id: gc.id,
        person_id: supervisorId,
        role: 'supervisor',
        status: 'active',
        joined_at: new Date().toISOString(),
      });
    }

    // Members (if provided)
    if (data.memberIds && data.memberIds.length > 0) {
      for (const memberId of data.memberIds) {
        participants.push({
          gc_id: gc.id,
          person_id: memberId,
          role: 'member',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
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
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: 'Não autenticado.' };
    }

    const supabase = await createSupabaseServerClient();

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

    // 2. Load current active leadership so we can update by diff.
    // This avoids temporarily leaving the GC without leaders/supervisors,
    // which would violate the database triggers.
    const { data: existingLeadership, error: leadershipFetchError } = await supabase
      .from('growth_group_participants')
      .select('id, person_id, role')
      .eq('gc_id', gcId)
      .in('role', ['leader', 'supervisor'])
      .eq('status', 'active')
      .is('deleted_at', null);

    if (leadershipFetchError) {
      console.error('Error fetching current leadership:', leadershipFetchError);
      return { error: 'Erro ao atualizar liderança.' };
    }

    const activeLeadership = existingLeadership ?? [];
    const existingLeaderIds = new Set(
      activeLeadership.filter((participant) => participant.role === 'leader').map((participant) => participant.person_id),
    );
    const existingSupervisorIds = new Set(
      activeLeadership.filter((participant) => participant.role === 'supervisor').map((participant) => participant.person_id),
    );

    const participantIdsToDelete = activeLeadership
      .filter((participant) => {
        if (participant.role === 'leader') {
          return !data.leaderIds.includes(participant.person_id);
        }

        return !data.supervisorIds.includes(participant.person_id);
      })
      .map((participant) => participant.id);

    // 3. Insert only missing leadership participants first.
    const participantsToInsert = [];

    // Leaders (all leaders have equal authority)
    for (const leaderId of data.leaderIds) {
      if (!existingLeaderIds.has(leaderId)) {
        participantsToInsert.push({
          gc_id: gcId,
          person_id: leaderId,
          role: 'leader',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    // Supervisors
    for (const supervisorId of data.supervisorIds) {
      if (!existingSupervisorIds.has(supervisorId)) {
        participantsToInsert.push({
          gc_id: gcId,
          person_id: supervisorId,
          role: 'supervisor',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
      }
    }

    if (participantsToInsert.length > 0) {
      const { error: participantsError } = await supabase
        .from('growth_group_participants')
        .insert(participantsToInsert);

      if (participantsError) {
        console.error('Error inserting participants:', participantsError);
        return { error: 'Erro ao atualizar liderança.' };
      }
    }

    // 4. Remove only obsolete leadership records after new ones exist.
    if (participantIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('growth_group_participants')
        .delete()
        .in('id', participantIdsToDelete);

      if (deleteError) {
        console.error('Error deleting old participants:', deleteError);
        return { error: 'Erro ao atualizar liderança.' };
      }
    }

    revalidatePath('/admin/growth-groups');
    revalidatePath(`/admin/growth-groups/${gcId}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateGrowthGroupAction:', error);
    return { error: 'Erro inesperado ao atualizar GC.' };
  }
}

export async function inactivateGrowthGroupAction(gcId: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: 'Não autenticado.' };
    }

    const supabase = await createSupabaseServerClient();
    const { data: gc, error: fetchError } = await supabase
      .from('growth_groups')
      .select('id, status')
      .eq('id', gcId)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError || !gc) {
      return { error: fetchError?.message ?? 'GC não encontrado.' };
    }

    if (gc.status !== 'active') {
      return { error: 'Apenas GCs ativos podem ser inativados.' };
    }

    const { error: updateError } = await supabase
      .from('growth_groups')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', gcId);

    if (updateError) {
      console.error('Error inactivating GC:', updateError);
      return { error: updateError.message ?? 'Erro ao inativar GC.' };
    }

    revalidatePath('/admin/growth-groups');
    revalidatePath(`/admin/growth-groups/${gcId}`);
    revalidatePath('/gc');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in inactivateGrowthGroupAction:', error);
    return { error: 'Erro inesperado ao inativar GC.' };
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
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const createdGcIds: string[] = [];

  try {
    // Get current user
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: 'Usuário não autenticado.' };
    }

    // Step 1: Update original GC status to 'multiplying'
    const { error: updateError } = await supabase
      .from('growth_groups')
      .update({ status: 'multiplying', updated_at: now })
      .eq('id', originalGcId);

    if (updateError) {
      console.error('Step 1 failed:', updateError);
      return { error: 'Erro ao iniciar multiplicação.' };
    }

    // Step 2: Create new GCs
    for (let i = 0; i < multiplicationState.newGCs.length; i++) {
      const newGcData = multiplicationState.newGCs[i];

      const { data: newGc, error: createError } = await supabase
        .from('growth_groups')
        .insert({
          name: newGcData.name,
          mode: newGcData.mode,
          address: newGcData.address || null,
          weekday: null,
          time: null,
          status: 'active',
        })
        .select('id')
        .single();

      if (createError || !newGc) {
        console.error('Step 2 failed:', createError);
        // Rollback: Delete created GCs
        if (createdGcIds.length > 0) {
          await supabase.from('growth_groups').delete().in('id', createdGcIds);
        }
        // Restore original GC status
        await supabase
          .from('growth_groups')
          .update({ status: 'active' })
          .eq('id', originalGcId);
        return { error: 'Erro ao criar novos GCs.' };
      }

      createdGcIds.push(newGc.id);

      // Step 2b: Add leader and supervisors to new GC
      const participants = [];

      // Leader
      if (newGcData.leaderId) {
        participants.push({
          gc_id: newGc.id,
          person_id: newGcData.leaderId,
          role: 'leader',
          status: 'active',
          joined_at: now,
          added_by_user_id: user.id,
        });
      }

      // Supervisors
      for (const supervisorId of newGcData.supervisorIds) {
        if (supervisorId) {
          participants.push({
            gc_id: newGc.id,
            person_id: supervisorId,
            role: 'supervisor',
            status: 'active',
            joined_at: now,
            added_by_user_id: user.id,
          });
        }
      }

      const { error: participantsError } = await supabase
        .from('growth_group_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Step 2b failed:', participantsError);
        // Rollback
        await supabase.from('growth_groups').delete().in('id', createdGcIds);
        await supabase
          .from('growth_groups')
          .update({ status: 'active' })
          .eq('id', originalGcId);
        return { error: 'Erro ao adicionar líderes aos novos GCs.' };
      }
    }

    // Step 3: Transfer members according to allocations
    const transferUpdates: Array<{ personId: string; newGcId: string }> = [];
    const remainingMembers: string[] = [];

    Object.entries(multiplicationState.memberAllocations).forEach(([personId, destination]) => {
      if (destination === 'original') {
        remainingMembers.push(personId);
      } else {
        const gcIndex = parseInt(destination.split('_')[1]);
        transferUpdates.push({
          personId,
          newGcId: createdGcIds[gcIndex],
        });
      }
    });

    // Mark transferred members as 'transferred' and create new participants
    for (const transfer of transferUpdates) {
      // Update old participation
      const { error: updateTransferError } = await supabase
        .from('growth_group_participants')
        .update({ status: 'transferred', left_at: now, updated_at: now })
        .eq('gc_id', originalGcId)
        .eq('person_id', transfer.personId);

      if (updateTransferError) {
        console.error('Step 3a failed:', updateTransferError);
        // Rollback
        await supabase.from('growth_groups').delete().in('id', createdGcIds);
        await supabase
          .from('growth_groups')
          .update({ status: 'active' })
          .eq('id', originalGcId);
        return { error: 'Erro ao transferir membros.' };
      }

      // Create new participation
      const { error: insertTransferError } = await supabase
        .from('growth_group_participants')
        .insert({
          gc_id: transfer.newGcId,
          person_id: transfer.personId,
          role: 'member',
          status: 'active',
          joined_at: now,
          added_by_user_id: user.id,
        });

      if (insertTransferError) {
        console.error('Step 3b failed:', insertTransferError);
        // Rollback
        await supabase.from('growth_groups').delete().in('id', createdGcIds);
        await supabase
          .from('growth_groups')
          .update({ status: 'active' })
          .eq('id', originalGcId);
        return { error: 'Erro ao alocar membros nos novos GCs.' };
      }
    }

    // Step 4: Insert multiplication event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: eventError } = await (supabase as any)
      .from('gc_multiplication_events')
      .insert({
        original_gc_id: originalGcId,
        new_gc_ids: createdGcIds,
        multiplied_by_user_id: user.id,
        multiplied_at: now,
        notes: multiplicationState.notes || null,
      });

    if (eventError) {
      console.error('Step 4 failed:', eventError);
      // Rollback
      await supabase.from('growth_groups').delete().in('id', createdGcIds);
      await supabase.from('growth_groups').update({ status: 'active' }).eq('id', originalGcId);
      return { error: 'Erro ao registrar evento de multiplicação.' };
    }

    // Step 5: Finalize original GC status
    const finalStatus = multiplicationState.keepOriginalActive ? 'active' : 'multiplied';
    const { error: finalizeError } = await supabase
      .from('growth_groups')
      .update({ status: finalStatus, updated_at: now })
      .eq('id', originalGcId);

    if (finalizeError) {
      console.error('Step 5 failed:', finalizeError);
      return { error: 'Erro ao finalizar status do GC original.' };
    }

    revalidatePath('/admin/growth-groups');
    return { success: true, newGcIds: createdGcIds };
  } catch (error) {
    console.error('Unexpected error in multiplyGrowthGroupAction:', error);

    // Attempt cleanup
    if (createdGcIds.length > 0) {
      await supabase.from('growth_groups').delete().in('id', createdGcIds);
    }
    await supabase.from('growth_groups').update({ status: 'active' }).eq('id', originalGcId);

    return { error: 'Erro inesperado ao multiplicar GC.' };
  }
}
