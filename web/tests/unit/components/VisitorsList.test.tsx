import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VisitorsList, type VisitorView } from '@/components/visitors/VisitorsList';

const refreshMock = vi.fn();

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === 'growth_group_participants') {
      return {
        upsert: vi.fn(() => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'participant-1' }, error: null }),
          }),
        })),
      };
    }

    if (table === 'visitors') {
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }

    if (table === 'visitor_conversion_events') {
      return {
        insert: vi.fn(() => Promise.resolve({ error: null })),
      };
    }

    return { upsert: vi.fn(), update: vi.fn(), insert: vi.fn() };
  }),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock('@/lib/auth/session-context', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, roles: null }),
}));

vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

const visitor: VisitorView = {
  id: 'visitor-1',
  gcId: 'gc-1',
  gcName: 'GC Alpha',
  personId: 'person-1',
  name: 'Visitante Teste',
  email: 'visitante@example.com',
  status: 'active',
  visitCount: 2,
  lastVisitDate: '2024-05-01',
};

describe('VisitorsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converte visitante em membro e atualiza a lista', async () => {
    render(<VisitorsList visitors={[visitor]} />);

    await userEvent.click(screen.getByRole('button', { name: /converter em membro/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar conversão/i }));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });

    expect(supabaseMock.from).toHaveBeenCalledWith('visitor_conversion_events');
    expect(screen.queryByText(/não foi possível converter visitante/i)).not.toBeInTheDocument();
  });
});
