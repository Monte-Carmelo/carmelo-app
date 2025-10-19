'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLessonForm, LessonFormData, LessonSeries } from '@/components/admin/AdminLessonForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';

export default function NewLessonPage() {
  const [series, setSeries] = useState<LessonSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSeriesId = searchParams.get('series');

  useEffect(() => {
    const fetchSeries = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('lesson_series')
        .select('id, name')
        .order('name');

      if (error) {
        toast.error('Erro ao carregar séries');
        console.error('Error fetching series:', error);
      } else {
        setSeries(data || []);
      }

      setLoading(false);
    };

    fetchSeries();
  }, []);

  const handleSubmit = async (data: LessonFormData) => {
    const supabase = getSupabaseBrowserClient();

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Get max order_in_series for this series if applicable
      let orderInSeries = data.order_in_series;
      if (data.series_id && !orderInSeries) {
        const { data: maxOrder } = await supabase
          .from('lessons')
          .select('order_in_series')
          .eq('series_id', data.series_id)
          .order('order_in_series', { ascending: false })
          .limit(1)
          .single();

        orderInSeries = (maxOrder?.order_in_series || 0) + 1;
      }

      const { error } = await supabase.from('lessons').insert({
        title: data.title,
        description: data.description,
        link: data.link,
        series_id: data.series_id,
        order_in_series: orderInSeries,
        created_by_user_id: user.id,
      });

      if (error) throw error;

      toast.success('Lição criada com sucesso!');
      router.push('/admin/lessons');
    } catch (error) {
      toast.error('Erro ao criar lição');
      console.error('Error creating lesson:', error);
    }
  };

  const handleCancel = () => {
    router.push('/admin/lessons');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nova Lição</h1>
        <p className="text-gray-600 mt-2">
          {defaultSeriesId
            ? 'Adicione uma nova lição à série selecionada'
            : 'Crie uma nova lição avulsa ou vincule-a a uma série existente'
          }
        </p>
      </div>

      <AdminLessonForm
        series={series}
        defaultSeriesId={defaultSeriesId || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}