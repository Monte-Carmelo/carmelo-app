import { describe, expect, it } from 'vitest';
import { getMeetingById } from '@/lib/supabase/queries/meetings';

const meetingRow = {
  id: 'm-1',
  gc_id: 'gc-1',
  lesson_template_id: null,
  lesson_title: 'Lição X',
  datetime: '2025-01-10T19:30:00Z',
  comments: 'ok',
  registered_by_user_id: 'user-1',
  growth_groups: { id: 'gc-1', name: 'GC Teste' },
  meeting_member_attendance: [
    {
      id: 'mma-1',
      participant_id: 'p-1',
      growth_group_participants: {
        id: 'p-1',
        people: { id: 'person-1', name: 'Pessoa 1' },
        role: 'member',
      },
    },
  ],
  meeting_visitor_attendance: [
    {
      id: 'mva-1',
      visitor_id: 'v-1',
      visitors: {
        id: 'v-1',
        people: { id: 'person-2', name: 'Visitante' },
      },
    },
  ],
};

function createSupabaseMock() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({ single: () => Promise.resolve({ data: meetingRow, error: null }) }),
        }),
      }),
    }),
  } as any;
}

describe('meetings queries', () => {
  it('retorna detalhes completos da reunião', async () => {
    const supabase = createSupabaseMock();
    const result = await getMeetingById(supabase, 'm-1');
    expect(result.error).toBeNull();
    expect(result.data?.growth_groups.name).toBe('GC Teste');
    expect(result.data?.meeting_member_attendance[0].growth_group_participants.people.name).toBe('Pessoa 1');
    expect(result.data?.meeting_visitor_attendance[0].visitors.people.name).toBe('Visitante');
  });
});
