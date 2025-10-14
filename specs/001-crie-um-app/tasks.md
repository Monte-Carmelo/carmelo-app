# Tasks: Carmelo Web

**Input**: Artefatos de design em `/specs/001-crie-um-app/`
**Contexto**: Front-end responsivo em Next.js consumindo Supabase (mesmo modelo de dados consolidado).
**Idioma**: pt-BR (per Constitution Principle VI)

## Execução Geral
```
1. Garantir base do projeto web e tooling (Next.js + Supabase + testes).
2. Escrever testes primeiro (Vitest/Playwright/contratos) → confirmar falha.
3. Implementar funcionalidades conforme prioridades do roadmap (Sprints 1-3).
4. Validar cenários E2E do quickstart e revisar acessibilidade/responsividade.
```

## Convenções
- Formato: `[ID] [P?] Descrição`
- `[P]` indica tarefas que podem ser executadas em paralelo (arquivos distintos).
- Referenciar caminhos exatos (`web/src/...`, `tests/...`).
- Commits: `feat: W### <descrição>`.

---

## Phase 3.1 — Setup (Fundação)
- [x] W001 Bootstrap Next.js + Tailwind + TypeScript em `web/`.
- [x] W002 Configurar lint, Vitest, Playwright, Husky/lint-staged (`web/package.json`, configs).
- [x] W003 Criar utilitários Supabase (`web/src/lib/env.ts`, `web/src/lib/supabase/*`).
- [x] W004 Publicar stack e roadmap web (`web/README.md`, `specs/001-crie-um-app/web-*.md`).
- [ ] W005 Configurar Storybook 8 com Storybook Test Runner e integração Tailwind (`web/.storybook`).
- [ ] W006 Preparar configuração Playwright (projeto mobile/desktop) + script `npm run test:e2e`.
- [ ] W007 Gerar tipos do Supabase via CLI e publicar em `web/src/lib/supabase/types.ts`.

---

## Phase 3.2 — Tests First (TDD obrigatório)
### Contract Tests (Node + Supabase)
- [ ] W010 [P] Teste contrato `GET /growth_groups` em `tests/contract/grupos.get.test.ts` validando agrupamentos por `growth_group_participants`.
- [ ] W011 [P] Teste contrato `POST /growth_group_participants` (`tests/contract/gc_participants.post.test.ts`) garantindo regras de papel.
- [ ] W012 [P] Teste contrato `POST /meetings` (`tests/contract/reunioes.post.test.ts`) cobrindo presença membros/visitantes, `lesson_title`, comentários.
- [ ] W013 [P] Teste contrato `GET /meetings/{id}` (`tests/contract/reunioes.get.test.ts`) com joins de attendance.
- [ ] W014 [P] Teste contrato `POST /visitor_conversion_events` (quando visitante convertido manualmente).

### Vitest (UI/Serviços)
- [ ] W020 [P] Escrever teste Vitest para hook de sessão Supabase (`web/src/lib/auth/use-session.test.ts` – deve falhar).
- [ ] W021 [P] Escrever teste Vitest para serviço de reuniões (`web/src/lib/api/meetings.test.ts` – mocks supabase, deve falhar).

### Playwright Smoke (Cenários Quickstart)
- [ ] W030 [P] Esboçar teste E2E "Líder registra reunião" em `web/tests/e2e/leader-register-meeting.spec.ts` (falhando).
- [ ] W031 [P] Esboçar teste E2E "Visitante convertido após 3 visitas" (`web/tests/e2e/visitor-conversion.spec.ts`, falhando).

*Somente após todos os testes acima falharem é permitido iniciar Phase 3.3.*

---

## Phase 3.3 — Implementação Core (Sprint 1)
### Autenticação & Shell
- [ ] W100 Implementar provider de sessão Supabase (`web/src/lib/auth/session-provider.tsx`) consumindo cookies SSR.
- [ ] W101 Criar middleware/route-handlers para proteger rotas autenticadas (`web/src/middleware.ts`).
- [ ] W102 Construir layout autenticado (navbar + sidebar responsiva) em `web/src/app/(app)/layout.tsx`.
- [ ] W103 Implementar página de login (`web/src/app/(public)/login/page.tsx`) com React Hook Form + Zod.

### Dashboard do Líder
- [ ] W110 Implementar serviço `growthGroupsService` (`web/src/lib/api/growth-groups.ts`) com TanStack Query clients.
- [ ] W111 Criar hook/adapter `useLeaderDashboard` (`web/src/lib/hooks/use-leader-dashboard.ts`).
- [ ] W112 Desenvolver página dashboard líder (`web/src/app/(app)/dashboard/page.tsx`) com cards (lição atual, presença, visitantes).
- [ ] W113 Componentizar widgets (ex.: `MeetingSummaryCard`, `AttendanceTrend`) em `web/src/components/dashboard/`.

### Registro de Reuniões
- [ ] W120 Implementar formulário de reunião (`web/src/components/meetings/meeting-form.tsx`) com RHF + Zod.
- [ ] W121 Criar componentes de lista de presença (membros vs visitantes) em `web/src/components/meetings/attendance/`.
- [ ] W122 Integrar envio para Supabase (`web/src/lib/api/meetings.ts`) e invalidar caches TanStack Query.
- [ ] W123 Atualizar página/modal de criação de reunião (`web/src/app/(app)/meetings/new/page.tsx`).

### Comentários & Lições
- [ ] W130 Criar seletor de lição (catálogo + custom) `web/src/components/lessons/lesson-selector.tsx`.
- [ ] W131 Sincronizar catálogo padrão via serviço `web/src/lib/api/lessons.ts`.

---

## Phase 3.4 — Implementação Sprint 2 (Pessoas & Visitantes)
- [ ] W200 Listagem de participantes com filtros por papel (`web/src/app/(app)/participants/page.tsx`).
- [ ] W201 Serviço de participantes (`web/src/lib/api/participants.ts`).
- [ ] W202 Fluxo de criação/edição de participante (`web/src/components/participants/participant-form.tsx`).
- [ ] W203 Listagem e gestão de visitantes (`web/src/app/(app)/visitors/page.tsx`).
- [ ] W204 Serviço de visitantes (`web/src/lib/api/visitors.ts`) com contagem de visitas.
- [ ] W205 Implementar conversão manual → cria registro em `visitor_conversion_events` (`web/src/components/visitors/convert-dialog.tsx`).
- [ ] W206 Atualizar dashboards com indicadores de frequência/conversão (`web/src/components/dashboard/conversion-banner.tsx`).

### Testes Sprint 2
- [ ] W210 Atualizar testes Vitest para hooks/serviços de participantes e visitantes.
- [ ] W211 Fazer Playwright cenários W030/W031 passarem (incluindo fixtures Supabase seed).

---

## Phase 3.5 — Implementação Sprint 3 (Supervisão & Lições)
- [ ] W300 Página supervisor (`web/src/app/(app)/supervision/page.tsx`) com tabela de GCs e filtros.
- [ ] W301 Serviço `supervisionService` (consulta agregada) em `web/src/lib/api/supervision.ts`.
- [ ] W302 Drill-down de GC (`web/src/app/(app)/growth-groups/[id]/page.tsx`) com histórico de reuniões.
- [ ] W303 CRUD do catálogo de lições (`web/src/app/(app)/lessons/page.tsx`).
- [ ] W304 Formulário série/lição (`web/src/components/lessons/lesson-form.tsx`).
- [ ] W305 Integração com comentários e anexos (se aplicável) em reuniões anteriores.

### Testes Sprint 3
- [ ] W310 Playwright cenário "Supervisor acompanha rede" (`web/tests/e2e/supervisor-network.spec.ts`).
- [ ] W311 Vitest para componentes de filtro/agrupamento.
- [ ] W312 Storybook docs para componentes críticos (dashboard cards, forms).

---

## Phase 3.6 — Integração & Observabilidade
- [ ] W400 Configurar PostHog + Sentry + logging custom (`web/src/lib/observability/*`).
- [ ] W401 Setup de feature flags minimalistas via Supabase (tabela `feature_flags`).
- [ ] W402 Scripts npm para seeds e reset (`web/scripts/reset-db.ts`).
- [ ] W403 Pipeline CI (GitHub Actions) com lint/test/type-check/build/E2E smoke.

---

## Phase 3.7 — Polimento & QA Final
- [ ] W500 Checklist responsivo (breakpoints xs-sm-md-lg) documentado.
- [ ] W501 Auditoria de acessibilidade (axe + Lighthouse) com issues endereçadas.
- [ ] W502 Revisão de cópia pt-BR e termos (conforme `TRANSLATION_MAP.md`).
- [ ] W503 Revisão de performance (Core Web Vitals, lazy chunks críticos).
- [ ] W504 Atualizar `quickstart.md` com passos web + validar cenário completo.
- [ ] W505 Preparar changelog/nota de lançamento vinculando `spec.md`.

---

## Dependências
- Phase 3.2 deve falhar antes de iniciar Phase 3.3.
- Serviços (W110-W122 etc.) dependem dos testes correspondentes escritos na Phase 3.2.
- Playwright cenários só passam após funcionalidades concluídas (W210, W211, W310).
- Observabilidade (W400+) depende de shell autenticado pronto.

## Paralelização
- `[P]` itens em contratos, testes e componentes UI independentes podem rodar simultaneamente.
- Evitar `[P]` no mesmo arquivo para prevenir conflitos.

## Observações
- Todos os testes novos devem começar falhando (TDD).
- Validar RLS com usuários seed (líder, supervisor, admin) em testes contract/E2E.
- Documentar decisões adicionais no arquivo `web-stack-decisions.md`.
- Quickstart deve permanecer executável para QA manual.

---

**Total**: 55 tarefas (4 concluídas). Atualize este arquivo conforme novas decisões forem tomadas.
