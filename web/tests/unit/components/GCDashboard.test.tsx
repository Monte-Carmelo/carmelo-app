import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GCDashboard } from '@/components/gc/gc-dashboard';
import type { GrowthGroupDashboardData, UpcomingMeeting } from '@/lib/supabase/queries/gc-dashboard';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const groups: GrowthGroupDashboardData[] = [
  {
    id: 'gc-1',
    name: 'GC Esperança',
    mode: 'in_person',
    address: 'Rua A, 123',
    weekday: 3,
    time: '19:30',
    status: 'active',
    memberCount: 12,
    visitorCount: 3,
  },
];

const upcoming: UpcomingMeeting[] = [
  {
    id: 'm-1',
    gc_id: 'gc-1',
    lesson_title: 'Lição Teste',
    datetime: '2025-01-10T19:30:00Z',
    comments: null,
    gc_name: 'GC Esperança',
  },
];

describe('GCDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra estado de carregamento', () => {
    render(<GCDashboard groups={[]} upcomingMeetings={[]} isLoading />);
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
  });

  it('mostra vazio quando usuário sem GCs', () => {
    render(<GCDashboard groups={[]} upcomingMeetings={[]} />);
    expect(screen.getByText(/você não está associado a nenhum gc/i)).toBeInTheDocument();
  });

  it('renderiza cards de GC, próximas reuniões e ações', async () => {
    render(<GCDashboard groups={groups} upcomingMeetings={upcoming} />);

    expect(screen.getByText('GC Esperança')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Lição Teste/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ver detalhes/i }));
    expect(pushMock).toHaveBeenCalledWith('/dashboard/gc/gc-1');

    await userEvent.click(screen.getByRole('button', { name: /nova reunião/i }));
    expect(pushMock).toHaveBeenCalledWith('/dashboard/gc/reunioes?gcId=gc-1');
  });
});
