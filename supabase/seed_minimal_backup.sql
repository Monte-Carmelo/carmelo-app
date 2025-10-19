-- Minimal Seed Data for carmelo-app
-- Feature: 001-crie-um-app
-- Description: Essential test data that works without auth.users dependencies

-- Step 1: Create people (base entity for personal data)
INSERT INTO people (id, name, email, phone, birth_date) VALUES
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
  ('11111111-0000-0000-0000-000000000022', 'Maria Visitante', 'maria.v@test.com', '11999999002', NULL),

  -- Leaders (for future user creation)
  ('11111111-0000-0000-0000-000000000001', 'João Líder', 'lider1@test.com', '11999999101', NULL),
  ('11111111-0000-0000-0000-000000000002', 'Ana Co-Líder', 'lider2@test.com', '11999999102', NULL),
  ('11111111-0000-0000-0000-000000000003', 'Maria Supervisora', 'supervisor1@test.com', '11999999103', NULL);

-- Step 2: Create test GCs
INSERT INTO growth_groups (id, name, mode, address, weekday, time, status) VALUES
  ('40000000-0000-0000-0000-000000000001', 'GC Esperança', 'in_person', 'Rua Teste 123', 3, '19:30', 'active'),
  ('40000000-0000-0000-0000-000000000002', 'GC Fé', 'online', NULL, NULL, NULL, 'active'),
  ('40000000-0000-0000-0000-000000000003', 'GC Amor', 'in_person', 'Av. Principal 456', 5, '20:00', 'active');

-- Step 3: Create visitors (without auth.users constraint)
INSERT INTO visitors (id, person_id, gc_id, status, created_at) VALUES
  ('80000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '30 days'),
  ('80000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000002', 'active', NOW() - INTERVAL '20 days');

-- Step 4: Create some test configurations
INSERT INTO config (key, value) VALUES
  ('organization_name', '"Igreja Monte Carmelo"'),
  ('gc_min_members', '3'),
  ('gc_max_members', '15');

-- Summary:
-- Este seed cria dados básicos que funcionam sem dependências de autenticação:
-- - Pessoas (membros, visitantes, líderes)
-- - Grupos de Crescimento (GCs)
-- - Visitantes
-- - Configurações do sistema
--
-- Para testar funcionalidade completa:
-- 1. Crie usuários via Supabase Dashboard ou signup
-- 2. Use os IDs das pessoas existentes para criar os usuários
-- 3. Crie growth_group_participants associando pessoas aos GCs
-- 4. Crie lesson_series, lessons e meetings conforme necessário