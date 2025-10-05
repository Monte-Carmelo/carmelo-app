
# Plano de Implementação: App de Gestão de Grupos de Crescimento

**Branch**: `001-crie-um-app` | **Data**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Especificação de funcionalidade em `/specs/001-crie-um-app/spec.md`
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

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Resumo
App móvel multiplataforma (iOS/Android) para gestão de Grupos de Crescimento (células) de igreja. Permite líderes registrarem reuniões com presença e lições, supervisores visualizarem redes de GCs com métricas (frequência, crescimento, conversão de visitantes), e suporte a hierarquia organizacional expansível com N níveis. Inclui catálogo de lições gerenciado por perfil administrativo independente.

## Contexto Técnico
**Language/Version**: Dart 3.x+ com Flutter 3.x+
**Primary Dependencies**: Flutter SDK, Supabase Flutter SDK, Provider/Riverpod (state management)
**Storage**: Supabase (PostgreSQL managed) com Row Level Security (RLS)
**Testing**: Flutter test framework, integration_test, mockito para unit tests
**Target Platform**: Mobile (iOS 13+, Android API 21+)
**Project Type**: mobile (Flutter app + Supabase backend)
**Performance Goals**: <500ms para carregamento de listas, <200ms para ações locais, 60fps UI
**Constraints**: Suporte offline-first para registro de reuniões, sincronização automática quando online, <100MB storage local inicial
**Scale/Scope**: ~20 telas principais, suporte inicial para 1000 usuários/5000 membros, hierarquia com até 10 níveis

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Princípio I: Specification-Driven Delivery
✅ **PASS** - Especificação completa em `specs/001-crie-um-app/spec.md` com esclarecimentos documentados (5 perguntas respondidas). Apenas 2 itens diferidos (FR-016 notificações, FR-017 exportação) que não bloqueiam implementação core.

### Princípio II: Plan Before Implementation
✅ **PASS** - Este plano será gerado antes de `/tasks`. Constitution Check presente e documentado.

### Princípio III: Test-Driven Delivery
✅ **PASS** - Plano inclui geração de contract tests (Phase 1) antes de implementação. Integration tests serão derivados dos cenários de aceitação. Quickstart.md conterá passos de verificação executáveis.

### Princípio IV: Traceable Artifacts & Documentation
✅ **PASS** - Linkagem direta: spec.md → plan.md → data-model.md/contracts/ → tasks.md → commits. Desvios serão documentados em Complexity Tracking.

### Princípio V: Operational Readiness & Observability
✅ **PASS** - Supabase fornece logging integrado. Métricas de negócio (frequência, crescimento, conversão) definidas em FR-015. Rollback via Supabase migrations. Failure modes serão documentados em quickstart.md (offline scenarios, sync conflicts).

### Princípio VI: Brazilian Portuguese Documentation
✅ **PASS** - Todos os artefatos (plan.md, research.md, data-model.md, quickstart.md, tasks.md) em pt-BR. Código e commits em inglês.

## Estrutura do Projeto

### Documentação (esta funcionalidade)
```
specs/001-crie-um-app/
├── spec.md              # Especificação (completa)
├── plan.md              # Este arquivo (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── auth.yaml
│   ├── grupos.yaml
│   ├── reunioes.yaml
│   ├── membros.yaml
│   ├── licoes.yaml
│   └── dashboards.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Código Fonte (repository root)
```
# Mobile + Backend (Flutter + Supabase)
app/
├── lib/
│   ├── main.dart
│   ├── models/           # Entities: User, GC, Meeting, Member, Visitor, Lesson
│   ├── services/         # Supabase clients, auth, sync logic
│   ├── screens/          # UI screens organized by feature
│   │   ├── auth/
│   │   ├── grupos/
│   │   ├── reunioes/
│   │   ├── membros/
│   │   ├── licoes/
│   │   └── dashboards/
│   ├── widgets/          # Reusable components
│   ├── providers/        # State management
│   └── utils/            # Helpers, constants
├── test/
│   ├── unit/            # Model tests, service tests
│   └── widget/          # Widget tests
└── integration_test/    # E2E user flows

supabase/
├── migrations/          # SQL schema migrations
├── seed.sql             # Initial data (lições padrão)
└── functions/           # Edge functions (se necessário)

tests/
├── contract/            # API contract tests (validação de schemas Supabase)
└── integration/         # Integration tests (Flutter + Supabase local)
```

**Decisão de Estrutura**: Mobile + API (Option 3 adaptada). Flutter app em `app/` com testes integrados. Supabase gerenciado remotamente com migrations versionadas em `supabase/`. Tests de contrato validam schemas PostgreSQL/RLS via Supabase client.

## Phase 0: Esboço & Pesquisa

Áreas de pesquisa identificadas:

1. **Flutter + Supabase Integration Best Practices**
   - Autenticação com Supabase Auth (email/senha)
   - Row Level Security (RLS) policies para hierarquia organizacional
   - Offline-first com sincronização (sqflite + Supabase sync)
   - State management (Provider vs Riverpod vs Bloc)

2. **Hierarquia Organizacional Expansível**
   - Schema PostgreSQL para árvore N-níveis (adjacency list vs nested sets vs materialized path)
   - Queries eficientes para "todos GCs sob coordenador X"
   - Permissões em cascata via RLS

3. **Conversão Automática de Visitantes**
   - Trigger PostgreSQL ou edge function para contar visitas
   - Parametrização (config table)

4. **Dashboards e Métricas**
   - Queries agregadas no Supabase (views ou functions)
   - Caching no app para performance

5. **Flutter Testing Strategy**
   - Mock Supabase client para unit tests
   - Local Supabase instance para integration tests
   - Golden tests para UI críticas

**Output**: `research.md` será criado na próxima etapa com decisões consolidadas.

## Phase 1: Design & Contratos
*Prerequisites: research.md complete*

### Entidades (extraídas da spec):
1. **User** (Usuário)
   - id, email, password_hash, nome, hierarquia_nivel, hierarquia_parent_id, is_admin, created_at, updated_at

2. **GrowthGroup** (Grupo de Crescimento)
   - id, nome, modalidade (presencial/online), endereco, dia_semana, horario, lider_id, supervisor_id, status, created_at, updated_at

3. **Member** (Membro)
   - id, nome, email, telefone, gc_id, joined_at, status

4. **Visitor** (Visitante)
   - id, nome, email, telefone, visit_count, first_visit_date, converted_to_member_at, converted_by_user_id

5. **Meeting** (Reunião)
   - id, gc_id, data_hora, licao_id, registrado_por_user_id, created_at

6. **MeetingAttendance** (Presença em Reunião)
   - id, meeting_id, member_id, visitor_id (nullable), attendance_type (member/visitor)

7. **Lesson** (Lição)
   - id, titulo, descricao, referencias_biblicas, serie_id, link, ordem_na_serie

8. **LessonSeries** (Série de Lições)
   - id, nome, descricao, criado_por_user_id (admin)

### Contratos API (Supabase REST/Realtime):
- **POST /auth/signup** - Cadastro de usuário
- **POST /auth/login** - Login email/senha
- **GET /grupos** - Listar GCs (filtrado por permissão RLS)
- **POST /grupos** - Criar GC (coordenadores+)
- **GET /grupos/{id}/membros** - Listar membros do GC
- **POST /membros** - Adicionar membro (líder do GC)
- **POST /reunioes** - Registrar reunião (líder do GC)
- **GET /reunioes/{id}** - Detalhes da reunião
- **GET /licoes** - Listar lições/séries
- **POST /licoes** - Criar lição (admin only)
- **GET /dashboards/metricas** - Métricas agregadas (frequência, crescimento, conversão)

### Contract Tests:
Cada endpoint terá test em `tests/contract/test_<endpoint>.dart` validando:
- Schema da request
- Schema da response
- RLS policies (acesso negado para usuários não autorizados)

### Quickstart Scenarios:
1. Líder registra reunião com 5 membros + 2 visitantes
2. Visitante atinge 3 visitas e é convertido automaticamente
3. Supervisor visualiza métricas da rede (3 GCs)
4. Admin cria série de 4 lições
5. Coordenador promove líder a supervisor

**Output**: data-model.md, contracts/*.yaml, quickstart.md, CLAUDE.md

## Phase 2: Abordagem de Planejamento de Tarefas
*Esta seção descreve o que o comando /tasks fará - NÃO execute durante /plan*

**Estratégia de Geração de Tarefas**:
1. **Setup** (5 tarefas):
   - Inicializar projeto Flutter
   - Configurar Supabase project e local dev
   - Setup migrations e seed data
   - Configurar CI/CD básico
   - Setup testing infrastructure

2. **Tests First (TDD)** (15 tarefas - [P] quando possível):
   - Contract tests para cada endpoint [P]
   - Integration tests para user stories principais
   - Widget tests para telas críticas [P]

3. **Core Implementation** (25 tarefas):
   - Models (8 entities) [P]
   - Supabase service layer (auth, CRUD)
   - Screens principais (grupos, reuniões, membros, dashboards)
   - State management (providers)
   - RLS policies no Supabase

4. **Integration** (8 tarefas):
   - Offline sync logic
   - Auto-conversão de visitantes (trigger/function)
   - Dashboards com queries otimizadas
   - Permission checks em todas telas

5. **Polish** (7 tarefas):
   - Error handling e loading states
   - Unit tests para services [P]
   - Performance optimization (caching)
   - Quickstart validation manual
   - Documentação de deployment

**Ordenação**:
- TDD: Tests antes de implementação
- Dependência: Models → Services → Screens
- [P] para tasks em arquivos independentes

**Estimativa**: ~60 tarefas numeradas em tasks.md

**IMPORTANTE**: Esta fase é executada pelo comando /tasks, NÃO pelo /plan

## Phase 3+: Implementação Futura
*Estas fases estão além do escopo do comando /plan*

**Phase 3**: Execução de tarefas (comando /tasks cria tasks.md)
**Phase 4**: Implementação (executar tasks.md seguindo princípios constitucionais)
**Phase 5**: Validação (executar testes, quickstart.md, validação de performance)

## Complexity Tracking
*Preencher APENAS se Constitution Check tiver violações que precisam justificativa*

| Violação | Por Que Necessário | Alternativa Mais Simples Rejeitada Porque |
|----------|-------------------|------------------------------------------|
| N/A | N/A | N/A |

## Progress Tracking
*Este checklist é atualizado durante execução do fluxo*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md criado
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md criados
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - Estratégia documentada
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (2 diferidos não bloqueantes)
- [x] Complexity deviations documented (nenhum)

---
*Baseado na Constitution v1.1.0 - Ver `/.specify/memory/constitution.md`*
