-- Migration: Create permissive storage policies for testing
-- Feature: 005-funcionalidade-de-eventos
-- Date: 2025-10-20

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event banners" ON storage.objects;

-- Create permissive policies for testing
CREATE POLICY "Allow all read access for event banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');

CREATE POLICY "Allow all upload for event banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-banners');

CREATE POLICY "Allow all update for event banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-banners');

CREATE POLICY "Allow all delete for event banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-banners');

COMMIT;