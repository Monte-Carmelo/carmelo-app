import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { updateParticipantStatus } from '@/lib/supabase/mutations/participants';

const updateParticipantStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'transferred']),
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
  const parsed = updateParticipantStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para atualizar status do participante.' },
      { status: 400 },
    );
  }

  const result = await updateParticipantStatus(supabase, {
    participantId: id,
    status: parsed.data.status,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
