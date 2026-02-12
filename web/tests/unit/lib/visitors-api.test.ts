import { describe, expect, it, vi } from 'vitest';
import { convertVisitorToParticipant, listVisitors, type VisitorView } from '@/lib/api/visitors';

function createSupabaseMock() {
  const upsertSingle = vi.fn().mockResolvedValue({ data: { id: 'participant-1' }, error: null });
  const upsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: upsertSingle,
    })),
  }));
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));
  const insert = vi.fn().mockResolvedValue({ error: null });

  const visitorsListResult = Promise.resolve({
    data: [
      {
        id: 'visitor-1',
        gc_id: 'gc-1',
        status: 'active',
        visit_count: 3,
        last_visit_date: '2025-01-10',
        people: { id: 'person-1', name: 'João', email: 'joao@example.com' },
        growth_groups: { name: 'GC Alpha' },
      },
    ],
    error: null,
  }) as Promise<unknown> & {
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
  };
  visitorsListResult.eq = vi.fn(() => visitorsListResult);
  visitorsListResult.order = vi.fn(() => visitorsListResult);

  const from = vi.fn((table: string) => {
    if (table === 'growth_group_participants') return { upsert };
    if (table === 'visitors') return { select: vi.fn(() => visitorsListResult), update };
    if (table === 'visitor_conversion_events') return { insert };
    return {};
  });

  return {
    supabase: { from } as any,
    visitorsListResult,
    upsert,
    updateEq,
    insert,
  };
}

const visitor: VisitorView = {
  id: 'visitor-1',
  gcId: 'gc-1',
  gcName: 'GC Alpha',
  personId: 'person-1',
  name: 'João',
  email: 'joao@example.com',
  status: 'active',
  visitCount: 3,
  lastVisitDate: '2025-01-10',
};

describe('visitors api', () => {
  it('lista visitantes com mapeamento para view', async () => {
    const mock = createSupabaseMock();
    const result = await listVisitors(mock.supabase, { status: 'active' });

    expect(result[0]).toMatchObject({
      id: 'visitor-1',
      gcName: 'GC Alpha',
      visitCount: 3,
    });
    expect(mock.visitorsListResult.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('converte visitante em participante e registra evento', async () => {
    const mock = createSupabaseMock();
    const result = await convertVisitorToParticipant(mock.supabase, visitor, 'user-1');

    expect(result.success).toBe(true);
    expect(mock.upsert).toHaveBeenCalledTimes(1);
    expect(mock.updateEq).toHaveBeenCalledWith('id', 'visitor-1');
    expect(mock.insert).toHaveBeenCalledTimes(1);
  });
});
