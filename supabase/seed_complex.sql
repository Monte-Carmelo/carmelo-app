-- Modified Seed Data for carmelo-app
-- Feature: 001-crie-um-app
-- Description: Test data that works with Supabase Auth constraints
-- LEGADO: arquivo experimental/historico. Nao use como seed padrao em cloud.

-- Step 1: Create people (base entity for personal data)
INSERT INTO people (id, name, email, phone, birth_date) VALUES
  -- Users
  ('11111111-0000-0000-0000-000000000001', 'João Líder', 'lider1@test.com', '11999999101', NULL),
  ('11111111-0000-0000-0000-000000000002', 'Ana Co-Líder', 'lider2@test.com', '11999999102', NULL),
  ('11111111-0000-0000-0000-000000000003', 'Maria Supervisora', 'supervisor1@test.com', '11999999103', NULL),
  ('11111111-0000-0000-0000-000000000004', 'Carlos Supervisor', 'supervisor2@test.com', '11999999104', NULL),
  ('11111111-0000-0000-0000-000000000005', 'Pedro Coordenador', 'coordenador1@test.com', '11999999105', NULL),
  ('11111111-0000-0000-0000-000000000006', 'Admin Sistema', 'admin@test.com', '11999999106', NULL),

  -- Members
  ('11111111-0000-0000-0000-000000000011', 'Ana Silva', 'ana@test.com', '11999999111', NULL),
  ('11111111-0000-0000-0000-000000000012', 'Carlos Santos', 'carlos@test.com', '11999999112', NULL),
  ('11111111-0000-0000-0000-000000000013', 'Beatriz Lima', 'beatriz@test.com', '11999999113', NULL),
  ('11111111-0000-0000-0000-000000000014', 'Daniel Costa', 'daniel@test.com', '11999999114', NULL),
  ('11111111-0000-0000-0000-000000000015', 'Elaine Rocha', 'elaine@test.com', '11999999115', NULL),
  ('11111111-0000-0000-0000-000000000016', 'Fernando Alves', 'fernando@test.com', '11999999116', NULL),
  ('11111111-0000-0000-0000-000000000017', 'Gabriela Mendes', 'gabriela@test.com', '11999999117', NULL),
  ('11111111-0000-0000-0000-000000000018', 'Hugo Ferreira', 'hugo@test.com', '11999999118', NULL),

  -- Visitors
  ('11111111-0000-0000-0000-000000000021', 'João Visitante', 'joao.v@test.com', '11999999001', NULL),
  ('11111111-0000-0000-0000-000000000022', 'Maria Visitante', 'maria.v@test.com', '11999999002', NULL);

-- Step 2: Create test GCs
INSERT INTO growth_groups (id, name, mode, address, weekday, time, status) VALUES
  ('40000000-0000-0000-0000-000000000001', 'GC Esperança', 'in_person', 'Rua Teste 123', 3, '19:30', 'active'),
  ('40000000-0000-0000-0000-000000000002', 'GC Fé', 'online', NULL, NULL, NULL, 'active'),
  ('40000000-0000-0000-0000-000000000003', 'GC Amor', 'in_person', 'Av. Principal 456', 5, '20:00', 'active');

-- Step 3: Create lesson series (sem created_by_user_id por enquanto)
INSERT INTO lesson_series (id, name, description) VALUES
  ('60000000-0000-0000-0000-000000000001', 'Fundamentos da Fé', 'Série básica de lições para novos convertidos'),
  ('60000000-0000-0000-0000-000000000002', 'Vida Cristã Prática', 'Lições sobre o dia a dia da vida cristã');

-- Step 4: Create individual lessons (sem created_by_user_id por enquanto)
INSERT INTO lessons (id, title, description, series_id) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Salvação em Cristo', 'Estudo sobre o plano da salvação...', '60000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', 'Oração e Comunhão', 'Como desenvolver uma vida de oração...', '60000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000003', 'Fruto do Espírito', 'Estudo sobre Gálatas 5:22-23...', '60000000-0000-0000-0000-000000000002');

-- Step 5: Create visitors (without auth.users constraint)
INSERT INTO visitors (id, person_id, gc_id, status, created_at) VALUES
  ('80000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000001', 'visitor', NOW() - INTERVAL '30 days'),
  ('80000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000002', 'visitor', NOW() - INTERVAL '20 days');

-- Step 6: Meetings (comentados - dependem de users criados via auth)
-- INSERT INTO meetings (id, gc_id, lesson_template_id, lesson_title, datetime, registered_by_user_id) VALUES
--   ('90000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Salvação em Cristo', NOW() - INTERVAL '7 days', '10000000-0000-0000-0000-000000000001');

-- Step 7: Create some test configurations
INSERT INTO config (key, value) VALUES
  ('organization_name', '"Igreja Monte Carmelo"'),
  ('gc_min_members', '3'),
  ('gc_max_members', '15'),
  ('visitor_conversion_threshold', '3');

-- Note:
-- Users table needs auth.users entries first, which requires authentication
-- Use the Supabase Dashboard or create users via auth signup to test full functionality
-- Growth group participants require valid user_id references
