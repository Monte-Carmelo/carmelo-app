import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import type { MeetingStatus } from '../queries/meetings';

export type CreateMeetingInput = {
  gcId: string;
  lessonTemplateId?: string | null;
  lessonTitle: string;
  datetime: string;
  comments?: string | null;
  status?: MeetingStatus;
  taughtBy?: string | null;
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
      status: input.status ?? 'scheduled',
      taught_by: input.taughtBy || null,
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
  lessonTemplateId?: string | null;
  lessonTitle?: string;
  datetime?: string;
  comments?: string | null;
  status?: MeetingStatus;
  taughtBy?: string | null;
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
  const updateData: Partial<Database['public']['Tables']['meetings']['Update']> = {};

  if (input.lessonTitle !== undefined) {
    updateData.lesson_title = input.lessonTitle;
  }
  if (input.lessonTemplateId !== undefined) {
    updateData.lesson_template_id = input.lessonTemplateId;
  }
  if (input.datetime !== undefined) {
    updateData.datetime = input.datetime;
  }
  if (input.comments !== undefined) {
    updateData.comments = input.comments;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.taughtBy !== undefined) {
    updateData.taught_by = input.taughtBy;
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

export type ReplaceMeetingAttendanceInput = {
  meetingId: string;
  memberAttendance?: string[];
  visitorAttendance?: string[];
};

export async function replaceMeetingAttendance(
  supabase: SupabaseClient<Database>,
  input: ReplaceMeetingAttendanceInput,
): Promise<UpdateMeetingResult> {
  const { error: deleteMembersError } = await supabase
    .from('meeting_member_attendance')
    .delete()
    .eq('meeting_id', input.meetingId);

  if (deleteMembersError) {
    return {
      success: false,
      error: deleteMembersError.message,
    };
  }

  if (input.memberAttendance && input.memberAttendance.length > 0) {
    const { error: memberAttendanceError } = await supabase
      .from('meeting_member_attendance')
      .insert(
        input.memberAttendance.map((participantId) => ({
          meeting_id: input.meetingId,
          participant_id: participantId,
        })),
      );

    if (memberAttendanceError) {
      return {
        success: false,
        error: 'Reunião atualizada, mas faltou registrar presença de membros.',
      };
    }
  }

  const { error: deleteVisitorsError } = await supabase
    .from('meeting_visitor_attendance')
    .delete()
    .eq('meeting_id', input.meetingId);

  if (deleteVisitorsError) {
    return {
      success: false,
      error: deleteVisitorsError.message,
    };
  }

  if (input.visitorAttendance && input.visitorAttendance.length > 0) {
    const { error: visitorAttendanceError } = await supabase
      .from('meeting_visitor_attendance')
      .insert(
        input.visitorAttendance.map((visitorId) => ({
          meeting_id: input.meetingId,
          visitor_id: visitorId,
        })),
      );

    if (visitorAttendanceError) {
      return {
        success: false,
        error: 'Reunião atualizada, mas faltou registrar presença de visitantes.',
      };
    }
  }

  return {
    success: true,
  };
}

export type UpdateMeetingWithAttendanceInput = UpdateMeetingInput & ReplaceMeetingAttendanceInput;

export async function updateMeetingWithAttendance(
  supabase: SupabaseClient<Database>,
  input: UpdateMeetingWithAttendanceInput,
): Promise<UpdateMeetingResult> {
  const updateResult = await updateMeeting(supabase, input);

  if (!updateResult.success) {
    return updateResult;
  }

  return replaceMeetingAttendance(supabase, input);
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
