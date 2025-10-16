import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type CreateMeetingInput = {
  gcId: string;
  lessonTemplateId?: string | null;
  lessonTitle: string;
  datetime: string;
  comments?: string | null;
  registeredByUserId: string;
  memberAttendance?: string[]; // participant_ids
  visitorAttendance?: string[]; // visitor_ids
};

export type CreateMeetingResult = {
  success: boolean;
  meetingId?: string;
  error?: string;
};

/**
 * Cria uma nova reunião com informações de presença opcional
 */
export async function createMeeting(
  supabase: SupabaseClient<Database>,
  input: CreateMeetingInput
): Promise<CreateMeetingResult> {
  // Criar a reunião
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .insert({
      gc_id: input.gcId,
      lesson_template_id: input.lessonTemplateId || null,
      lesson_title: input.lessonTitle,
      datetime: input.datetime,
      comments: input.comments || null,
      registered_by_user_id: input.registeredByUserId,
    })
    .select('id')
    .single();

  if (meetingError || !meeting) {
    return {
      success: false,
      error: meetingError?.message ?? 'Falha ao criar reunião',
    };
  }

  // Registrar presença de membros (se fornecida)
  if (input.memberAttendance && input.memberAttendance.length > 0) {
    const memberAttendancePayload = input.memberAttendance.map((participantId) => ({
      meeting_id: meeting.id,
      participant_id: participantId,
    }));

    const { error: memberAttendanceError } = await supabase
      .from('meeting_member_attendance')
      .insert(memberAttendancePayload);

    if (memberAttendanceError) {
      console.error('Error creating member attendance:', memberAttendanceError);
      // Não retornar erro, pois a reunião foi criada com sucesso
    }
  }

  // Registrar presença de visitantes (se fornecida)
  if (input.visitorAttendance && input.visitorAttendance.length > 0) {
    const visitorAttendancePayload = input.visitorAttendance.map((visitorId) => ({
      meeting_id: meeting.id,
      visitor_id: visitorId,
    }));

    const { error: visitorAttendanceError } = await supabase
      .from('meeting_visitor_attendance')
      .insert(visitorAttendancePayload);

    if (visitorAttendanceError) {
      console.error('Error creating visitor attendance:', visitorAttendanceError);
      // Não retornar erro, pois a reunião foi criada com sucesso
    }
  }

  return {
    success: true,
    meetingId: meeting.id,
  };
}

export type UpdateMeetingInput = {
  meetingId: string;
  lessonTitle?: string;
  datetime?: string;
  comments?: string | null;
};

export type UpdateMeetingResult = {
  success: boolean;
  error?: string;
};

/**
 * Atualiza informações de uma reunião existente
 */
export async function updateMeeting(
  supabase: SupabaseClient<Database>,
  input: UpdateMeetingInput
): Promise<UpdateMeetingResult> {
  const updateData: any = {};

  if (input.lessonTitle !== undefined) {
    updateData.lesson_title = input.lessonTitle;
  }
  if (input.datetime !== undefined) {
    updateData.datetime = input.datetime;
  }
  if (input.comments !== undefined) {
    updateData.comments = input.comments;
  }

  const { error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', input.meetingId);

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

export type DeleteMeetingResult = {
  success: boolean;
  error?: string;
};

/**
 * Remove uma reunião (soft delete)
 */
export async function deleteMeeting(
  supabase: SupabaseClient<Database>,
  meetingId: string
): Promise<DeleteMeetingResult> {
  const { error } = await supabase
    .from('meetings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', meetingId);

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
