import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { updateGrowthGroup } from '@/lib/supabase/mutations/growth-groups';

const updateGrowthGroupSchema = z.object({
  gcId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(255),
  mode: z.enum(['in_person', 'online', 'hybrid']),
  address: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
  weekday: z.number().min(0).max(6).nullable().optional(),
  time: z.string().optional().or(z.literal('')).nullable(),
  status: z.enum(['active', 'inactive', 'multiplying']),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ gcId: string }> },
) {
  const { gcId } = await context.params;
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateGrowthGroupSchema.safeParse(body);

  if (!parsed.success || parsed.data.gcId !== gcId) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para atualizar GC.' },
      { status: 400 },
    );
  }

  const result = await updateGrowthGroup(supabase, {
    gcId: parsed.data.gcId,
    name: parsed.data.name,
    mode: parsed.data.mode,
    address: parsed.data.address?.trim() || null,
    weekday: parsed.data.weekday ?? null,
    time: parsed.data.time || null,
    status: parsed.data.status,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
