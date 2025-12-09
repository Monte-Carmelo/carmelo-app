import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  getEventAction,
  listEventsAction,
} from '@/app/(app)/admin/events/actions';

const { getAuthenticatedUser, createSupabaseServerClient, revalidatePath } = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server-auth', () => ({ getAuthenticatedUser }));
vi.mock('@/lib/supabase/server-client', () => ({ createSupabaseServerClient }));
vi.mock('next/cache', () => ({ revalidatePath }));

function supabaseInsertMock() {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'e-1', title: 'Evento' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({ single: () => Promise.resolve({ data: { id: 'e-1', title: 'Atualizado' }, error: null }) }),
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'e-1',
                title: 'Evento',
                description: null,
                event_date: '2025-01-01',
                event_time: '10:00',
                location: null,
                banner_url: null,
                status: 'scheduled',
                created_at: '2024-01-01',
                users: { people: { name: 'Admin' } },
              },
              error: null,
            }),
          }),
        }),
        order: () => ({
          order: () => ({
            gte: () => ({ lte: () => ({ eq: () => ({ is: () => ({ single: () => null }) }) }) }),
            lte: () => ({ eq: () => ({ is: () => ({ single: () => null }) }) }),
            then: (resolve: (val: { data: any[]; error: null }) => void) => resolve({ data: [sampleEvent], error: null }),
          }),
        }),
      }),
    }),
  } as any;
}

const sampleEvent = {
  id: 'e-1',
  title: 'Evento',
  description: null,
  event_date: '2025-01-01',
  event_time: '10:00',
  location: null,
  banner_url: null,
  status: 'scheduled',
  created_at: '2024-01-01',
  created_by_name: 'Admin',
  is_deleted: false,
};

describe('admin events actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
    createSupabaseServerClient.mockResolvedValue(supabaseInsertMock());
  });

  it('cria evento e revalida paths', async () => {
    const result = await createEventAction({
      title: 'Evento',
      event_date: '2025-01-01',
      event_time: '10:00',
    });
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/events');
    expect(revalidatePath).toHaveBeenCalledWith('/events');
  });

  it('atualiza evento existente', async () => {
    const result = await updateEventAction({ id: 'e-1', title: 'Novo' });
    expect(result.success).toBe(true);
  });

  it('exclui evento com soft delete', async () => {
    const result = await deleteEventAction({ id: 'e-1' });
    expect(result.success).toBe(true);
  });

  it('busca evento individual com nome do criador', async () => {
    const result = await getEventAction({ id: 'e-1' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.created_by_name).toBeDefined();
  });

  it('lista eventos por ano', async () => {
    const result = await listEventsAction({ year: 2025 });
    expect(result.success).toBe(true);
    expect(result.success && result.data[0].title).toBe('Evento');
  });
});
