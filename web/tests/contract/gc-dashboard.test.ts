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

describeIf('GC Dashboard Contract Tests', () => {
  it('should fetch GCs for a user', async () => {
    // This test assumes that there is a user in the database with at least one GC.
    // We will fetch the GCs for the first user we find.
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1);
    const userRows = assertRows(users, 'users');
    expect(usersError).toBeNull();
    console.log('Users:', userRows);
    expect(userRows.length).toBe(1);
    const userId = userRows[0].id;

    const { data, error } = await supabase
      .from('growth_group_participants')
      .select('gc_id')
      .eq('person_id', userId);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('should fetch recent meetings for a GC', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    const gcRows = assertRows(gcs, 'growth_groups');
    expect(gcsError).toBeNull();
    expect(gcRows.length).toBe(1);
    const gcId = gcRows[0].id;

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('gc_id', gcId)
      .order('datetime', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('should fetch members for a GC', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    const gcRows = assertRows(gcs, 'growth_groups');
    expect(gcsError).toBeNull();
    expect(gcRows.length).toBe(1);
    const gcId = gcRows[0].id;

    const { data, error } = await supabase
      .from('growth_group_participants')
      .select('*, people(*)')
      .eq('gc_id', gcId);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});
