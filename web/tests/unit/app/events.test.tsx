import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EventsPage from '@/app/(app)/events/page';

const {
  createSupabaseServerClient,
  listEvents,
  listEventYears,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  listEvents: vi.fn(),
  listEventYears: vi.fn(),
}));

vi.mock('@/lib/supabase/server-client', () => ({
  createSupabaseServerClient,
}));

vi.mock('@/lib/events/queries', () => ({
  listEvents,
  listEventYears,
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
    createSupabaseServerClient.mockResolvedValue({});
  });

  it('renderiza lista de eventos com ano atual', async () => {
    listEvents.mockResolvedValueOnce(events);
    listEventYears.mockResolvedValueOnce([2025]);

    const page = await EventsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText(/Eventos da Igreja/)).toBeInTheDocument();
    expect(screen.getByTestId('event-list-stub').textContent).toContain('Retiro');
    expect(listEvents).toHaveBeenCalled();
  });

  it('mostra erro se carregamento falha', async () => {
    listEvents.mockRejectedValueOnce(new Error('fail'));

    const page = await EventsPage({ searchParams: Promise.resolve({ year: '2024' }) });
    render(page);

    expect(screen.getByText(/Erro ao carregar eventos/)).toBeInTheDocument();
    expect(screen.getByText('fail')).toBeInTheDocument();
  });
});
