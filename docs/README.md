# Documentação do Carmelo Web

Repositório monorepo que combina:
- **Web Next.js** em `web/` (App Router, React Query, Supabase SSR)
- **Infra Supabase** em `supabase/` (migrations, seeds e RLS)
- **Testes de contrato (web)** em `web/tests/contract/` e especificações em `specs/`

Leituras rápidas:
- `docs/web.md` — detalhes da aplicação web
- `docs/supabase.md` — banco, migrations e seeds

## Visão geral rápida
- Domínio: gestão de Grupos de Crescimento (GCs), reuniões, membros, visitantes, catálogo de lições e eventos da igreja.
- Autenticação: Supabase Auth (email/senha) + tabela `users` com `person_id` e flag `is_admin`.
- Papéis: líderes, supervisores, coordenadores (hierarquia livre) e admins (flag). A distinção de co-líder foi removida nas migrations mais recentes.
- Principais entidades: `people`, `users`, `growth_groups`, `growth_group_participants`, `visitors`, `lessons`/`lesson_series`, `meetings`, `meeting_member_attendance`, `meeting_visitor_attendance`, `events`.

## Como levantar o ambiente local (Supabase + Web)
1) **Supabase**
   - `supabase start`
   - `supabase db reset --local` ou `cd web && npm run db:reset` (aplica migrations e seed.sql)
   - `cd web && npm run db:seed-users` (cria usuários no Auth + vínculos)
   - Anote `SUPABASE_URL` e `SUPABASE_ANON_KEY` do output
2) **Web (Next)**
   - `cd web`
   - `cp .env.example .env.local` e preencha com as chaves locais
   - `npm install`
   - `npm run dev`

## Estado atual resumido
- **Web Next**: Layout autenticado, dashboards básicos, listagem de GCs, participantes, visitantes e reuniões com formulários híbridos. Fluxos críticos de reuniões e visitantes usam API routes autenticadas; fluxo de eventos implementado via server actions. Ver `docs/web.md`.
- **Banco**: 20+ migrations, triggers de hierarquia e conversão de visitantes, seeds completas + script adicional para Auth. Migrations recentes adicionam eventos. RLS parcialmente desativado pela migration `015_disable_rls_for_tests.sql` (somente para ambiente de teste). Ver `docs/supabase.md`.

## Testes
- **Web**: Vitest e contract tests em `web/tests/contract` (dependem de Supabase local + seed). Playwright configurado; cenários exigem credenciais válidas.

## Pendências críticas (alto nível)
- Web: revisar proteção/escopo da rota `/events` (atualmente autenticada) e completar telas administrativas ainda stubadas.
- Supabase: revisar se RLS deve permanecer desligado após testes; confirmar aplicação das migrations e seeds em ambientes reais.
