import { describe, expect, it, vi } from 'vitest';
import { listGrowthGroups, listParticipants } from '@/lib/api/participants';

function createSupabaseMock() {
  const participantsResult = Promise.resolve({
    data: [
      {
        id: 'p-1',
        gc_id: 'gc-1',
        person_id: 'person-1',
        role: 'member',
        status: 'active',
        joined_at: '2025-01-01T00:00:00.000Z',
        growth_groups: { name: 'GC Esperança' },
        people: { name: 'Maria', email: 'maria@example.com', phone: null },
      },
    ],
    error: null,
  }) as Promise<unknown> & {
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  };
  participantsResult.eq = vi.fn(() => participantsResult);
  participantsResult.order = vi.fn(() => participantsResult);
  participantsResult.limit = vi.fn(() => participantsResult);

  const groupsResult = Promise.resolve({
    data: [{ id: 'gc-1', name: 'GC Esperança' }],
    error: null,
  }) as Promise<unknown> & {
    order: ReturnType<typeof vi.fn>;
  };
  groupsResult.order = vi.fn(() => groupsResult);

  const select = vi.fn((columns?: string) => {
    if (columns?.includes('growth_groups ( id, name )')) {
      return participantsResult;
    }
    return groupsResult;
  });

  return {
    supabase: {
      from: vi.fn(() => ({ select })),
    } as any,
    participantsResult,
  };
}

describe('participants api', () => {
  it('lista grupos para filtros', async () => {
    const mock = createSupabaseMock();
    const result = await listGrowthGroups(mock.supabase);
    expect(result).toEqual([{ id: 'gc-1', name: 'GC Esperança' }]);
  });

  it('mapeia participantes com filtros aplicados', async () => {
    const mock = createSupabaseMock();
    const result = await listParticipants(mock.supabase, {
      gcId: 'gc-1',
      role: 'member',
      status: 'active',
    });

    expect(result[0]).toMatchObject({
      participantId: 'p-1',
      gcName: 'GC Esperança',
      name: 'Maria',
      role: 'member',
    });
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('gc_id', 'gc-1');
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('role', 'member');
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('status', 'active');
  });
});
