# UI Component Contracts

**Feature**: 003-vamos-ajustar-a
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR)

## Overview

Este documento define contratos de interface para componentes React criados/modificados nesta feature. Contratos especificam props, comportamento esperado, e estados visuais **sem** detalhes de implementação.

---

## 1. Logo Component

**Path**: `web/src/components/layout/Logo.tsx`

### Contract

```typescript
interface LogoProps {
  /**
   * Variante do logo para diferentes contextos
   * - 'default': Logo completo com texto (header, login)
   * - 'compact': Apenas ícone circular (mobile collapsed nav - futuro)
   */
  variant?: 'default' | 'compact';

  /**
   * Classes Tailwind adicionais para customização de tamanho/posicionamento
   */
  className?: string;
}
```

### Behavior

1. **Exibição Normal**:
   - Renderiza `<Image>` Next.js com src `/logo/igreja-monte-carmelo.png`
   - Alt text: "Igreja Monte Carmelo - Grupos de Crescimento"
   - Dimensões default: `width={180} height={60}` (ajustável via `className`)

2. **Fallback em Erro**:
   - Se imagem falha ao carregar (`onError` event):
     - Esconde `<Image>`
     - Exibe `<h1>` com texto "Igreja Monte Carmelo"
     - Estilo: `text-text-dark font-semibold`

3. **Variant 'compact'**:
   - (Futuro) Renderiza apenas ícone circular sem texto
   - Dimensões reduzidas: `width={40} height={40}`

### Visual States

| Estado | Descrição | Implementação |
|--------|-----------|---------------|
| Loading | Placeholder blur Next.js | Automático via `<Image>` |
| Loaded | Logo visível | `<Image>` renderizado |
| Error | Texto fallback | `<h1>Igreja Monte Carmelo</h1>` |

### Accessibility

- ✅ Alt text descritivo para leitores de tela
- ✅ Contraste adequado texto fallback vs background
- ✅ Tamanho mínimo 40x40px (touch target futuro se clickable)

### Usage Example

```tsx
// Header global
<Logo className="h-16" />

// Login page
<Logo className="h-24 mx-auto" />

// Mobile nav (futuro)
<Logo variant="compact" className="h-10" />
```

---

## 2. NavigationCard Component

**Path**: `web/src/components/dashboard/NavigationCard.tsx`

### Contract

```typescript
interface NavigationCardProps {
  /**
   * Título da seção exibido no card
   * Valores esperados: "GC" | "Eventos" | "Lições" | "Membros"
   */
  title: string;

  /**
   * Ícone Lucide React representando a seção
   * Valores esperados: Users | Calendar | BookOpen | UserCheck
   */
  icon: LucideIcon;

  /**
   * URL de destino ao clicar
   * Valores esperados: "/gc" | "/eventos" | "/licoes" | "/membros"
   */
  href: string;

  /**
   * Texto descritivo opcional abaixo do título
   * Ex: "Gerencie seus grupos de crescimento"
   */
  description?: string;
}
```

### Behavior

1. **Renderização**:
   - Componente é um `<Link>` Next.js wrapping um `<Card>` shadcn/ui
   - Ícone centralizado no topo (tamanho 48x48px, cor `text-primary`)
   - Título abaixo do ícone (font-semibold, text-text-dark)
   - Descrição opcional (text-sm, text-text-light)

2. **Interação**:
   - Hover: Card elevation aumenta (shadow-md → shadow-lg)
   - Hover: Ícone scale 1.05 (transform transition)
   - Click: Navegação via Next.js Link (client-side routing)

3. **Responsividade**:
   - Mobile (< 768px): Card full-width, min-height 150px
   - Desktop (>= 768px): Card grid item, min-height 200px

### Visual States

| Estado | Descrição | Estilo |
|--------|-----------|--------|
| Default | Card normal | `bg-white border border-gray-200 shadow-sm` |
| Hover | Card elevado | `shadow-lg transition-shadow duration-200` |
| Focus | Outline teclado | `focus:ring-2 focus:ring-primary focus:ring-offset-2` |
| Active | Click visual | `active:scale-[0.98]` |

### Accessibility

- ✅ Componente é `<Link>` semântico (não `<div onClick>`)
- ✅ Navegação via teclado (Tab, Enter)
- ✅ Aria-label se description ausente: `aria-label={title}`
- ✅ Contraste ícone/texto vs background

### Usage Example

```tsx
import { Users, Calendar, BookOpen, UserCheck } from 'lucide-react';

<NavigationCard
  title="GC"
  icon={Users}
  href="/gc"
  description="Gerencie seus grupos de crescimento"
/>

<NavigationCard
  title="Eventos"
  icon={Calendar}
  href="/eventos"
/>
```

---

## 3. DashboardGrid Component

**Path**: `web/src/components/dashboard/DashboardGrid.tsx`

### Contract

```typescript
interface DashboardGridProps {
  /**
   * Array de dados para renderizar cards
   * Geralmente 4 items: GC, Eventos, Lições, Membros
   */
  items: Array<{
    title: string;
    icon: LucideIcon;
    href: string;
    description?: string;
  }>;
}
```

### Behavior

1. **Layout**:
   - Mobile (< 768px): Flex column, gap-4
   - Desktop (>= 768px): Grid 2x2, gap-6

2. **Renderização**:
   - Map sobre `items`, renderiza `<NavigationCard>` para cada
   - Container com `max-w-4xl mx-auto` (centralizado)

3. **Ordering**:
   - Cards na ordem do array (esperado: GC, Eventos, Lições, Membros)
   - Grid desktop: GC top-left, Eventos top-right, Lições bottom-left, Membros bottom-right

### Visual States

Herda estados de `NavigationCard` filhos.

### Accessibility

- ✅ Landmark `<main>` ou `<section>` wrapper
- ✅ Heading "Bem-vindo" (h1) antes do grid

### Usage Example

```tsx
const navigationItems = [
  { title: 'GC', icon: Users, href: '/gc', description: 'Grupos de Crescimento' },
  { title: 'Eventos', icon: Calendar, href: '/eventos' },
  { title: 'Lições', icon: BookOpen, href: '/licoes' },
  { title: 'Membros', icon: UserCheck, href: '/membros' },
];

<DashboardGrid items={navigationItems} />
```

---

## 4. Header Component

**Path**: `web/src/components/layout/Header.tsx`

### Contract

```typescript
interface HeaderProps {
  /**
   * Controla exibição do subtítulo "Grupos de Crescimento"
   * Default: true (exibe em todas páginas autenticadas)
   * false: Login page (sem header) ou contextos específicos
   */
  showSubtitle?: boolean;
}
```

### Behavior

1. **Layout**:
   - Container `sticky top-0` com `bg-white border-b border-gray-200`
   - Flex row: Logo à esquerda, texto à direita do logo
   - Padding: `px-4 py-3 md:px-6 md:py-4`

2. **Conteúdo**:
   - `<Logo />` component
   - Texto:
     - Linha 1: "Igreja Monte Carmelo" (font-semibold, text-text-dark)
     - Linha 2 (se `showSubtitle`): "Grupos de Crescimento" (text-sm, text-text-light)

3. **Responsividade**:
   - Mobile: Logo smaller, texto single column
   - Desktop: Logo larger, texto pode ser inline

### Visual States

| Estado | Descrição | Estilo |
|--------|-----------|--------|
| Default | Header fixo topo | `sticky top-0 z-50 bg-white shadow-sm` |
| Scrolled | Sombra aumentada | `shadow-md` (via scroll listener - futuro) |

### Accessibility

- ✅ Landmark `<header>` semântico
- ✅ Logo com alt text adequado
- ✅ Contraste texto vs background

### Usage Example

```tsx
// Layout padrão (app/(app)/layout.tsx)
<Header showSubtitle={true} />

// Contexto específico (se necessário)
<Header showSubtitle={false} />
```

---

## 5. Modificações em Componentes Existentes

### 5.1 Login Page (`app/(auth)/login/page.tsx`)

**Mudanças Contratuais**:
- ✅ Adicionar `<Logo />` component centralizado no topo
- ✅ Alterar cor botão "Entrar" de `bg-blue-600` para `bg-primary`
- ✅ Manter funcionalidade de autenticação Supabase inalterada

**Behavior Esperado**:
- Logo exibido com alt text
- Botão hover state: `hover:bg-primary/90`
- Fallback logo funcional em error

### 5.2 App Layout (`app/(app)/layout.tsx`)

**Mudanças Contratuais**:
- ✅ Adicionar `<Header />` component acima de `{children}`
- ✅ Manter autenticação guard existente

**Behavior Esperado**:
- Header presente em todas páginas autenticadas
- Children renderizados abaixo do header
- Sticky header não sobrepõe conteúdo (padding-top em children se necessário)

---

## Testing Contracts

### Unit Tests (Vitest + React Testing Library)

**Arquivo**: `web/tests/unit/components/Logo.test.tsx`

```typescript
describe('Logo Component', () => {
  it('renders image with correct alt text', () => {
    render(<Logo />);
    const img = screen.getByAltText(/igreja monte carmelo/i);
    expect(img).toBeInTheDocument();
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

**Arquivo**: `web/tests/unit/components/NavigationCard.test.tsx`

```typescript
describe('NavigationCard Component', () => {
  it('renders title and icon', () => {
    render(<NavigationCard title="GC" icon={Users} href="/gc" />);
    expect(screen.getByText('GC')).toBeInTheDocument();
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

### E2E Tests (Playwright)

Vide `tests/e2e/branding.spec.ts` gerado em Phase 1.

---

## Approval Checklist

- [x] Todos componentes têm TypeScript interfaces
- [x] Behavior descrito sem detalhes de implementação
- [x] Accessibility requirements especificados
- [x] Visual states documentados
- [x] Usage examples fornecidos
- [x] Testing contracts definidos

**Status**: Contratos aprovados. Prontos para implementação TDD (tests primeiro).
