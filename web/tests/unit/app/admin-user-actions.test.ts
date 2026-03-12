import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addUserAssignment, inactivateUser, removeUserAssignment } from '@/app/(app)/admin/actions';

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

describe('admin user actions', () => {
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
                        id: '50000000-0000-0000-0000-000000000102',
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
      userId: '10000000-0000-0000-0000-000000000002',
      assignmentId: '50000000-0000-0000-0000-000000000102',
    });

    expect(result).toEqual({
      success: false,
      error: 'Não é possível remover este vínculo porque o GC "GC Esperança" precisa manter pelo menos um líder ativo.',
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('impede criar vínculo em GC inativo', async () => {
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

        if (table === 'growth_groups') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: null,
                      error: null,
                    })),
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

    const result = await addUserAssignment({
      userId: '10000000-0000-0000-0000-000000000002',
      gcId: '40000000-0000-0000-0000-000000000003',
      role: 'leader',
    });

    expect(result).toEqual({
      success: false,
      error: 'GC não encontrado ou inativo.',
    });
  });

  it('inativa o usuário sem removê-lo do auth provider', async () => {
    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: '10000000-0000-0000-0000-000000000002', person_id: 'person-2' },
                    error: null,
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(async () => ({
                error: null,
              })),
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
                        {
                          gc_id: '40000000-0000-0000-0000-000000000003',
                          role: 'leader',
                          growth_groups: { name: 'GC Esperança' },
                        },
                      ],
                      error: null,
                    })),
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(async () => ({
                  error: null,
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const result = await inactivateUser('10000000-0000-0000-0000-000000000002');

    expect(result).toEqual({ success: true });
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/users');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/users/10000000-0000-0000-0000-000000000002');
    expect(revalidatePathMock).toHaveBeenCalledWith('/supervision');
  });

  it('retorna mensagem clara quando a inativação deixaria o GC sem supervisor', async () => {
    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: '10000000-0000-0000-0000-000000000002', person_id: 'person-2' },
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
                in: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    is: vi.fn(async () => ({
                      data: [
                        {
                          gc_id: '40000000-0000-0000-0000-000000000003',
                          role: 'supervisor',
                          growth_groups: { name: 'GC Esperança' },
                        },
                      ],
                      error: null,
                    })),
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(async () => ({
                  error: { message: 'GC 40000000-0000-0000-0000-000000000003 deve manter pelo menos um supervisor ativo' },
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const result = await inactivateUser('10000000-0000-0000-0000-000000000002');

    expect(result).toEqual({
      success: false,
      error: 'Não é possível inativar este usuário porque o GC "GC Esperança" precisa manter pelo menos um supervisor ativo.',
    });
  });
});
