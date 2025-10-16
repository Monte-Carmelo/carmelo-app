import { describe, it, expect } from 'vitest';
import { supabase } from '../supabase';

describe('Visitors Contract Tests', () => {
  it('should add a new visitor', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    expect(gcsError).toBeNull();
    expect(gcs).toBeDefined();
    expect(gcs.length).toBe(1);
    const gcId = gcs[0].id;

    const personData = {
      name: 'New Visitor',
      email: `visitor-${Date.now()}@test.com`,
    };

    const { data: person, error: personError } = await supabase.from('people').insert(personData).select();
    expect(personError).toBeNull();
    expect(person).toBeDefined();
    expect(person.length).toBe(1);
    const personId = person[0].id;

    const visitorData = {
      person_id: personId,
      gc_id: gcId,
    };

    const { data, error } = await supabase.from('visitors').insert(visitorData).select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBe(1);
  });
});
