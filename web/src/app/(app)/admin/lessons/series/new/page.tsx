import { Suspense } from 'react';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminSeriesForm } from '@/components/admin/AdminSeriesForm';
import { Loading } from '@/components/ui/spinner';
import { createSeriesAction } from '../actions';

async function AdminSeriesNewContent() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nova Série de Lições</h1>
        <p className="text-slate-600 mt-1">
          Crie uma série para agrupar lições relacionadas
        </p>
      </div>

      <AdminSeriesForm onSubmit={createSeriesAction} />
    </div>
  );
}

export default function AdminSeriesNewPage() {
  return (
    <Suspense fallback={<Loading message="Carregando formulário..." />}>
      <AdminSeriesNewContent />
    </Suspense>
  );
}
