-- Temporary migration to seed auth users for E2E tests
-- This will be run during db reset
-- NOTE: People will be created by supabase/seed.sql which runs after migrations

-- Insert test users directly into auth.users
-- Note: Passwords are hashed with bcrypt for 'senha123'
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES
  -- admin@test.com
  (
    '90000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- lider1@test.com
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'lider1@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- lider2@test.com
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'lider2@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- supervisor1@test.com
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'supervisor1@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- supervisor2@test.com
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'supervisor2@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- coordenador1@test.com
  (
    '30000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'coordenador1@test.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Insert identities for each user
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    '90000000-0000-0000-0000-000000000001'::text,
    '90000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object('sub', '90000000-0000-0000-0000-000000000001'::text, 'email', 'admin@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '10000000-0000-0000-0000-000000000001'::text,
    '10000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object('sub', '10000000-0000-0000-0000-000000000001'::text, 'email', 'lider1@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '10000000-0000-0000-0000-000000000002'::text,
    '10000000-0000-0000-0000-000000000002'::uuid,
    jsonb_build_object('sub', '10000000-0000-0000-0000-000000000002'::text, 'email', 'lider2@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '20000000-0000-0000-0000-000000000001'::text,
    '20000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object('sub', '20000000-0000-0000-0000-000000000001'::text, 'email', 'supervisor1@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '20000000-0000-0000-0000-000000000002'::text,
    '20000000-0000-0000-0000-000000000002'::uuid,
    jsonb_build_object('sub', '20000000-0000-0000-0000-000000000002'::text, 'email', 'supervisor2@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000001'::text,
    '30000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object('sub', '30000000-0000-0000-0000-000000000001'::text, 'email', 'coordenador1@test.com'),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- NOTE: users table rows will be created by seed.sql after this migration runs

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Auth users seeded successfully for E2E tests';
  RAISE NOTICE '📋 Test credentials: admin@test.com / senha123';
END $$;

