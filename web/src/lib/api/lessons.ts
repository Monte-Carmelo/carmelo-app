import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type LessonTemplate = Pick<
  Database['public']['Tables']['lessons']['Row'],
  'id' | 'title'
>;

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
    .select('id, title')
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getRecentSeriesWithLessons(
  supabase: SupabaseClient<Database>,
  limit = 2,
): Promise<SeriesWithLessons[]> {
  const { data: series, error: seriesError } = await supabase
    .from('lesson_series')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (seriesError) {
    throw seriesError;
  }

  const seriesWithLessons: SeriesWithLessons[] = [];

  for (const item of series ?? []) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('series_id', item.id)
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
