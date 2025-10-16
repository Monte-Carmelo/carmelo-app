import { describe, it, expect } from 'vitest';
import { supabase } from '../supabase';

describe('GC Dashboard Contract Tests', () => {
  it('should fetch GCs for a user', async () => {
    // This test assumes that there is a user in the database with at least one GC.
    // We will fetch the GCs for the first user we find.
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1);
    expect(usersError).toBeNull();
    expect(users).toBeDefined();
    console.log('Users:', users);
    expect(users.length).toBe(1);
    const userId = users[0].id;

    const { data, error } = await supabase
      .from('growth_group_participants')
      .select('gc_id')
      .eq('person_id', userId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should fetch recent meetings for a GC', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    expect(gcsError).toBeNull();
    expect(gcs).toBeDefined();
    expect(gcs.length).toBe(1);
    const gcId = gcs[0].id;

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('gc_id', gcId)
      .order('datetime', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should fetch members for a GC', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    expect(gcsError).toBeNull();
    expect(gcs).toBeDefined();
    expect(gcs.length).toBe(1);
    const gcId = gcs[0].id;

    const { data, error } = await supabase
      .from('growth_group_participants')
      .select('*, people(*)')
      .eq('gc_id', gcId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
