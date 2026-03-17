'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AdminLessonForm,
  type LessonFormData,
  type LessonSeries,
} from '@/components/admin/AdminLessonForm';

interface AdminLessonCreateClientProps {
  defaultSeriesId?: string;
  defaultSeriesName?: string;
  series: LessonSeries[];
  onSubmit: (data: LessonFormData) => Promise<{ redirectTo: string }>;
}

export function AdminLessonCreateClient({
  defaultSeriesId,
  defaultSeriesName,
  series,
  onSubmit,
}: AdminLessonCreateClientProps) {
  const router = useRouter();

  const handleCancel = () => {
    router.push(defaultSeriesId ? `/admin/lessons/series/${defaultSeriesId}` : '/admin/lessons');
  };

  const handleSubmit = async (data: LessonFormData) => {
    try {
      const result = await onSubmit(data);
      toast.success('Lição criada com sucesso!');
      router.push(result.redirectTo);
      router.refresh();
    } catch (error) {
      toast.error('Erro ao criar lição');
      console.error('Error creating lesson:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nova Lição</h1>
        <p className="text-gray-600 mt-2">
          {defaultSeriesName
            ? `Adicione uma nova lição à série "${defaultSeriesName}"`
            : 'Crie uma nova lição avulsa ou vincule-a a uma série existente'}
        </p>
      </div>

      <AdminLessonForm
        series={series}
        defaultSeriesId={defaultSeriesId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
