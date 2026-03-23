import { describe, expect, it, vi } from 'vitest';
import {
  getParticipantManagementScope,
  listGrowthGroups,
  listParticipants,
} from '@/lib/api/participants';

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
        growth_groups: { id: 'gc-1', name: 'GC Esperança', status: 'active' },
        people: { name: 'Maria', email: 'maria@example.com', phone: null },
      },
    ],
    error: null,
  }) as Promise<unknown> & {
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  };
  participantsResult.eq = vi.fn(() => participantsResult);
  participantsResult.in = vi.fn(() => participantsResult);
  participantsResult.is = vi.fn(() => participantsResult);
  participantsResult.neq = vi.fn(() => participantsResult);
  participantsResult.order = vi.fn(() => participantsResult);
  participantsResult.limit = vi.fn(() => participantsResult);

  const groupsResult = Promise.resolve({
    data: [{ id: 'gc-1', name: 'GC Esperança' }],
    error: null,
  }) as Promise<unknown> & {
    in: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
  };
  groupsResult.in = vi.fn(() => groupsResult);
  groupsResult.neq = vi.fn(() => groupsResult);
  groupsResult.order = vi.fn(() => groupsResult);

  const userMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      person_id: 'person-1',
      is_admin: false,
    },
    error: null,
  });

  const assignmentsResult = Promise.resolve({
    data: [
      { gc_id: 'gc-1' },
      { gc_id: 'gc-2' },
    ],
    error: null,
  }) as Promise<unknown> & {
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
  };
  assignmentsResult.eq = vi.fn(() => assignmentsResult);
  assignmentsResult.in = vi.fn(() => assignmentsResult);
  assignmentsResult.is = vi.fn(() => assignmentsResult);

  const select = vi.fn((columns?: string) => {
    if (columns?.includes('growth_groups!inner ( id, name, status )')) {
      return participantsResult;
    }

    if (columns === 'person_id, is_admin') {
      return {
        eq: () => ({
          maybeSingle: userMaybeSingle,
        }),
      };
    }

    if (columns === 'gc_id') {
      return assignmentsResult;
    }

    return groupsResult;
  });

  return {
    supabase: {
      from: vi.fn(() => ({ select })),
    } as any,
    groupsResult,
    participantsResult,
    assignmentsResult,
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
    }, { gcIds: ['gc-1'] });

    expect(result[0]).toMatchObject({
      participantId: 'p-1',
      gcName: 'GC Esperança',
      name: 'Maria',
      role: 'member',
    });
    expect(mock.participantsResult.is).toHaveBeenCalledWith('deleted_at', null);
    expect(mock.participantsResult.neq).toHaveBeenCalledWith('growth_groups.status', 'inactive');
    expect(mock.participantsResult.in).toHaveBeenCalledWith('gc_id', ['gc-1']);
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('gc_id', 'gc-1');
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('role', 'member');
    expect(mock.participantsResult.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('filtra grupos inativos e aplica escopo permitido', async () => {
    const mock = createSupabaseMock();
    await listGrowthGroups(mock.supabase, { gcIds: ['gc-1'] });

    expect(mock.groupsResult.neq).toHaveBeenCalledWith('status', 'inactive');
    expect(mock.groupsResult.in).toHaveBeenCalledWith('id', ['gc-1']);
  });

  it('calcula escopo de gerenciamento apenas com GCs ativos liderados/supervisionados', async () => {
    const mock = createSupabaseMock();
    const scope = await getParticipantManagementScope(mock.supabase, 'user-1');

    expect(scope).toEqual({
      isAdmin: false,
      personId: 'person-1',
      managedGcIds: ['gc-1'],
    });
    expect(mock.assignmentsResult.eq).toHaveBeenCalledWith('person_id', 'person-1');
    expect(mock.assignmentsResult.eq).toHaveBeenCalledWith('status', 'active');
    expect(mock.assignmentsResult.in).toHaveBeenCalledWith('role', ['leader', 'supervisor']);
    expect(mock.assignmentsResult.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
