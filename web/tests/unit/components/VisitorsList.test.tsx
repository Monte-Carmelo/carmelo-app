import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VisitorsList, type VisitorView } from '@/components/visitors/VisitorsList';

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
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
    vi.stubGlobal(
      'fetch',
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converte visitante em membro e atualiza a lista', async () => {
    render(<VisitorsList visitors={[visitor]} />);

    await userEvent.click(screen.getByRole('button', { name: /converter em membro/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar conversão/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${window.location.origin}/api/visitors/visitor-1/convert`,
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(refreshMock).toHaveBeenCalled();
    });

    expect(screen.queryByText(/não foi possível converter visitante/i)).not.toBeInTheDocument();
  });
});
