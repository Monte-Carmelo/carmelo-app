'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';
import { EventFormSchema } from '@/lib/validations/event';

export type CreateEventInput = {
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  banner_url?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
};

export type UpdateEventInput = {
  id: string;
  title?: string;
  description?: string | null;
  event_date?: string;
  event_time?: string | null;
  location?: string | null;
  banner_url?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
};

export type DeleteEventInput = {
  id: string;
};

export type GetEventInput = {
  id: string;
};

export type ListEventsInput = {
  year?: number;
  futureOnly?: boolean;
  includeDeleted?: boolean;
};

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createEventAction(input: CreateEventInput): Promise<ActionResponse<{ id: string; title: string }>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();

  // 3. Validate input
  try {
    EventFormSchema.parse(input);
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Dados inválidos' };
  }

  // 4. Insert event
  const { data, error } = await (supabase as any)
    .from('events')
    .insert({
      ...input,
      created_by_user_id: user.id,
    })
    .select('id, title')
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Erro ao criar evento' };
  }

  // 5. Revalidate caches
  revalidatePath('/admin/events');
  revalidatePath('/events');

  return { success: true, data };
}

export async function updateEventAction(input: UpdateEventInput): Promise<ActionResponse<{ id: string; title: string }>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();

  // 2. Validate input (partial schema)
  const { id, ...updates } = input;
  try {
    if (updates.title || updates.description || updates.event_date || updates.event_time || updates.location || updates.banner_url || updates.status) {
      EventFormSchema.partial().parse(updates);
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Dados inválidos' };
  }

  // 3. Update event
  const { data, error } = await (supabase as any)
    .from('events')
    .update(updates)
    .eq('id', id)
    .eq('deleted_at', null) // Only update non-deleted events
    .select('id, title')
    .single();

  if (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Erro ao atualizar evento' };
  }

  if (!data) {
    return { success: false, error: 'Evento não encontrado' };
  }

  // 4. Revalidate caches
  revalidatePath('/admin/events');
  revalidatePath('/events');
  revalidatePath(`/events/${id}`);

  return { success: true, data };
}

export async function deleteEventAction(input: DeleteEventInput): Promise<ActionResponse<{ id: string }>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();

  // 2. Soft delete event
  const { data, error } = await (supabase as any)
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('deleted_at', null) // Only delete if not already deleted
    .select('id')
    .single();

  if (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Erro ao excluir evento' };
  }

  if (!data) {
    return { success: false, error: 'Evento não encontrado' };
  }

  // 3. Revalidate caches
  revalidatePath('/admin/events');
  revalidatePath('/events');

  return { success: true, data };
}

export async function getEventAction(input: GetEventInput): Promise<ActionResponse<{
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  banner_url: string | null;
  status: string;
  created_at: string;
  created_by_name: string;
}>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();

  // 2. Query event with creator info
  const { data, error } = await (supabase as any)
    .from('events')
    .select(`
      id,
      title,
      description,
      event_date,
      event_time,
      location,
      banner_url,
      status,
      created_at,
      users!created_by_user_id (
        people (name)
      )
    `)
    .eq('id', input.id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return { success: false, error: 'Evento não encontrado' };
  }

  // 3. Format response
  return {
    success: true,
    data: {
      ...data,
      created_by_name: data.users?.people?.name || 'Usuário desconhecido',
    },
  };
}

export async function listEventsAction(input: ListEventsInput = {}): Promise<ActionResponse<Array<{
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  banner_url: string | null;
  status: string;
  is_deleted: boolean;
}>>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();

  // 2. Build query
  let query = (supabase as any)
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false });

  // Filter by year
  if (input.year) {
    query = query.gte('event_date', `${input.year}-01-01`);
    query = query.lte('event_date', `${input.year}-12-31`);
  }

  // Filter future only
  if (input.futureOnly) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    query = query.gte('event_date', today);
  }

  // Include deleted (admin only)
  if (!input.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  // 3. Execute query
  const { data, error } = await query;

  if (error) {
    console.error('Error listing events:', error);
    return { success: false, error: 'Erro ao listar eventos' };
  }

  // 4. Format response
  return {
    success: true,
    data: data.map((event: any) => ({
      ...event,
      is_deleted: !!event.deleted_at,
    })),
  };
}
