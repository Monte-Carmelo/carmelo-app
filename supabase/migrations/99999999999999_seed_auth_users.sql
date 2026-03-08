-- Legacy placeholder migration.
-- Auth test users are no longer seeded via SQL migrations because that is unsafe for shared/cloud environments.
-- Use `cd web && npm run db:seed-users` when you explicitly want demo/test credentials.

DO $$
BEGIN
  RAISE NOTICE 'Skipping legacy auth user seed migration.';
  RAISE NOTICE 'Use web/scripts/seed-auth-users.ts explicitly for local/demo environments.';
END $$;
