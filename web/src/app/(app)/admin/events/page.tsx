import { listEventsAction } from './actions';
import { AdminEventList } from '@/components/admin/AdminEventList';

export default async function AdminEventsPage() {
  const result = await listEventsAction({ includeDeleted: true });

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

  return (
    <div className="p-6">
      <AdminEventList events={result.data} />
    </div>
  );
}