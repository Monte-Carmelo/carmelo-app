-- Demo Seed Data for carmelo-app (Two-step process)
-- Feature: 001-crie-um-app
-- Description: Demo data for development, testing and non-production cloud environments
--
-- EXECUÇÃO:
-- 1. supabase db reset
-- 2. cd web && npx tsx scripts/seed-auth-users.ts
--
-- AVISO:
-- - Este seed e apropriado para ambiente local, staging ou demo.
-- - Nao use este seed como base de producao real.
-- - Ele NAO cria usuarios em auth.users e nao deve mais depender de migrations que criem logins automaticamente.

-- Create people (base entity for personal data)
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

-- Create test GCs
INSERT INTO growth_groups (id, name, mode, address, weekday, time, status) VALUES
  ('40000000-0000-0000-0000-000000000001', 'GC Esperança', 'in_person', 'Rua Teste 123', 3, '19:30', 'active'),
  ('40000000-0000-0000-0000-000000000002', 'GC Fé', 'online', NULL, NULL, NULL, 'active'),
  ('40000000-0000-0000-0000-000000000003', 'GC Amor', 'in_person', 'Av. Principal 456', 5, '20:00', 'active');

-- Create visitors
INSERT INTO visitors (id, person_id, gc_id, status, created_at) VALUES
  ('80000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '30 days'),
  ('80000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000002', 'active', NOW() - INTERVAL '20 days');

-- Summary:
-- Este seed cria os dados básicos que funcionam sem dependências de auth.users:
-- - Pessoas (membros, visitantes, líderes)
-- - Grupos de Crescimento (GCs)
-- - Visitantes
--
-- Após executar este seed, execute o script de auth users para criar:
-- - Usuários em auth.users
-- - Usuários na tabela users
-- - growth_group_participants (relacionamentos)
-- - lessons, meetings e outros dados que dependem de users
