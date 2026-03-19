import { AdminEventList } from '@/components/admin/AdminEventList';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { listEvents } from '@/lib/events/queries';

export default async function AdminEventsPage() {
  const supabase = await createSupabaseServerClient();

  try {
    const events = await listEvents(supabase, { includeDeleted: true });

    return (
      <div className="p-6">
        <AdminEventList events={events} />
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
