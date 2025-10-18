# Implementation Plan: Atualização de Navegação e Identidade Visual

**Branch**: `003-vamos-ajustar-a` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-vamos-ajustar-a/spec.md`
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Project Type: web (Next.js 15.5.5 + React 19)
   → ⚠️ 3 low-priority clarifications deferred (typography, performance, exact colors)
3. Fill the Constitution Check section
   → ✅ All constitutional principles applicable
4. Evaluate Constitution Check section
   → ✅ No violations - UI/visual update only
   → ✅ Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → ✅ Completed (design system research)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ Completed (UI contracts, manual test scenarios)
7. Re-evaluate Constitution Check section
   → ✅ No new violations
   → ✅ Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach described
9. ✅ STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Atualização da identidade visual da aplicação web para refletir a marca "Igreja Monte Carmelo", incluindo novo logo (IMG_4121.PNG - teal circular com texto cinza), paleta de cores teal (#17a2b8) e cinza, e reestruturação do dashboard principal com navegação baseada em cards (GC, Eventos, Lições, Membros). O dashboard atual de listagem de GCs torna-se uma página específica acessada via card.

**Abordagem Técnica**: Atualização de componentes UI existentes (login, header, dashboard) utilizando Tailwind CSS para cores, criação de novos componentes de cards de navegação com ícones Lucide React, e reorganização de rotas Next.js App Router para nova estrutura de navegação. Sem alterações de banco de dados ou backend.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15.5.5, React 19.1.0
**Primary Dependencies**: Next.js, React, Tailwind CSS 3.4.18, Lucide React (ícones), Supabase client (auth apenas), shadcn/ui components
**Storage**: N/A (feature visual apenas - sem mudanças de dados)
**Testing**: Vitest (component tests), Playwright (E2E visual regression), Storybook (component showcase)
**Target Platform**: Web browsers (modern), responsive 320px-4K
**Project Type**: web (frontend Next.js App Router)
**Performance Goals**: <100ms First Paint para dashboard (otimizado para 375px+)
**Constraints**:
- Largura mínima suportada: 320px
- Sem requisitos formais WCAG (alt text obrigatório, legibilidade razoável)
- Inspiração no protótipo sem cópia exata
- Web React apenas (Flutter não afetado)

**Scale/Scope**:
- 4 páginas principais afetadas: login, dashboard home (nova), GCs list (movida), header global
- ~8-10 componentes UI (novos + modificados)
- Assets: 1 logo PNG principal (IMG_4121.PNG)

**Deferred Clarifications** (baixa prioridade, decidíveis durante implementação):
- FR-011: Tipografia específica (usar sistema default Next.js/Tailwind)
- NFR-003: Performance exata (usar padrões web Next.js)
- FR-002: Valor exato teal (usar #17a2b8 do protótipo)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Specification-Driven Delivery
✅ **PASS** - Feature spec aprovada em `spec.md` com 5 clarificações críticas resolvidas via `/clarify`. Clarificações deferred são não-bloqueantes.

### Principle II: Plan Before Implementation
✅ **PASS** - Este documento (`plan.md`) referencia Constitution v1.2.0 e estabelece contratos visuais antes de tasks.

### Principle III: Test-Driven Delivery
✅ **PASS** - Estratégia:
- **Contract tests**: N/A (sem APIs alteradas)
- **Integration tests**: Testes E2E Playwright para fluxos visuais (login → dashboard → navegação)
- **Unit tests**: Testes de componentes Vitest para novos cards, header
- **Quickstart**: Validação manual dos 4 cenários de aceitação da spec

### Principle IV: Traceable Artifacts & Documentation
✅ **PASS** - Artefatos gerados:
- `research.md`: Decisões de design system
- `quickstart.md`: Cenários de validação manual
- `contracts/`: UI contracts (component props, layout specs)
- Tasks criados em `tasks.md` pelo comando `/tasks`

### Principle V: Operational Readiness & Observability
✅ **PASS** (simplified) - Feature visual apenas:
- **Logging**: Não aplicável (sem backend)
- **Metrics**: Não aplicável (sem lógica de negócio)
- **Rollback**: Git revert simples (sem migração de dados)
- **Failure modes**: Logo fallback (texto), responsive graceful degradation

### Principle VI: Language Standards
✅ **PASS** -
- **Documentação (pt-BR)**: spec.md, plan.md, research.md, quickstart.md, tasks.md
- **Código (English)**: Componentes React, CSS classes, file names, props
- **Comentários (pt-BR)**: Para clareza com desenvolvedores brasileiros
- **Commits (English)**: Seguindo convenção da indústria

**Constitution Version**: 1.2.0

## Project Structure

### Documentation (this feature)
```
specs/003-vamos-ajustar-a/
├── spec.md              # Feature specification (approved)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── ui-components.md # Component contracts (props, behavior)
│   └── layout-specs.md  # Layout and spacing specs
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

**Note**: `data-model.md` omitido (sem entidades de dados nesta feature)

### Source Code (repository root)

```
web/
├── public/
│   └── logo/                    # [NEW] Logo assets
│       └── igreja-monte-carmelo.png
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx     # [MODIFIED] Atualizar logo + cores
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx       # [MODIFIED] Header global com novo branding
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # [NEW] Dashboard principal com cards
│   │   │   │
│   │   │   ├── gc/
│   │   │   │   └── page.tsx     # [MODIFIED] Renomear de /dashboard, ajustar branding
│   │   │   │
│   │   │   ├── eventos/
│   │   │   │   └── page.tsx     # [MODIFIED] Ajustar header branding
│   │   │   │
│   │   │   ├── licoes/
│   │   │   │   └── page.tsx     # [MODIFIED] Ajustar header branding
│   │   │   │
│   │   │   └── membros/
│   │   │       └── page.tsx     # [MODIFIED] Ajustar header branding
│   │   │
│   │   └── globals.css          # [MODIFIED] Atualizar CSS vars cores teal/cinza
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (existing)
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx       # [NEW] Header global com logo + "Igreja Monte Carmelo"
│   │   │   └── Logo.tsx         # [NEW] Component logo com fallback
│   │   │
│   │   └── dashboard/
│   │       ├── NavigationCard.tsx  # [NEW] Card navegação reutilizável
│   │       └── DashboardGrid.tsx   # [NEW] Grid 2x2 cards responsivo
│   │
│   └── lib/
│       └── constants/
│           └── branding.ts      # [NEW] Cores, logo paths, alt texts
│
└── tests/
    ├── e2e/
    │   └── branding.spec.ts     # [NEW] Testes visuais de navegação
    │
    └── unit/
        └── components/
            ├── Logo.test.tsx    # [NEW] Testes logo + fallback
            └── NavigationCard.test.tsx  # [NEW] Testes card navegação
```

**Structure Decision**: Web application (Option 2) - Frontend Next.js apenas. Feature não requer alterações de backend/API. Estrutura existente `web/src/app` (App Router) será modificada com novos componentes e páginas reorganizadas.

## Phase 0: Outline & Research

### Decisões de Pesquisa

1. **Design System Integration**
   - **Decisão**: Utilizar Tailwind CSS + shadcn/ui existentes
   - **Rationale**: Projeto já possui setup completo Tailwind + componentes shadcn/ui. Consistência com código existente.
   - **Alternativas consideradas**:
     - Material UI (rejected: overhead, conflito com Tailwind)
     - Styled Components (rejected: migração complexa)

2. **Icon Library**
   - **Decisão**: Lucide React (já instalado)
   - **Rationale**: Biblioteca já presente em `package.json`, leve, tree-shakeable
   - **Ícones mapeados**:
     - GC: `Users` icon
     - Eventos: `Calendar` icon
     - Lições: `BookOpen` icon
     - Membros: `UserCheck` icon

3. **Logo Asset Management**
   - **Decisão**: PNG estática em `public/logo/` com Next.js Image optimization
   - **Rationale**:
     - IMG_4121.PNG já disponível em refs/assets
     - Next.js Image otimiza automaticamente (lazy load, responsive)
     - Fallback via error handling nativo
   - **Alternativas consideradas**:
     - SVG inline (rejected: PNG fornecida, não precisamos edição)
     - CDN externa (rejected: simplicidade, sem dependência externa)

4. **Color Palette Implementation**
   - **Decisão**: Tailwind custom colors via `tailwind.config.ts`
   - **Rationale**: Centraliza cores, autocomplete IDE, design tokens
   - **Config**:
     ```typescript
     colors: {
       primary: {
         DEFAULT: '#17a2b8', // teal
         foreground: '#ffffff'
       },
       'text-dark': '#5a5a5a',
       'text-light': '#999999'
     }
     ```

5. **Responsive Strategy**
   - **Decisão**: Mobile-first Tailwind breakpoints
   - **Rationale**: Suporte 320px mínimo requer mobile-first
   - **Breakpoints**:
     - `sm` (640px): Ajuste espaçamentos
     - `md` (768px): Grid 2x2 cards
     - `lg` (1024px): Layout desktop completo

6. **Typography** (deferred clarification FR-011)
   - **Decisão**: Sistema default Next.js (Inter via font optimization)
   - **Rationale**: Inter já configurada, excelente legibilidade, não especificado na spec

**Output**: `research.md` com detalhamento completo

## Phase 1: Design & Contracts

### 1. Data Model
**N/A** - Feature visual apenas, sem entidades de dados. Arquivo `data-model.md` **não será criado**.

### 2. UI Component Contracts

**Output**: `contracts/ui-components.md`

#### Logo Component
```typescript
interface LogoProps {
  variant?: 'default' | 'compact';
  className?: string;
}
// Behavior: Exibe IMG_4121.PNG, fallback para <h1>Igreja Monte Carmelo</h1>
// Alt text: "Igreja Monte Carmelo - Grupos de Crescimento"
```

#### NavigationCard Component
```typescript
interface NavigationCardProps {
  title: string;           // "GC" | "Eventos" | "Lições" | "Membros"
  icon: LucideIcon;        // Users | Calendar | BookOpen | UserCheck
  href: string;            // "/gc" | "/eventos" | "/licoes" | "/membros"
  description?: string;    // Texto descritivo opcional
}
// Behavior: Link clicável, hover states, responsivo
```

#### Header Component
```typescript
interface HeaderProps {
  showSubtitle?: boolean;  // Default true - "Grupos de Crescimento"
}
// Behavior: Logo + text, sticky top, presente em todas páginas autenticadas
```

**Output**: `contracts/layout-specs.md`

#### Dashboard Grid Layout
- **Desktop (>= 768px)**: Grid 2x2 (4 cards)
- **Mobile (< 768px)**: Stack vertical (4 cards)
- **Spacing**: gap-6 (24px)
- **Card size**: min-height 200px desktop, 150px mobile
- **Heading**: "Bem-vindo" + nome usuário (se disponível)

#### Color Usage Specification
- **Teal (#17a2b8)**: Botões primários, logo, hover states, links
- **Gray dark (#5a5a5a)**: Headings
- **Gray light (#999999)**: Body text, descriptions
- **White (#ffffff)**: Backgrounds, card content
- **Borders**: gray-200 (existing Tailwind)

### 3. Contract Tests
**N/A** - Sem endpoints API alterados. Testes visuais em E2E.

### 4. Integration Test Scenarios

**Output**: `tests/e2e/branding.spec.ts` (failing inicialmente)

```typescript
test.describe('Visual Identity & Navigation', () => {
  test('AS-001: Login page displays logo and teal colors', async ({ page }) => {
    // Given: User accesses login
    // When: Page loads
    // Then: Logo visible, teal buttons, proper alt text
  });

  test('AS-002: Authenticated dashboard shows cards and branding', async ({ page }) => {
    // Given: User logged in
    // When: Accesses /dashboard
    // Then: Header with logo + subtitle, 4 cards visible (GC, Eventos, Lições, Membros)
  });

  test('AS-003: Responsive behavior on mobile', async ({ page }) => {
    // Given: Viewport 375px
    // When: Navigate dashboard
    // Then: Cards stack vertically, text readable, spacing adequate
  });

  test('AS-004: Navigation consistency across pages', async ({ page }) => {
    // Given: User on /gc
    // When: Navigate to /eventos, /licoes, /membros
    // Then: Header branding consistent, logo always visible
  });

  test('EDGE: Logo fallback when image fails', async ({ page }) => {
    // Given: Logo image blocked
    // When: Page loads
    // Then: Text "Igreja Monte Carmelo" displays
  });
});
```

### 5. Quickstart Manual Test Scenarios

**Output**: `quickstart.md`

```markdown
# Quickstart: Validação Manual da Identidade Visual

## Pré-requisitos
- Aplicação web rodando (`npm run dev`)
- Usuário de teste autenticado

## Cenário 1: Logo e Cores na Login
1. Acessar `/login` (logout se necessário)
2. **Verificar**: Logo circular teal centralizado
3. **Verificar**: Botão "Entrar" cor teal (#17a2b8)
4. **Verificar**: Textos em cinza (#5a5a5a headings, #999999 body)
5. **Verificar**: Alt text inspecionando elemento `<img>`

## Cenário 2: Dashboard com Cards
1. Login bem-sucedido
2. **Verificar**: URL redireciona para `/dashboard`
3. **Verificar**: Header com logo + "Igreja Monte Carmelo" + "Grupos de Crescimento"
4. **Verificar**: Mensagem "Bem-vindo"
5. **Verificar**: 4 cards visíveis: GC (ícone Users), Eventos (Calendar), Lições (BookOpen), Membros (UserCheck)
6. **Clicar**: Card "GC" → redireciona para `/gc` (antiga home de GCs)

## Cenário 3: Responsividade Mobile
1. Abrir DevTools, viewport 375px
2. **Verificar**: Cards empilhados verticalmente
3. **Verificar**: Textos legíveis, sem overflow
4. Reduzir para 320px
5. **Verificar**: Interface ainda utilizável (fontes menores aceitável)

## Cenário 4: Consistência entre Páginas
1. Navegar: /dashboard → /gc → /eventos → /licoes → /membros
2. **Verificar**: Header sempre presente com branding
3. **Verificar**: Logo não muda entre páginas

## Edge Case: Fallback Logo
1. DevTools → Network → Block `igreja-monte-carmelo.png`
2. Recarregar página
3. **Verificar**: Texto "Igreja Monte Carmelo" aparece em lugar do logo
```

### 6. Agent Context Update

**Executar**: `.specify/scripts/bash/update-agent-context.sh`

**Adições ao CLAUDE.md**:
- Active Technologies: Tailwind CSS 3.4.18, Lucide React, Next.js Image
- Project Structure: `web/public/logo/`, `web/src/components/layout/`, `web/src/components/dashboard/`
- Recent Changes: "003-vamos-ajustar-a: Visual identity update - teal branding, card-based dashboard navigation"

**Output**: CLAUDE.md atualizado incrementalmente

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Asset preparation** [P]:
   - T001: Copiar IMG_4121.PNG para `web/public/logo/igreja-monte-carmelo.png`

2. **Design tokens** [P]:
   - T002: Atualizar `tailwind.config.ts` com cores teal/cinza
   - T003: Criar `src/lib/constants/branding.ts` (logo paths, alt texts)

3. **Base components** (ordem de dependência):
   - T004: Criar `Logo.tsx` component com fallback [P]
   - T005: Escrever testes `Logo.test.tsx` **antes** de T004
   - T006: Criar `NavigationCard.tsx` component [P]
   - T007: Escrever testes `NavigationCard.test.tsx` **antes** de T006
   - T008: Criar `DashboardGrid.tsx` layout component

4. **Page updates** (após components prontos):
   - T009: Criar nova página `/app/(app)/dashboard/page.tsx` com cards
   - T010: Modificar `/app/(auth)/login/page.tsx` (logo + cores)
   - T011: Criar `Header.tsx` global component
   - T012: Modificar `/app/(app)/layout.tsx` (integrar Header)
   - T013: Mover `/app/dashboard/page.tsx` para `/app/(app)/gc/page.tsx`
   - T014: Atualizar navegação em páginas `/eventos`, `/licoes`, `/membros`

5. **Styling** [P]:
   - T015: Atualizar `globals.css` (CSS vars se necessário)

6. **Testing** (após implementação):
   - T016: Escrever E2E tests `branding.spec.ts` (5 cenários)
   - T017: Executar testes E2E, verificar falhas iniciais
   - T018: Corrigir até testes passarem

7. **Manual validation**:
   - T019: Executar quickstart.md end-to-end
   - T020: Validar responsividade 320px-1920px
   - T021: Verificar logo fallback

8. **Cleanup**:
   - T022: Lint check (`npm run lint:fix`)
   - T023: Type check (`npm run type-check`)
   - T024: Build verification (`npm run build`)

**Ordering Strategy**:
- **TDD order**: Tests T005, T007 antes de implementation T004, T006
- **Dependency order**: Tokens (T002-T003) → Components (T004-T008) → Pages (T009-T014) → Tests (T016-T018)
- **[P] markers**: T001, T002, T003, T004+T005, T006+T007 são paralelos (arquivos independentes)

**Estimated Output**: 24 tasks numeradas em `tasks.md`

**IMPORTANT**: Este planejamento será executado pelo comando `/tasks`, NÃO por `/plan`

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD principles)
**Phase 5**: Validation (E2E tests pass, quickstart scenarios validated, build successful)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**Nenhuma violação detectada.** Feature puramente visual, sem complexidade arquitetural.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All critical NEEDS CLARIFICATION resolved (3 deferred are low-priority)
- [x] Complexity deviations documented (none)

**Artifacts Generated**:
- [x] research.md
- [x] contracts/ui-components.md
- [x] contracts/layout-specs.md
- [x] quickstart.md
- [x] CLAUDE.md updated
- [ ] tasks.md (awaiting /tasks command)

---
*Based on Constitution v1.2.0 - See `.specify/memory/constitution.md`*
