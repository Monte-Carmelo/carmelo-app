import { Suspense } from 'react';
import { Loading } from '@/components/ui/spinner';
import { createSeriesAction } from '../actions';
import { AdminSeriesCreateClient } from './AdminSeriesCreateClient';

async function AdminSeriesNewContent() {
  return <AdminSeriesCreateClient onSubmit={createSeriesAction} />;
}

export default function AdminSeriesNewPage() {
  return (
    <Suspense fallback={<Loading message="Carregando formulário..." />}>
      <AdminSeriesNewContent />
    </Suspense>
  );
}
