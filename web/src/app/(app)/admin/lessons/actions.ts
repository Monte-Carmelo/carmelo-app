'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

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
  } catch (error) {
    console.error('Unexpected error in deleteLessonAction:', error);
    throw error;
  }
}
