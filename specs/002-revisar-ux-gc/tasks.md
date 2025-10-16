# Tasks: Revisão da UX de Gestão de GCs

**Input**: Design documents from `/specs/002-revisar-ux-gc/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)

## Path Conventions
- All paths are relative to the `web/` directory.

## Phase 3.1: Setup
- [x] T001 [P] Instale e configure o Shadcn/UI no projeto `web`.
- [x] T002 [P] Crie os arquivos de tipo para as entidades do Supabase em `src/lib/supabase/types.ts`. Baseie-se no `data-model.md`.
- [x] T003 Crie as novas páginas no Next.js em `src/app/dashboard/gc/`, incluindo `page.tsx`, `reunioes/page.tsx` e `reunioes/[id]/page.tsx`.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Implemente o teste de contrato `web/tests/contract/gc-dashboard.test.ts` para buscar os dados do dashboard.
- [x] T005 [P] Implemente o teste de contrato `web/tests/contract/meetings.test.ts` para criar e buscar reuniões.
- [x] T006 [P] Implemente o teste de contrato `web/tests/contract/attendance.test.ts` para registrar a presença.
- [x] T007 [P] Implemente o teste de contrato `web/tests/contract/visitors.test.ts` para adicionar visitantes.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T008 [P] Crie o componente React para o Dashboard do GC em `src/components/gc/gc-dashboard.tsx`.
- [x] T009 [P] Crie o componente React para o formulário de agendamento de reunião em `src/components/gc/schedule-meeting-form.tsx`.
- [x] T010 [P] Crie o componente React para a lista de presença em `src/components/gc/attendance-list.tsx`.
- [x] T011 [P] Crie o componente React para o formulário de adição de visitante em `src/components/gc/add-visitor-form.tsx`.
- [x] T012 Implemente a lógica de busca de dados para o dashboard do GC em `src/lib/supabase/queries/gc-dashboard.ts`.
- [x] T013 Implemente a lógica para criar reuniões em `src/lib/supabase/mutations/meetings.ts`.
- [x] T014 Implemente a lógica para registrar presença em `src/lib/supabase/mutations/attendance.ts`.
- [x] T015 Implemente a lógica para adicionar visitantes em `src/lib/supabase/mutations/visitors.ts`.

## Phase 3.4: Integration
- [x] T016 Integre a lógica de busca de dados (T012) com o componente do dashboard (T008).
- [x] T017 Integre a lógica de criação de reuniões (T013) com o formulário (T009).
- [x] T018 Integre a lógica de registro de presença (T014) com a lista de presença (T010).
- [x] T019 Integre a lógica de adição de visitantes (T015) com o formulário (T011).

## Phase 3.5: Polish
- [ ] T020 [P] Crie testes E2E com Playwright para os cenários do `quickstart.md` em `tests/e2e/`.
- [x] T021 [P] Estilize as novas páginas e componentes com Tailwind CSS para garantir uma boa UX e responsividade.
- [x] T022 [P] Adicione estados de carregamento (loading) e erro para todas as interações de dados.
- [ ] T023 Execute os testes manuais do `quickstart.md` para validar a feature.

## Dependencies
- T001, T002, T003 devem ser concluídos antes de iniciar as outras fases.
- Testes (T004-T007) antes da implementação (T008-T015).
- Implementação do Core (T008-T015) antes da Integração (T016-T019).
- Integração (T016-T019) antes do Polimento (T020-T023).
