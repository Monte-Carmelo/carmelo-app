import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ParticipantList } from '@/components/participants/ParticipantList';

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams('status=active'),
}));

const participants = [
  {
    participantId: 'pp-1',
    gcId: 'gc-1',
    gcName: 'GC Alpha',
    personId: 'person-1',
    name: 'Membro Ativo',
    email: 'membro@example.com',
    phone: '123',
    role: 'member' as const,
    status: 'active' as const,
    joinedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ParticipantList', () => {
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

  it('exibe participantes e permite alternar status', async () => {
    render(<ParticipantList participants={participants} groups={[{ id: 'gc-1', name: 'GC Alpha' }]} />);

    expect(screen.getByText('Membro Ativo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /inativar/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${window.location.origin}/api/participants/pp-1/status`,
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
