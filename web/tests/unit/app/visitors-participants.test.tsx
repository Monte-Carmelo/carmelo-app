import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { VisitorsContent } from '@/app/(app)/visitors/page';
import { ParticipantsContent } from '@/app/(app)/participants/page';

const { redirectMock, getAuthenticatedUser, createSupabaseServerClient } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('status=active'),
}));

vi.mock('@/lib/auth/session-context', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, roles: null }),
}));

vi.mock('@/lib/supabase/server-auth', () => ({
  getAuthenticatedUser,
}));

vi.mock('@/lib/supabase/server-client', () => ({
  createSupabaseServerClient,
}));

const supabaseMock = {
  from: (table: string) => {
    switch (table) {
      case 'visitors':
        return {
          select: () => {
            const result = { data: visitorRows, error: null };
            const chain: any = {
              order: () => chain,
              eq: () => chain,
              then: (resolve: (value: typeof result) => void) => resolve(result),
            };
            return chain;
          },
        };
      case 'growth_group_participants': {
        const result = { data: participantRows, error: null };
        const chain: any = {
          eq: () => chain,
          order: () => chain,
          limit: () => chain,
          then: (resolve: (value: typeof result) => void) => resolve(result),
        };
        return {
          select: () => chain,
        };
      }
      case 'growth_groups':
        return {
          select: () => ({ order: () => Promise.resolve({ data: gcRows, error: null }) }),
        };
      default:
        return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) };
    }
  },
};

const visitorRows = [
  {
    id: 'v-1',
    gc_id: 'gc-1',
    status: 'active',
    visit_count: 2,
    last_visit_date: '2024-05-01',
    people: { id: 'p-1', name: 'Visitante 1', email: 'v1@example.com' },
    growth_groups: { name: 'GC Alpha' },
  },
];

const participantRows = [
  {
    id: 'gp-1',
    gc_id: 'gc-1',
    person_id: 'p-2',
    role: 'member',
    status: 'active',
    joined_at: '2024-05-01T00:00:00Z',
    growth_groups: { id: 'gc-1', name: 'GC Alpha' },
    people: { id: 'p-2', name: 'Participante 1', email: 'p1@example.com', phone: '111' },
  },
];

const gcRows = [
  { id: 'gc-1', name: 'GC Alpha' },
  { id: 'gc-2', name: 'GC Beta' },
];

describe('Visitors and Participants pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
    createSupabaseServerClient.mockResolvedValue(supabaseMock);
  });

  it('renderiza lista de visitantes com filtro padrão', async () => {
    const content = await VisitorsContent({ searchParams: { status: 'all' } });
    render(content);

    expect(screen.getByRole('heading', { name: /visitantes/i })).toBeInTheDocument();
    expect(await screen.findByText(/Visitante 1/)).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('renderiza participantes ativos com filtros iniciais', async () => {
    const content = await ParticipantsContent({ searchParams: {} });
    render(content);

    expect(screen.getByRole('heading', { name: /participantes/i })).toBeInTheDocument();
    expect(screen.getByText('Participante 1')).toBeInTheDocument();
    expect(screen.getByText(/GC Alpha/)).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
