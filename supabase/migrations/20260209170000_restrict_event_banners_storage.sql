-- Migration: Restrict event-banners storage policies to admins
-- Date: 2026-02-09

BEGIN;

-- Remove permissive testing policies
DROP POLICY IF EXISTS "Allow all read access for event banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow all upload for event banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow all update for event banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow all delete for event banners" ON storage.objects;

-- Ensure desired production-like policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for event banners'
  ) THEN
    CREATE POLICY "Public read access for event banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-banners');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload event banners'
  ) THEN
    CREATE POLICY "Admins can upload event banners"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'event-banners'
      AND auth.uid() IN (
        SELECT id FROM users WHERE is_admin = true
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update event banners'
  ) THEN
    CREATE POLICY "Admins can update event banners"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'event-banners'
      AND auth.uid() IN (
        SELECT id FROM users WHERE is_admin = true
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete event banners'
  ) THEN
    CREATE POLICY "Admins can delete event banners"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'event-banners'
      AND auth.uid() IN (
        SELECT id FROM users WHERE is_admin = true
      )
    );
  END IF;
END $$;

COMMIT;
