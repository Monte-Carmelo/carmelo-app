import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { updateParticipant } from '@/lib/supabase/mutations/participants';

const idSchema = z.string().trim().min(1);

const updateParticipantSchema = z
  .object({
    participantId: idSchema,
    personId: idSchema,
    gcId: idSchema,
    name: z.string().trim().min(3).max(255),
    email: z.string().email().trim().optional().or(z.literal('')).nullable(),
    phone: z.string().trim().optional().or(z.literal('')).nullable(),
    role: z.enum(['member', 'leader', 'supervisor']),
    status: z.enum(['active', 'inactive', 'transferred']),
  })
  .refine((data) => Boolean(data.email?.trim() || data.phone?.trim()), {
    message: 'Informe e-mail ou telefone.',
    path: ['email'],
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

  const result = await updateParticipant(supabase, {
    participantId: parsed.data.participantId,
    personId: parsed.data.personId,
    gcId: parsed.data.gcId,
    name: parsed.data.name,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    role: parsed.data.role,
    status: parsed.data.status,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
