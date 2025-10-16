import { describe, it, expect } from 'vitest';
import { supabase } from '../supabase';

describe('Attendance Contract Tests', () => {
  it('should mark a member as present', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    expect(meetingsError).toBeNull();
    expect(meetings).toBeDefined();
    expect(meetings.length).toBe(1);
    const meetingId = meetings[0].id;

    const { data: participants, error: participantsError } = await supabase.from('growth_group_participants').select('id').limit(1);
    expect(participantsError).toBeNull();
    expect(participants).toBeDefined();
    expect(participants.length).toBe(1);
    const participantId = participants[0].id;

    const attendanceData = {
      meeting_id: meetingId,
      participant_id: participantId,
    };

    // Delete existing attendance first to avoid duplicate key error
    await supabase.from('meeting_member_attendance').delete().match(attendanceData);

    const { data, error } = await supabase.from('meeting_member_attendance').insert(attendanceData).select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
  });

  it("should remove a member's presence", async () => {
    const { data: attendance, error: attendanceError } = await supabase.from('meeting_member_attendance').select('*').limit(1);
    expect(attendanceError).toBeNull();
    expect(attendance).toBeDefined();
    expect(attendance.length).toBe(1);
    const { meeting_id, participant_id } = attendance[0];

    const { error } = await supabase.from('meeting_member_attendance').delete().match({ meeting_id, participant_id });

    expect(error).toBeNull();
  });

  it('should mark a visitor as present', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    expect(meetingsError).toBeNull();
    expect(meetings).toBeDefined();
    expect(meetings.length).toBe(1);
    const meetingId = meetings[0].id;

    const { data: visitors, error: visitorsError } = await supabase.from('visitors').select('id').limit(1);
    expect(visitorsError).toBeNull();
    expect(visitors).toBeDefined();
    expect(visitors.length).toBe(1);
    const visitorId = visitors[0].id;

    const attendanceData = {
      meeting_id: meetingId,
      visitor_id: visitorId,
    };

    const { data, error } = await supabase.from('meeting_visitor_attendance').insert(attendanceData).select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
  });

  it("should remove a visitor's presence", async () => {
    const { data: attendance, error: attendanceError } = await supabase.from('meeting_visitor_attendance').select('*').limit(1);
    expect(attendanceError).toBeNull();
    expect(attendance).toBeDefined();
    expect(attendance.length).toBe(1);
    const { meeting_id, visitor_id } = attendance[0];

    const { error } = await supabase.from('meeting_visitor_attendance').delete().match({ meeting_id, visitor_id });

    expect(error).toBeNull();
  });
});
