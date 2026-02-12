import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createMeeting, updateMeeting, deleteMeeting } from '@/lib/supabase/mutations/meetings';

type TableName = keyof Database['public']['Tables'];

function createSupabaseMock() {
  const meetingSingle = vi.fn().mockResolvedValue({ data: { id: 'meeting-1' }, error: null });
  const meetingsInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: meetingSingle,
    })),
  }));
  const meetingsUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const meetingsUpdate = vi.fn(
    (payload: { lesson_title?: string; comments?: string | null; deleted_at?: string }) => ({
      eq: meetingsUpdateEq,
      payload,
    }),
  );

  const memberAttendanceInsert = vi.fn().mockResolvedValue({ error: null });
  const visitorAttendanceInsert = vi.fn().mockResolvedValue({ error: null });

  const tableMock = {
    meetings: {
      insert: meetingsInsert,
      update: meetingsUpdate,
    },
    meeting_member_attendance: {
      insert: memberAttendanceInsert,
    },
    meeting_visitor_attendance: {
      insert: visitorAttendanceInsert,
    },
  };

  const from = vi.fn((table: TableName) => {
    if (table === 'meetings') return tableMock.meetings;
    if (table === 'meeting_member_attendance') return tableMock.meeting_member_attendance;
    if (table === 'meeting_visitor_attendance') return tableMock.meeting_visitor_attendance;
    throw new Error(`Table not mocked: ${String(table)}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    from,
    meetingSingle,
    meetingsInsert,
    meetingsUpdate,
    meetingsUpdateEq,
    memberAttendanceInsert,
    visitorAttendanceInsert,
  };
}

describe('W021 - meetings service (mutations)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createMeeting retorna erro quando falha ao criar reuniao', async () => {
    const mock = createSupabaseMock();
    mock.meetingSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });

    const result = await createMeeting(mock.supabase, {
      gcId: 'gc-1',
      lessonTitle: 'Licao',
      datetime: new Date().toISOString(),
      registeredByUserId: 'user-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('insert failed');
  });

  it('createMeeting cria reuniao e presencas de membros/visitantes', async () => {
    const mock = createSupabaseMock();

    const result = await createMeeting(mock.supabase, {
      gcId: 'gc-1',
      lessonTemplateId: null,
      lessonTitle: 'Licao de teste',
      datetime: new Date().toISOString(),
      comments: 'comentarios',
      registeredByUserId: 'user-1',
      memberAttendance: ['p-1', 'p-2'],
      visitorAttendance: ['v-1'],
    });

    expect(result.success).toBe(true);
    expect(result.meetingId).toBe('meeting-1');
    expect(mock.meetingsInsert).toHaveBeenCalledTimes(1);
    expect(mock.memberAttendanceInsert).toHaveBeenCalledWith([
      { meeting_id: 'meeting-1', participant_id: 'p-1' },
      { meeting_id: 'meeting-1', participant_id: 'p-2' },
    ]);
    expect(mock.visitorAttendanceInsert).toHaveBeenCalledWith([
      { meeting_id: 'meeting-1', visitor_id: 'v-1' },
    ]);
  });

  it('createMeeting segue com sucesso mesmo quando attendance falha', async () => {
    const mock = createSupabaseMock();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mock.memberAttendanceInsert.mockResolvedValueOnce({
      error: { message: 'attendance failure' },
    });

    const result = await createMeeting(mock.supabase, {
      gcId: 'gc-1',
      lessonTitle: 'Licao',
      datetime: new Date().toISOString(),
      registeredByUserId: 'user-1',
      memberAttendance: ['p-1'],
    });

    expect(result.success).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('updateMeeting envia payload parcial e retorna sucesso', async () => {
    const mock = createSupabaseMock();

    const result = await updateMeeting(mock.supabase, {
      meetingId: 'meeting-1',
      lessonTitle: 'Nova licao',
      comments: 'novo comentario',
    });

    expect(result.success).toBe(true);
    expect(mock.meetingsUpdate).toHaveBeenCalledWith({
      lesson_title: 'Nova licao',
      comments: 'novo comentario',
    });
    expect(mock.meetingsUpdateEq).toHaveBeenCalledWith('id', 'meeting-1');
  });

  it('deleteMeeting aplica soft delete e retorna sucesso', async () => {
    const mock = createSupabaseMock();

    const result = await deleteMeeting(mock.supabase, 'meeting-1');

    expect(result.success).toBe(true);
    expect(mock.meetingsUpdate).toHaveBeenCalledTimes(1);
    expect(mock.meetingsUpdateEq).toHaveBeenCalledWith('id', 'meeting-1');
    const payload = mock.meetingsUpdate.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload).toHaveProperty('deleted_at');
    expect(typeof payload!.deleted_at).toBe('string');
  });
});
