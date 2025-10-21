-- Migration: Create event-banners storage bucket
-- Feature: 005-funcionalidade-de-eventos
-- Date: 2025-10-20

BEGIN;

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