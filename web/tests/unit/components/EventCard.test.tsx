import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { EventCard } from '@/components/events/EventCard';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

const event = {
  id: 'e-1',
  title: 'Encontro Jovem',
  description: 'Uma tarde de comunhão',
  event_date: '2099-05-10',
  event_time: '18:00',
  location: 'Igreja Central',
  banner_url: null,
  status: 'scheduled',
};

describe('EventCard', () => {
  it('renderiza informações básicas do evento', () => {
    render(<EventCard event={event} />);

    expect(screen.getByText('Encontro Jovem')).toBeInTheDocument();
    expect(screen.getByText(/Igreja Central/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/events/e-1');
  });

  it('exibe badge de status e descrição', () => {
    render(<EventCard event={{ ...event, status: 'completed', description: 'finalizado' }} />);
    expect(screen.getByText(/Concluído/)).toBeInTheDocument();
    expect(screen.getByText('finalizado')).toBeInTheDocument();
  });
});
