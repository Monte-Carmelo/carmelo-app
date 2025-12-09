import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EventsPage from '@/app/(app)/events/page';

const { listEventsAction } = vi.hoisted(() => ({ listEventsAction: vi.fn() }));

vi.mock('@/app/(app)/admin/events/actions', () => ({
  listEventsAction,
}));

vi.mock('@/components/events/EventList', () => ({
  EventList: (props: unknown) => <div data-testid="event-list-stub">{JSON.stringify(props)}</div>,
}));

const events = [
  {
    id: 'e-1',
    title: 'Retiro',
    description: 'Tempo de comunhão',
    event_date: '2025-03-10',
    event_time: '09:00',
    location: 'Sítio',
    banner_url: null,
    status: 'scheduled',
  },
];

describe('EventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza lista de eventos com ano atual', async () => {
    listEventsAction.mockResolvedValueOnce({ success: true, data: events });
    listEventsAction.mockResolvedValueOnce({ success: true, data: events });

    const page = await EventsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText(/Eventos da Igreja/)).toBeInTheDocument();
    expect(screen.getByTestId('event-list-stub').textContent).toContain('Retiro');
    expect(listEventsAction).toHaveBeenCalled();
  });

  it('mostra erro se carregamento falha', async () => {
    listEventsAction.mockResolvedValueOnce({ success: false, error: 'fail' });

    const page = await EventsPage({ searchParams: Promise.resolve({ year: '2024' }) });
    render(page);

    expect(screen.getByText(/Erro ao carregar eventos/)).toBeInTheDocument();
    expect(screen.getByText('fail')).toBeInTheDocument();
  });
});
