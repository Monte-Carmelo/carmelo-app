'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';

const createUserSchema = z.object({
  name: z.string().min(3, 'Informe um nome com pelo menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres.'),
  isAdmin: z.boolean().default(false),
});

interface CreateUserInput {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  isAdmin: boolean;
}

export async function createUser(input: CreateUserInput) {
  const parsed = createUserSchema.parse({
    ...input,
    phone: input.phone ?? null,
  });

  const normalizedPhone = parsed.phone?.trim() ? parsed.phone.trim() : null;

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado.' } as const;
  }

  const supabase = await createSupabaseServerClient(cookies());

  const { data: existingPerson, error: personLookupError } = await supabase
    .from('people')
    .select('id, deleted_at')
    .eq('email', parsed.email)
    .maybeSingle();

  if (personLookupError) {
    return {
      success: false,
      error: personLookupError.message ?? 'Falha ao consultar dados pessoais.',
    } as const;
  }

  let personId: string;

  if (existingPerson) {
    const { error: updatePersonError } = await supabase
      .from('people')
      .update({
        name: parsed.name,
        email: parsed.email.trim().toLowerCase(),
        phone: normalizedPhone,
        deleted_at: null,
      })
      .eq('id', existingPerson.id);

    if (updatePersonError) {
      return {
        success: false,
        error: updatePersonError.message ?? 'Não foi possível atualizar dados pessoais.',
      } as const;
    }

    personId = existingPerson.id;
  } else {
    const { data: newPerson, error: insertPersonError } = await supabase
      .from('people')
      .insert({
        name: parsed.name,
        email: parsed.email.trim().toLowerCase(),
        phone: normalizedPhone,
      })
      .select('id')
      .single();

    if (insertPersonError || !newPerson) {
      return {
        success: false,
        error: insertPersonError?.message ?? 'Não foi possível registrar dados pessoais.',
      } as const;
    }

    personId = newPerson.id;
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id, deleted_at')
    .eq('person_id', personId)
    .maybeSingle();

  if (existingUserError) {
    return {
      success: false,
      error: existingUserError.message ?? 'Falha ao validar usuário existente.',
    } as const;
  }

  if (existingUser) {
    if (existingUser.deleted_at) {
      return {
        success: false,
        error: 'Esta pessoa já possui um usuário removido anteriormente. Restaure-o antes de criar um novo.',
      } as const;
    }

    return {
      success: false,
      error: 'Esta pessoa já possui um usuário ativo.',
    } as const;
  }

  const serviceClient = getSupabaseServiceClient();
  const { data: authResult, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.email.trim().toLowerCase(),
    password: parsed.password,
    email_confirm: false,
    user_metadata: {
      name: parsed.name,
      phone: normalizedPhone,
    },
  });

  if (authError || !authResult?.user) {
    return {
      success: false,
      error: authError?.message ?? 'Falha ao criar usuário na autenticação.',
    } as const;
  }

  const authUserId = authResult.user.id;

  const { error: insertUserError } = await supabase.from('users').insert({
    id: authUserId,
    person_id: personId,
    is_admin: parsed.isAdmin,
  });

  if (insertUserError) {
    await serviceClient.auth.admin.deleteUser(authUserId);

    return {
      success: false,
      error: insertUserError.message ?? 'Falha ao salvar usuário na base.',
    } as const;
  }

  revalidatePath('/admin');
  revalidatePath('/supervision');

  return { success: true, userId: authUserId } as const;
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(3, 'Informe o nome completo.'),
  email: z.string().email('E-mail inválido.'),
  phone: z.string().optional(),
  isAdmin: z.boolean(),
});

interface UpdateUserInput {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  isAdmin: boolean;
}

export async function updateUserProfile(input: UpdateUserInput) {
  const parsed = updateUserSchema.parse({
    ...input,
    phone: input.phone ?? null,
  });

  const normalizedPhone = parsed.phone?.trim() ? parsed.phone.trim() : null;

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado.' } as const;
  }

  if (!parsed.isAdmin && user.id === parsed.userId) {
    return {
      success: false,
      error: 'Não é possível remover seu próprio acesso administrativo.',
    } as const;
  }

  const supabase = await createSupabaseServerClient();

  const { data: userRecord, error: userFetchError } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', parsed.userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userFetchError || !userRecord) {
    return {
      success: false,
      error: userFetchError?.message ?? 'Usuário não encontrado.',
    } as const;
  }

  const { error: updatePersonError } = await supabase
    .from('people')
    .update({ name: parsed.name.trim(), email: parsed.email.trim().toLowerCase(), phone: normalizedPhone })
    .eq('id', userRecord.person_id);

  if (updatePersonError) {
    return {
      success: false,
      error: updatePersonError.message ?? 'Falha ao atualizar dados pessoais.',
    } as const;
  }

  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      is_admin: parsed.isAdmin,
    })
    .eq('id', parsed.userId);

  if (updateUserError) {
    return {
      success: false,
      error: updateUserError.message ?? 'Falha ao atualizar permissões.',
    } as const;
  }

  revalidatePath(`/admin/users/${parsed.userId}`);
  revalidatePath('/admin');
  revalidatePath('/supervision');

  return { success: true } as const;
}

const assignmentRoleSchema = z.enum(['member', 'leader', 'supervisor']);

const addAssignmentSchema = z.object({
  userId: z.string().uuid(),
  gcId: z.string().uuid(),
  role: assignmentRoleSchema,
});

interface AddAssignmentInput {
  userId: string;
  gcId: string;
  role: z.infer<typeof assignmentRoleSchema>;
}

export async function addUserAssignment(input: AddAssignmentInput) {
  const parsed = addAssignmentSchema.parse(input);

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado.' } as const;
  }

  const supabase = await createSupabaseServerClient();

  const { data: userRecord, error: userFetchError } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', parsed.userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userFetchError || !userRecord) {
    return {
      success: false,
      error: userFetchError?.message ?? 'Usuário não encontrado.',
    } as const;
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from('growth_group_participants')
    .upsert(
      {
        gc_id: parsed.gcId,
        person_id: userRecord.person_id,
        role: parsed.role,
        status: 'active',
        joined_at: now,
        left_at: null,
        deleted_at: null,
        added_by_user_id: user.id,
      },
      { onConflict: 'gc_id,person_id,role', ignoreDuplicates: false },
    );

  if (upsertError) {
    return {
      success: false,
      error: upsertError.message ?? 'Não foi possível vincular o usuário ao GC.',
    } as const;
  }

  revalidatePath(`/admin/users/${parsed.userId}`);
  revalidatePath('/admin');
  revalidatePath('/supervision');

  return { success: true } as const;
}

const removeAssignmentSchema = z.object({
  userId: z.string().uuid(),
  assignmentId: z.string().uuid(),
});

interface RemoveAssignmentInput {
  userId: string;
  assignmentId: string;
}

export async function removeUserAssignment(input: RemoveAssignmentInput) {
  const parsed = removeAssignmentSchema.parse(input);

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado.' } as const;
  }

  const supabase = await createSupabaseServerClient();

  const { data: userRecord, error: userFetchError } = await supabase
    .from('users')
    .select('person_id')
    .eq('id', parsed.userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userFetchError || !userRecord) {
    return {
      success: false,
      error: userFetchError?.message ?? 'Usuário não encontrado.',
    } as const;
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('growth_group_participants')
    .update({
      status: 'inactive',
      deleted_at: now,
      left_at: now,
    })
    .eq('id', parsed.assignmentId)
    .eq('person_id', userRecord.person_id)
    .is('deleted_at', null);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? 'Não foi possível remover o vínculo.',
    } as const;
  }

  revalidatePath(`/admin/users/${parsed.userId}`);
  revalidatePath('/admin');
  revalidatePath('/supervision');

  return { success: true } as const;
}

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function deleteUser(userId: string) {
  const { userId: targetUserId } = deleteUserSchema.parse({ userId });

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado.' } as const;
  }

  if (user.id === targetUserId) {
    return { success: false, error: 'Você não pode excluir seu próprio usuário.' } as const;
  }

  const supabase = await createSupabaseServerClient();

  const { data: userRecord, error: fetchError } = await supabase
    .from('users')
    .select('id, person_id')
    .eq('id', targetUserId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !userRecord) {
    return { success: false, error: 'Usuário não encontrado ou já removido.' } as const;
  }

  const serviceClient = getSupabaseServiceClient();
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(targetUserId);

  if (authDeleteError) {
    return { success: false, error: authDeleteError.message ?? 'Falha ao remover usuário na autenticação.' } as const;
  }

  const now = new Date().toISOString();

  const { error: participantError } = await supabase
    .from('growth_group_participants')
    .update({ status: 'inactive', deleted_at: now })
    .eq('person_id', userRecord.person_id)
    .is('deleted_at', null);

  if (participantError) {
    return { success: false, error: participantError.message ?? 'Falha ao atualizar vínculos de GC.' } as const;
  }

  const { error: deleteError } = await supabase
    .from('users')
    .update({ deleted_at: now })
    .eq('id', targetUserId);

  if (deleteError) {
    return { success: false, error: deleteError.message ?? 'Erro ao marcar usuário como removido.' } as const;
  }

  revalidatePath('/admin');
  revalidatePath('/supervision');

  return { success: true } as const;
}
