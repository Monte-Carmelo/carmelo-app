# Supabase (pasta `supabase/`)

Banco Postgres gerenciado pelo Supabase, com RLS e triggers para hierarquia e conversão de visitantes. As migrations vivem em `supabase/migrations/`; seeds em `supabase/seed.sql` e scripts adicionais em `web/scripts/`.

## Passo a passo para ambiente local
1. `supabase start`
2. `supabase db reset` (aplica todas as migrations e o `seed.sql`)
3. `cd web && npx tsx scripts/seed-auth-users.ts` (cria usuários no Supabase Auth + sincroniza tabela `users` e relacionamentos)
4. Anote `API URL` e `anon key` exibidos; use em `.env.local` (web) e `--dart-define` (mobile).

## Principais objetos de dados
- **people**: dados básicos (nome, email ou telefone obrigatório); chave para quase todas as relações. Triggers de `updated_at`.
- **users**: liga usuários Auth ↔ pessoas; campos `parent_user_id` e `hierarchy_path` para N níveis de coordenação; flag `is_admin`.
- **growth_groups**: GCs com `mode` (in_person/online/hybrid), endereço opcional, dia/horário, status e soft delete (`deleted_at`).
- **growth_group_participants**: papéis vinculados a `people` e `growth_groups` (`leader`, `co_leader` removido em migration 210000...; `supervisor`, `member`), status e auditoria.
- **visitors** + **members**: visitantes e membros (referenciam `people`), contagem de visitas e conversão.
- **lessons** / **lesson_series**: catálogo de lições com ordem na série e autor (`created_by_user_id`).
- **meetings**, **meeting_member_attendance**, **meeting_visitor_attendance**: registro de reuniões com presenças; validações em serviço Flutter/web.
- **events**: (feature 005) título, descrição, data/hora, local, banner, status e soft delete.
- **Views**: `dashboard_metrics`, `user_gc_roles` (papéis agregados), `dashboard_metricas` (histórica).
- **Config**: tabela `config` usada para threshold de conversão de visitantes (default 3 visitas).

## Migrations relevantes
- `001`-`014`: criação de entidades base, triggers (ex.: `update_hierarchy_path`), policies e seeds de suporte.
- `010_visitor_conversion_trigger.sql`: converte visitante automaticamente após N visitas.
- `011_dashboard_views.sql` + `013_refactor_rls.sql`: views e ajustes de RLS.
- `015_disable_rls_for_tests.sql`: **desativa RLS** em várias tabelas para testes automatizados. Avalie remover/ignorar em produção.
- `20251020131705_create_events_table.sql` e subsequentes: adicionam eventos e storage de banners.
- `99999999999999_seed_auth_users.sql`: cria usuários de exemplo na tabela `users` (sem Auth).

## Seeds
- `supabase/seed.sql`: popula `people`, `growth_groups`, `users`, `visitors` e dados mínimos. Não cria `auth.users`.
- `web/scripts/seed-auth-users.ts`: cria usuários Supabase Auth e insere relacionamentos (necessário para login real). Idempotente.

## Notas de RLS
- Policies permitem: líderes ver GCs e participantes associados; supervisores ver GCs próprios e subordinados; admins tudo. SELECT bloqueado retorna array vazio; writes retornam 403.
- Como `015_disable_rls_for_tests.sql` desliga RLS, revise em ambientes de staging/prod (reabilitar policies ou remover a migration do pipeline).

## Testes de contrato (Dart)
- Em `tests/contract/` (fora de `supabase/`). Exigem Supabase rodando com migrations + seed + usuários Auth.
- Cobrem signup/login, listagem/criação de GCs; T010-T018 pendentes.
