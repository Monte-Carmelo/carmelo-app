# Implementation Plan: Área Administrativa Completa

**Branch**: `004-area-administrativa` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-area-administrativa/spec.md`
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded /Users/rafael/dev/carmelo-app/specs/004-area-administrativa/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ All clarifications resolved in spec Session 2025-10-18
   → Project Type: web (Next.js 15.5.5 frontend + Supabase backend)
   → Structure Decision: Next.js App Router in /web with admin routes
3. Fill Constitution Check section
   → ✅ Evaluated against Constitution v1.2.0
4. Evaluate Constitution Check section
   → ✅ No violations detected
   → Progress: Initial Constitution Check complete
5. Execute Phase 0 → research.md
   → ⏸️ Skipping - admin infrastructure already researched
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → 🔄 IN PROGRESS
7. Re-evaluate Constitution Check section
   → ⏸️ PENDING Phase 1 completion
8. Plan Phase 2 → Describe task generation approach
   → ⏸️ PENDING Phase 1 completion
9. STOP - Ready for /tasks command
```

**STATUS**: Phase 1 in progress - creating design artifacts

## Summary

**Requisito Principal**: Criar área administrativa completa (`/admin`) que permita aos administradores gerenciar todo o sistema de Grupos de Crescimento, incluindo:
- Dashboard com métricas e atividades recentes
- Gestão completa de GCs (CRUD + multiplicação)
- Gestão de séries e lições (CRUD + reordenação)
- Relatórios e analytics (crescimento, frequência, conversões)
- Configurações do sistema

**Abordagem Técnica**:
- Expandir estrutura `/admin` existente com novo layout AdminShell (sidebar navigation)
- Implementar em 7 fases incrementais, começando por fundação e gestão de GCs (MVP)
- Criar nova tabela `gc_multiplication_events` para auditar multiplicações
- Usar componentes shadcn/ui existentes + novas bibliotecas (Recharts para gráficos, @dnd-kit para drag-and-drop)
- Aproveitar RLS policies existentes com flag `is_admin`

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 15.5.5 + React 19.1.0
**Primary Dependencies**:
- Next.js 15.5.5 (App Router)
- React 19.1.0
- Supabase client (backend)
- Tailwind CSS 3.4.18
- shadcn/ui components (Button, Card, Badge, Input, etc.)
- Lucide React (ícones)
- **Novos**: Recharts (gráficos), @dnd-kit (drag-and-drop), date-fns (datas)

**Storage**: PostgreSQL via Supabase (12 tabelas existentes + 1 nova: gc_multiplication_events)
**Testing**: Manual testing + quickstart scenarios (E2E automatizado fora do escopo inicial)
**Target Platform**: Web browsers (desktop e mobile, mínimo 375px width para admin)

**Project Type**: web (Next.js frontend + Supabase backend)

**Performance Goals**:
- Listagem de GCs (até 100 registros): < 2s
- Queries de relatórios: < 3s com paginação
- Transação de multiplicação: < 5s

**Constraints**:
- Acesso admin verificado via `is_admin` flag no layout
- Todas as operações registram `created_by_user_id`
- Soft delete (deleted_at) ao invés de DELETE permanente
- Transações de multiplicação devem ser atômicas (rollback em erro)

**Scale/Scope**:
- Esperado: ~50 usuários admin, ~100 GCs, ~1000 membros
- Relatórios: período máximo padrão de 1 ano
- Multiplicação: até 3 novos GCs por operação

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Specification-Driven Delivery
✅ **PASS** - Feature specification completa em `spec.md` com 37 FR + 14 NFR
✅ **PASS** - Nenhum marker `[NEEDS CLARIFICATION]` permanece (5 clarificações resolvidas em sessão)
✅ **PASS** - Requisitos focam em valor de negócio (gestão eficiente, auditoria, relatórios)

### Principle II: Plan Before Implementation
✅ **PASS** - Este plano precede qualquer implementação de código
✅ **PASS** - Constitution Check presente e preenchido
✅ **PASS** - Estrutura de rotas `/admin/**` documentada em Project Structure
📋 **ACTION REQUIRED** - Phase 1 deve gerar: data-model.md, quickstart.md, contracts/

### Principle III: Test-Driven Delivery
⚠️ **DEFERRED** - Testes automatizados (E2E) estão fora do escopo do MVP
✅ **MITIGATION** - quickstart.md conterá cenários de teste manual detalhados
✅ **MITIGATION** - Validação Zod em todos os formulários garante contratos de input
📝 **JUSTIFICATION**: Área admin é de uso restrito (apenas admins), priorizamos entrega funcional com testes manuais para MVP. Testes automatizados ficam para versão 2.0.

### Principle IV: Traceable Artifacts & Documentation
✅ **PASS** - Especificação → Plano → Tasks → Commits (workflow completo)
✅ **PASS** - Plano documenta 7 fases com entregas claras
✅ **PASS** - Desvio (testes manuais vs TDD) documentado acima
📋 **ACTION REQUIRED** - Criar plan-detailed.md → research.md, data-model.md, quickstart.md

### Principle V: Operational Readiness & Observability
⚠️ **PARTIAL** - Logging/metrics não especificados explicitamente
✅ **MITIGATION** - Soft delete preserva histórico para auditoria
✅ **MITIGATION** - `gc_multiplication_events` registra eventos críticos
✅ **MITIGATION** - Mensagens de erro/sucesso em todas as operações (toast notifications)
📝 **COMPLEXITY NOTE**: Observability avançada (APM, tracing) excede escopo MVP. Logs básicos do Supabase + audit tables são suficientes.

### Principle VI: Language Standards
✅ **PASS** - Documentação (spec, plan) em pt-BR
✅ **PASS** - Código TypeScript/React em inglês
✅ **PASS** - Tabela `gc_multiplication_events` usa nomes em inglês
✅ **PASS** - Rotas em inglês (`/admin/growth-groups`, `/admin/lessons`)
✅ **PASS** - UI strings em pt-BR para usuários brasileiros

**GATE RESULT**: ✅ **APPROVED** para Phase 0 (com mitigações documentadas)

---

## Project Structure

### Documentation (this feature)
```
specs/004-area-administrativa/
├── spec.md              # Feature specification (✅ complete)
├── plan.md              # This file - Implementation plan (🔄 in progress)
├── plan-detailed.md     # Documento detalhado expandido (✅ created)
├── research.md          # Phase 0: Technology research (⏸️ skipped - infraestrutura conhecida)
├── data-model.md        # Phase 1: Database schema for gc_multiplication_events (📋 to create)
├── quickstart.md        # Phase 1: Manual testing scenarios (📋 to create)
├── contracts/           # Phase 1: API contracts (📋 to create)
│   ├── admin-gc-api.md        # Endpoints para gestão de GCs
│   ├── admin-lessons-api.md   # Endpoints para séries/lições
│   └── admin-reports-api.md   # Endpoints para relatórios
└── tasks.md             # Phase 2: Task breakdown (⏸️ pending /tasks command)
```

### Source Code (repository root - web project)
```
web/
├── src/
│   ├── app/
│   │   └── (app)/
│   │       └── admin/                     # Área administrativa
│   │           ├── layout.tsx             # ✅ Existente - verifica is_admin
│   │           ├── page.tsx               # ✅ Existente - lista usuários
│   │           │                          # 📋 ATUALIZAR - Dashboard com métricas
│   │           ├── users/                 # ✅ Existente - gestão de usuários
│   │           │   ├── page.tsx
│   │           │   ├── new/page.tsx
│   │           │   └── [id]/page.tsx
│   │           ├── growth-groups/         # 📋 CRIAR - gestão de GCs
│   │           │   ├── page.tsx           # Lista todos os GCs
│   │           │   ├── new/page.tsx       # Criar GC
│   │           │   └── [id]/
│   │           │       ├── page.tsx       # Editar GC
│   │           │       └── multiply/page.tsx  # Multiplicação (wizard)
│   │           ├── lessons/               # 📋 CRIAR - gestão de lições
│   │           │   ├── page.tsx           # Lista séries e lições
│   │           │   ├── new/page.tsx       # Criar lição
│   │           │   ├── [id]/page.tsx      # Editar lição
│   │           │   └── series/
│   │           │       ├── new/page.tsx   # Criar série
│   │           │       └── [id]/page.tsx  # Editar série
│   │           ├── reports/               # 📋 CRIAR - relatórios
│   │           │   ├── page.tsx           # Dashboard de relatórios
│   │           │   ├── growth/page.tsx
│   │           │   ├── attendance/page.tsx
│   │           │   └── conversions/page.tsx
│   │           └── settings/              # 📋 CRIAR - configurações
│   │               └── page.tsx
│   │
│   └── components/
│       ├── admin/                         # Componentes admin existentes
│       │   ├── AdminUserList.tsx          # ✅ Existente
│       │   ├── AdminUserCreateForm.tsx    # ✅ Existente
│       │   ├── AdminUserProfileForm.tsx   # ✅ Existente
│       │   ├── AdminUserAssignments.tsx   # ✅ Existente
│       │   ├── AdminShell.tsx             # 📋 CRIAR - Layout com sidebar
│       │   ├── AdminSidebar.tsx           # 📋 CRIAR - Navegação lateral
│       │   ├── AdminBreadcrumbs.tsx       # 📋 CRIAR - Breadcrumbs
│       │   ├── AdminMetricsCard.tsx       # 📋 CRIAR - Card de métrica
│       │   ├── AdminGrowthGroupList.tsx   # 📋 CRIAR - Lista de GCs
│       │   ├── AdminGrowthGroupForm.tsx   # 📋 CRIAR - Form criar/editar GC
│       │   ├── GCMultiplicationWizard.tsx # 📋 CRIAR - Wizard multiplicação
│       │   ├── AdminSeriesList.tsx        # 📋 CRIAR - Lista de séries
│       │   ├── AdminLessonList.tsx        # 📋 CRIAR - Lista de lições
│       │   └── AdminReportsDashboard.tsx  # 📋 CRIAR - Dashboard relatórios
│       │
│       └── ui/                            # shadcn/ui components (existente)
│
└── supabase/
    └── migrations/
        └── YYYYMMDDHHMMSS_create_gc_multiplication_events.sql  # 📋 CRIAR
```

---

## Phase 0: Research ⏸️ SKIPPED

**Decisão**: Pular Phase 0 - toda infraestrutura necessária já está em uso no projeto:
- Next.js 15.5.5 + React 19.1.0 ✅
- Supabase client ✅
- shadcn/ui components ✅
- Tailwind CSS ✅
- Admin layout com verificação de permissão ✅

**Novas tecnologias** a serem adicionadas (baixa complexidade):
- **Recharts** ou **Chart.js**: Para gráficos em relatórios (bem documentado, fácil integração)
- **@dnd-kit** ou **react-beautiful-dnd**: Para drag-and-drop de lições (APIs simples)
- **date-fns**: Para manipulação de datas em relatórios (já amplamente usado)

Todas são bibliotecas maduras com ótima documentação. Nenhuma pesquisa profunda necessária.

**Output**: `research.md` não será criado. Justificação registrada em Complexity Tracking.

---

## Phase 1: Design Artifacts 🔄 IN PROGRESS

### 1.1 Data Model (`data-model.md`)

**Nova Tabela**: `gc_multiplication_events`

**Esquema**:
```sql
CREATE TABLE gc_multiplication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL,  -- Array de IDs dos novos GCs
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gc_mult_original ON gc_multiplication_events(original_gc_id);
CREATE INDEX idx_gc_mult_user ON gc_multiplication_events(multiplied_by_user_id);
CREATE INDEX idx_gc_mult_date ON gc_multiplication_events(multiplied_at DESC);
```

**Relacionamentos**:
- `original_gc_id` → `growth_groups.id` (many-to-one)
- `new_gc_ids` → array de `growth_groups.id` (many-to-many via array)
- `multiplied_by_user_id` → `users.id` (many-to-one)

**Constraints**:
- `original_gc_id` NOT NULL
- `new_gc_ids` NOT NULL, CHECK (array_length(new_gc_ids, 1) > 0)
- `multiplied_by_user_id` NOT NULL
- `multiplied_at` NOT NULL

**Uso**:
- Auditar eventos de multiplicação
- Rastrear "linhagem" de GCs (qual GC originou quais)
- Relatórios de crescimento orgânico
- Histórico de ações administrativas

**Tabelas Existentes Afetadas**: Nenhuma modificação estrutural. Apenas updates de status:
- `growth_groups.status` → 'multiplying' (temporário) → 'active' ou 'inactive'
- `growth_group_participants.status` → 'transferred' para membros realocados
- `growth_group_participants.left_at` → timestamp quando transferido

### 1.2 API Contracts (`contracts/`)

**Princípio**: Usar Supabase client queries (não REST API customizada). Contratos definem:
- Queries esperadas
- Estrutura de dados retornados
- Validações de input (Zod schemas)

**Arquivos a criar**:

1. **`contracts/admin-gc-queries.md`**:
   - Listar todos os GCs com líderes/supervisores
   - Buscar GC por ID com relacionamentos completos
   - Criar GC + atribuir participantes (transação)
   - Atualizar GC + modificar participantes
   - Multiplicar GC (transação complexa)

2. **`contracts/admin-lessons-queries.md`**:
   - Listar séries com contagem de lições
   - Buscar série com lições ordenadas
   - Criar série + lições (opcional)
   - Atualizar ordem de lições
   - Soft delete série/lição

3. **`contracts/admin-reports-queries.md`**:
   - Métricas agregadas (totais, médias)
   - Crescimento temporal (group by month)
   - Distribuição (group by mode, status)
   - Top N (order by + limit)

### 1.3 Quickstart Scenarios (`quickstart.md`)

**Objetivo**: Cenários de teste manual passo a passo para validar funcionalidades críticas.

**Cenários Planejados**:

1. **Cenário 1: Dashboard Admin**
   - Login como admin
   - Verificar métricas exibidas
   - Clicar em ação rápida "Criar GC"
   - Verificar redirecionamento

2. **Cenário 2: Criar GC**
   - Preencher formulário (nome, modo presencial, líder, supervisor)
   - Submeter
   - Verificar GC criado na listagem
   - Verificar participantes com papéis corretos

3. **Cenário 3: Editar GC**
   - Acessar GC existente
   - Adicionar novo membro
   - Modificar endereço
   - Salvar
   - Verificar mudanças persistidas

4. **Cenário 4: Multiplicar GC**
   - Selecionar GC com 10+ membros
   - Iniciar wizard de multiplicação
   - Definir 2 novos GCs
   - Alocar membros (5 para cada novo, 0 no original)
   - Configurar original como inativo
   - Confirmar
   - Verificar: 2 novos GCs criados, membros transferidos, original inativo, evento registrado

5. **Cenário 5: Gestão de Lições**
   - Criar série "Fundamentos da Fé"
   - Adicionar 3 lições
   - Reordenar lições (drag-and-drop)
   - Verificar ordem atualizada

6. **Cenário 6: Relatórios**
   - Acessar dashboard de relatórios
   - Aplicar filtro "últimos 90 dias"
   - Verificar gráficos carregados
   - Verificar métricas calculadas corretamente

7. **Cenário 7: Segurança**
   - Logout admin
   - Login como usuário não-admin
   - Tentar acessar `/admin`
   - Verificar redirecionamento para `/dashboard`

---

## Phase 1 Deliverables - Summary

**Arquivos a criar**:
- ✅ `data-model.md` - Esquema `gc_multiplication_events` + relacionamentos
- ✅ `contracts/admin-gc-queries.md` - Queries de gestão de GCs
- ✅ `contracts/admin-lessons-queries.md` - Queries de séries/lições
- ✅ `contracts/admin-reports-queries.md` - Queries de relatórios
- ✅ `quickstart.md` - 7 cenários de teste manual

**Migration a criar**:
- SQL para `gc_multiplication_events` (em supabase/migrations/)

---

## Phase 2: Task Generation (Planned for /tasks)

**Abordagem**: Dividir implementação em 7 fases incrementais conforme plano detalhado.

### Estrutura de Tasks

**FASE 1: Fundação e Navegação** (Prioridade ALTA)
- T001: Criar AdminShell component com sidebar
- T002: Criar AdminSidebar com links de navegação
- T003: Criar AdminBreadcrumbs component
- T004: Atualizar `/admin/layout.tsx` para usar AdminShell
- T005: Atualizar `/admin/page.tsx` com dashboard e métricas
- T006: Criar queries para métricas do dashboard
- T007: Criar AdminMetricsCard component
- T008: Testar navegação entre seções

**FASE 2: Gestão de GCs** (Prioridade ALTA)
- T009: Criar migration para `gc_multiplication_events`
- T010: Criar `/admin/growth-groups/page.tsx` - lista
- T011: Criar query complexa para GCs com líderes/supervisores
- T012: Criar AdminGrowthGroupList component com filtros
- T013: Criar AdminGrowthGroupForm component
- T014: Criar `/admin/growth-groups/new/page.tsx`
- T015: Implementar transação de criação de GC + participantes
- T016: Criar `/admin/growth-groups/[id]/page.tsx` - edição
- T017: Implementar seções: Info, Líderes/Supervisores, Membros, Histórico
- T018: Testar CRUD completo de GCs

**FASE 3: Multiplicação** (Prioridade MÉDIA)
- T019: Criar `/admin/growth-groups/[id]/multiply/page.tsx`
- T020: Criar GCMultiplicationWizard component (multi-step)
- T021-T024: Implementar steps 1-4 do wizard
- T025: Implementar transação de multiplicação
- T026: Testar cenários de multiplicação
- T027: Validar registro em `gc_multiplication_events`

**FASE 4: Lições** (Prioridade MÉDIA)
- T028-T035: Páginas e componentes para séries/lições
- T036: Integrar biblioteca drag-and-drop
- T037: Implementar reordenação de lições

**FASE 5: Relatórios** (Prioridade BAIXA)
- T038-T042: Dashboard e relatórios especializados
- T043: Integrar Recharts
- T044: Implementar queries agregadas

**FASE 6: Configurações** (Prioridade BAIXA)
- T045-T047: Página de settings e persistência

**FASE 7: Polimento** (Prioridade BAIXA)
- T048-T053: Loading states, toast notifications, confirmações
- T054: Testes E2E das principais funcionalidades

**Total Estimado**: ~54 tasks distribuídas em 7 fases

**Critérios de Priorização**:
1. **ALTA**: Fases 1-2 formam MVP utilizável (dashboard + gestão de GCs)
2. **MÉDIA**: Fases 3-4 adicionam funcionalidades avançadas
3. **BAIXA**: Fases 5-7 são melhorias e analytics

---

## Implementation Phases (from plan-detailed.md)

### FASE 1: Fundação e Navegação
**Duração**: 2-3h | **Prioridade**: ALTA

**Entregável**: Área admin com navegação funcional e dashboard com métricas básicas

**Componentes**:
- `AdminShell` - Layout com sidebar
- `AdminSidebar` - Navegação lateral com ícones (Shield, Users, Building, BookOpen, BarChart, Settings)
- `AdminBreadcrumbs` - Trilha de navegação
- `AdminMetricsCard` - Cards de métrica reutilizável

**Páginas**:
- `/admin/page.tsx` - Dashboard com 4 cards de métricas + timeline de atividades + ações rápidas

### FASE 2: Gestão de GCs
**Duração**: 4-5h | **Prioridade**: ALTA

**Entregável**: CRUD completo de GCs com gestão de líderes/supervisores/membros

**Componentes**:
- `AdminGrowthGroupList` - Tabela com filtros e ordenação
- `AdminGrowthGroupForm` - Formulário criar/editar

**Páginas**:
- `/admin/growth-groups/page.tsx` - Lista
- `/admin/growth-groups/new/page.tsx` - Criar
- `/admin/growth-groups/[id]/page.tsx` - Editar (5 seções)

**Query Complexa**:
```typescript
const { data: gcs } = await supabase
  .from('growth_groups')
  .select(`
    id, name, mode, status, created_at, weekday, time,
    growth_group_participants!inner (
      id, role, status,
      people (id, name, email, phone)
    ),
    meetings (id, datetime)
  `)
  .order('name');

// Processar para agrupar líderes, supervisores, membros
```

### FASE 3: Multiplicação de GCs
**Duração**: 4-6h | **Prioridade**: MÉDIA

**Entregável**: Processo completo de multiplicação com wizard e auditoria

**Componentes**:
- `GCMultiplicationWizard` - Wizard 4 steps com estado compartilhado
- `MemberAllocationInterface` - UI drag-and-drop ou selects para alocar membros

**Página**:
- `/admin/growth-groups/[id]/multiply/page.tsx`

**Transação Crítica**:
```typescript
// 1. Update original GC status
// 2. Create new GCs
// 3. Transfer members (update status to 'transferred')
// 4. Create participants in new GCs
// 5. Insert gc_multiplication_event
// 6. Finalize original GC status
// ROLLBACK se qualquer etapa falhar
```

### FASE 4: Gestão de Lições
**Duração**: 3-4h | **Prioridade**: MÉDIA

**Entregável**: CRUD de séries/lições com reordenação

**Componentes**:
- `AdminSeriesList` - Lista de séries
- `AdminLessonList` - Lista de lições com drag-and-drop
- `SeriesForm`, `LessonForm`

**Páginas**:
- `/admin/lessons/page.tsx`
- `/admin/lessons/series/new`, `/admin/lessons/series/[id]`
- `/admin/lessons/new`, `/admin/lessons/[id]`

### FASE 5: Relatórios
**Duração**: 4-5h | **Prioridade**: BAIXA

**Entregável**: Dashboard de analytics com gráficos

**Componentes**:
- `AdminReportsDashboard` - Gráficos Recharts
- `GrowthChart`, `DistributionChart`, `TopGCsChart`

**Páginas**:
- `/admin/reports/page.tsx` - Dashboard
- `/admin/reports/growth`, `/attendance`, `/conversions`

### FASE 6: Configurações
**Duração**: 2-3h | **Prioridade**: BAIXA

**Entregável**: Interface de settings persistida em `config` table

**Página**:
- `/admin/settings/page.tsx` com form de configurações

### FASE 7: Polimento
**Duração**: 2-3h | **Prioridade**: BAIXA

**Melhorias**:
- Loading states (Spinner component)
- Toast notifications (sucesso/erro)
- Confirmações (Dialog para ações destrutivas)
- Responsividade (sidebar colapsável)
- Paginação (listas > 50 itens)

---

## Complexity Tracking

### Expected Complexity
- **Multiplicação de GCs**: Alto - wizard multi-step + transação atômica complexa
- **Queries de relatórios**: Médio - agregações e joins, mas Supabase facilita
- **Drag-and-drop de lições**: Baixo - bibliotecas maduras existem
- **Navegação admin**: Baixo - padrão common de sidebar

### Actual Complexity (to be filled during implementation)
- TBD

### Deviations from Plan
1. **Research phase skipped**: Justificação - infraestrutura já conhecida e em uso
2. **TDD deferred to v2.0**: Justificação - área admin de uso restrito, priorizamos MVP com testes manuais

### Performance Considerations
- **Listagem de GCs**: Query pode ser lenta com 100+ GCs. Mitigação: adicionar índices, paginação.
- **Relatórios**: Agregações em tabelas grandes (1000+ membros). Mitigação: limitar período padrão, usar materialized views futuro.
- **Multiplicação**: Transação com múltiplos inserts. Mitigação: usar batch inserts do Supabase.

---

## Progress Tracking

### Phase 0: Research
- [x] Decision: SKIP - infraestrutura conhecida
- [x] Justification documented

### Phase 1: Design Artifacts
- [x] `plan.md` structure created
- [x] `plan-detailed.md` migrated from standalone plan
- [x] `data-model.md` - CREATED
- [x] `contracts/README.md` - CREATED (consolidado)
- [x] `quickstart.md` - CREATED

### Phase 1: Constitution Re-check
- [x] COMPLETED - All principles still satisfied:
  - Spec-driven: ✅ spec.md completo com 51 requirements
  - Plan before code: ✅ Este plano completo antes de implementação
  - TDD: ⚠️ Deferred com mitigação (quickstart manual, Zod validation)
  - Traceability: ✅ Spec → Plan → (Tasks pendente) → Code
  - Operational: ✅ Soft delete, auditoria, error handling
  - Language: ✅ Docs pt-BR, code/schema English

### Phase 2: Task Generation
- [ ] PENDING - executar `/tasks` após Phase 1 completa

### Implementation Phases (future)
- [ ] FASE 1: Fundação (2-3h)
- [ ] FASE 2: GCs (4-5h)
- [ ] FASE 3: Multiplicação (4-6h)
- [ ] FASE 4: Lições (3-4h)
- [ ] FASE 5: Relatórios (4-5h)
- [ ] FASE 6: Configurações (2-3h)
- [ ] FASE 7: Polimento (2-3h)

---

## Next Steps

**Immediate Actions** (para completar Phase 1):

1. ✅ **Criar `data-model.md`** com esquema `gc_multiplication_events` detalhado
2. ✅ **Criar `contracts/admin-gc-queries.md`** com queries de GCs
3. ✅ **Criar `contracts/admin-lessons-queries.md`** com queries de lições
4. ✅ **Criar `contracts/admin-reports-queries.md`** com queries de relatórios
5. ✅ **Criar `quickstart.md`** com 7 cenários de teste manual
6. ✅ **Re-avaliar Constitution Check** após artifacts criados
7. ✅ **Executar `/tasks`** para gerar tasks.md

**Then**:
8. Começar implementação pela FASE 1 (Fundação)
9. Incrementar fase a fase, testando antes de prosseguir

---

## Dependencies

### External
- Recharts ou Chart.js (gráficos) - instalar via `npm install recharts`
- @dnd-kit (drag-and-drop) - instalar via `npm install @dnd-kit/core @dnd-kit/sortable`
- date-fns (datas) - já deve estar instalado

### Internal
- Admin layout existente (`/admin/layout.tsx`)
- Componentes shadcn/ui existentes
- RLS policies com `is_admin` support
- Tabelas: `growth_groups`, `growth_group_participants`, `lesson_series`, `lessons`, `config`

### Migration Dependencies
- Criar `gc_multiplication_events` ANTES de implementar FASE 3

---

## Risk Mitigation

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Transação de multiplicação falha parcialmente | Médio | Alto | Usar transações atômicas, testes extensivos, rollback automático |
| Performance de queries complexas | Médio | Médio | Índices no banco, paginação, período limitado em relatórios |
| Biblioteca drag-and-drop incompatível com Next.js 15 | Baixo | Médio | Verificar compatibilidade antes de instalar, ter alternativa (@dnd-kit é bem mantido) |
| Admin acidentalmente deleta dados críticos | Baixo | Alto | Soft delete apenas, confirmações para ações destrutivas, auditoria |

---

## Acceptance Criteria (from spec.md)

- [ ] Dashboard admin exibe métricas corretas (totais de usuários, GCs, membros, visitantes)
- [ ] Criação de GC com líder + supervisor funciona corretamente
- [ ] Edição de GC permite adicionar/remover membros e atualiza dados
- [ ] Multiplicação de GC cria novos GCs, transfere membros, atualiza status original, registra evento
- [ ] Tabela `gc_multiplication_events` contém todos os dados de auditoria
- [ ] Gestão de séries/lições permite CRUD completo
- [ ] Reordenação de lições atualiza campo `order_in_series` corretamente
- [ ] Relatórios exibem dados corretos com filtros de período funcionais
- [ ] Sidebar de navegação funciona em desktop e mobile (colapsável)
- [ ] Usuários não-admins são bloqueados de acessar `/admin` (redirect para `/dashboard`)

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Constitution Reference**: v1.2.0
