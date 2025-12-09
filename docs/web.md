# Web Next.js (pasta `web/`)

Aplicação Next.js 15 (App Router) com Supabase SSR e React Query. Design mobile-first, componentes Radix e UI utilitários próprios.

## Arquitetura
- **Providers**: `src/app/providers.tsx` injeta React Query + Toaster; `SessionProvider` em `src/app/(app)/layout.tsx` cria contexto com usuário autenticado e papéis (`user_gc_roles`). Rotas em `(app)` exigem login via `getAuthenticatedUser` (supabase server).
- **Supabase**: clients separados para server (`server-client.ts`) e browser (`browser-client.ts`), tipos em `src/lib/supabase/types.ts`.
- **Formulários**: React Hook Form + Zod; componentes UI em `src/components/ui/`.
- **Estado**: páginas SSR (server components) trazem dados iniciais; alguns formulários são client components (ex.: `MeetingForm`).

## Rotas principais
- `/` (landing) – Hero com CTA para login; lista “Próximos incrementos”; checklist. **Obs:** CTA “Ver Eventos” aponta para `/events` que exige login.
- `/login` – página pública; redireciona usuários autenticados para `/dashboard`.
- `(app)` (autenticado):
  - `/dashboard` – grid de atalho (GC, lições, participantes, visitantes).
  - `/gc` – lista GCs do usuário (via `growth_group_participants` + contagem de membros/visitantes). Links para `/gc/{id}` (rota ainda não criada).
  - `/participants` – lista participantes com filtros (`role`, `status`, `gcId`). Usa `ParticipantList`.
  - `/visitors` – lista visitantes com filtros por GC e conversão.
  - `/meetings` – lista reuniões recentes com contagem de presenças; filtro por GC.
  - `/meetings/new` – **MeetingForm** completo (GC pré-selecionado via query opcional) para registrar reunião com lição de catálogo ou título custom, e presenças de membros/visitantes.
  - `/meetings/[id]` e `/meetings/[id]/edit` – rotas stub/placeholder.
  - `/lessons`, `/supervision`, `/admin` – placeholders ou primeiras versões de layout.
  - `/events` – lista eventos (usa server action `listEventsAction`), filtragem por ano/futuro.
  - `/docs/roadmap` – roadmap textual das sprints planejadas.

## Recursos construídos
- **Eventos (feature 005)**: tabela `events` + server actions (`createEventAction`, `updateEventAction`, `deleteEventAction`, `listEventsAction`, `getEventAction`) em `src/app/(app)/admin/events/actions.ts`. Usa RLS “admins_manage_all_events” e listagem pública autenticada.
- **Reuniões**: MeetingForm insere em `meetings`, `meeting_member_attendance` e `meeting_visitor_attendance`; pré-carrega lições e GCs, aplica validações Zod.
- **Pessoas**: listas unificadas de `growth_group_participants` e `visitors` com filtros e componentes dedicados (`ParticipantList`, `VisitorList`).
- **Layout**: `AppShell` com navegação lateral, `Logo`, cabeçalhos e componentes de cartão/badge customizados.

## Pontos em aberto / bugs
- **MeetingFormLoader** (`/meetings/new/page.tsx`) usa `session.user.id` mas `session` não está definido; deve usar o `user` autenticado obtido na função ou passar `session` via contexto.
- **GC detail**: rotas `/gc/{id}` não existem — links criam 404.
- **Eventos públicos**: landing sugere “Ver Eventos”, mas rota `/events` exige autenticação (redireciona para login).
- **Teste Vitest** (`src/app/page.test.tsx`) falha: espera heading “gestão dos grupos de crescimento”, mas título atual é “Sistema de Gestão de Grupos de Crescimento”.
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
npm run test         # Vitest
npm run test:e2e     # Playwright (define E2E_SUPABASE_EMAIL/PASSWORD)
```
Supabase local deve estar ativo e seedado (ver `docs/supabase.md`).

## Próximos passos sugeridos
1. Consertar MeetingFormLoader (`user.id` no loader; validar papéis).
2. Criar rota `/gc/[id]` com resumo de GC, membros, visitantes e últimas reuniões.
3. Ajustar teste de homepage e textos para alinhar Vitest ou atualizar assertion.
4. Avaliar se `/events` deve ser público; se sim, mover rota para `(public)` ou relaxar guarda.
5. Completar telas de edição/visualização de reunião e GC; adicionar estados de erro e loading consistentes.
