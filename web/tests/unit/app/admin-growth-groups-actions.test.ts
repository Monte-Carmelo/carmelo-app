import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inactivateGrowthGroupAction, updateGrowthGroupAction } from '@/app/(app)/admin/growth-groups/actions';

const { revalidatePathMock, getAuthenticatedUser, createSupabaseServerClient } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/lib/supabase/server-auth', () => ({
  getAuthenticatedUser,
}));

vi.mock('@/lib/supabase/server-client', () => ({
  createSupabaseServerClient,
}));

describe('admin growth group actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
  });

  it('insere nova liderança antes de remover a antiga', async () => {
    const operationLog: string[] = [];

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'growth_groups') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(async () => {
                operationLog.push('update:gc');
                return { error: null };
              }),
            })),
          };
        }

        if (table === 'growth_group_participants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    is: vi.fn(async () => ({
                      data: [
                        { id: 'old-leader', person_id: 'person-old-leader', role: 'leader' },
                        { id: 'old-supervisor', person_id: 'person-old-supervisor', role: 'supervisor' },
                      ],
                      error: null,
                    })),
                  })),
                })),
              })),
            })),
            insert: vi.fn(async (rows: Array<{ person_id: string; role: string }>) => {
              operationLog.push(`insert:${rows.map((row) => `${row.role}:${row.person_id}`).join(',')}`);
              return { error: null };
            }),
            delete: vi.fn(() => ({
              in: vi.fn(async (_column: string, ids: string[]) => {
                operationLog.push(`delete:${ids.join(',')}`);
                return { error: null };
              }),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const result = await updateGrowthGroupAction('gc-1', {
      name: 'GC Esperança',
      mode: 'in_person',
      address: 'Rua 1',
      weekday: 3,
      time: '19:30',
      leaderIds: ['person-new-leader'],
      supervisorIds: ['person-new-supervisor'],
      memberIds: [],
    });

    expect(result).toEqual({ success: true });
    expect(operationLog).toEqual([
      'update:gc',
      'insert:leader:person-new-leader,supervisor:person-new-supervisor',
      'delete:old-leader,old-supervisor',
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/growth-groups');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/growth-groups/gc-1');
  });

  it('inativa um GC ativo preservando o histórico', async () => {
    const operationLog: string[] = [];

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table !== 'growth_groups') {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { id: 'gc-1', status: 'active' },
                  error: null,
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => {
              operationLog.push('update:inactive');
              return { error: null };
            }),
          })),
        };
      }),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const result = await inactivateGrowthGroupAction('gc-1');

    expect(result).toEqual({ success: true });
    expect(operationLog).toEqual(['update:inactive']);
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/growth-groups');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/growth-groups/gc-1');
    expect(revalidatePathMock).toHaveBeenCalledWith('/gc');
  });
});
