import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { deleteMeeting, updateMeetingWithAttendance } from '@/lib/supabase/mutations/meetings';

const idSchema = z.string().trim().min(1);

const updateMeetingSchema = z.object({
  meetingId: idSchema,
  lessonTemplateId: idSchema.nullable().optional(),
  lessonTitle: z.string().trim().min(1).max(255),
  datetime: z.string().datetime(),
  comments: z.string().trim().max(1000).nullable().optional(),
  memberAttendance: z.array(idSchema).default([]),
  visitorAttendance: z.array(idSchema).default([]),
});

async function getAuthenticatedSupabaseUser() {
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    error,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase, user, error } = await getAuthenticatedSupabaseUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateMeetingSchema.safeParse(body);

  if (!parsed.success || parsed.data.meetingId !== id) {
    return NextResponse.json(
      { success: false, error: 'Payload inválido para atualizar reunião.' },
      { status: 400 },
    );
  }

  const result = await updateMeetingWithAttendance(supabase, {
    meetingId: parsed.data.meetingId,
    lessonTemplateId: parsed.data.lessonTemplateId ?? null,
    lessonTitle: parsed.data.lessonTitle,
    datetime: parsed.data.datetime,
    comments: parsed.data.comments ?? null,
    memberAttendance: parsed.data.memberAttendance,
    visitorAttendance: parsed.data.visitorAttendance,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase, user, error } = await getAuthenticatedSupabaseUser();

  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await deleteMeeting(supabase, id);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
