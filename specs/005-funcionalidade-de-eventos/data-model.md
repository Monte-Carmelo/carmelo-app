# Data Model: Sistema de Eventos

**Feature**: 005-funcionalidade-de-eventos
**Database**: PostgreSQL via Supabase
**Language**: English (per Constitution Principle VI - code/schema in English, docs in Portuguese)
**Date**: 2025-10-20

---

## Overview

Este documento define o schema de banco de dados para o Sistema de Eventos, incluindo tabelas, índices, constraints, triggers e RLS policies.

### Entities

1. **events**: Eventos da igreja (cultos especiais, conferências, retiros, etc.)
2. **event-banners** (Storage Bucket): Imagens/banners dos eventos

### Relationships

- `events.created_by_user_id` → `users.id` (many-to-one)
- `events.banner_url` → Supabase Storage URL (one-to-one, optional)

---

## Table: `events`

### Purpose

Armazena todos os eventos da igreja, incluindo informações de data, local, descrição e banner de divulgação.

### Schema

```sql
CREATE TABLE events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Information
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  banner_url TEXT, -- URL from Supabase Storage

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),

  -- Audit Fields
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Unique identifier |
| `title` | TEXT | NO | - | Event name/title (e.g., "Conferência de Jovens 2025") |
| `description` | TEXT | YES | NULL | Detailed description (optional, markdown-safe) |
| `event_date` | DATE | NO | - | Date of the event (no timezone, local date) |
| `event_time` | TIME | YES | NULL | Start time (optional, 24h format) |
| `location` | TEXT | YES | NULL | Address or room where event happens (optional) |
| `banner_url` | TEXT | YES | NULL | Public URL to banner image in Supabase Storage |
| `status` | TEXT | NO | `'scheduled'` | Event status: `scheduled`, `completed`, `cancelled` |
| `created_by_user_id` | UUID | NO | - | User (admin) who created the event |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp when event was created |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp of last update |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete timestamp (NULL = not deleted) |

### Constraints

```sql
-- Primary Key
ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE events
  ADD CONSTRAINT events_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT;

-- Check Constraints
ALTER TABLE events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Not Null Constraints
ALTER TABLE events ALTER COLUMN title SET NOT NULL;
ALTER TABLE events ALTER COLUMN event_date SET NOT NULL;
ALTER TABLE events ALTER COLUMN status SET NOT NULL;
ALTER TABLE events ALTER COLUMN created_by_user_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE events ALTER COLUMN updated_at SET NOT NULL;
```

### Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_events_date
  ON events(event_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_status
  ON events(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_created_by
  ON events(created_by_user_id);

-- Composite index for year-based queries
CREATE INDEX idx_events_year_date
  ON events(EXTRACT(YEAR FROM event_date), event_date)
  WHERE deleted_at IS NULL;
```

**Rationale**:
- `idx_events_date`: Fast ordering and filtering by date (most common query)
- `idx_events_status`: Filter by status (admin view)
- `idx_events_created_by`: Fast lookup of events by creator
- `idx_events_year_date`: Optimized for "events of year X" queries
- All indexes exclude soft-deleted rows (`WHERE deleted_at IS NULL`)

### Triggers

#### 1. Update `updated_at` on modification

```sql
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
```

**Purpose**: Automatically update `updated_at` timestamp on every UPDATE.

---

## Storage Bucket: `event-banners`

### Configuration

```sql
-- Create bucket (via Supabase Dashboard or CLI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true);
```

### Properties

| Property | Value | Description |
|----------|-------|-------------|
| `name` | `event-banners` | Bucket identifier |
| `public` | `true` | Files are publicly readable (for event banners) |
| `file_size_limit` | `2MB` | Maximum file size (enforced via policy) |
| `allowed_mime_types` | `image/jpeg, image/png, image/webp` | Enforced via policy |

### Path Structure

```
event-banners/
├── {event_id}/
│   └── {filename}  (e.g., "banner.jpg", "conferencia-2025.png")
```

**Rationale**:
- Group files by event ID for easy cleanup if event is deleted
- Allow custom filenames for better debugging

### Storage Policies

#### 1. Allow public read (all users)

```sql
CREATE POLICY "Public read access for event banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');
```

#### 2. Allow admin upload

```sql
CREATE POLICY "Admins can upload event banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
```

#### 3. Allow admin update

```sql
CREATE POLICY "Admins can update event banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
```

#### 4. Allow admin delete

```sql
CREATE POLICY "Admins can delete event banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
```

---

## Row Level Security (RLS) Policies

### Enable RLS

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

### Policies

#### 1. Admins can manage all events (CRUD)

```sql
CREATE POLICY "admins_manage_all_events"
ON events
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
```

**Applies to**: SELECT, INSERT, UPDATE, DELETE
**Who**: Users with `is_admin = true`
**What**: Full CRUD access to all events (including soft-deleted)

#### 2. Users can view active events (non-deleted)

```sql
CREATE POLICY "users_view_active_events"
ON events
FOR SELECT
USING (
  deleted_at IS NULL
  AND auth.uid() IN (
    SELECT id FROM users
  )
);
```

**Applies to**: SELECT only
**Who**: All authenticated users (including admins)
**What**: Read-only access to non-deleted events

#### 3. Admins can restore soft-deleted events (optional)

```sql
-- Optional: Allow admins to restore deleted events by setting deleted_at = NULL
-- This is implicit in "admins_manage_all_events" policy
-- No additional policy needed
```

---

## Queries

### Common Queries (with RLS applied)

#### 1. List all future events (user view)

```sql
SELECT
  id,
  title,
  description,
  event_date,
  event_time,
  location,
  banner_url,
  status
FROM events
WHERE deleted_at IS NULL
  AND event_date >= CURRENT_DATE
ORDER BY event_date ASC, event_time ASC NULLS LAST;
```

**Usage**: User dashboard (`/events`)
**Performance**: Uses `idx_events_date`

#### 2. List events of a specific year

```sql
SELECT
  id,
  title,
  description,
  event_date,
  event_time,
  location,
  banner_url,
  status
FROM events
WHERE deleted_at IS NULL
  AND EXTRACT(YEAR FROM event_date) = $1
ORDER BY event_date ASC, event_time ASC NULLS LAST;
```

**Usage**: User dashboard with year navigation
**Performance**: Uses `idx_events_year_date`
**Parameters**: `$1` = year (e.g., 2025)

#### 3. Get event details (with creator info)

```sql
SELECT
  e.id,
  e.title,
  e.description,
  e.event_date,
  e.event_time,
  e.location,
  e.banner_url,
  e.status,
  e.created_at,
  e.updated_at,
  p.name AS created_by_name
FROM events e
JOIN users u ON e.created_by_user_id = u.id
JOIN people p ON u.person_id = p.id
WHERE e.id = $1
  AND e.deleted_at IS NULL;
```

**Usage**: Event detail page (`/events/[id]`)
**Parameters**: `$1` = event ID

#### 4. Admin list all events (including deleted)

```sql
SELECT
  id,
  title,
  event_date,
  event_time,
  status,
  deleted_at IS NOT NULL AS is_deleted
FROM events
ORDER BY event_date ASC, event_time ASC NULLS LAST;
```

**Usage**: Admin dashboard (`/admin/events`)
**Note**: Admins can see soft-deleted events (via RLS policy)

#### 5. Create new event

```sql
INSERT INTO events (
  title,
  description,
  event_date,
  event_time,
  location,
  banner_url,
  status,
  created_by_user_id
)
VALUES (
  $1, -- title
  $2, -- description
  $3, -- event_date
  $4, -- event_time
  $5, -- location
  $6, -- banner_url
  'scheduled',
  auth.uid()
)
RETURNING id;
```

**Usage**: Create event form
**Parameters**: Form values
**Note**: `created_by_user_id` uses `auth.uid()` (current user)

#### 6. Update event

```sql
UPDATE events
SET
  title = COALESCE($1, title),
  description = COALESCE($2, description),
  event_date = COALESCE($3, event_date),
  event_time = COALESCE($4, event_time),
  location = COALESCE($5, location),
  banner_url = COALESCE($6, banner_url),
  status = COALESCE($7, status)
WHERE id = $8
  AND deleted_at IS NULL
RETURNING id;
```

**Usage**: Edit event form
**Parameters**: New values (NULL = keep existing)
**Note**: `updated_at` is updated automatically by trigger

#### 7. Soft delete event

```sql
UPDATE events
SET deleted_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING id;
```

**Usage**: Delete event action
**Parameters**: `$1` = event ID
**Note**: Sets `deleted_at` to current timestamp

#### 8. Restore soft-deleted event (admin only)

```sql
UPDATE events
SET deleted_at = NULL
WHERE id = $1
RETURNING id;
```

**Usage**: Restore deleted event (optional feature)
**Parameters**: `$1` = event ID
**Note**: Only admins can execute (via RLS)

---

## Migration File

### File: `YYYYMMDDHHMMSS_create_events_table.sql`

```sql
-- Migration: Create events table and related objects
-- Feature: 005-funcionalidade-de-eventos
-- Date: 2025-10-20

BEGIN;

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_events_date
  ON events(event_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_status
  ON events(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_created_by
  ON events(created_by_user_id);

CREATE INDEX idx_events_year_date
  ON events(EXTRACT(YEAR FROM event_date), event_date)
  WHERE deleted_at IS NULL;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins manage all events
CREATE POLICY "admins_manage_all_events"
ON events
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- RLS Policy: Users view active events
CREATE POLICY "users_view_active_events"
ON events
FOR SELECT
USING (
  deleted_at IS NULL
  AND auth.uid() IN (
    SELECT id FROM users
  )
);

-- Create storage bucket (note: may need to be done via Supabase Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public read access for event banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');

CREATE POLICY "Admins can upload event banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

CREATE POLICY "Admins can update event banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

CREATE POLICY "Admins can delete event banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-banners'
  AND auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

COMMIT;
```

### Rollback Script

```sql
-- Rollback: Drop events table and related objects
-- Feature: 005-funcionalidade-de-eventos

BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS "users_view_active_events" ON events;
DROP POLICY IF EXISTS "admins_manage_all_events" ON events;

-- Drop storage policies
DROP POLICY IF EXISTS "Public read access for event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event banners" ON storage.objects;

-- Drop trigger
DROP TRIGGER IF EXISTS events_updated_at_trigger ON events;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_events_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_events_year_date;
DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_date;

-- Drop table
DROP TABLE IF EXISTS events;

-- Delete storage bucket
DELETE FROM storage.buckets WHERE id = 'event-banners';

COMMIT;
```

---

## TypeScript Types (Generated)

### After migration, regenerate types:

```bash
npx supabase gen types --lang=typescript --local > web/src/lib/supabase/database.types.ts
```

### Expected Type Definition:

```typescript
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string; // ISO date string "YYYY-MM-DD"
          event_time: string | null; // "HH:MM:SS"
          location: string | null;
          banner_url: string | null;
          status: 'scheduled' | 'completed' | 'cancelled';
          created_by_user_id: string;
          created_at: string; // ISO timestamp
          updated_at: string; // ISO timestamp
          deleted_at: string | null; // ISO timestamp or null
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          location?: string | null;
          banner_url?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled';
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          location?: string | null;
          banner_url?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled';
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      // ... other tables
    };
  };
}
```

---

## Data Validation Rules

### Application Layer (TypeScript + Zod)

```typescript
import { z } from 'zod';

export const EventFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título muito longo'),
  description: z.string().max(5000, 'Descrição muito longa').optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
  event_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)').optional().nullable(),
  location: z.string().max(500, 'Local muito longo').optional().nullable(),
  banner_url: z.string().url('URL inválida').optional().nullable(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
});

export const BannerUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'Imagem deve ter no máximo 2MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Formato inválido. Use JPG, PNG ou WEBP'
    ),
});
```

---

## Sample Data (Seed)

### For development/testing:

```sql
-- Insert sample events (assumes admin user exists)
INSERT INTO events (
  title,
  description,
  event_date,
  event_time,
  location,
  status,
  created_by_user_id
) VALUES
(
  'Conferência de Jovens 2025',
  'Três dias de conferências, workshops e momentos de adoração voltados para jovens de 15 a 30 anos.',
  '2025-11-15',
  '19:00',
  'Auditório Principal',
  'scheduled',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1)
),
(
  'Culto de Páscoa',
  'Celebração especial da ressurreição de Cristo com ceia e batismos.',
  '2025-04-20',
  '10:00',
  'Templo Central',
  'scheduled',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1)
),
(
  'Retiro de Carnaval',
  'Retiro espiritual de 4 dias na Serra da Mantiqueira.',
  '2025-03-01',
  NULL, -- Evento de múltiplos dias, sem horário específico
  'Pousada Recanto das Águas',
  'scheduled',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1)
),
(
  'Workshop de Música',
  'Oficina de instrumentos e teoria musical para o ministério de louvor.',
  '2024-12-10',
  '14:00',
  'Sala de Música',
  'completed',
  (SELECT id FROM users WHERE is_admin = true LIMIT 1)
);
```

---

## Appendix: ER Diagram

```
┌─────────────────────────────────────────┐
│             events                      │
├─────────────────────────────────────────┤
│ id (PK)                UUID              │
│ title                  TEXT              │
│ description            TEXT              │
│ event_date             DATE              │
│ event_time             TIME              │
│ location               TEXT              │
│ banner_url             TEXT              │
│ status                 TEXT              │
│ created_by_user_id (FK)→ users.id       │
│ created_at             TIMESTAMPTZ       │
│ updated_at             TIMESTAMPTZ       │
│ deleted_at             TIMESTAMPTZ       │
└─────────────────────────────────────────┘
                ↓
                │ belongs_to
                ↓
┌─────────────────────────────────────────┐
│             users                       │
├─────────────────────────────────────────┤
│ id (PK)                UUID              │
│ person_id (FK)         UUID              │
│ is_admin               BOOLEAN           │
│ ...                                      │
└─────────────────────────────────────────┘
                ↓
                │ has_profile
                ↓
┌─────────────────────────────────────────┐
│             people                      │
├─────────────────────────────────────────┤
│ id (PK)                UUID              │
│ name                   TEXT              │
│ email                  TEXT              │
│ ...                                      │
└─────────────────────────────────────────┘

Storage:
┌─────────────────────────────────────────┐
│        event-banners (bucket)           │
├─────────────────────────────────────────┤
│ {event_id}/                             │
│   ├── banner.jpg                        │
│   └── ...                               │
└─────────────────────────────────────────┘
          ↑
          │ referenced by events.banner_url
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Next**: contracts/ (API specifications)
