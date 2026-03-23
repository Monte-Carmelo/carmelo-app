import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { resolveExistingPersonByContact } from './people';
import { formatBrazilianPhone } from '@/lib/formatters/phone';

type ParticipantRole = Database['public']['Tables']['growth_group_participants']['Row']['role'];
type ParticipantStatus = Database['public']['Tables']['growth_group_participants']['Row']['status'];

export type AddParticipantInput = {
  gcId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  role: ParticipantRole;
  addedByUserId: string;
};

export type AddParticipantResult = {
  success: boolean;
  participantId?: string;
  personId?: string;
  error?: string;
};

export async function addParticipant(
  supabase: SupabaseClient<Database>,
  input: AddParticipantInput,
): Promise<AddParticipantResult> {
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email?.trim() || null;
  const trimmedPhone = formatBrazilianPhone(input.phone) || null;
  const trimmedBirthDate = input.birthDate?.trim() || null;

  if (input.role === 'member' && !trimmedBirthDate) {
    return {
      success: false,
      error: 'Informe a data de nascimento para cadastrar membros.',
    };
  }

  const personLookup = await resolveExistingPersonByContact(supabase, {
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
  });

  if (personLookup.error) {
    return {
      success: false,
      error: personLookup.error,
    };
  }

  let personId = personLookup.personId;

  if (!personId) {
    const { data: personData, error: personError } = await supabase
      .from('people')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        birth_date: trimmedBirthDate,
      })
      .select('id')
      .single();

    if (personError || !personData) {
      return {
        success: false,
        error: personError?.message ?? 'Falha ao salvar dados pessoais.',
      };
    }

    personId = personData.id;
  } else if (trimmedBirthDate) {
    const { error: updateExistingPersonError } = await supabase
      .from('people')
      .update({
        birth_date: trimmedBirthDate,
      })
      .eq('id', personId);

    if (updateExistingPersonError) {
      return {
        success: false,
        error: updateExistingPersonError.message,
      };
    }
  }

  const now = new Date().toISOString();

  const { data: participantData, error: participantError } = await supabase
    .from('growth_group_participants')
    .upsert(
      {
        gc_id: input.gcId,
        person_id: personId,
        role: input.role,
        status: 'active',
        joined_at: now,
        added_by_user_id: input.addedByUserId,
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
      error: participantError?.message ?? 'Não foi possível vincular participante ao GC.',
    };
  }

  return {
    success: true,
    participantId: participantData.id,
    personId,
  };
}

export type UpdateParticipantInput = {
  participantId: string;
  personId: string;
  gcId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  role: ParticipantRole;
  status: ParticipantStatus;
};

export type UpdateParticipantResult = {
  success: boolean;
  error?: string;
};

export type UpdateParticipantStatusInput = {
  participantId: string;
  status: ParticipantStatus;
};

export async function updateParticipant(
  supabase: SupabaseClient<Database>,
  input: UpdateParticipantInput,
): Promise<UpdateParticipantResult> {
  const trimmedBirthDate = input.birthDate?.trim() || null;
  const trimmedPhone = formatBrazilianPhone(input.phone) || null;

  if (input.role === 'member' && !trimmedBirthDate) {
    return {
      success: false,
      error: 'Informe a data de nascimento para membros.',
    };
  }

  const { error: personError } = await supabase
    .from('people')
    .update({
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: trimmedPhone,
      birth_date: trimmedBirthDate,
    })
    .eq('id', input.personId);

  if (personError) {
    return {
      success: false,
      error: personError.message,
    };
  }

  const { error: participantError } = await supabase
    .from('growth_group_participants')
    .update({
      gc_id: input.gcId,
      role: input.role,
      status: input.status,
    })
    .eq('id', input.participantId);

  if (participantError) {
    return {
      success: false,
      error: participantError.message,
    };
  }

  return { success: true };
}

export async function updateParticipantStatus(
  supabase: SupabaseClient<Database>,
  input: UpdateParticipantStatusInput,
): Promise<UpdateParticipantResult> {
  const { error } = await supabase
    .from('growth_group_participants')
    .update({
      status: input.status,
    })
    .eq('id', input.participantId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}
