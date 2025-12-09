import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ParticipantList } from '@/components/participants/ParticipantList';

const replaceMock = vi.fn();
const refreshMock = vi.fn();

const updateMock = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));

const supabaseMock = {
  from: vi.fn(() => ({ update: updateMock })),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams('status=active'),
}));

vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: () => supabaseMock,
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
  });

  it('exibe participantes e permite alternar status', async () => {
    render(<ParticipantList participants={participants} groups={[{ id: 'gc-1', name: 'GC Alpha' }]} />);

    expect(screen.getByText('Membro Ativo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /inativar/i }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
