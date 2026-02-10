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

describeIf('Visitors Contract Tests', () => {
  it('should add a new visitor', async () => {
    const { data: gcs, error: gcsError } = await supabase.from('growth_groups').select('id').limit(1);
    const gcRows = assertRows(gcs, 'growth_groups');
    expect(gcsError).toBeNull();
    expect(gcRows.length).toBe(1);
    const gcId = gcRows[0].id;

    const personData = {
      name: 'New Visitor',
      email: `visitor-${Date.now()}@test.com`,
    };

    const { data: person, error: personError } = await supabase.from('people').insert(personData).select();
    const personRows = assertRows(person, 'people');
    expect(personError).toBeNull();
    expect(personRows.length).toBe(1);
    const personId = personRows[0].id;

    const visitorData = {
      person_id: personId,
      gc_id: gcId,
    };

    const { data, error } = await supabase.from('visitors').insert(visitorData).select();
    const visitorRows = assertRows(data, 'visitors');

    expect(error).toBeNull();
    expect(visitorRows.length).toBe(1);
  });
});
