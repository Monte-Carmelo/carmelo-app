import { vi } from 'vitest';
import { removeUserAssignment } from '@/app/(app)/admin/actions';

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

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient,
  getSupabaseServiceClient: vi.fn(),
}));

describe('removeUserAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'admin-user' });
  });

  it('retorna mensagem clara quando a remoção deixaria o GC sem líder', async () => {
    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { person_id: 'person-1' },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        if (table === 'growth_group_participants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: {
                        id: '11111111-1111-4111-8111-111111111111',
                        role: 'leader',
                        growth_groups: { name: 'GC Esperança' },
                      },
                      error: null,
                    })),
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(async () => ({
                    error: { message: 'GC 111 deve manter pelo menos um leader ativo' },
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const result = await removeUserAssignment({
      userId: '22222222-2222-4222-8222-222222222222',
      assignmentId: '11111111-1111-4111-8111-111111111111',
    });

    expect(result).toEqual({
      success: false,
      error: 'Não é possível remover este vínculo porque o GC "GC Esperança" precisa manter pelo menos um líder ativo.',
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
