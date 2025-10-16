
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`
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
O objetivo é revisar e melhorar a experiência do usuário (UX) para as tarefas mais comuns da aplicação web, que são a gestão dos Grupos de Crescimento (GCs), o cadastro de reuniões e o registro de presença de membros e visitantes. A meta é criar um fluxo de trabalho mais intuitivo e eficiente para os usuários (líderes, coordenadores, membros, etc.), facilitando seus casos de uso rotineiros.

## Technical Context
**Language/Version**: TypeScript '^5'
**Primary Dependencies**: Next.js '15.5.5', React '19.1.0', Supabase
**Storage**: Supabase (PostgreSQL)
**Testing**: Vitest, Playwright
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: UX fluida e responsiva para as tarefas de rotina.
**Constraints**: A interface deve ser simples e intuitiva, otimizada para os principais casos de uso.
**Scale/Scope**: Revisão e refatoração da interface de usuário para gestão de GCs, incluindo reuniões e presença, na aplicação web.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Specification-Driven Delivery)**: PASS. A especificação será gerada a partir do input do usuário.
- **Principle II (Plan Before Implementation)**: PASS. Este plano está sendo criado antes da implementação.
- **Principle III (Test-Driven Delivery)**: PASS. O plano incluirá a criação de testes.
- **Principle IV (Traceable Artifacts & Documentation)**: PASS. Os artefatos serão rastreáveis.
- **Principle V (Operational Readiness & Observability)**: N/A. Esta é uma refatoração de UX, sem grandes mudanças operacionais.
- **Principle VI (Language Standards)**: PASS. A documentação será em pt-BR e o código em inglês.

## Project Structure

### Documentation (this feature)
```
specs/002-revisar-ux-gc/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
web/
├── src/
│   ├── app/ # Páginas da aplicação Next.js
│   ├── components/ # Componentes React
│   └── lib/ # Funções e hooks
└── tests/
    └── e2e/
```

**Structure Decision**: A estrutura existente da aplicação web Next.js (`web`) será mantida. As alterações de UX serão focadas principalmente nos componentes de UI e fluxo de páginas.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- **UI Components**: Criar componentes React para cada uma das novas telas e funcionalidades de UX (Dashboard, Agendamento de Reunião, Lista de Presença).
- **Data Fetching**: Implementar a lógica de busca de dados usando o `supabase-js` para cada uma das ações definidas nos contratos de API.
- **State Management**: Gerenciar o estado da aplicação (dados do usuário, GCs, reuniões, etc.) utilizando uma biblioteca como Zustand ou React Query.
- **Styling**: Estilizar os componentes utilizando Tailwind CSS, seguindo o sistema de design definido.
- **Testing**: Fazer os testes de contrato passarem e criar testes de integração para os fluxos de usuário definidos no `quickstart.md`.

**Ordering Strategy**:
1.  Implementação dos componentes de UI (sem lógica de dados).
2.  Implementação da lógica de busca e atualização de dados.
3.  Integração da lógica de dados com os componentes de UI.
4.  Criação de testes de integração (E2E com Playwright).
5.  Refatoração e estilização final.

**Estimated Output**: 15-20 tarefas no arquivo `tasks.md`.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

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
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.1.0 - See `/memory/constitution.md`*
