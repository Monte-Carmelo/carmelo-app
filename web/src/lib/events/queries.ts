import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type AppSupabaseClient = SupabaseClient<Database>;
type EventRow = Database['public']['Tables']['events']['Row'];

type EventDetailsQueryResult = Pick<
  EventRow,
  | 'id'
  | 'title'
  | 'description'
  | 'event_date'
  | 'event_time'
  | 'location'
  | 'banner_url'
  | 'status'
  | 'created_at'
> & {
  users: {
    people: {
      name: string | null;
    } | null;
  } | null;
};

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  banner_url: string | null;
  status: string;
  is_deleted: boolean;
};

export type EventDetails = {
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
};

export type ListEventsInput = {
  year?: number;
  futureOnly?: boolean;
  includeDeleted?: boolean;
};

export async function listEvents(
  supabase: AppSupabaseClient,
  input: ListEventsInput = {},
): Promise<EventListItem[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false });

  if (input.year) {
    query = query.gte('event_date', `${input.year}-01-01`);
    query = query.lte('event_date', `${input.year}-12-31`);
  }

  if (input.futureOnly) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('event_date', today);
  }

  if (!input.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((event) => ({
    ...event,
    is_deleted: Boolean(event.deleted_at),
  }));
}

export async function getEventById(
  supabase: AppSupabaseClient,
  id: string,
  options?: { includeDeleted?: boolean },
): Promise<EventDetails | null> {
  let query = supabase
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
    .eq('id', id);

  if (!options?.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const event = data as EventDetailsQueryResult;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    event_date: event.event_date,
    event_time: event.event_time,
    location: event.location,
    banner_url: event.banner_url,
    status: event.status,
    created_at: event.created_at,
    created_by_name: event.users?.people?.name || 'Usuário desconhecido',
  };
}

export async function listEventYears(
  supabase: AppSupabaseClient,
  input: Pick<ListEventsInput, 'includeDeleted'> = {},
): Promise<number[]> {
  const events = await listEvents(supabase, { includeDeleted: input.includeDeleted });

  return [...new Set(events.map((event) => new Date(event.event_date).getFullYear()))].sort(
    (a, b) => b - a,
  );
}
