# Web Next.js (pasta `web/`)

Aplicação Next.js 15 (App Router) com Supabase SSR e React Query. Design mobile-first, componentes Radix e UI utilitários próprios.

## Arquitetura

O padrao oficial do frontend web esta em `docs/frontend-architecture.md`.

Resumo da arquitetura ativa:
- **Providers**: `src/app/providers.tsx` injeta providers globais; `SessionProvider` em `src/app/(app)/layout.tsx` cria contexto com usuário autenticado e papéis (`user_gc_roles`).
- **Boundary server/client**: telas e fluxos criticos devem carregar o estado inicial no servidor e deixar componentes cliente focados em interacao.
- **Supabase**: clients separados para server (`server-client.ts`) e browser (`browser-client.ts`), tipos em `src/lib/supabase/types.ts`.
- **Mutacoes**: fluxos criticos devem usar server actions ou API routes autenticadas; o browser client nao e a via preferencial para CRUD sensivel.
- **Formulários**: componentes cliente com hidratacao protegida; use `useClientReady` e bloqueie todos os campos ate a hidratacao terminar.
- **Convergencia legado**: o roadmap de migracao para esse modelo esta em `docs/frontend-hardening-plan.md`.

## Rotas principais
- `/` (landing) – Hero com CTA para login; lista “Próximos incrementos”; checklist. **Obs:** CTA “Ver Eventos” aponta para `/events` que exige login.
- `/login` – página pública; redireciona usuários autenticados para `/dashboard`.
- `(app)` (autenticado):
  - `/dashboard` – grid de atalho (GC, lições, participantes, visitantes).
  - `/gc` – lista GCs do usuário (via `growth_group_participants` + contagem de membros/visitantes).
  - `/gc/[id]` – detalhe do GC com liderança, membros, visitantes ativos e histórico recente de reuniões.
  - `/participants` – lista participantes com filtros (`role`, `status`, `gcId`). Usa `ParticipantList`.
  - `/visitors` – lista visitantes com filtros por GC e conversão.
  - `/meetings` – lista reuniões recentes com contagem de presenças; filtro por GC.
  - `/meetings/new` – **MeetingForm** completo (GC pré-selecionado via query opcional) para registrar reunião com lição de catálogo ou título custom, e presenças de membros/visitantes.
  - `/meetings/[id]` e `/meetings/[id]/edit` – rotas stub/placeholder.
  - `/lessons` – catálogo de lições (últimas séries) com links e detalhes.
  - `/supervision` – painel de métricas por GC para supervisores/coordenadores.
  - `/admin` – área administrativa (dashboard, usuários, GCs, lições, eventos, relatórios e configurações).
  - `/events` – lista eventos (usa server action `listEventsAction`), filtragem por ano/futuro.
  - `/docs/roadmap` – roadmap textual das sprints planejadas.

## Recursos construídos
- **Eventos (feature 005)**: tabela `events` + server actions (`createEventAction`, `updateEventAction`, `deleteEventAction`, `listEventsAction`, `getEventAction`) em `src/app/(app)/admin/events/actions.ts`. Usa RLS “admins_manage_all_events” e listagem pública autenticada.
- **Reuniões**: MeetingForm usa `/api/meetings` e `/api/growth-groups/[gcId]/attendance-options`; aplica validações Zod, pré-carrega GC quando informado e separa estado de carregamento de presença do submit.
- **Pessoas**: listas unificadas de `growth_group_participants` e `visitors` com filtros e componentes dedicados (`ParticipantList`, `VisitorList`).
- **Layout**: `AppShell` com navegação lateral, `Logo`, cabeçalhos e componentes de cartão/badge customizados.
- **Visitantes**: VisitorForm usa `/api/visitors`; deduplicação de `people` prioriza e-mail e só usa telefone como fallback quando não há e-mail informado.

## Pontos em aberto / bugs
- **Eventos públicos**: landing sugere “Ver Eventos”, mas rota `/events` exige autenticação (redireciona para login).
- **RLS/Permissões**: rely nas policies Supabase; revisar impacto da migration `015_disable_rls_for_tests.sql` antes de usar em produção.

## Como rodar localmente
```bash
cd web
cp .env.example .env.local  # preencher SUPABASE_URL e SUPABASE_ANON_KEY
npm install
npm run dev
```
Testes:
```bash
npm run lint
npm test             # unit + contract
npm run test:e2e     # Playwright (define E2E_SUPABASE_EMAIL/PASSWORD)
```
Supabase local deve estar ativo e seedado (ver `docs/supabase.md`).

## Próximos passos sugeridos
1. Avaliar se `/events` deve ser público; se sim, mover rota para `(public)` ou relaxar guarda.
2. Completar telas de edição/visualização administrativa ainda stubadas.
3. Revisar impacto da migration `015_disable_rls_for_tests.sql` antes de qualquer uso fora do ambiente local.
