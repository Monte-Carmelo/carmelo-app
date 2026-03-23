'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { LessonFormData } from '@/components/admin/AdminLessonForm';
import { postgresUuid } from '@/lib/validation/postgres-uuid';
import { isLessonSeriesActive } from '@/lib/lessons/series';
import { z } from 'zod';

const lessonSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
  description: z.string().nullable().optional(),
  link: z.string().url('Link inválido').nullable().optional(),
  series_id: postgresUuid('Série inválida.').nullable().optional(),
  order_in_series: z.number().int().min(1).nullable().optional(),
});

type LessonsSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function normalizeLessonData(data: LessonFormData) {
  return lessonSchema.parse({
    title: data.title.trim(),
    description: data.description?.trim() || null,
    link: data.link?.trim() || null,
    series_id: data.series_id || null,
    order_in_series:
      data.order_in_series === '' || data.order_in_series === undefined
        ? null
        : typeof data.order_in_series === 'string'
          ? Number(data.order_in_series)
          : data.order_in_series,
  });
}

async function loadSeriesOrThrow(supabase: LessonsSupabaseClient, seriesId: string) {
  const { data: series, error } = await supabase
    .from('lesson_series')
    .select('*')
    .eq('id', seriesId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!series) {
    throw new Error('Série não encontrada.');
  }

  if (!isLessonSeriesActive(series)) {
    throw new Error('Selecione uma série ativa para vincular a lição.');
  }

  return series;
}

async function getNextOrderInSeries(supabase: LessonsSupabaseClient, seriesId: string) {
  const { data: lastLesson, error } = await supabase
    .from('lessons')
    .select('order_in_series')
    .eq('series_id', seriesId)
    .is('deleted_at', null)
    .order('order_in_series', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (lastLesson?.order_in_series ?? 0) + 1;
}

async function resolveLessonPlacement(
  supabase: LessonsSupabaseClient,
  requestedSeriesId: string | null,
  requestedOrderInSeries: number | null,
  existingLesson?: {
    series_id: string | null;
    order_in_series: number | null;
  } | null,
) {
  if (!requestedSeriesId) {
    return {
      seriesId: null,
      orderInSeries: null,
    };
  }

  await loadSeriesOrThrow(supabase, requestedSeriesId);

  if (requestedOrderInSeries !== null) {
    return {
      seriesId: requestedSeriesId,
      orderInSeries: requestedOrderInSeries,
    };
  }

  const keepsSameSeries = existingLesson?.series_id === requestedSeriesId;
  if (keepsSameSeries && existingLesson.order_in_series !== null) {
    return {
      seriesId: requestedSeriesId,
      orderInSeries: existingLesson.order_in_series,
    };
  }

  return {
    seriesId: requestedSeriesId,
    orderInSeries: await getNextOrderInSeries(supabase, requestedSeriesId),
  };
}

export async function createLessonAction(data: LessonFormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const validatedData = normalizeLessonData(data);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { seriesId: resolvedSeriesId, orderInSeries } = await resolveLessonPlacement(
      supabase,
      validatedData.series_id ?? null,
      validatedData.order_in_series ?? null,
    );

    const { error } = await supabase.from('lessons').insert({
      title: validatedData.title,
      description: validatedData.description,
      link: validatedData.link,
      series_id: resolvedSeriesId,
      order_in_series: orderInSeries,
      created_by_user_id: user.id,
    });

    if (error) {
      console.error('Error creating lesson:', error);
      throw new Error('Erro ao criar lição.');
    }

    revalidatePath('/admin/lessons');

    if (resolvedSeriesId) {
      revalidatePath(`/admin/lessons/series/${resolvedSeriesId}`);
      return { redirectTo: `/admin/lessons/series/${resolvedSeriesId}` };
    }

    return { redirectTo: '/admin/lessons' };
  } catch (error) {
    console.error('Unexpected error in createLessonAction:', error);
    throw error;
  }
}

export async function deleteSeriesAction(seriesId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const deletedAt = new Date().toISOString();

    const { error: detachLessonsError } = await supabase
      .from('lessons')
      .update({
        series_id: null,
        order_in_series: null,
        updated_at: deletedAt,
      })
      .eq('series_id', seriesId)
      .is('deleted_at', null);

    if (detachLessonsError) {
      console.error('Error detaching lessons from deleted series:', detachLessonsError);
      throw new Error('Erro ao excluir série.');
    }

    const { error } = await supabase
      .from('lesson_series')
      .update({ deleted_at: deletedAt, updated_at: deletedAt } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq('id', seriesId);

    if (error) {
      console.error('Error deleting series:', error);
      throw new Error('Erro ao excluir série.');
    }

    revalidatePath('/admin/lessons');
    revalidatePath(`/admin/lessons/series/${seriesId}`);
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
    const validatedData = normalizeLessonData(data);

    const { data: existingLesson, error: existingLessonError } = await supabase
      .from('lessons')
      .select('series_id, order_in_series')
      .eq('id', lessonId)
      .maybeSingle();

    if (existingLessonError) {
      throw existingLessonError;
    }

    const { seriesId, orderInSeries } = await resolveLessonPlacement(
      supabase,
      validatedData.series_id ?? null,
      validatedData.order_in_series ?? null,
      existingLesson,
    );

    const { error } = await supabase
      .from('lessons')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        link: validatedData.link,
        series_id: seriesId,
        order_in_series: orderInSeries,
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

    if (seriesId) {
      revalidatePath(`/admin/lessons/series/${seriesId}`);
    }
  } catch (error) {
    console.error('Unexpected error in updateLessonAction:', error);
    throw error;
  }
}
