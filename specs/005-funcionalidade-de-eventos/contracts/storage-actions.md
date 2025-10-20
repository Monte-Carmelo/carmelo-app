# Storage Actions API Contract

**Feature**: 005-funcionalidade-de-eventos
**File**: `web/src/app/(app)/admin/events/storage-actions.ts`
**Type**: Next.js Server Actions + Supabase Storage
**Date**: 2025-10-20

---

## Overview

Server Actions for uploading, deleting, and managing event banner images in Supabase Storage.

**Bucket**: `event-banners`
**Access**: Admin only (write), Public (read)

---

## Actions

### 1. `uploadEventBannerAction`

Uploads an event banner image to Supabase Storage.

**Access**: Admin only

#### Input

```typescript
type UploadEventBannerInput = {
  eventId: string;     // UUID of the event
  file: File;          // Image file (JPG, PNG, WEBP)
};
```

#### Output

```typescript
type UploadEventBannerOutput =
  | { success: true; data: { url: string; path: string } }
  | { success: false; error: string };
```

#### Validation Rules

- **File size**: Max 2MB (2 * 1024 * 1024 bytes)
- **MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Filename**: Sanitized, no special characters

#### Example

```typescript
const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });

const result = await uploadEventBannerAction({
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  file,
});

// Returns:
{
  success: true,
  data: {
    url: 'https://[project].supabase.co/storage/v1/object/public/event-banners/123.../banner.jpg',
    path: '123e4567-e89b-12d3-a456-426614174000/banner.jpg'
  }
}

// Error (file too large)
{
  success: false,
  error: 'Imagem deve ter no máximo 2MB'
}
```

#### Implementation Notes

```typescript
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export async function uploadEventBannerAction(input: UploadEventBannerInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication & admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    return { success: false, error: 'Acesso negado' };
  }

  // 2. Validate file
  if (input.file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Imagem deve ter no máximo 2MB' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(input.file.type)) {
    return { success: false, error: 'Formato inválido. Use JPG, PNG ou WEBP' };
  }

  // 3. Generate path and filename
  const ext = input.file.name.split('.').pop() || 'jpg';
  const filename = `banner-${Date.now()}.${ext}`;
  const path = `${input.eventId}/${filename}`;

  // 4. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('event-banners')
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading banner:', error);
    return { success: false, error: 'Erro ao fazer upload da imagem' };
  }

  // 5. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-banners')
    .getPublicUrl(path);

  return {
    success: true,
    data: {
      url: publicUrl,
      path: data.path,
    },
  };
}
```

---

### 2. `deleteEventBannerAction`

Deletes an event banner from Supabase Storage.

**Access**: Admin only

#### Input

```typescript
type DeleteEventBannerInput = {
  path: string; // Storage path (e.g., "uuid/banner.jpg")
};
```

#### Output

```typescript
type DeleteEventBannerOutput =
  | { success: true; data: { path: string } }
  | { success: false; error: string };
```

#### Example

```typescript
const result = await deleteEventBannerAction({
  path: '123e4567-e89b-12d3-a456-426614174000/banner.jpg',
});

// Returns:
{
  success: true,
  data: {
    path: '123e4567-e89b-12d3-a456-426614174000/banner.jpg'
  }
}
```

#### Implementation Notes

```typescript
'use server';

export async function deleteEventBannerAction(input: DeleteEventBannerInput) {
  const supabase = getSupabaseServerClient();

  // 1. Check authentication & admin
  // ... (same as upload)

  // 2. Delete file
  const { data, error } = await supabase.storage
    .from('event-banners')
    .remove([input.path]);

  if (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: 'Erro ao excluir imagem' };
  }

  return {
    success: true,
    data: { path: input.path },
  };
}
```

---

## Client-Side Usage

### Upload Flow (Admin Form)

```typescript
'use client';

import { useState } from 'react';
import { uploadEventBannerAction } from './storage-actions';

export function EventBannerUpload({ eventId }: { eventId: string }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    setPreviewUrl(URL.createObjectURL(file));

    // Upload
    setUploading(true);
    const result = await uploadEventBannerAction({ eventId, file });
    setUploading(false);

    if (result.success) {
      // Update form with banner URL
      toast.success('Imagem enviada com sucesso!');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
      {uploading && <p>Enviando...</p>}
      {previewUrl && <img src={previewUrl} alt="Preview" />}
    </div>
  );
}
```

---

## Error Scenarios

| Scenario | Response |
|----------|----------|
| File > 2MB | `{ success: false, error: 'Imagem deve ter no máximo 2MB' }` |
| Invalid format (GIF, SVG) | `{ success: false, error: 'Formato inválido. Use JPG, PNG ou WEBP' }` |
| Upload failed (network) | `{ success: false, error: 'Erro ao fazer upload da imagem' }` |
| Delete failed (file not found) | `{ success: false, error: 'Erro ao excluir imagem' }` |
| Non-admin tries to upload | `{ success: false, error: 'Acesso negado' }` |

---

## Storage Security

- **Bucket**: `event-banners` (public read, admin write)
- **RLS Policies**: Enforce admin-only write access
- **Public URLs**: All uploaded images are publicly accessible (for display)
- **Path Structure**: `{event_id}/{filename}` for organization

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
