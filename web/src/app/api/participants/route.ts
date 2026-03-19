import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { addParticipant } from '@/lib/supabase/mutations/participants';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

const idSchema = z.string().trim().min(1);

const createParticipantSchema = z
  .object({
    gcId: idSchema,
    name: z.string().trim().min(3).max(255),
    email: z.string().email().trim().optional().or(z.literal('')).nullable(),
    phone: z.string().trim().optional().or(z.literal('')).nullable(),
    role: z.enum(['member', 'leader', 'supervisor']),
  })
  .refine((data) => Boolean(data.email?.trim() || data.phone?.trim()), {
    message: 'Informe e-mail ou telefone.',
    path: ['email'],
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

  const result = await addParticipant(supabase, {
    gcId: parsed.data.gcId,
    name: parsed.data.name,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    role: parsed.data.role,
    addedByUserId: user.id,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
