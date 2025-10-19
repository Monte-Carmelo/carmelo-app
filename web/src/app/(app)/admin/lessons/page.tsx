import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminSeriesList } from '@/components/admin/AdminSeriesList';
import { AdminLessonList } from '@/components/admin/AdminLessonList';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { deleteSeriesAction, deleteLessonAction } from './actions';

async function AdminLessonsContent() {
  const supabase = await createSupabaseServerClient();

  // Fetch all lesson series with lessons
  const { data: series, error: seriesError } = await supabase
    .from('lesson_series')
    .select(
      `
      id,
      name,
      description,
      created_at,
      created_by_user_id,
      users!created_by_user_id (
        id,
        people (name)
      ),
      lessons (id, title, order_in_series)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch standalone lessons (not in a series)
  const { data: standaloneLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, description, link, order_in_series, series_id')
    .is('series_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (seriesError || lessonsError) {
    console.error('Error fetching lessons data:', seriesError || lessonsError);
    return <div className="text-red-600">Erro ao carregar lições.</div>;
  }

  // Process series data
  const processedSeries =
    series?.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      created_by_user_id: s.created_by_user_id,
      created_at: s.created_at,
      creator_name: s.users?.people?.name || 'Desconhecido',
      lesson_count: s.lessons?.length || 0,
    })) || [];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lições e Séries</h1>
          <p className="text-slate-600 mt-1">
            Gerencie séries de lições e lições individuais para os GCs
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/lessons/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Lição
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/lessons/series/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Série
            </Link>
          </Button>
        </div>
      </div>

      {/* Séries de Lições */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Séries de Lições</h2>
        <AdminSeriesList series={processedSeries} onDelete={deleteSeriesAction} />
      </section>

      {/* Lições Avulsas */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Lições Avulsas</h2>
        <AdminLessonList
          lessons={standaloneLessons || []}
          onDelete={deleteLessonAction}
          seriesId={null}
        />
      </section>
    </div>
  );
}

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<Loading message="Carregando lições..." />}>
      <AdminLessonsContent />
    </Suspense>
  );
}
