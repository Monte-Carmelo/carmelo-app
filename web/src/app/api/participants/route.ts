import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { addParticipant } from '@/lib/supabase/mutations/participants';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getParticipantManagementScope, listGrowthGroups } from '@/lib/api/participants';

const idSchema = z.string().trim().min(1);
const birthDateSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .nullable()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida.');

const createParticipantSchema = z
  .object({
    gcId: idSchema,
    name: z.string().trim().min(3).max(255),
    email: z.string().email().trim().optional().or(z.literal('')).nullable(),
    phone: z.string().trim().optional().or(z.literal('')).nullable(),
    birthDate: birthDateSchema,
    role: z.enum(['member', 'leader', 'supervisor']),
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

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createParticipantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para cadastrar participante.' },
      { status: 400 },
    );
  }

  const scope = await getParticipantManagementScope(supabase, user.id);
  const allowedGroups = await listGrowthGroups(
    supabase,
    scope.isAdmin ? undefined : { gcIds: scope.managedGcIds },
  );
  const allowedGcIds = new Set(allowedGroups.map((group) => group.id));

  if (!allowedGcIds.has(parsed.data.gcId)) {
    return NextResponse.json(
      { success: false, error: 'Você não pode cadastrar participantes neste GC.' },
      { status: 403 },
    );
  }

  const result = await addParticipant(supabase, {
    gcId: parsed.data.gcId,
    name: parsed.data.name,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    birthDate: parsed.data.birthDate?.trim() || null,
    role: parsed.data.role,
    addedByUserId: user.id,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
