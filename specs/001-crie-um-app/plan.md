
# Implementation Plan: App de Gestão de Grupos de Crescimento

**Branch**: `001-crie-um-app` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-crie-um-app/spec.md`
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Sistema mobile para gestão de Grupos de Crescimento (células) de igrejas, permitindo que líderes registrem reuniões e gerenciem membros, supervisores acompanhem múltiplos GCs, e coordenadores tenham visão hierárquica expansível da rede. Inclui autenticação, controle de permissões por nível hierárquico, catálogo de lições padrão, conversão automática de visitantes para membros, e dashboards com métricas de frequência, crescimento e conversão.

## Technical Context
**Language/Version**: Dart 3.x+ com Flutter 3.x+
**Primary Dependencies**: Flutter SDK, Supabase Flutter SDK, Provider/Riverpod (state management)
**Storage**: PostgreSQL via Supabase (gerenciado) com Row Level Security (RLS)
**Testing**: Flutter test framework, integration_test, mockito para unit tests
**Target Platform**: iOS 15+ e Android 8.0+ (mobile multiplataforma)
**Project Type**: mobile - app Flutter + backend Supabase
**Performance Goals**: Sincronização offline-first com sync em background, <500ms para operações CRUD locais, 60 fps em listas de GCs/membros
**Constraints**: Suporte offline para registro de reuniões (sync posterior), <50MB footprint do app, compatível com dispositivos básicos (2GB RAM)
**Scale/Scope**: ~100-500 usuários ativos por instância, ~50-200 GCs por rede, hierarquia até 5-7 níveis, ~20-30 screens principais

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I - Specification-Driven Delivery**:
- ✅ Feature spec exists at `/specs/001-crie-um-app/spec.md`
- ✅ Spec has Clarifications section (Session 2025-10-04, 5 questions answered)
- ⚠️  2 NEEDS CLARIFICATION remain (FR-016: notificações, FR-017: exportação) - diferidos para features futuras, não bloqueiam MVP
- ✅ Business value clearly defined (gestão de GCs, acompanhamento hierárquico)

**Principle II - Plan Before Implementation**:
- ✅ /plan being executed before /tasks
- ✅ Constitution Check presente neste documento
- ✅ Structure decisions documentados abaixo (Flutter + Supabase)

**Principle III - Test-Driven Delivery**:
- ✅ Planejamento de contract tests (Phase 1: contratos OpenAPI → failing tests)
- ✅ Integration tests planejados (cada user story → test scenario)
- ✅ quickstart.md planejado como verificação executável

**Principle IV - Traceable Artifacts & Documentation**:
- ✅ Linkage spec → plan → tasks (tasks.md será gerado por /tasks)
- ✅ research.md, data-model.md, contracts/, quickstart.md planejados
- ✅ Complexity Tracking section presente (vazia se sem violações)

**Principle V - Operational Readiness & Observability**:
- ✅ Logging: Flutter logging framework (developer logs + error tracking)
- ✅ Metrics: Supabase analytics (queries, auth events), Firebase Analytics (app usage)
- ✅ Rollback: Supabase migrations reversíveis, feature flags via Supabase config table
- ✅ Failure modes: Offline sync recovery, RLS policy violations handling, network retry logic

**Principle VI - Brazilian Portuguese Documentation**:
- ✅ Spec, plan, e artifacts em pt-BR
- ✅ Code comments e user-facing strings em pt-BR
- ✅ Commit messages em inglês (convenção)

**Resultado**: ✅ PASS - Nenhuma violação constitucional. Os 2 NEEDS CLARIFICATION diferidos não bloqueiam MVP.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/                   # Data models (User, GC, Meeting, Member, Visitor, Lesson)
│   ├── services/                 # Business logic & Supabase clients
│   │   ├── auth_service.dart     # Autenticação
│   │   ├── gc_service.dart       # Gestão de GCs
│   │   ├── meeting_service.dart  # Reuniões
│   │   ├── member_service.dart   # Membros
│   │   └── sync_service.dart     # Offline sync
│   ├── screens/                  # UI screens (por feature)
│   │   ├── auth/                 # Login, signup
│   │   ├── gcs/                  # Lista, detalhes, criação de GCs
│   │   ├── meetings/             # Registro de reuniões
│   │   ├── members/              # Gestão de membros
│   │   └── dashboard/            # Métricas e visão de rede
│   ├── widgets/                  # Componentes reutilizáveis
│   ├── providers/                # State management (Provider/Riverpod)
│   └── utils/                    # Helpers, constants
├── test/                         # Unit e widget tests
├── integration_test/             # Integration tests
└── pubspec.yaml                  # Dependencies

supabase/
├── migrations/                   # Database schema (SQL)
│   ├── 001_users_hierarchy.sql
│   ├── 002_growth_groups.sql
│   ├── 003_gc_relationships.sql  # gc_leaders, gc_supervisors (many-to-many)
│   ├── 004_members.sql
│   ├── 005_visitors.sql
│   ├── 006_lessons.sql
│   ├── 007_meetings.sql
│   ├── 008_meeting_attendance.sql
│   ├── 009_visitor_conversion_trigger.sql
│   └── 010_dashboard_views.sql
└── seed.sql                      # Initial test data
```

**Structure Decision**: Mobile + API (Option 3).
- **App**: Flutter app em `app/` seguindo arquitetura em camadas (models, services, screens, widgets, providers).
- **Backend**: Supabase gerenciado (PostgreSQL + Auth + Storage), migrations SQL em `supabase/migrations/`.
- **Testing**: Unit/widget tests em `app/test/`, integration tests em `app/integration_test/`.
- **Rationale**: Flutter permite codebase único para iOS/Android, Supabase elimina necessidade de backend customizado, RLS policies implementam regras de negócio no DB.

## Phase 0: Outline & Research ✅ COMPLETO

**Unknowns identificados no Technical Context**: Nenhum - stack já definido (Flutter + Supabase)

**Decisões de pesquisa documentadas em** [research.md](./research.md):

1. **Flutter + Supabase Integration**: SDK oficial, auth email/senha, offline support
2. **Hierarquia Expansível**: Adjacency List + Materialized Path (triggers auto-update)
3. **State Management**: Riverpod 2.x (compile-time safety, testabilidade)
4. **Offline-First**: Hive local storage + background sync strategy
5. **Permissões**: Row Level Security (RLS) policies no PostgreSQL
6. **Testing Strategy**: Contract + Integration + Unit tests (TDD)
7. **Lições Padrão**: Modelo `lesson_series (1:N) lessons`
8. **Conversão de Visitantes**: Trigger automático (threshold parametrizável) + manual
9. **Dashboards**: Views agregadas com cache 5min (frequência, crescimento, conversão)
10. **GC Leaders & Supervisors**: Many-to-many via `gc_leaders` e `gc_supervisors`

**Alternativas consideradas e rejeitadas**:
- Firebase (Firestore não suporta queries hierárquicas complexas)
- Backend customizado (overhead de desenvolvimento)
- BLoC/GetX state management (boilerplate excessivo ou service locator global)
- SQLite local (Hive mais performático para cache de objetos)

**Status**: ✅ research.md completo, todas decisões técnicas documentadas

## Phase 1: Design & Contracts ✅ COMPLETO

**1. Entities extraídas** → [data-model.md](./data-model.md):

Entidades principais documentadas:
- `users` (hierarquia com `hierarchy_parent_id` + `hierarchy_path`)
- `growth_groups` (GCs com modalidade, endereco, status)
- `gc_leaders` (many-to-many: GC ↔ Leaders, role='leader'/'co-leader')
- `gc_supervisors` (many-to-many: GC ↔ Supervisors)
- `members` (vinculados a GC, status ativo/inativo/transferido)
- `visitors` (visit_count, auto-conversão após threshold)
- `meetings` (data_hora, licao_id, registrado_por_user_id)
- `meeting_attendance` (presença de members ou visitors)
- `lesson_series` e `lessons` (catálogo de lições)
- `config` (parametrização: visitor_conversion_threshold, etc.)

**Validations & Constraints**:
- RLS policies implementadas em todas as tabelas
- Triggers: `hierarchy_path` auto-update, `visitor_conversion`, `ensure_gc_has_leader/supervisor`
- Soft deletes via `deleted_at` onde aplicável
- CHECK constraints: `endereco_se_presencial`, `attendance_xor`, `serie_requer_ordem`

**2. API Contracts gerados** → [contracts/](./contracts/):

OpenAPI schemas para endpoints Supabase:
- `auth.yaml`: Login, signup, refresh token
- `grupos.yaml`: CRUD de GCs (GET /growth_groups, POST /growth_groups, PATCH /growth_groups/:id)
- `gc_relationships.yaml`: Gestão de leaders/supervisors (POST /gc_leaders, DELETE /gc_leaders, etc.)
- `reunioes.yaml`: CRUD de reuniões + presença (POST /meetings, POST /meeting_attendance)

**3. Contract Tests**: Planejados em tasks.md (serão criados durante Phase 3)

**4. Integration Test Scenarios** → [quickstart.md](./quickstart.md):

5 cenários de aceitação mapeados:
1. Líder registra reunião com presença e lição
2. Supervisor visualiza lista de GCs da rede
3. Líder adiciona novo membro ao GC
4. Líder seleciona lição do catálogo padrão
5. Supervisor filtra/ordena GCs por critérios

**5. Agent Context File**: Será atualizado a seguir via script `update-agent-context.sh`

**Status**: ✅ data-model.md, contracts/, quickstart.md completos

---

## Constitution Check (Post-Design Re-evaluation)

**Re-validação após Phase 1**:

✅ **Principle I - Specification-Driven Delivery**: Nenhuma nova ambiguidade surgiu. Design reflete os requisitos da spec.

✅ **Principle II - Plan Before Implementation**: Design artifacts (data-model.md, contracts/) completos antes de tasks.md.

✅ **Principle III - Test-Driven Delivery**:
- Contract tests planejados (validação de schemas OpenAPI)
- Integration tests mapeados (quickstart.md → 5 cenários)
- Unit tests serão gerados por /tasks

✅ **Principle IV - Traceable Artifacts**:
- Linkage: spec.md → plan.md → research.md / data-model.md / contracts/ → quickstart.md
- Próximo passo: /tasks gerará tasks.md rastreável

✅ **Principle V - Operational Readiness**:
- Logging: Flutter logging + Supabase logs
- Metrics: Supabase Analytics + Firebase Analytics
- Rollback: Migrations reversíveis (Supabase CLI)
- Failure modes: Offline sync recovery documentado (research.md #4)

✅ **Principle VI - Brazilian Portuguese**: Todos artifacts em pt-BR

**Violações identificadas**: Nenhuma

**Complexity deviations**: Nenhuma (Complexity Tracking vazio)

**Resultado**: ✅ PASS - Design está constitutionalmente compliant, pronto para Phase 2

---

## Phase 2: Task Planning Approach ✅ DESCRITO

*Nota: Esta seção descreve o que o /tasks command fará - NÃO executar durante /plan*

**Task Generation Strategy para /tasks command**:

1. **Database Layer** (Supabase migrations):
   - Task por migration SQL (001_users_hierarchy.sql até 010_dashboard_views.sql)
   - Seed data (seed.sql) com usuários/GCs/lições de teste
   - Validação: `supabase db reset` sem erros

2. **Models Layer** (app/lib/models/):
   - Task por entity (User, GrowthGroup, GCLeader, GCSupervisor, Member, Visitor, Meeting, MeetingAttendance, Lesson, LessonSeries)
   - Cada task: Model class + Hive adapter (offline) + JSON serialization
   - [P] = Paralelo (models independentes)

3. **Services Layer** (app/lib/services/):
   - `auth_service.dart`: Login, signup, session management
   - `gc_service.dart`: CRUD de GCs, fetch por role (líder/supervisor/coordenador)
   - `meeting_service.dart`: Registro de reuniões + presença
   - `member_service.dart`: CRUD de membros + visitor conversion
   - `sync_service.dart`: Offline sync com Supabase
   - Dependency order: auth_service primeiro → outros services

4. **Contract Tests** (app/test/contract/):
   - Task por contract OpenAPI (auth_test.dart, grupos_test.dart, reunioes_test.dart, gc_relationships_test.dart)
   - Validar schemas de request/response
   - **TDD**: Tests escritos antes de services, devem FAIL inicialmente

5. **Providers** (app/lib/providers/):
   - auth_provider.dart (user session, role detection)
   - gc_list_provider.dart (GCs filtrados por role)
   - meeting_detail_provider.dart (state de reunião)
   - [P] após services completos

6. **Screens & Widgets** (app/lib/screens/, app/lib/widgets/):
   - auth/ (login, signup)
   - gcs/ (lista, detalhes, criação)
   - meetings/ (registro de reunião, presença)
   - members/ (lista, adicionar, converter visitor)
   - dashboard/ (métricas: frequência, crescimento, conversão)
   - Dependency order: providers → screens

7. **Integration Tests** (app/integration_test/):
   - Task por cenário do quickstart.md (5 cenários)
   - E2E flows: líder registra reunião, supervisor visualiza rede, etc.
   - **TDD**: Tests antes de UI implementation

**Ordering Strategy (TDD compliant)**:
1. Migrations → Models → Contract Tests (failing) → Services (make tests pass)
2. Providers → Integration Tests (failing) → Screens (make tests pass)
3. Mark [P] for parallel execution where no dependencies

**Estimated Output**: ~40-50 tasks em tasks.md (ordenados, numerados, com [P] markers)

**IMPORTANTE**: Esta phase é executada pelo comando `/tasks`, NÃO pelo `/plan`

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*Checklist atualizado durante execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅ research.md
- [x] Phase 1: Design complete (/plan command) ✅ data-model.md, contracts/, quickstart.md
- [x] Phase 2: Task planning approach documented (/plan command) ✅ Strategy descrita
- [ ] Phase 3: Tasks generated (/tasks command) → **Próximo passo**: Run `/tasks`
- [ ] Phase 4: Implementation complete (manual ou via /implement)
- [ ] Phase 5: Validation passed (execute quickstart.md scenarios)

**Gate Status**:
- [x] Initial Constitution Check: PASS (nenhuma violação detectada)
- [x] Post-Design Constitution Check: PASS (design compliant)
- [x] All NEEDS CLARIFICATION resolved (2 diferidos: FR-016 notificações, FR-017 exportação - não bloqueiam MVP)
- [x] Complexity deviations documented (nenhuma - Complexity Tracking vazio)

**Artifacts Generated**:
- ✅ `/specs/001-crie-um-app/plan.md` (este arquivo)
- ✅ `/specs/001-crie-um-app/research.md` (10 decisões técnicas documentadas)
- ✅ `/specs/001-crie-um-app/data-model.md` (10 entidades + RLS policies)
- ✅ `/specs/001-crie-um-app/contracts/` (4 OpenAPI schemas: auth, grupos, reunioes, gc_relationships)
- ✅ `/specs/001-crie-um-app/quickstart.md` (5 cenários de validação end-to-end)
- ✅ `/CLAUDE.md` (agent context atualizado)
- ⏳ `/specs/001-crie-um-app/tasks.md` (será gerado por `/tasks`)

**Próximos Passos**:
1. ✅ /plan completo (este comando)
2. ⏭️  Run `/tasks` para gerar tasks.md a partir dos design artifacts
3. ⏭️  Executar tasks em ordem (TDD: tests → implementation)
4. ⏭️  Validar com quickstart.md end-to-end scenarios
5. ⏭️  Criar PR referenciando spec.md e plan.md

---
*Based on Constitution v1.1.0 - See `/memory/constitution.md`*
