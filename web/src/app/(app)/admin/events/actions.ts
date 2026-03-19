'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';
import { EventFormSchema } from '@/lib/validations/event';
import { getEventById, listEvents } from '@/lib/events/queries';

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

async function isAdminUser(supabase: any, userId: string): Promise<boolean> {
  const { data: userData, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    return false;
  }

  return Boolean(userData?.is_admin);
}

export async function createEventAction(input: CreateEventInput): Promise<ActionResponse<{ id: string; title: string }>> {
  // 1. Check authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  const supabase = await createSupabaseServerClient();
  const isAdmin = await isAdminUser(supabase, user.id);
  if (!isAdmin) {
    return { success: false, error: 'Acesso negado' };
  }

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
  const isAdmin = await isAdminUser(supabase, user.id);
  if (!isAdmin) {
    return { success: false, error: 'Acesso negado' };
  }

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
    .is('deleted_at', null) // Only update non-deleted events
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
  const isAdmin = await isAdminUser(supabase, user.id);
  if (!isAdmin) {
    return { success: false, error: 'Acesso negado' };
  }

  // 2. Soft delete event
  const { data, error } = await (supabase as any)
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .is('deleted_at', null) // Only delete if not already deleted
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
  const event = await getEventById(supabase, input.id);

  if (!event) {
    return { success: false, error: 'Evento não encontrado' };
  }

  return {
    success: true,
    data: event,
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

  if (input.includeDeleted) {
    const isAdmin = await isAdminUser(supabase, user.id);
    if (!isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }
  }

  try {
    return {
      success: true,
      data: await listEvents(supabase, input),
    };
  } catch (error) {
    console.error('Error listing events:', error);
    return { success: false, error: 'Erro ao listar eventos' };
  }
}
