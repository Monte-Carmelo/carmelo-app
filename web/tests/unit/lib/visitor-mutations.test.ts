import { describe, expect, it, vi } from 'vitest';
import { addVisitor } from '@/lib/supabase/mutations/visitors';

function createSupabaseMock() {
  const peopleByEmailMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const peopleByPhoneMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'person-phone' }, error: null });
  const insertedPersonSingle = vi.fn().mockResolvedValue({ data: { id: 'person-new' }, error: null });
  const existingVisitorMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const insertedVisitorSingle = vi.fn().mockResolvedValue({ data: { id: 'visitor-new' }, error: null });

  const peopleSelect = vi.fn(() => ({
    eq: vi.fn((column: string) => {
      if (column === 'email') {
        return { maybeSingle: peopleByEmailMaybeSingle };
      }

      if (column === 'phone') {
        return { maybeSingle: peopleByPhoneMaybeSingle };
      }

      throw new Error(`Unexpected people column: ${column}`);
    }),
  }));

  const peopleInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: insertedPersonSingle,
    })),
  }));

  const visitorsSelect = vi.fn(() => ({
    eq: vi.fn((column: string) => {
      if (column !== 'person_id') {
        throw new Error(`Unexpected visitors column: ${column}`);
      }

      return {
        eq: vi.fn((nextColumn: string) => {
          if (nextColumn !== 'gc_id') {
            throw new Error(`Unexpected visitors nested column: ${nextColumn}`);
          }

          return { maybeSingle: existingVisitorMaybeSingle };
        }),
      };
    }),
  }));

  const visitorsInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: insertedVisitorSingle,
    })),
  }));

  const from = vi.fn((table: string) => {
    if (table === 'people') {
      return {
        select: peopleSelect,
        insert: peopleInsert,
      };
    }

    if (table === 'visitors') {
      return {
        select: visitorsSelect,
        insert: visitorsInsert,
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: { from } as any,
    peopleByPhoneMaybeSingle,
    peopleInsert,
    insertedPersonSingle,
    visitorsInsert,
    insertedVisitorSingle,
  };
}

describe('visitor mutations', () => {
  it('creates a new person when email is provided and phone matches someone else', async () => {
    const mock = createSupabaseMock();

    const result = await addVisitor(mock.supabase, {
      gcId: 'gc-1',
      name: 'Nova Pessoa',
      email: 'nova@example.com',
      phone: '11999999999',
    });

    expect(result).toMatchObject({
      success: true,
      personId: 'person-new',
      visitorId: 'visitor-new',
    });
    expect(mock.peopleByPhoneMaybeSingle).not.toHaveBeenCalled();
    expect(mock.peopleInsert).toHaveBeenCalledTimes(1);
    expect(mock.visitorsInsert).toHaveBeenCalledTimes(1);
  });
});
