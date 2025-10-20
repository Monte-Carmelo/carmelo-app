# Event Actions API Contract

**Feature**: 005-funcionalidade-de-eventos
**File**: `web/src/app/(app)/admin/events/actions.ts`
**Type**: Next.js Server Actions
**Date**: 2025-10-20

---

## Overview

Server Actions for Event CRUD operations. All actions run server-side and are type-safe.

---

## Actions

### 1. `createEventAction`

Creates a new event.

**Access**: Admin only

#### Input

```typescript
type CreateEventInput = {
  title: string;           // min 3, max 200 chars
  description?: string | null; // max 5000 chars
  event_date: string;      // ISO date "YYYY-MM-DD"
  event_time?: string | null; // "HH:MM"
  location?: string | null;   // max 500 chars
  banner_url?: string | null; // URL from Storage
  status?: 'scheduled' | 'completed' | 'cancelled'; // default: 'scheduled'
};
```

#### Output

```typescript
type CreateEventOutput =
  | { success: true; data: { id: string; title: string } }
  | { success: false; error: string };
```

#### Example

```typescript
// Success
const result = await createEventAction({
  title: 'Conferência de Jovens 2025',
  description: 'Três dias de conferências...',
  event_date: '2025-11-15',
  event_time: '19:00',
  location: 'Auditório Principal',
  banner_url: 'https://supabase.co/storage/event-banners/uuid/banner.jpg',
  status: 'scheduled',
});

// Returns:
{
  success: true,
  data: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Conferência de Jovens 2025'
  }
}

// Error (not admin)
{
  success: false,
  error: 'Acesso negado'
}
```

#### Implementation Notes

```typescript
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { revalidatePath } from 'next/cache';
import { EventFormSchema } from '@/lib/validations/event';

export async function createEventAction(input: CreateEventInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  // 2. Check admin permission
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    return { success: false, error: 'Acesso negado' };
  }

  // 3. Validate input
  try {
    EventFormSchema.parse(input);
  } catch (error) {
    return { success: false, error: 'Dados inválidos' };
  }

  // 4. Insert event
  const { data, error } = await supabase
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
```

---

### 2. `updateEventAction`

Updates an existing event.

**Access**: Admin only

#### Input

```typescript
type UpdateEventInput = {
  id: string;              // UUID of event to update
  title?: string;
  description?: string | null;
  event_date?: string;
  event_time?: string | null;
  location?: string | null;
  banner_url?: string | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
};
```

#### Output

```typescript
type UpdateEventOutput =
  | { success: true; data: { id: string; title: string } }
  | { success: false; error: string };
```

#### Example

```typescript
const result = await updateEventAction({
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Conferência de Jovens 2025 - ATUALIZADO',
  event_date: '2025-11-16', // Changed date
  status: 'completed',
});

// Returns:
{
  success: true,
  data: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Conferência de Jovens 2025 - ATUALIZADO'
  }
}
```

#### Implementation Notes

```typescript
'use server';

export async function updateEventAction(input: UpdateEventInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication & admin
  // ... (same as createEventAction)

  // 2. Validate input (partial schema)
  // ...

  // 3. Update event
  const { id, ...updates } = input;

  const { data, error } = await supabase
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
```

---

### 3. `deleteEventAction`

Soft deletes an event (sets `deleted_at` timestamp).

**Access**: Admin only

#### Input

```typescript
type DeleteEventInput = {
  id: string; // UUID of event to delete
};
```

#### Output

```typescript
type DeleteEventOutput =
  | { success: true; data: { id: string } }
  | { success: false; error: string };
```

#### Example

```typescript
const result = await deleteEventAction({
  id: '123e4567-e89b-12d3-a456-426614174000',
});

// Returns:
{
  success: true,
  data: {
    id: '123e4567-e89b-12d3-a456-426614174000'
  }
}
```

#### Implementation Notes

```typescript
'use server';

export async function deleteEventAction(input: DeleteEventInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication & admin
  // ... (same as createEventAction)

  // 2. Soft delete event
  const { data, error } = await supabase
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
```

---

### 4. `getEventAction`

Fetches a single event by ID.

**Access**: All authenticated users (returns only non-deleted events)

#### Input

```typescript
type GetEventInput = {
  id: string; // UUID of event
};
```

#### Output

```typescript
type GetEventOutput =
  | {
      success: true;
      data: {
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
    }
  | { success: false; error: string };
```

#### Example

```typescript
const result = await getEventAction({
  id: '123e4567-e89b-12d3-a456-426614174000',
});

// Returns:
{
  success: true,
  data: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Conferência de Jovens 2025',
    description: 'Três dias de conferências...',
    event_date: '2025-11-15',
    event_time: '19:00',
    location: 'Auditório Principal',
    banner_url: 'https://supabase.co/storage/event-banners/uuid/banner.jpg',
    status: 'scheduled',
    created_at: '2025-10-20T10:00:00Z',
    created_by_name: 'Admin User'
  }
}
```

#### Implementation Notes

```typescript
'use server';

export async function getEventAction(input: GetEventInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  // 2. Query event with creator info
  const { data, error } = await supabase
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
      created_by_name: data.users.people.name,
    },
  };
}
```

---

### 5. `listEventsAction`

Lists events with optional filters.

**Access**: All authenticated users (returns only non-deleted events for non-admins)

#### Input

```typescript
type ListEventsInput = {
  year?: number;          // Filter by year (e.g., 2025)
  futureOnly?: boolean;   // If true, only return events >= today
  includeDeleted?: boolean; // Admin-only: include soft-deleted events
};
```

#### Output

```typescript
type ListEventsOutput =
  | {
      success: true;
      data: Array<{
        id: string;
        title: string;
        description: string | null;
        event_date: string;
        event_time: string | null;
        location: string | null;
        banner_url: string | null;
        status: string;
        is_deleted: boolean; // Only present if includeDeleted=true
      }>;
    }
  | { success: false; error: string };
```

#### Example

```typescript
// User: list future events of 2025
const result = await listEventsAction({
  year: 2025,
  futureOnly: true,
});

// Returns:
{
  success: true,
  data: [
    {
      id: '...',
      title: 'Conferência de Jovens 2025',
      event_date: '2025-11-15',
      event_time: '19:00',
      location: 'Auditório Principal',
      banner_url: 'https://...',
      status: 'scheduled',
      is_deleted: false
    },
    // ... more events
  ]
}
```

#### Implementation Notes

```typescript
'use server';

export async function listEventsAction(input: ListEventsInput = {}) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  // 2. Build query
  let query = supabase
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
    data: data.map((event) => ({
      ...event,
      is_deleted: !!event.deleted_at,
    })),
  };
}
```

---

## Error Scenarios

### Authentication Errors

| Scenario | Response |
|----------|----------|
| User not logged in | `{ success: false, error: 'Não autenticado' }` |
| Invalid session token | `{ success: false, error: 'Não autenticado' }` |

### Authorization Errors

| Scenario | Response |
|----------|----------|
| Non-admin tries to create event | `{ success: false, error: 'Acesso negado' }` |
| Non-admin tries to update event | `{ success: false, error: 'Acesso negado' }` |
| Non-admin tries to delete event | `{ success: false, error: 'Acesso negado' }` |

### Validation Errors

| Scenario | Response |
|----------|----------|
| Title too short (< 3 chars) | `{ success: false, error: 'Título deve ter no mínimo 3 caracteres' }` |
| Missing required field (title) | `{ success: false, error: 'Dados inválidos' }` |
| Invalid date format | `{ success: false, error: 'Data inválida (formato: YYYY-MM-DD)' }` |
| Invalid status value | `{ success: false, error: 'Dados inválidos' }` |

### Database Errors

| Scenario | Response |
|----------|----------|
| Event not found (wrong ID) | `{ success: false, error: 'Evento não encontrado' }` |
| Event already deleted | `{ success: false, error: 'Evento não encontrado' }` |
| Database connection error | `{ success: false, error: 'Erro ao processar solicitação' }` |

---

## Cache Invalidation

All mutation actions (create, update, delete) invalidate the following caches:

```typescript
revalidatePath('/admin/events');    // Admin list page
revalidatePath('/events');          // User list page
revalidatePath(`/events/${id}`);    // Event detail page (if applicable)
```

This ensures immediate UI updates without manual refresh.

---

## TypeScript Types

All types are generated from Supabase schema:

```typescript
import type { Database } from '@/lib/supabase/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
```

---

## Testing

### Unit Tests

```typescript
import { describe, test, expect, vi } from 'vitest';
import { createEventAction } from './actions';

vi.mock('@/lib/supabase/server-client');

describe('createEventAction', () => {
  test('creates event successfully', async () => {
    const result = await createEventAction({
      title: 'Test Event',
      event_date: '2025-12-25',
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });

  test('rejects non-admin user', async () => {
    // Mock non-admin user
    const result = await createEventAction({
      title: 'Test Event',
      event_date: '2025-12-25',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Acesso negado');
  });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Next**: storage-actions.md
