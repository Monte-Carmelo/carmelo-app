import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type MarkMemberAttendanceInput = {
  meetingId: string;
  participantId: string;
};

export type MarkMemberAttendanceResult = {
  success: boolean;
  error?: string;
};

/**
 * Marca a presença de um membro em uma reunião
 */
export async function markMemberAttendance(
  supabase: SupabaseClient<Database>,
  input: MarkMemberAttendanceInput
): Promise<MarkMemberAttendanceResult> {
  const { error } = await supabase.from('meeting_member_attendance').insert({
    meeting_id: input.meetingId,
    participant_id: input.participantId,
  });

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

export type UnmarkMemberAttendanceInput = {
  meetingId: string;
  participantId: string;
};

export type UnmarkMemberAttendanceResult = {
  success: boolean;
  error?: string;
};

/**
 * Remove a marcação de presença de um membro em uma reunião
 */
export async function unmarkMemberAttendance(
  supabase: SupabaseClient<Database>,
  input: UnmarkMemberAttendanceInput
): Promise<UnmarkMemberAttendanceResult> {
  const { error } = await supabase
    .from('meeting_member_attendance')
    .delete()
    .match({
      meeting_id: input.meetingId,
      participant_id: input.participantId,
    });

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

export type MarkVisitorAttendanceInput = {
  meetingId: string;
  visitorId: string;
};

export type MarkVisitorAttendanceResult = {
  success: boolean;
  error?: string;
};

/**
 * Marca a presença de um visitante em uma reunião
 */
export async function markVisitorAttendance(
  supabase: SupabaseClient<Database>,
  input: MarkVisitorAttendanceInput
): Promise<MarkVisitorAttendanceResult> {
  const { error } = await supabase.from('meeting_visitor_attendance').insert({
    meeting_id: input.meetingId,
    visitor_id: input.visitorId,
  });

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

export type UnmarkVisitorAttendanceInput = {
  meetingId: string;
  visitorId: string;
};

export type UnmarkVisitorAttendanceResult = {
  success: boolean;
  error?: string;
};

/**
 * Remove a marcação de presença de um visitante em uma reunião
 */
export async function unmarkVisitorAttendance(
  supabase: SupabaseClient<Database>,
  input: UnmarkVisitorAttendanceInput
): Promise<UnmarkVisitorAttendanceResult> {
  const { error } = await supabase
    .from('meeting_visitor_attendance')
    .delete()
    .match({
      meeting_id: input.meetingId,
      visitor_id: input.visitorId,
    });

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

export type BulkUpdateAttendanceInput = {
  meetingId: string;
  memberIds: string[]; // participant_ids to mark as present
  visitorIds: string[]; // visitor_ids to mark as present
};

export type BulkUpdateAttendanceResult = {
  success: boolean;
  error?: string;
};

/**
 * Atualiza em lote a presença de membros e visitantes
 * Remove todas as presenças existentes e insere as novas
 */
export async function bulkUpdateAttendance(
  supabase: SupabaseClient<Database>,
  input: BulkUpdateAttendanceInput
): Promise<BulkUpdateAttendanceResult> {
  // Remover todas as presenças existentes da reunião
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

  // Inserir novas presenças de membros
  if (input.memberIds.length > 0) {
    const memberAttendancePayload = input.memberIds.map((participantId) => ({
      meeting_id: input.meetingId,
      participant_id: participantId,
    }));

    const { error: insertMembersError } = await supabase
      .from('meeting_member_attendance')
      .insert(memberAttendancePayload);

    if (insertMembersError) {
      return {
        success: false,
        error: insertMembersError.message,
      };
    }
  }

  // Inserir novas presenças de visitantes
  if (input.visitorIds.length > 0) {
    const visitorAttendancePayload = input.visitorIds.map((visitorId) => ({
      meeting_id: input.meetingId,
      visitor_id: visitorId,
    }));

    const { error: insertVisitorsError } = await supabase
      .from('meeting_visitor_attendance')
      .insert(visitorAttendancePayload);

    if (insertVisitorsError) {
      return {
        success: false,
        error: insertVisitorsError.message,
      };
    }
  }

  return {
    success: true,
  };
}
