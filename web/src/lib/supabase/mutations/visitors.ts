import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { resolveExistingPersonByContact } from './people';

export type AddVisitorInput = {
  gcId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  initialVisitCount?: number;
};

export type AddVisitorResult = {
  success: boolean;
  visitorId?: string;
  personId?: string;
  error?: string;
};

/**
 * Adiciona um novo visitante a um GC
 * Cria ou reutiliza um registro em `people` e cria um registro em `visitors`
 */
export async function addVisitor(
  supabase: SupabaseClient<Database>,
  input: AddVisitorInput
): Promise<AddVisitorResult> {
  const trimmedEmail = input.email?.trim() || null;
  const trimmedPhone = input.phone?.trim() || null;
  const trimmedName = input.name.trim();

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

  // Se a pessoa não existe, criar novo registro
  if (!personId) {
    const { data: newPerson, error: personError } = await supabase
      .from('people')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      })
      .select('id')
      .single();

    if (personError || !newPerson) {
      return {
        success: false,
        error: personError?.message ?? 'Falha ao criar registro de pessoa',
      };
    }

    personId = newPerson.id;
  }

  // Verificar se já existe um visitante com essa pessoa neste GC
  const { data: existingVisitor } = await supabase
    .from('visitors')
    .select('id')
    .eq('person_id', personId)
    .eq('gc_id', input.gcId)
    .maybeSingle();

  if (existingVisitor) {
    return {
      success: false,
      error: 'Esta pessoa já está cadastrada como visitante neste GC',
    };
  }

  // Criar registro de visitante
  const now = new Date().toISOString();
  const initialVisitCount = input.initialVisitCount ?? 0;

  const { data: visitor, error: visitorError } = await supabase
    .from('visitors')
    .insert({
      gc_id: input.gcId,
      person_id: personId,
      status: 'active',
      visit_count: initialVisitCount,
      first_visit_date: now,
      last_visit_date: initialVisitCount > 0 ? now : null,
    })
    .select('id')
    .single();

  if (visitorError || !visitor) {
    return {
      success: false,
      error: visitorError?.message ?? 'Falha ao criar registro de visitante',
    };
  }

  return {
    success: true,
    visitorId: visitor.id,
    personId,
  };
}

export type UpdateVisitorInput = {
  visitorId: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
};

export type UpdateVisitorResult = {
  success: boolean;
  error?: string;
};

/**
 * Atualiza informações pessoais de um visitante
 */
export async function updateVisitor(
  supabase: SupabaseClient<Database>,
  input: UpdateVisitorInput
): Promise<UpdateVisitorResult> {
  // Buscar o person_id associado ao visitante
  const { data: visitor, error: visitorError } = await supabase
    .from('visitors')
    .select('person_id')
    .eq('id', input.visitorId)
    .single();

  if (visitorError || !visitor) {
    return {
      success: false,
      error: visitorError?.message ?? 'Visitante não encontrado',
    };
  }

  // Atualizar dados da pessoa
  const updateData: Partial<Database['public']['Tables']['people']['Update']> = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }
  if (input.email !== undefined) {
    updateData.email = input.email?.trim() || null;
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone?.trim() || null;
  }

  const { error: personError } = await supabase
    .from('people')
    .update(updateData)
    .eq('id', visitor.person_id);

  if (personError) {
    return {
      success: false,
      error: personError.message,
    };
  }

  return {
    success: true,
  };
}

export type IncrementVisitCountInput = {
  visitorId: string;
};

export type IncrementVisitCountResult = {
  success: boolean;
  error?: string;
};

/**
 * Incrementa o contador de visitas de um visitante
 */
export async function incrementVisitCount(
  supabase: SupabaseClient<Database>,
  input: IncrementVisitCountInput
): Promise<IncrementVisitCountResult> {
  // Buscar contagem atual
  const { data: visitor, error: fetchError } = await supabase
    .from('visitors')
    .select('visit_count')
    .eq('id', input.visitorId)
    .single();

  if (fetchError || !visitor) {
    return {
      success: false,
      error: fetchError?.message ?? 'Visitante não encontrado',
    };
  }

  // Incrementar e atualizar
  const { error: updateError } = await supabase
    .from('visitors')
    .update({
      visit_count: visitor.visit_count + 1,
      last_visit_date: new Date().toISOString(),
    })
    .eq('id', input.visitorId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  return {
    success: true,
  };
}

export type ConvertVisitorToMemberInput = {
  visitorId: string;
  gcId: string;
  role?: string; // Default: 'member'
  convertedByUserId?: string;
};

export type ConvertVisitorToMemberResult = {
  success: boolean;
  participantId?: string;
  error?: string;
};

/**
 * Converte um visitante em membro do GC
 */
export async function convertVisitorToMember(
  supabase: SupabaseClient<Database>,
  input: ConvertVisitorToMemberInput
): Promise<ConvertVisitorToMemberResult> {
  // Buscar informações do visitante
  const { data: visitor, error: visitorError } = await supabase
    .from('visitors')
    .select('person_id, status')
    .eq('id', input.visitorId)
    .single();

  if (visitorError || !visitor) {
    return {
      success: false,
      error: visitorError?.message ?? 'Visitante não encontrado',
    };
  }

  if (visitor.status === 'converted') {
    return {
      success: false,
      error: 'Visitante já foi convertido',
    };
  }

  // Verificar se já existe um participante ativo com essa pessoa no GC
  const { data: existingParticipant } = await supabase
    .from('growth_group_participants')
    .select('id')
    .eq('person_id', visitor.person_id)
    .eq('gc_id', input.gcId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingParticipant) {
    return {
      success: false,
      error: 'Pessoa já é membro ativo deste GC',
    };
  }

  // Criar novo participante
  const now = new Date().toISOString();
  const { data: participant, error: participantError } = await supabase
    .from('growth_group_participants')
    .insert({
      gc_id: input.gcId,
      person_id: visitor.person_id,
      role: input.role || 'member',
      status: 'active',
      joined_at: now,
      converted_from_visitor_id: input.visitorId,
      added_by_user_id: input.convertedByUserId || null,
    })
    .select('id')
    .single();

  if (participantError || !participant) {
    return {
      success: false,
      error: participantError?.message ?? 'Falha ao criar participante',
    };
  }

  // Atualizar status do visitante
  const { error: updateVisitorError } = await supabase
    .from('visitors')
    .update({
      status: 'converted',
      converted_at: now,
      converted_by_user_id: input.convertedByUserId || null,
      converted_to_participant_id: participant.id,
    })
    .eq('id', input.visitorId);

  if (updateVisitorError) {
    console.error('Error updating visitor status:', updateVisitorError);
    // Não retornar erro, pois o participante foi criado com sucesso
  }

  // Criar evento de conversão
  const { error: conversionEventError } = await supabase
    .from('visitor_conversion_events')
    .insert({
      visitor_id: input.visitorId,
      person_id: visitor.person_id,
      participant_id: participant.id,
      gc_id: input.gcId,
      conversion_source: 'manual',
      converted_at: now,
      converted_by_user_id: input.convertedByUserId || null,
    });

  if (conversionEventError) {
    console.error('Error creating conversion event:', conversionEventError);
    // Não retornar erro
  }

  return {
    success: true,
    participantId: participant.id,
  };
}

export type DeactivateVisitorInput = {
  visitorId: string;
};

export type DeactivateVisitorResult = {
  success: boolean;
  error?: string;
};

/**
 * Desativa um visitante (soft delete)
 */
export async function deactivateVisitor(
  supabase: SupabaseClient<Database>,
  input: DeactivateVisitorInput
): Promise<DeactivateVisitorResult> {
  const { error } = await supabase
    .from('visitors')
    .update({ status: 'inactive' })
    .eq('id', input.visitorId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}
