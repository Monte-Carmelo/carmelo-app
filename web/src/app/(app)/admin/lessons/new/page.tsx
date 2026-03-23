import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { Loading } from '@/components/ui/spinner';
import { createLessonAction } from '../actions';
import { AdminLessonCreateClient } from './AdminLessonCreateClient';
import { getNextLessonOrderInSeries, isLessonSeriesActive } from '@/lib/lessons/series';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function resolveParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function AdminLessonNewContent({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = await searchParams;
  const defaultSeriesId =
    resolveParamValue(resolvedSearchParams.series) ??
    resolveParamValue(resolvedSearchParams.seriesId);

  const { data: series, error } = await supabase
    .from('lesson_series')
    .select('*, lessons(order_in_series, deleted_at)')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    throw error;
  }

  const availableSeries =
    (series ?? [])
      .filter((item) => isLessonSeriesActive(item))
      .map((item) => ({
        id: item.id,
        name: item.name,
        active: 'active' in item ? item.active : undefined,
        is_active: 'is_active' in item ? item.is_active : undefined,
        nextOrderInSeries: getNextLessonOrderInSeries(item.lessons),
      })) ?? [];

  const matchedSeries = availableSeries.find((item) => item.id === defaultSeriesId);
  const resolvedSeriesId = matchedSeries?.id;
  const defaultSeriesName = matchedSeries?.name;

  return (
    <AdminLessonCreateClient
      defaultSeriesId={resolvedSeriesId}
      defaultSeriesName={defaultSeriesName}
      onSubmit={createLessonAction}
      series={availableSeries}
    />
  );
}

export default function NewLessonPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando formulário..." />}>
      <AdminLessonNewContent searchParams={searchParams} />
    </Suspense>
  );
}
