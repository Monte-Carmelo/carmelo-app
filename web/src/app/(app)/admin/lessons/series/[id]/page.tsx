'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminSeriesForm, SeriesFormData } from '@/components/admin/AdminSeriesForm';
import { AdminLessonList } from '@/components/admin/AdminLessonList';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';

interface Series {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  order_in_series: number | null;
  series_id: string | null;
  created_at: string;
}

export default function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <EditSeriesWrapper params={params} />
  );
}

async function EditSeriesWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <EditSeriesClientContent seriesId={id} />
  );
}

function EditSeriesClientContent({ seriesId }: { seriesId: string }) {
  const [series, setSeries] = useState<Series | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSeriesData = async () => {
      const supabase = getSupabaseBrowserClient();

      // Fetch series
      const { data: seriesData, error: seriesError } = await supabase
        .from('lesson_series')
        .select('id, name, description, created_at')
        .eq('id', seriesId)
        .single();

      if (seriesError) {
        toast.error('Erro ao carregar série');
        console.error('Error fetching series:', seriesError);
        router.push('/admin/lessons');
        return;
      }

      // Fetch lessons for this series
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, link, order_in_series, series_id, created_at')
        .eq('series_id', seriesId)
        .order('order_in_series', { ascending: true });

      if (lessonsError) {
        toast.error('Erro ao carregar lições');
        console.error('Error fetching lessons:', lessonsError);
      }

      setSeries(seriesData);
      setLessons(lessonsData || []);
      setLoading(false);
    };

    fetchSeriesData();
  }, [seriesId, router]);

  const handleSubmit = async (data: SeriesFormData) => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase
        .from('lesson_series')
        .update({
          name: data.name,
          description: data.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', seriesId);

      if (error) throw error;

      toast.success('Série atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar série');
      console.error('Error updating series:', error);
    }
  };

  const handleCancel = () => {
    router.push('/admin/lessons');
  };

  const handleReorder = async (newOrder: string[]) => {
    setReordering(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // Update order for each lesson
      const updates = newOrder.map((lessonId, index) => ({
        lessonId,
        newOrder: index + 1,
      }));

      for (const { lessonId, newOrder } of updates) {
        const { error } = await supabase
          .from('lessons')
          .update({
            order_in_series: newOrder,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lessonId);

        if (error) throw error;
      }

      // Update local state
      const reorderedLessons = newOrder.map((lessonId) =>
        lessons.find(l => l.id === lessonId)!
      );
      setLessons(reorderedLessons);

      toast.success('Ordem das lições atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar ordem das lições');
      console.error('Error reordering lessons:', error);
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Série não encontrada</h1>
          <button
            onClick={() => router.push('/admin/lessons')}
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para Lições
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/admin/lessons"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lições
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Editar Série</h1>
        <p className="text-gray-600 mt-2">
          Edite as informações da série &quot;{series.name}&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div>
          <AdminSeriesForm
            series={series}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>

        {/* Lessons Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Lições da Série ({lessons.length})
            </h2>
            <Link href={`/admin/lessons/new?series=${seriesId}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lição
              </Button>
            </Link>
          </div>

          {lessons.length > 0 ? (
            <AdminLessonList
              lessons={lessons}
              onReorder={handleReorder}
              reordering={reordering}
            />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Nenhuma lição nesta série ainda</p>
              <Link href={`/admin/lessons/new?series=${seriesId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Lição
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}