'use client';

import { EventCard } from './EventCard';
import { EventYearNavigator } from './EventYearNavigator';
import { EventFilter } from './EventFilter';
import { Calendar } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  banner_url: string | null;
  status: string;
}

interface EventListProps {
  events: Event[];
  currentYear: number;
  availableYears: number[];
  filter: 'future' | 'all';
}

export function EventList({ events, currentYear, availableYears, filter }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <EventYearNavigator
            currentYear={currentYear}
            availableYears={availableYears}
          />
          <EventFilter
            currentFilter={filter}
            currentYear={currentYear}
          />
        </div>

        <EmptyState
          icon={<Calendar />}
          title={
            filter === 'future'
              ? 'Não há eventos futuros programados'
              : 'Nenhum evento cadastrado para este ano'
          }
          text={
            filter === 'future'
              ? 'Novos eventos serão anunciados em breve.'
              : 'Volte em outro ano para ver os eventos.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <EventYearNavigator
          currentYear={currentYear}
          availableYears={availableYears}
        />
        <EventFilter
          currentFilter={filter}
          currentYear={currentYear}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}