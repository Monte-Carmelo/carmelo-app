import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createMeeting } from '@/lib/supabase/mutations/meetings';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

const idSchema = z.string().trim().min(1);

const createMeetingSchema = z.object({
  gcId: idSchema,
  lessonTemplateId: idSchema.nullable().optional(),
  lessonTitle: z.string().trim().min(1).max(255),
  datetime: z.string().datetime(),
  comments: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  memberAttendance: z.array(idSchema).default([]),
  visitorAttendance: z.array(idSchema).default([]),
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
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para registrar reunião.' },
      { status: 400 },
    );
  }

  const result = await createMeeting(supabase, {
    gcId: parsed.data.gcId,
    lessonTemplateId: parsed.data.lessonTemplateId ?? null,
    lessonTitle: parsed.data.lessonTitle,
    datetime: parsed.data.datetime,
    comments: parsed.data.comments ?? null,
    status: parsed.data.status,
    registeredByUserId: user.id,
    memberAttendance: parsed.data.memberAttendance,
    visitorAttendance: parsed.data.visitorAttendance,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
