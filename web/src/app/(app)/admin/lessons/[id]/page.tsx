'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLessonForm, LessonFormData, LessonSeries } from '@/components/admin/AdminLessonForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  series_id: string | null;
  order_in_series: number | null;
  created_at: string;
}

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <EditLessonWrapper params={params} />
  );
}

async function EditLessonWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <EditLessonClientContent lessonId={id} />
  );
}

function EditLessonClientContent({ lessonId }: { lessonId: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [series, setSeries] = useState<LessonSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();

      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, description, link, series_id, order_in_series, created_at')
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        toast.error('Erro ao carregar lição');
        console.error('Error fetching lesson:', lessonError);
        router.push('/admin/lessons');
        return;
      }

      // Fetch series
      const { data: seriesData, error: seriesError } = await supabase
        .from('lesson_series')
        .select('id, name')
        .order('name');

      if (seriesError) {
        toast.error('Erro ao carregar séries');
        console.error('Error fetching series:', seriesError);
      }

      setLesson(lessonData);
      setSeries(seriesData || []);
      setLoading(false);
    };

    fetchData();
  }, [lessonId, router]);

  const handleSubmit = async (data: LessonFormData) => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: data.title,
          description: data.description,
          link: data.link,
          series_id: data.series_id,
          order_in_series: data.order_in_series,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId);

      if (error) throw error;

      toast.success('Lição atualizada com sucesso!');
      router.push('/admin/lessons');
    } catch (error) {
      toast.error('Erro ao atualizar lição');
      console.error('Error updating lesson:', error);
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

  if (!lesson) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lição não encontrada</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Editar Lição</h1>
        <p className="text-gray-600 mt-2">
          Edite as informações da lição &quot;{lesson.title}&quot;
        </p>
      </div>

      <AdminLessonForm
        lesson={lesson}
        series={series}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}