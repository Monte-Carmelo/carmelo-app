import { listEventsAction } from '@/app/(app)/admin/events/actions';
import { EventList } from '@/components/events/EventList';

interface EventsPageProps {
  searchParams: Promise<{
    year?: string;
    filter?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const year = params.year ? parseInt(params.year) : new Date().getFullYear();
  const filter = params.filter === 'future' ? 'future' : 'all';
  
  // Get events for the specified year
  const result = await listEventsAction({ 
    year,
    futureOnly: filter === 'future',
    includeDeleted: false
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Erro ao carregar eventos
          </h1>
          <p className="text-slate-600">{result.error}</p>
        </div>
      </div>
    );
  }

  // Get available years for navigation
  const allYearsResult = await listEventsAction({ includeDeleted: false });
  const availableYears = allYearsResult.success 
    ? [...new Set(allYearsResult.data.map(event => new Date(event.event_date).getFullYear()))]
    : [year];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Eventos da Igreja
        </h1>
        <p className="text-slate-600">
          Confira os eventos programados para nossa comunidade
        </p>
      </div>

      <EventList 
        events={result.data}
        currentYear={year}
        availableYears={availableYears}
        filter={filter}
      />
    </div>
  );
}