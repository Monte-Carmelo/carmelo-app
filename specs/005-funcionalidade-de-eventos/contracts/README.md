# API Contracts: Sistema de Eventos

**Feature**: 005-funcionalidade-de-eventos
**API Type**: Next.js Server Actions
**Date**: 2025-10-20

---

## Overview

Este diretório contém as especificações de contrato para todas as APIs (Server Actions) relacionadas ao Sistema de Eventos.

### Server Actions vs REST API

Este projeto utiliza **Next.js Server Actions** em vez de REST API tradicional:
- Server Actions são funções TypeScript que rodam no servidor
- Invocadas diretamente do Client Components via RPC
- Type-safe via TypeScript (sem necessidade de OpenAPI)
- Integração nativa com React Server Components

### Files

1. `event-actions.md` - CRUD operations para eventos
2. `storage-actions.md` - Upload/delete de imagens no Supabase Storage

---

## Authentication

Todas as Server Actions verificam autenticação via:

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export async function someAction() {
  const supabase = getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  // ... rest of action
}
```

### Admin-Only Actions

Actions restritas a admins verificam adicionalmente:

```typescript
const { data: userData } = await supabase
  .from('users')
  .select('is_admin')
  .eq('id', user.id)
  .single();

if (!userData?.is_admin) {
  return { success: false, error: 'Acesso negado' };
}
```

---

## Response Format

Todas as Server Actions seguem o padrão:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Conferência de Jovens 2025"
    // ... other fields
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Mensagem de erro legível para o usuário"
}
```

---

## Error Handling

### Common Error Codes

| Error Message | Cause | HTTP Equivalent |
|---------------|-------|-----------------|
| "Não autenticado" | User not logged in | 401 Unauthorized |
| "Acesso negado" | User is not admin | 403 Forbidden |
| "Evento não encontrado" | Invalid event ID | 404 Not Found |
| "Dados inválidos" | Validation failed | 400 Bad Request |
| "Erro ao processar solicitação" | Server/DB error | 500 Internal Server Error |

### Validation Errors

Validation errors use Zod schemas and return detailed messages:

```typescript
try {
  const validatedData = EventFormSchema.parse(formData);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map(e => e.message).join(', ')
    };
  }
}
```

---

## Rate Limiting

**Current Status**: NOT IMPLEMENTED

Future considerations:
- Upload actions: max 10 uploads/minute per user
- Create/Update actions: max 20 operations/minute per user
- Delete actions: max 5 deletes/minute per user

---

## Revalidation

Server Actions invalidate Next.js cache via `revalidatePath()`:

```typescript
import { revalidatePath } from 'next/cache';

// After create/update/delete
revalidatePath('/admin/events'); // Admin list
revalidatePath('/events'); // User list
revalidatePath(`/events/${eventId}`); // Event details
```

This ensures immediate UI updates without manual refresh.

---

## Type Safety

All Server Actions use generated TypeScript types from Supabase:

```typescript
import type { Database } from '@/lib/supabase/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
```

---

## Testing

### Unit Tests

Test individual Server Actions with mocked Supabase client:

```typescript
import { vi } from 'vitest';
import { createEventAction } from './actions';

vi.mock('@/lib/supabase/server-client');

test('createEventAction creates event', async () => {
  const result = await createEventAction({
    title: 'Test Event',
    event_date: '2025-12-25',
    // ...
  });

  expect(result.success).toBe(true);
  expect(result.data.id).toBeDefined();
});
```

### Integration Tests

Test with real Supabase local instance:

```typescript
import { createEventAction, getEventAction } from './actions';

test('full event lifecycle', async () => {
  // Create
  const createResult = await createEventAction({ /* ... */ });
  expect(createResult.success).toBe(true);

  // Read
  const getResult = await getEventAction(createResult.data.id);
  expect(getResult.success).toBe(true);
  expect(getResult.data.title).toBe('Test Event');
});
```

---

## Security Considerations

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented by Supabase parameterized queries
- XSS prevented by React's automatic escaping

### File Upload Security

- MIME type validation (server-side)
- File size validation (max 2MB)
- Filename sanitization
- Storage bucket isolation (public bucket for events only)

### Authorization

- RLS policies enforce database-level security
- Server Actions perform additional checks
- Admin-only operations double-verified

---

## Next Steps

Read the detailed specifications:
1. `event-actions.md` - Event CRUD operations
2. `storage-actions.md` - Image upload/delete operations
