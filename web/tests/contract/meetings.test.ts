import { describe, it, expect } from 'vitest';
import { supabase, supabaseReachable } from '../supabase';

const describeIf = supabaseReachable ? describe : describe.skip;

describeIf('Meetings Contract Tests', () => {
  it('should create a new meeting', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    expect(gcsError).toBeNull();
    expect(gcs).toBeDefined();
    console.log('GCS:', gcs);
    expect(gcs.length).toBe(1);
    const gcId = gcs[0].id;

    // Get a user to use as registered_by_user_id
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1);
    expect(usersError).toBeNull();
    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThan(0);
    const userId = users[0].id;

    const meetingData = {
      gc_id: gcId,
      lesson_title: 'Test Lesson',
      datetime: new Date().toISOString(),
      registered_by_user_id: userId,
    };

    const { data, error } = await supabase.from('meetings').insert(meetingData).select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
    expect(data[0].lesson_title).toBe(meetingData.lesson_title);
  });

  it('should fetch meeting details', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    expect(meetingsError).toBeNull();
    expect(meetings).toBeDefined();
    expect(meetings.length).toBe(1);
    const meetingId = meetings[0].id;

    const { data, error } = await supabase.from('meetings').select('*').eq('id', meetingId).single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(meetingId);
  });
});
