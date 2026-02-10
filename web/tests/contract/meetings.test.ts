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

describeIf('Meetings Contract Tests', () => {
  it('should create a new meeting', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    const gcRows = assertRows(gcs, 'growth_groups');
    expect(gcsError).toBeNull();
    console.log('GCS:', gcRows);
    expect(gcRows.length).toBe(1);
    const gcId = gcRows[0].id;

    // Get a user to use as registered_by_user_id
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1);
    const userRows = assertRows(users, 'users');
    expect(usersError).toBeNull();
    expect(userRows.length).toBeGreaterThan(0);
    const userId = userRows[0].id;

    const meetingData = {
      gc_id: gcId,
      lesson_title: 'Test Lesson',
      datetime: new Date().toISOString(),
      registered_by_user_id: userId,
    };

    const { data, error } = await supabase.from('meetings').insert(meetingData).select();
    const createdRows = assertRows(data, 'meetings insert');

    expect(error).toBeNull();
    expect(createdRows.length).toBe(1);
    expect(createdRows[0].lesson_title).toBe(meetingData.lesson_title);
  });

  it('should fetch meeting details', async () => {
    const { data: meetings, error: meetingsError } = await supabase.from('meetings').select('id').limit(1);
    const meetingRows = assertRows(meetings, 'meetings');
    expect(meetingsError).toBeNull();
    expect(meetingRows.length).toBe(1);
    const meetingId = meetingRows[0].id;

    const { data, error } = await supabase.from('meetings').select('*').eq('id', meetingId).single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    if (!data) {
      throw new Error('meeting details returned null');
    }
    expect(data.id).toBe(meetingId);
  });
});
