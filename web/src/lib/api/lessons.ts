import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type LessonTemplate = Pick<
  Database['public']['Tables']['lessons']['Row'],
  'id' | 'title' | 'order_in_series'
> & {
  series_name?: string | null;
};

export type LessonSeriesItem = Database['public']['Tables']['lesson_series']['Row'];
export type LessonItem = Database['public']['Tables']['lessons']['Row'];

export interface SeriesWithLessons extends LessonSeriesItem {
  lessons: LessonItem[];
}

export async function getLessonTemplates(
  supabase: SupabaseClient<Database>,
): Promise<LessonTemplate[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      order_in_series,
      series:lesson_series ( name )
    `)
    .is('deleted_at', null)
    .order('series_id', { ascending: true, nullsFirst: false })
    .order('order_in_series', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    order_in_series: lesson.order_in_series,
    series_name: lesson.series?.name ?? null,
  }));
}

export async function getRecentSeriesWithLessons(
  supabase: SupabaseClient<Database>,
  limit = 2,
): Promise<SeriesWithLessons[]> {
  return getAllSeriesWithLessons(supabase, limit);
}

export async function getAllSeriesWithLessons(
  supabase: SupabaseClient<Database>,
  limit?: number,
): Promise<SeriesWithLessons[]> {
  let query = supabase
    .from('lesson_series')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: series, error: seriesError } = await query;

  if (seriesError) {
    throw seriesError;
  }

  const seriesWithLessons: SeriesWithLessons[] = [];

  for (const item of series ?? []) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('series_id', item.id)
      .is('deleted_at', null)
      .order('order_in_series', { ascending: true, nullsFirst: false });

    if (lessonsError) {
      throw lessonsError;
    }

    seriesWithLessons.push({
      ...item,
      lessons: lessons ?? [],
    });
  }

  return seriesWithLessons;
}

export async function getLessonById(
  supabase: SupabaseClient<Database>,
  lessonId: string,
): Promise<(LessonItem & { series: LessonSeriesItem | null }) | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, series:lesson_series(*)')
    .eq('id', lessonId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  return data as LessonItem & { series: LessonSeriesItem | null };
}
