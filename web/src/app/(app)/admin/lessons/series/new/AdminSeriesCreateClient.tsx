'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminSeriesForm, type SeriesFormData } from '@/components/admin/AdminSeriesForm';

interface AdminSeriesCreateClientProps {
  onSubmit: (data: SeriesFormData) => Promise<{ redirectTo: string }>;
}

export function AdminSeriesCreateClient({ onSubmit }: AdminSeriesCreateClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: SeriesFormData) => {
    try {
      const result = await onSubmit(data);
      toast.success('Série criada com sucesso!');
      router.push(result.redirectTo);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao criar série');
      console.error('Error creating series:', error);
    }
  };

  const handleCancel = () => {
    router.push('/admin/lessons');
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nova Série de Lições</h1>
        <p className="text-slate-600 mt-1">
          Crie uma série para agrupar lições relacionadas
        </p>
      </div>

      <AdminSeriesForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
