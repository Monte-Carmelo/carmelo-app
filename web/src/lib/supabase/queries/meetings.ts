import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type MeetingDetails = {
  id: string;
  gc_id: string;
  lesson_template_id: string | null;
  lesson_title: string;
  datetime: string;
  comments: string | null;
  registered_by_user_id: string;
  growth_groups: {
    id: string;
    name: string;
  };
  meeting_member_attendance: Array<{
    id: string;
    participant_id: string;
    growth_group_participants: {
      id: string;
      people: {
        id: string;
        name: string;
      };
      role: string;
    };
  }>;
  meeting_visitor_attendance: Array<{
    id: string;
    visitor_id: string;
    visitors: {
      id: string;
      people: {
        id: string;
        name: string;
      };
    };
  }>;
};

/**
 * Busca detalhes completos de uma reunião incluindo presença
 */
export async function getMeetingById(
  supabase: SupabaseClient<Database>,
  meetingId: string
): Promise<{ data: MeetingDetails | null; error: string | null }> {
  const { data, error } = await supabase
    .from('meetings')
    .select(
      `
      id,
      gc_id,
      lesson_template_id,
      lesson_title,
      datetime,
      comments,
      registered_by_user_id,
      growth_groups!inner (
        id,
        name
      ),
      meeting_member_attendance (
        id,
        participant_id,
        growth_group_participants (
          id,
          people:person_id (
            id,
            name
          ),
          role
        )
      ),
      meeting_visitor_attendance (
        id,
        visitor_id,
        visitors (
          id,
          people:person_id (
            id,
            name
          )
        )
      )
    `
    )
    .eq('id', meetingId)
    .is('deleted_at', null)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as MeetingDetails, error: null };
}
