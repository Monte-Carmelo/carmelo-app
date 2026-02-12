import { describe, it, expect } from 'vitest';
import { supabase, supabaseReachable } from '../supabase';

const describeIf = supabaseReachable ? describe : describe.skip;

function assertRows<T>(rows: T[] | null, label: string): T[] {
  expect(rows).not.toBeNull();
  if (!rows) {
    throw new Error(`${label} returned null`);
  }
  return rows;
}

describeIf('Attendance Contract Tests', () => {
  it('should mark a member as present', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    const meetingRows = assertRows(meetings, 'meetings');
    expect(meetingsError).toBeNull();
    expect(meetingRows.length).toBe(1);
    const meetingId = meetingRows[0].id;

    const { data: participants, error: participantsError } = await supabase.from('growth_group_participants').select('id').limit(1);
    const participantRows = assertRows(participants, 'growth_group_participants');
    expect(participantsError).toBeNull();
    expect(participantRows.length).toBe(1);
    const participantId = participantRows[0].id;

    const attendanceData = {
      meeting_id: meetingId,
      participant_id: participantId,
    };

    // Delete existing attendance first to avoid duplicate key error
    await supabase.from('meeting_member_attendance').delete().match(attendanceData);

    const { data, error } = await supabase.from('meeting_member_attendance').insert(attendanceData).select();
    const attendanceRows = assertRows(data, 'meeting_member_attendance');

    expect(error).toBeNull();
    expect(attendanceRows.length).toBe(1);
  });

  it("should remove a member's presence", async () => {
    const { data: attendance, error: attendanceError } = await supabase.from('meeting_member_attendance').select('*').limit(1);
    const attendanceRows = assertRows(attendance, 'meeting_member_attendance');
    expect(attendanceError).toBeNull();
    expect(attendanceRows.length).toBe(1);
    const { meeting_id, participant_id } = attendanceRows[0];

    const { error } = await supabase.from('meeting_member_attendance').delete().match({ meeting_id, participant_id });

    expect(error).toBeNull();
  });

  it('should mark a visitor as present', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    const meetingRows = assertRows(meetings, 'meetings');
    expect(meetingsError).toBeNull();
    expect(meetingRows.length).toBe(1);
    const meetingId = meetingRows[0].id;

    const { data: visitors, error: visitorsError } = await supabase.from('visitors').select('id').limit(1);
    const visitorRows = assertRows(visitors, 'visitors');
    expect(visitorsError).toBeNull();
    expect(visitorRows.length).toBe(1);
    const visitorId = visitorRows[0].id;

    const attendanceData = {
      meeting_id: meetingId,
      visitor_id: visitorId,
    };

    // Delete existing attendance first to avoid duplicate key error
    await supabase.from('meeting_visitor_attendance').delete().match(attendanceData);

    const { data, error } = await supabase.from('meeting_visitor_attendance').insert(attendanceData).select();

    expect(error).toBeNull();
    const attendanceRows = assertRows(data, 'meeting_visitor_attendance');
    expect(attendanceRows.length).toBe(1);
  });

  it("should remove a visitor's presence", async () => {
    const { data: attendance, error: attendanceError } = await supabase.from('meeting_visitor_attendance').select('*').limit(1);
    const attendanceRows = assertRows(attendance, 'meeting_visitor_attendance');
    expect(attendanceError).toBeNull();
    expect(attendanceRows.length).toBe(1);
    const { meeting_id, visitor_id } = attendanceRows[0];

    const { error } = await supabase.from('meeting_visitor_attendance').delete().match({ meeting_id, visitor_id });

    expect(error).toBeNull();
  });
});
