'use client';

import { EventCard } from './EventCard';
import { EventYearNavigator } from './EventYearNavigator';
import { EventFilter } from './EventFilter';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'future' 
                ? 'Não há eventos futuros programados' 
                : 'Nenhum evento cadastrado para este ano'
              }
            </h3>
            <p className="text-slate-500 text-center">
              {filter === 'future' 
                ? 'Novos eventos serão anunciados em breve.' 
                : 'Volte em outro ano para ver os eventos.'
              }
            </p>
          </CardContent>
        </Card>
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