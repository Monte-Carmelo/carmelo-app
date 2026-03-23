import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { updateParticipant } from '@/lib/supabase/mutations/participants';
import { getParticipantManagementScope, listGrowthGroups } from '@/lib/api/participants';

const idSchema = z.string().trim().min(1);
const birthDateSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .nullable()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida.');

const updateParticipantSchema = z
  .object({
    participantId: idSchema,
    personId: idSchema,
    gcId: idSchema,
    name: z.string().trim().min(3).max(255),
    email: z.string().email().trim().optional().or(z.literal('')).nullable(),
    phone: z.string().trim().optional().or(z.literal('')).nullable(),
    birthDate: birthDateSchema,
    role: z.enum(['member', 'leader', 'supervisor']),
    status: z.enum(['active', 'inactive', 'transferred']),
  })
  .superRefine((data, ctx) => {
    if (!data.email?.trim() && !data.phone?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe e-mail ou telefone.',
        path: ['email'],
      });
    }

    if (data.role === 'member' && !data.birthDate?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a data de nascimento para membros.',
        path: ['birthDate'],
      });
    }
  });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateParticipantSchema.safeParse(body);

  if (!parsed.success || parsed.data.participantId !== id) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para atualizar participante.' },
      { status: 400 },
    );
  }

  const scope = await getParticipantManagementScope(supabase, user.id);
  const allowedGroups = await listGrowthGroups(
    supabase,
    scope.isAdmin ? undefined : { gcIds: scope.managedGcIds },
  );
  const allowedGcIds = new Set(allowedGroups.map((group) => group.id));

  const { data: currentParticipant, error: currentParticipantError } = await supabase
    .from('growth_group_participants')
    .select('gc_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (currentParticipantError || !currentParticipant) {
    return NextResponse.json(
      { success: false, error: 'Participante não encontrado.' },
      { status: 404 },
    );
  }

  if (!allowedGcIds.has(currentParticipant.gc_id) || !allowedGcIds.has(parsed.data.gcId)) {
    return NextResponse.json(
      { success: false, error: 'Você não pode editar participantes fora dos seus GCs.' },
      { status: 403 },
    );
  }

  const result = await updateParticipant(supabase, {
    participantId: parsed.data.participantId,
    personId: parsed.data.personId,
    gcId: parsed.data.gcId,
    name: parsed.data.name,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    birthDate: parsed.data.birthDate?.trim() || null,
    role: parsed.data.role,
    status: parsed.data.status,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
