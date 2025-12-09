import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EventDetailsPage from '@/app/(app)/events/[id]/page';

const { getEventAction } = vi.hoisted(() => ({ getEventAction: vi.fn() }));
const notFound = vi.fn();

vi.mock('@/app/(app)/admin/events/actions', () => ({
  getEventAction,
}));

vi.mock('next/navigation', () => ({
  notFound: () => notFound(),
}));

vi.mock('@/components/events/EventDetail', () => ({
  EventDetail: ({ event }: any) => <div data-testid="event-detail-stub">{event.title}</div>,
}));

const event = {
  id: 'e-1',
  title: 'Evento X',
  description: 'Desc',
  event_date: '2099-01-01',
  event_time: '10:00',
  location: 'Igreja',
  banner_url: null,
  status: 'scheduled',
  created_at: '2024-01-01T10:00:00Z',
  created_by_name: 'Admin',
};

describe('EventDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza detalhes quando sucesso', async () => {
    getEventAction.mockResolvedValueOnce({ success: true, data: event });

    const page = await EventDetailsPage({ params: Promise.resolve({ id: 'e-1' }) });
    render(page);

    expect(screen.getByTestId('event-detail-stub')).toHaveTextContent('Evento X');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('chama notFound em erro', async () => {
    getEventAction.mockResolvedValueOnce({ success: false });

    await EventDetailsPage({ params: Promise.resolve({ id: 'e-1' }) });
    expect(notFound).toHaveBeenCalled();
  });
});
