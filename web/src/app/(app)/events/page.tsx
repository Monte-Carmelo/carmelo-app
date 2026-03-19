import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { EventList } from '@/components/events/EventList';
import { listEvents, listEventYears } from '@/lib/events/queries';

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
  const supabase = await createSupabaseServerClient();

  try {
    const [events, availableYears] = await Promise.all([
      listEvents(supabase, {
        year,
        futureOnly: filter === 'future',
        includeDeleted: false,
      }),
      listEventYears(supabase, { includeDeleted: false }),
    ]);

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
          events={events}
          currentYear={year}
          availableYears={availableYears.length > 0 ? availableYears : [year]}
          filter={filter}
        />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar eventos';

    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Erro ao carregar eventos
          </h1>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    );
  }
}
