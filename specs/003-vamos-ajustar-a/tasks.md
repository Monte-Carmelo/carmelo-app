# Tasks: Atualização de Navegação e Identidade Visual

**Input**: Design documents from `/specs/003-vamos-ajustar-a/`
**Prerequisites**: plan.md (✅), research.md (✅), contracts/ (✅ ui-components.md, layout-specs.md), quickstart.md (✅)
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI
**Branch**: `003-vamos-ajustar-a`

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Loaded: Tech stack TypeScript 5.x + Next.js 15.5.5 + React 19.1.0
   → ✅ Structure: web/ (frontend Next.js App Router)
2. Load optional design documents:
   → ✅ research.md: 6 design decisions (Tailwind, Lucide, colors, responsive)
   → ✅ contracts/ui-components.md: 4 components (Logo, NavigationCard, DashboardGrid, Header)
   → ✅ contracts/layout-specs.md: Colors, typography, spacing, responsive breakpoints
   → ✅ quickstart.md: 4 manual scenarios + 1 edge case
   → ⚠️ data-model.md: N/A (feature visual apenas)
3. Generate tasks by category:
   → Setup: Asset preparation, Tailwind config, constants
   → Tests (TDD): Unit tests antes de components, E2E após implementation
   → Core: React components (Logo, NavigationCard, DashboardGrid, Header)
   → Integration: Page modifications (dashboard, login, layout)
   → Polish: Lint, type-check, build, manual validation
4. Apply task rules:
   → [P] different files: T001-T003, T005-T006, T008-T009
   → Sequential same file: T011-T012 (layout.tsx), T015-T020 (integration)
   → TDD order: Unit tests (T005, T008) → Implementation (T006, T009)
5. Number tasks sequentially (T001-T027)
6. ✅ Dependency graph generated
7. ✅ Parallel execution examples included
8. Validate task completeness:
   → ✅ Contracts UI components have implementation tasks
   → ✅ Quickstart scenarios have E2E + manual tests
   → ✅ Tests before implementation (TDD)
9. ✅ SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- Incluir caminhos exatos de arquivos nas descrições

## Path Conventions
Este projeto segue estrutura **Web application**:
- `web/public/` - Assets estáticos
- `web/src/app/` - Next.js App Router pages
- `web/src/components/` - React components
- `web/src/lib/` - Utilities e constants
- `web/tests/` - Testes (unit/, e2e/)

---

## Phase 3.1: Setup & Assets

### T001 [P] Copiar logo para public directory
**Arquivo**: `web/public/logo/igreja-monte-carmelo.png`
**Descrição**: Copiar arquivo `refs/assets/IMG_4121.PNG` para `web/public/logo/igreja-monte-carmelo.png`. Criar diretório `web/public/logo/` se não existir.
**Comandos**:
```bash
mkdir -p web/public/logo
cp refs/assets/IMG_4121.PNG web/public/logo/igreja-monte-carmelo.png
```
**Critérios de Aceitação**:
- [x] Arquivo PNG copiado com sucesso
- [x] Caminho final: `web/public/logo/igreja-monte-carmelo.png`
- [x] Imagem legível (verificar não corrompeu)

---

### T002 [P] Configurar cores customizadas no Tailwind
**Arquivo**: `web/tailwind.config.ts`
**Descrição**: Adicionar cores customizadas da marca Igreja Monte Carmelo no `extend.colors` do Tailwind config:
- `primary.DEFAULT`: `#17a2b8` (teal)
- `primary.foreground`: `#ffffff`
- `text-dark`: `#5a5a5a` (headings)
- `text-light`: `#999999` (body text)

**Config a adicionar**:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#17a2b8',
          foreground: '#ffffff'
        },
        'text-dark': '#5a5a5a',
        'text-light': '#999999',
      }
    }
  }
}
```
**Critérios de Aceitação**:
- [x] Cores adicionadas ao `extend.colors`
- [x] Build Next.js não quebra (`npm run build` funciona)
- [x] Autocomplete IDE funciona para `bg-primary`, `text-text-dark`

---

### T003 [P] Criar constants de branding
**Arquivo**: `web/src/lib/constants/branding.ts`
**Descrição**: Criar arquivo com constants de branding (logo paths, alt texts, colors). Criar diretório `web/src/lib/constants/` se não existir.

**Conteúdo**:
```typescript
export const BRANDING = {
  logo: {
    path: '/logo/igreja-monte-carmelo.png',
    altText: 'Igreja Monte Carmelo - Grupos de Crescimento',
    fallbackText: 'Igreja Monte Carmelo',
  },
  church: {
    name: 'Igreja Monte Carmelo',
    subtitle: 'Grupos de Crescimento',
  },
  colors: {
    primary: '#17a2b8',
    textDark: '#5a5a5a',
    textLight: '#999999',
  },
} as const;
```

**Critérios de Aceitação**:
- [x] Arquivo criado em `web/src/lib/constants/branding.ts`
- [x] Exporta objeto `BRANDING` tipado
- [x] Type-check passa (`npm run type-check`)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: Estes testes DEVEM ser escritos e DEVEM FALHAR antes de qualquer implementação**

### T004 Criar diretório para testes de componentes
**Arquivo**: `web/tests/unit/components/` (diretório)
**Descrição**: Criar estrutura de diretórios para testes unitários de componentes.
**Comandos**:
```bash
mkdir -p web/tests/unit/components
```
**Critérios de Aceitação**:
- [x] Diretório `web/tests/unit/components/` existe

---

### T005 [P] Teste unitário: Logo component
**Arquivo**: `web/tests/unit/components/Logo.test.tsx`
**Descrição**: Escrever testes unitários para Logo component **antes** de implementar. Testes DEVEM FALHAR inicialmente (component não existe).

**Casos de teste**:
1. Renderiza imagem com alt text correto
2. Aplica className customizado
3. Mostra texto fallback quando imagem falha (fireEvent.error)

**Exemplo de estrutura**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Logo } from '@/components/layout/Logo';

describe('Logo Component', () => {
  it('renders image with correct alt text', () => {
    render(<Logo />);
    const img = screen.getByAltText(/igreja monte carmelo/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('igreja-monte-carmelo.png'));
  });

  it('shows fallback text when image fails', async () => {
    render(<Logo />);
    const img = screen.getByAltText(/igreja monte carmelo/i);
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('Igreja Monte Carmelo')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<Logo className="h-24" />);
    expect(container.firstChild).toHaveClass('h-24');
  });
});
```

**Critérios de Aceitação**:
- [x] Arquivo `Logo.test.tsx` criado
- [x] 3 testes escritos (render, fallback, className)
- [x] **Testes FALHAM** ao rodar `npm run test` (Logo component não existe)

---

### T006 [P] Implementar Logo component
**Arquivo**: `web/src/components/layout/Logo.tsx`
**Descrição**: Implementar component Logo conforme contract em `contracts/ui-components.md`. Criar diretório `web/src/components/layout/` se não existir.

**Interface**:
```typescript
interface LogoProps {
  variant?: 'default' | 'compact';
  className?: string;
}
```

**Comportamento**:
- Renderiza `<Image>` Next.js com src do BRANDING constant
- Alt text: "Igreja Monte Carmelo - Grupos de Crescimento"
- `onError`: esconde Image, mostra `<h1>` com fallback text
- Dimensões default: width={180} height={60}

**Critérios de Aceitação**:
- [x] Component implementado em `web/src/components/layout/Logo.tsx`
- [x] **Testes T005 PASSAM** após implementação
- [x] Type-check passa
- [x] Component renderiza sem erros no dev server

---

### T007 Criar diretório para componentes dashboard
**Arquivo**: `web/src/components/dashboard/` (diretório)
**Descrição**: Criar diretório para componentes de navegação dashboard.
**Comandos**:
```bash
mkdir -p web/src/components/dashboard
```
**Critérios de Aceitação**:
- [ ] Diretório `web/src/components/dashboard/` existe

---

### T008 [P] Teste unitário: NavigationCard component
**Arquivo**: `web/tests/unit/components/NavigationCard.test.tsx`
**Descrição**: Escrever testes unitários para NavigationCard **antes** de implementar. Testes DEVEM FALHAR.

**Casos de teste**:
1. Renderiza title e icon
2. Link tem href correto
3. Exibe description quando fornecido

**Exemplo**:
```typescript
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { NavigationCard } from '@/components/dashboard/NavigationCard';

describe('NavigationCard Component', () => {
  it('renders title and icon', () => {
    render(<NavigationCard title="GC" icon={Users} href="/gc" />);
    expect(screen.getByText('GC')).toBeInTheDocument();
    // Icon rendered (check svg presence)
  });

  it('navigates to href on click', () => {
    render(<NavigationCard title="GC" icon={Users} href="/gc" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/gc');
  });

  it('displays description when provided', () => {
    render(
      <NavigationCard
        title="GC"
        icon={Users}
        href="/gc"
        description="Gerencie grupos"
      />
    );
    expect(screen.getByText('Gerencie grupos')).toBeInTheDocument();
  });
});
```

**Critérios de Aceitação**:
- [ ] Arquivo `NavigationCard.test.tsx` criado
- [ ] 3 testes escritos
- [ ] **Testes FALHAM** (component não existe)

---

### T009 [P] Implementar NavigationCard component
**Arquivo**: `web/src/components/dashboard/NavigationCard.tsx`
**Descrição**: Implementar component NavigationCard conforme contract.

**Interface**:
```typescript
interface NavigationCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  description?: string;
}
```

**Comportamento**:
- `<Link>` Next.js wrapping `<Card>` shadcn/ui
- Ícone centralizado (48x48px mobile, 64x64px desktop)
- Hover: shadow-lg, icon scale 1.05
- Min-height: 150px mobile, 200px desktop

**Critérios de Aceitação**:
- [ ] Component implementado
- [ ] **Testes T008 PASSAM**
- [ ] Hover states funcionais
- [ ] Responsivo (min-height correto)

---

### T010 Implementar DashboardGrid component
**Arquivo**: `web/src/components/dashboard/DashboardGrid.tsx`
**Descrição**: Criar component container para grid 2x2 de NavigationCards.

**Interface**:
```typescript
interface DashboardGridProps {
  items: Array<{
    title: string;
    icon: LucideIcon;
    href: string;
    description?: string;
  }>;
}
```

**Layout**:
- Mobile (< 768px): `flex flex-col gap-4`
- Desktop (>= 768px): `grid grid-cols-2 gap-6 md:max-w-4xl`

**Critérios de Aceitação**:
- [ ] Component criado
- [ ] Map sobre `items`, renderiza `<NavigationCard>`
- [ ] Responsivo (flex mobile, grid desktop)
- [ ] Type-check passa

---

### T011 Implementar Header component
**Arquivo**: `web/src/components/layout/Header.tsx`
**Descrição**: Criar Header global com logo + texto "Igreja Monte Carmelo" + subtítulo.

**Interface**:
```typescript
interface HeaderProps {
  showSubtitle?: boolean; // default true
}
```

**Layout**:
```tsx
<header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
  <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6 md:py-4">
    <Logo className="h-12 md:h-16" />
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-text-dark md:text-xl">
        {BRANDING.church.name}
      </span>
      {showSubtitle && (
        <span className="text-sm text-text-light md:text-base">
          {BRANDING.church.subtitle}
        </span>
      )}
    </div>
  </div>
</header>
```

**Critérios de Aceitação**:
- [ ] Header implementado
- [ ] Sticky top (z-50)
- [ ] Logo + texto renderizados
- [ ] Subtítulo condicional funciona

---

## Phase 3.3: Page Implementation

### T012 Criar nova página dashboard home
**Arquivo**: `web/src/app/(app)/dashboard/page.tsx`
**Descrição**: Criar nova página `/dashboard` com cards de navegação (GC, Eventos, Lições, Membros). Criar diretório `web/src/app/(app)/dashboard/` se não existir.

**Conteúdo**:
```tsx
import { Users, Calendar, BookOpen, UserCheck } from 'lucide-react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export default function DashboardPage() {
  const navigationItems = [
    { title: 'GC', icon: Users, href: '/gc', description: 'Grupos de Crescimento' },
    { title: 'Eventos', icon: Calendar, href: '/eventos' },
    { title: 'Lições', icon: BookOpen, href: '/licoes' },
    { title: 'Membros', icon: UserCheck, href: '/membros' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-8 text-2xl font-semibold text-text-dark md:text-3xl">
          Bem-vindo
        </h1>
        <DashboardGrid items={navigationItems} />
      </div>
    </main>
  );
}
```

**Critérios de Aceitação**:
- [x] Página criada em `web/src/app/(app)/dashboard/page.tsx`
- [x] Acessível em `http://localhost:3000/dashboard`
- [x] 4 cards renderizados (GC, Eventos, Lições, Membros)
- [x] Layout responsivo funcional

---

### T013 Integrar Header no layout autenticado
**Arquivo**: `web/src/app/(app)/layout.tsx`
**Descrição**: Adicionar `<Header />` component ao layout `(app)` para aparecer em todas páginas autenticadas.

**Modificação**:
```tsx
import { Header } from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header showSubtitle={true} />
      {children}
    </>
  );
}
```

**Critérios de Aceitação**:
- [ ] Header importado e renderizado acima de `{children}`
- [ ] Header aparece em todas páginas `/dashboard`, `/gc`, `/eventos`, etc
- [ ] Sticky header funcional (permanece ao scrollar)

---

### T014 Atualizar página de login com logo e cores
**Arquivo**: `web/src/app/(auth)/login/page.tsx`
**Descrição**: Modificar login page para exibir logo centralizado e botão "Entrar" cor teal.

**Modificações**:
1. Importar `<Logo />` component
2. Adicionar logo centralizado no topo do form
3. Alterar className do botão de `bg-blue-600` para `bg-primary hover:bg-primary/90`

**Exemplo de estrutura**:
```tsx
<main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
  <div className="w-full max-w-md space-y-8">
    <div className="flex justify-center">
      <Logo className="h-20 md:h-24" />
    </div>
    <h1 className="text-center text-2xl font-semibold text-text-dark">
      Bem-vindo
    </h1>
    {/* Form existente */}
    <Button className="w-full bg-primary hover:bg-primary/90">
      Entrar
    </Button>
  </div>
</main>
```

**Critérios de Aceitação**:
- [ ] Logo exibido centralizado
- [ ] Botão "Entrar" cor teal (#17a2b8)
- [ ] Hover state funcional (escurece)
- [ ] Funcionalidade de login não quebrada

---

### T015 Reorganizar rota: mover dashboard atual para /gc
**Arquivos**:
- Source: `web/src/app/(app)/dashboard/page.tsx` (se existir antigo)
- Dest: `web/src/app/(app)/gc/page.tsx`

**Descrição**: Mover conteúdo do dashboard atual (listagem de GCs) para nova rota `/gc`. Se a página antiga não existe em `dashboard/`, verificar estrutura atual e criar `/gc/page.tsx` com conteúdo adequado.

**Passos**:
1. Verificar se existe `web/src/app/(app)/dashboard/page.tsx` antigo
2. Se existir, mover conteúdo para `web/src/app/(app)/gc/page.tsx`
3. Se não existir, criar `/gc/page.tsx` vazio ou com placeholder
4. Criar diretório `web/src/app/(app)/gc/` se necessário

**Critérios de Aceitação**:
- [ ] Rota `/gc` acessível
- [ ] Conteúdo de listagem de GCs em `/gc` (se havia)
- [ ] `/dashboard` renderiza nova home com cards (T012)

---

### T016 Atualizar globals.css (se necessário)
**Arquivo**: `web/src/app/globals.css`
**Descrição**: Verificar se CSS vars precisam ser atualizadas. Tailwind config (T002) já define cores, mas se houver CSS vars shadcn/ui conflitantes, ajustar.

**Verificação**:
```css
/* Se existir algo como: */
:root {
  --primary: 214 100% 50%; /* azul antigo */
}

/* Atualizar para teal: */
:root {
  --primary: 188 78% 41%; /* teal #17a2b8 em HSL */
}
```

**Critérios de Aceitação**:
- [ ] CSS vars não conflitam com Tailwind colors
- [ ] Build não quebra
- [ ] Cores consistentes (teal aparece corretamente)

---

### T017 Ajustar branding em página /eventos (se existir)
**Arquivo**: `web/src/app/(app)/eventos/page.tsx`
**Descrição**: Se página `/eventos` existir, verificar que Header global aparece (via layout T013). Não é necessário modificar conteúdo da página, apenas confirmar branding consistente.

**Critérios de Aceitação**:
- [ ] Header aparece em `/eventos`
- [ ] Cores teal aplicadas em botões (se houver)

---

### T018 Ajustar branding em página /licoes (se existir)
**Arquivo**: `web/src/app/(app)/licoes/page.tsx`
**Descrição**: Similar a T017, verificar Header e branding.

**Critérios de Aceitação**:
- [ ] Header aparece em `/licoes`

---

### T019 Ajustar branding em página /membros (se existir)
**Arquivo**: `web/src/app/(app)/membros/page.tsx`
**Descrição**: Similar a T017/T018.

**Critérios de Aceitação**:
- [ ] Header aparece em `/membros`

---

## Phase 3.4: E2E Testing

### T020 Escrever testes E2E de branding
**Arquivo**: `web/tests/e2e/branding.spec.ts`
**Descrição**: Criar testes Playwright para 5 cenários visuais conforme `contracts/ui-components.md` e `quickstart.md`.

**Cenários**:
1. **AS-001**: Login page displays logo and teal colors
2. **AS-002**: Authenticated dashboard shows cards and branding
3. **AS-003**: Responsive behavior on mobile (viewport 375px)
4. **AS-004**: Navigation consistency across pages
5. **EDGE**: Logo fallback when image fails

**Exemplo de estrutura**:
```typescript
import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;

test.describe('Visual Identity & Navigation', () => {
  test('AS-001: Login page displays logo and teal colors', async ({ page }) => {
    await page.goto('/login');

    // Verificar logo
    const logo = page.getByAltText(/igreja monte carmelo/i);
    await expect(logo).toBeVisible();

    // Verificar botão teal
    const button = page.getByRole('button', { name: /entrar/i });
    await expect(button).toHaveCSS('background-color', /17a2b8|rgb\(23, 162, 184\)/);
  });

  test('AS-002: Authenticated dashboard shows cards and branding', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard');

    // Verificar header
    await expect(page.getByText('Igreja Monte Carmelo')).toBeVisible();
    await expect(page.getByText('Grupos de Crescimento')).toBeVisible();

    // Verificar 4 cards
    await expect(page.getByText('GC')).toBeVisible();
    await expect(page.getByText('Eventos')).toBeVisible();
    await expect(page.getByText('Lições')).toBeVisible();
    await expect(page.getByText('Membros')).toBeVisible();
  });

  test('AS-003: Responsive behavior on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Login + verificar layout mobile (cards empilhados)
  });

  test('AS-004: Navigation consistency across pages', async ({ page }) => {
    // Navegar /dashboard → /gc → /eventos
    // Verificar header consistente
  });

  test('EDGE: Logo fallback when image fails', async ({ page }) => {
    // Block logo image
    await page.route('**/igreja-monte-carmelo.png', route => route.abort());
    await page.goto('/login');

    // Verificar texto fallback
    await expect(page.getByText('Igreja Monte Carmelo')).toBeVisible();
  });
});
```

**Critérios de Aceitação**:
- [x] Arquivo `branding.spec.ts` criado
- [x] 5 testes escritos
- [x] Testes **inicialmente FALHAM** (features não implementadas)

---

### T021 Executar testes E2E e verificar falhas
**Comando**: `npm run test:e2e -- branding.spec.ts`
**Descrição**: Rodar testes Playwright para verificar que **falham** antes das correções. Documentar falhas encontradas.

**Critérios de Aceitação**:
- [ ] Testes executados
- [ ] **Falhas esperadas** (cenários não implementados ainda)
- [ ] Output de falhas claro (screenshots se configurado)

---

### T022 Corrigir implementação até testes E2E passarem
**Arquivos**: Vários (ajustes em components/pages conforme falhas)
**Descrição**: Iterar sobre falhas de T021, corrigir bugs/falhas de implementação até todos testes E2E passarem.

**Passos**:
1. Analisar falhas de T021
2. Corrigir bugs (ex: logo não fallback, cores erradas, cards não clicáveis)
3. Re-rodar `npm run test:e2e` até 100% PASS

**Critérios de Aceitação**:
- [ ] **Todos testes E2E PASSAM**
- [ ] 5/5 cenários validados

---

## Phase 3.5: Polish & Validation

### T023 [P] Executar lint fix
**Comando**: `npm run lint:fix`
**Descrição**: Rodar ESLint com auto-fix para garantir código consistente.

**Critérios de Aceitação**:
- [ ] `npm run lint:fix` executa sem erros críticos
- [ ] Warnings aceitáveis documentados (se houver)

---

### T024 [P] Executar type-check
**Comando**: `npm run type-check`
**Descrição**: Verificar que não há erros TypeScript em todo projeto web.

**Critérios de Aceitação**:
- [ ] `npm run type-check` passa 100%
- [ ] Sem erros TS em components novos

---

### T025 Executar build de produção
**Comando**: `npm run build`
**Descrição**: Build Next.js production para verificar que não há erros de compilação.

**Critérios de Aceitação**:
- [ ] `npm run build` completa com sucesso
- [ ] Output bundle size razoável (sem aumento dramático)
- [ ] Warnings mínimos (apenas existentes, não novos)

---

### T026 [P] Validação manual: Executar quickstart.md
**Arquivo**: `specs/003-vamos-ajustar-a/quickstart.md`
**Descrição**: Executar todos 4 cenários manuais + edge case do quickstart.md. Documentar resultados.

**Cenários**:
1. Logo e cores na login
2. Dashboard com cards
3. Responsividade mobile (320px, 375px, 768px)
4. Consistência entre páginas
5. Edge case: Fallback logo

**Critérios de Aceitação**:
- [ ] 5/5 cenários PASS
- [ ] Nenhum bug crítico encontrado
- [ ] Resultados documentados (✅ APROVADO)

---

### T027 Validar responsividade em múltiplos viewports
**Ferramentas**: DevTools responsive mode
**Descrição**: Testar viewports críticos: 320px, 375px, 768px, 1024px, 1920px. Verificar que layout não quebra, textos legíveis, sem overflow horizontal.

**Critérios de Aceitação**:
- [ ] 320px: Interface utilizável (mínimo)
- [ ] 375px: Layout otimizado
- [ ] 768px: Grid 2x2 ativa
- [ ] 1024px+: Layout desktop completo
- [ ] Sem overflow horizontal em nenhum viewport

---

## Dependencies

### Setup Dependencies
- T001, T002, T003 → Podem rodar em paralelo [P]
- T001 blocks T006 (Logo precisa de arquivo PNG)
- T002 blocks T006, T009 (Components usam cores Tailwind)
- T003 blocks T006, T011 (Components usam BRANDING constants)

### TDD Dependencies
- T004 → T005, T008 (diretórios primeiro)
- T005 → T006 (teste antes de implementation)
- T007 → T009 (diretório antes de component)
- T008 → T009 (teste antes de implementation)
- T006, T009, T010, T011 → T012 (components antes de pages)

### Page Dependencies
- T012 requires T010, T011 (DashboardGrid, Header)
- T013 requires T011 (Header component)
- T014 requires T006 (Logo component)
- T015 sequential after T012 (reorganização de rotas)

### Testing Dependencies
- T020 requires T012-T019 (pages implementadas)
- T021 requires T020 (testes escritos)
- T022 requires T021 (falhas identificadas)

### Polish Dependencies
- T023, T024, T025 podem rodar em paralelo após T022 [P]
- T026, T027 requerem T022 (implementação completa) mas podem ser paralelos [P]

## Parallel Execution Examples

### Grupo 1: Setup (T001-T003) - Paralelo
```bash
# Executar simultaneamente:
# Terminal 1:
mkdir -p web/public/logo && cp refs/assets/IMG_4121.PNG web/public/logo/igreja-monte-carmelo.png

# Terminal 2:
# Editar web/tailwind.config.ts (adicionar cores)

# Terminal 3:
mkdir -p web/src/lib/constants && create web/src/lib/constants/branding.ts
```

### Grupo 2: Unit Tests (T005 + T008) - Paralelo
```bash
# Criar ambos testes simultaneamente (arquivos diferentes):
# File 1: web/tests/unit/components/Logo.test.tsx
# File 2: web/tests/unit/components/NavigationCard.test.tsx
```

### Grupo 3: Components (T006 + T009) - Paralelo (após testes)
```bash
# Implementar ambos components simultaneamente:
# File 1: web/src/components/layout/Logo.tsx
# File 2: web/src/components/dashboard/NavigationCard.tsx
```

### Grupo 4: Polish (T023-T024) - Paralelo
```bash
# Terminal 1:
npm run lint:fix

# Terminal 2:
npm run type-check

# (Após ambos passarem)
# Terminal 3:
npm run build
```

### Grupo 5: Validation (T026 + T027) - Paralelo
```bash
# Pessoa 1: Executa quickstart.md cenários
# Pessoa 2: Testa responsividade viewports
```

## Task Execution Order (Recommended)

**Wave 1 (Paralelo)**:
- T001, T002, T003

**Wave 2 (Sequencial)**:
- T004 → T005, T007, T008

**Wave 3 (TDD - Paralelo após testes)**:
- T006, T009 (após respectivos testes passarem)

**Wave 4 (Sequencial)**:
- T010 → T011 → T012 → T013

**Wave 5 (Sequencial)**:
- T014 → T015 → T016

**Wave 6 (Verificações - Paralelo)**:
- T017, T018, T019

**Wave 7 (E2E - Sequencial)**:
- T020 → T021 → T022

**Wave 8 (Polish - Paralelo)**:
- T023, T024 → T025

**Wave 9 (Validation - Paralelo)**:
- T026, T027

## Validation Checklist
*GATE: Validado antes de considerar feature completa*

- [x] Todos components de contracts têm implementation tasks (Logo, NavigationCard, DashboardGrid, Header)
- [x] Todos testes vêm antes de implementação (T005→T006, T008→T009)
- [x] Tarefas paralelas são arquivos independentes (T001-T003, T005+T008, T006+T009, T023-T024)
- [x] Cada task especifica caminho exato de arquivo
- [x] Tasks de mesmo arquivo são sequenciais (T011→T012→T013 layout changes)
- [x] Quickstart scenarios têm tasks de validação (T026)
- [x] E2E tests cobrem todos cenários críticos (T020: 5 scenarios)

## Notes

- **[P] tasks**: Arquivos diferentes, sem dependências → podem rodar em paralelo
- **TDD obrigatório**: Testes T005, T008 DEVEM FALHAR antes de T006, T009
- **Commits**: Commit após cada task (ou grupo de tasks paralelas)
- **Avoid**: Tarefas vagas, conflitos de mesmo arquivo, implementação antes de testes

## Estimated Completion

- **Setup (T001-T003)**: 15-20 min
- **Tests + Components (T004-T011)**: 90-120 min
- **Pages (T012-T019)**: 60-90 min
- **E2E Testing (T020-T022)**: 45-60 min
- **Polish (T023-T027)**: 30-45 min

**Total Estimado**: 4-5 horas (1 desenvolvedor)

---

**Status**: ✅ Tasks geradas e prontas para execução
**Próximo passo**: Executar T001 (copiar logo) ou executar Wave 1 completa em paralelo
