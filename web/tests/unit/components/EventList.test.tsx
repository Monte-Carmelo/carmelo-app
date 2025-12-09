import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { EventList } from '@/components/events/EventList';

vi.mock('@/components/events/EventCard', () => ({
  EventCard: ({ event }: any) => <div data-testid="event-card">{event.title}</div>,
}));

vi.mock('@/components/events/EventYearNavigator', () => ({
  EventYearNavigator: ({ currentYear }: { currentYear: number }) => <div>Year {currentYear}</div>,
}));

vi.mock('@/components/events/EventFilter', () => ({
  EventFilter: ({ currentFilter }: { currentFilter: string }) => <div>Filter {currentFilter}</div>,
}));

const events = [
  {
    id: 'e-1',
    title: 'Conferência',
    description: null,
    event_date: '2099-01-01',
    event_time: '10:00',
    location: null,
    banner_url: null,
    status: 'scheduled',
  },
];

describe('EventList', () => {
  it('mostra vazio quando não há eventos', () => {
    render(<EventList events={[]} currentYear={2025} availableYears={[2025]} filter="all" />);
    expect(screen.getByText(/Nenhum evento cadastrado/)).toBeInTheDocument();
  });

  it('renderiza cards quando há eventos', () => {
    render(<EventList events={events} currentYear={2025} availableYears={[2025]} filter="future" />);
    expect(screen.getByText('Conferência')).toBeInTheDocument();
    expect(screen.getByText(/Year 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Filter future/)).toBeInTheDocument();
  });
});
