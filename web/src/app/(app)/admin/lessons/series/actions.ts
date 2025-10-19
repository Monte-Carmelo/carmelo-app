'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SeriesFormData } from '@/components/admin/AdminSeriesForm';

const seriesSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  description: z.string().optional(),
  initialLessons: z
    .array(
      z.object({
        title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
        description: z.string().optional(),
        link: z.string().url('Link inválido').optional().or(z.literal('')),
      })
    )
    .optional(),
});

export async function createSeriesAction(data: SeriesFormData) {
  const supabase = await createSupabaseServerClient();

  try {
    // Validate input
    const validatedData = seriesSchema.parse(data);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Create series
    const { data: series, error: seriesError } = await supabase
      .from('lesson_series')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        created_by_user_id: user.id,
      })
      .select('id')
      .single();

    if (seriesError) throw seriesError;

    // Create initial lessons if provided
    if (validatedData.initialLessons && validatedData.initialLessons.length > 0) {
      const lessons = validatedData.initialLessons.map((lesson, index) => ({
        title: lesson.title,
        description: lesson.description || null,
        link: lesson.link || null,
        series_id: series.id,
        order_in_series: index + 1,
        created_by_user_id: user.id,
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessons);

      if (lessonsError) throw lessonsError;
    }

    revalidatePath('/admin/lessons');
    redirect('/admin/lessons');
  } catch (error) {
    console.error('Error creating series:', error);
    throw error;
  }
}

export async function updateSeriesAction(id: string, data: SeriesFormData) {
  const supabase = await createSupabaseServerClient();

  try {
    // Validate input
    const validatedData = seriesSchema.omit({ initialLessons: true }).parse(data);

    // Update series
    const { error } = await supabase
      .from('lesson_series')
      .update({
        name: validatedData.name,
        description: validatedData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/lessons/series/${id}`);
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
}

export async function deleteSeriesAction(id: string) {
  const supabase = await createSupabaseServerClient();

  try {
    // Soft delete series
    const { error } = await supabase
      .from('lesson_series')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/lessons');
  } catch (error) {
    console.error('Error deleting series:', error);
    throw error;
  }
}

export async function reorderLessonsAction(seriesId: string, lessonOrders: { lessonId: string; newOrder: number }[]) {
  const supabase = await createSupabaseServerClient();

  try {
    // Update order for each lesson
    for (const { lessonId, newOrder } of lessonOrders) {
      const { error } = await supabase
        .from('lessons')
        .update({
          order_in_series: newOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId);

      if (error) throw error;
    }

    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/lessons/series/${seriesId}`);
  } catch (error) {
    console.error('Error reordering lessons:', error);
    throw error;
  }
}