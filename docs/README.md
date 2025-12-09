# Documentação do Carmelo Web

Repositório monorepo que combina:
- **Web Next.js** em `web/` (App Router, React Query, Supabase SSR)
- **Infra Supabase** em `supabase/` (migrations, seeds e RLS)
- **Testes de contrato** em `tests/contract/` e especificações em `specs/`

Leituras rápidas:
- `docs/web.md` — detalhes da aplicação web
- `docs/supabase.md` — banco, migrations e seeds

## Visão geral rápida
- Domínio: gestão de Grupos de Crescimento (GCs), reuniões, membros, visitantes, catálogo de lições e eventos da igreja.
- Autenticação: Supabase Auth (email/senha) + tabela `users` com `person_id`, `is_admin` e hierarquia por `parent_user_id`/`hierarchy_path`.
- Papéis: líderes, co-líderes (removido em migrations mais recentes), supervisores, coordenadores (hierarquia livre), admins (flag).
- Principais entidades: `people`, `users`, `growth_groups`, `growth_group_participants`, `members`, `visitors`, `lessons`/`lesson_series`, `meetings`, `meeting_member_attendance`, `meeting_visitor_attendance`, `events`.

## Como levantar o ambiente local (Supabase + Web)
1) **Supabase**
   - `supabase start`
   - `supabase db reset` (aplica migrations e seed.sql)
   - `cd web && npx tsx scripts/seed-auth-users.ts` (cria usuários no Auth + vínculos)
   - Anote `SUPABASE_URL` e `SUPABASE_ANON_KEY` do output
2) **Web (Next)**
   - `cd web`
   - `cp .env.example .env.local` e preencha com as chaves locais
   - `npm install`
   - `npm run dev`

## Estado atual resumido
- **Web Next**: Layout autenticado, dashboards básicos, listagem de GCs, participantes, visitantes e reuniões com formulários server/client. Fluxo de eventos implementado (server actions). Alguns endpoints/rotas incompletos e testes quebrados. Ver `docs/web.md`.
- **Banco**: 20+ migrations, triggers de hierarquia e conversão de visitantes, seeds completas + script adicional para Auth. Migrations recentes adicionam eventos. RLS parcialmente desativado pela migration `015_disable_rls_for_tests.sql` (somente para ambiente de teste). Ver `docs/supabase.md`.

## Testes
- **Contrato (Dart)**: em `tests/contract/` — cobrem signup/login/listagem/criação de GCs; T010-T018 pendentes.
- **Web**: Vitest mínimo (`web/src/app/page.test.tsx`, atualmente falha por texto divergente); Playwright configurado mas sem cenários ativos.

## Pendências críticas (alto nível)
- Web: corrigir MeetingFormLoader (usa `session` indefinido), alinhar textos de testes, criar telas de detalhe/edição de GC e revisar proteções de rota `/events` (atualmente autenticada).
- Supabase: revisar se RLS deve permanecer desligado após testes; confirmar aplicação das migrations e seeds em ambientes reais.
