'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { LessonFormData } from '@/components/admin/AdminLessonForm';

export async function deleteSeriesAction(seriesId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Soft delete: set deleted_at
    const { error } = await supabase
      .from('lesson_series')
      .update({ deleted_at: new Date().toISOString() } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq('id', seriesId);

    if (error) {
      console.error('Error deleting series:', error);
      throw new Error('Erro ao excluir série.');
    }

    revalidatePath('/admin/lessons');
  } catch (error) {
    console.error('Unexpected error in deleteSeriesAction:', error);
    throw error;
  }
}

export async function deleteLessonAction(lessonId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: lesson, error: lessonLookupError } = await supabase
      .from('lessons')
      .select('series_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonLookupError) {
      console.error('Error loading lesson before delete:', lessonLookupError);
    }

    // Soft delete: set deleted_at
    const { error } = await supabase
      .from('lessons')
      .update({ deleted_at: new Date().toISOString() } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      throw new Error('Erro ao excluir lição.');
    }

    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/lessons/${lessonId}`);

    if (lesson?.series_id) {
      revalidatePath(`/admin/lessons/series/${lesson.series_id}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteLessonAction:', error);
    throw error;
  }
}

export async function updateLessonAction(lessonId: string, data: LessonFormData) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: existingLesson, error: existingLessonError } = await supabase
      .from('lessons')
      .select('series_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (existingLessonError) {
      throw existingLessonError;
    }

    const { error } = await supabase
      .from('lessons')
      .update({
        title: data.title,
        description: data.description || null,
        link: data.link || null,
        series_id: data.series_id || null,
        order_in_series: data.order_in_series ? Number(data.order_in_series) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId);

    if (error) {
      console.error('Error updating lesson:', error);
      throw new Error('Erro ao atualizar lição.');
    }

    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/lessons/${lessonId}`);

    if (existingLesson?.series_id) {
      revalidatePath(`/admin/lessons/series/${existingLesson.series_id}`);
    }

    if (data.series_id) {
      revalidatePath(`/admin/lessons/series/${data.series_id}`);
    }
  } catch (error) {
    console.error('Unexpected error in updateLessonAction:', error);
    throw error;
  }
}
