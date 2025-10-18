# Layout & Styling Specifications

**Feature**: 003-vamos-ajustar-a
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR)

## Overview

Este documento define especificações de layout, spacing, cores e tipografia para implementação da identidade visual. Todas medidas utilizam sistema Tailwind CSS.

---

## 1. Color Palette

### Primary Colors (Tailwind Config)

```typescript
// web/tailwind.config.ts - extend.colors
{
  primary: {
    DEFAULT: '#17a2b8',     // Teal principal (botões, ícones, links)
    foreground: '#ffffff'   // Texto sobre teal
  },
  'text-dark': '#5a5a5a',   // Headings
  'text-light': '#999999',  // Body text, descriptions
}
```

### Usage Guidelines

| Elemento | Cor | Classe Tailwind | Uso |
|----------|-----|-----------------|-----|
| Botões primários | Teal #17a2b8 | `bg-primary hover:bg-primary/90` | "Entrar", CTAs principais |
| Ícones navegação | Teal #17a2b8 | `text-primary` | Icons em NavigationCard |
| Links | Teal #17a2b8 | `text-primary hover:text-primary/80` | Hyperlinks |
| Headings | Gray dark #5a5a5a | `text-text-dark` | h1, h2, h3, títulos |
| Body text | Gray light #999999 | `text-text-light` | Parágrafos, descriptions |
| Backgrounds | White #ffffff | `bg-white` | Cards, page backgrounds |
| Borders | Gray 200 (Tailwind) | `border-gray-200` | Card borders, dividers |

### Contrast Verification

| Combinação | Ratio | WCAG AA | WCAG AAA |
|------------|-------|---------|----------|
| Teal (#17a2b8) on White | 3.02:1 | ✅ UI components | ❌ |
| Text Dark (#5a5a5a) on White | 6.54:1 | ✅ Normal text | ✅ Large text |
| Text Light (#999999) on White | 2.85:1 | ⚠️ Large text only | ❌ |

**Nota**: Feature não exige conformidade WCAG formal (NFR-004), mas contraste mantido em níveis razoáveis de legibilidade.

---

## 2. Typography

### Font Stack

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Fonte**: Inter (carregada via `next/font/google` em `app/layout.tsx`)

### Scale & Usage

| Elemento | Tailwind Class | Size | Weight | Line Height | Uso |
|----------|---------------|------|--------|-------------|-----|
| Page Title (h1) | `text-2xl md:text-3xl` | 24px / 30px | 600 (semibold) | 1.2 | "Bem-vindo" |
| Section Title (h2) | `text-xl md:text-2xl` | 20px / 24px | 600 (semibold) | 1.3 | Títulos de seção |
| Card Title | `text-lg` | 18px | 600 (semibold) | 1.4 | "GC", "Eventos" |
| Body | `text-base` | 16px | 400 (normal) | 1.5 | Texto geral |
| Description | `text-sm` | 14px | 400 (normal) | 1.5 | Subtexts, descriptions |
| Caption | `text-xs` | 12px | 400 (normal) | 1.4 | Notas, timestamps |

### Responsive Adjustments

- **Mobile (< 640px)**: Reduzir 1 step (ex: `text-2xl` → `text-xl`)
- **Desktop (>= 640px)**: Tamanhos padrão via breakpoint `md:`

---

## 3. Spacing System

### Container Padding

| Context | Tailwind Class | Pixels |
|---------|---------------|--------|
| Page container | `px-4 md:px-6 lg:px-8` | 16px / 24px / 32px |
| Vertical sections | `py-6 md:py-8 lg:py-12` | 24px / 32px / 48px |

### Component Gaps

| Component | Tailwind Class | Pixels | Uso |
|-----------|---------------|--------|-----|
| Dashboard cards (mobile) | `gap-4` | 16px | Stack vertical |
| Dashboard cards (desktop) | `gap-6` | 24px | Grid 2x2 |
| Card internal padding | `p-6` | 24px | Conteúdo interno card |
| Header padding | `px-4 py-3 md:px-6 md:py-4` | 16x12px / 24x16px | Header sticky |

---

## 4. Dashboard Layout

### Container Structure

```tsx
<main className="min-h-screen bg-gray-50">
  <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
    <h1 className="mb-8 text-2xl font-semibold text-text-dark md:text-3xl">
      Bem-vindo
    </h1>

    <DashboardGrid items={navigationItems} />
  </div>
</main>
```

### Grid Specifications

**Mobile (< 768px)**:
```tsx
<div className="flex flex-col gap-4">
  {/* Cards stack vertically */}
</div>
```

**Desktop (>= 768px)**:
```tsx
<div className="grid grid-cols-2 gap-6 md:max-w-4xl">
  {/* 2x2 grid, max-width 896px */}
</div>
```

### Card Dimensions

| Breakpoint | Behavior | Min Height | Max Width |
|------------|----------|------------|-----------|
| Mobile (< 768px) | Full width | 150px | 100% |
| Desktop (>= 768px) | Grid item | 200px | ~430px (2 cols in max-w-4xl) |

---

## 5. Header Layout

### Structure

```tsx
<header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
  <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6 md:py-4">
    <Logo className="h-12 md:h-16" />

    <div className="flex flex-col">
      <span className="text-lg font-semibold text-text-dark md:text-xl">
        Igreja Monte Carmelo
      </span>
      {showSubtitle && (
        <span className="text-sm text-text-light md:text-base">
          Grupos de Crescimento
        </span>
      )}
    </div>
  </div>
</header>
```

### Z-Index Management

| Layer | z-index | Tailwind | Elemento |
|-------|---------|----------|----------|
| Header | 50 | `z-50` | Sticky header |
| Modals | 100 | `z-[100]` | Dialogs, dropdowns (shadcn default) |
| Toasts | 200 | `z-[200]` | Notifications (shadcn default) |

---

## 6. Login Page Layout

### Structure

```tsx
<main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
  <div className="w-full max-w-md space-y-8">
    {/* Logo centralizado */}
    <div className="flex justify-center">
      <Logo className="h-20 md:h-24" />
    </div>

    {/* Heading */}
    <h1 className="text-center text-2xl font-semibold text-text-dark">
      Bem-vindo
    </h1>

    {/* Form card */}
    <Card className="p-6">
      {/* Email input, password input */}
      <Button className="w-full bg-primary hover:bg-primary/90">
        Entrar
      </Button>
    </Card>
  </div>
</main>
```

### Vertical Rhythm

| Element | Margin Bottom | Tailwind Class |
|---------|---------------|----------------|
| Logo → Heading | 32px | `space-y-8` parent |
| Heading → Form | 32px | `space-y-8` parent |
| Form inputs | 16px | `space-y-4` form |
| Input → Button | 24px | `mt-6` button |

---

## 7. Navigation Card Layout

### Card Structure

```tsx
<Card className="flex min-h-[150px] flex-col items-center justify-center gap-4 p-6 transition-shadow hover:shadow-lg md:min-h-[200px]">
  <Icon className="h-12 w-12 text-primary md:h-16 md:w-16" />

  <div className="text-center">
    <h3 className="text-lg font-semibold text-text-dark">{title}</h3>
    {description && (
      <p className="mt-1 text-sm text-text-light">{description}</p>
    )}
  </div>
</Card>
```

### Icon Sizing

| Breakpoint | Icon Size | Tailwind Class |
|------------|-----------|----------------|
| Mobile (< 768px) | 48x48px | `h-12 w-12` |
| Desktop (>= 768px) | 64x64px | `h-16 w-16 md:h-16 md:w-16` |

### Hover State

```tsx
// Transition properties
transition-shadow duration-200

// Default shadow
shadow-sm

// Hover shadow
hover:shadow-lg
```

---

## 8. Responsive Breakpoints

### Tailwind Breakpoints (Standard)

| Name | Min Width | Max Width | Uso |
|------|-----------|-----------|-----|
| xs (implicit) | 0px | 639px | Mobile small (320px+) |
| sm | 640px | 767px | Mobile large |
| md | 768px | 1023px | Tablet / Grid 2x2 |
| lg | 1024px | 1279px | Desktop small |
| xl | 1280px | 1535px | Desktop standard |
| 2xl | 1536px+ | - | Desktop large |

### Critical Widths

| Width | Device | Layout Behavior |
|-------|--------|-----------------|
| 320px | iPhone SE (old) | Mínimo suportado, padding reduzido |
| 375px | iPhone standard | Otimizado, espaçamento normal |
| 768px | iPad portrait | Grid 2x2 ativa, header expande |
| 1024px | Desktop small | Max-width container, layout completo |

---

## 9. Shadow & Elevation

### Elevation Scale

| Level | Tailwind Class | Use Case |
|-------|---------------|----------|
| 0 | `shadow-none` | Flat elements |
| 1 | `shadow-sm` | Default cards |
| 2 | `shadow-md` | Hover cards, header scrolled |
| 3 | `shadow-lg` | Active/hover navigation cards |
| 4 | `shadow-xl` | Modals, dropdowns |

### Border Radius

| Element | Tailwind Class | Pixels | Uso |
|---------|---------------|--------|-----|
| Cards | `rounded-lg` | 8px | Navigation cards, form cards |
| Buttons | `rounded-md` | 6px | Botões primários |
| Inputs | `rounded-md` | 6px | Form inputs |
| Logo (PNG já rounded) | N/A | - | Logo IMG_4121.PNG já possui cantos arredondados |

---

## 10. Accessibility Specifications

### Focus States

```tsx
// Padrão para elementos interativos
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Touch Targets

| Element | Min Size | Tailwind | Rationale |
|---------|----------|----------|-----------|
| Buttons | 44x44px | `min-h-11 px-4` | iOS touch target guideline |
| Links | 44x44px | `min-h-11 inline-flex` | Mesmo standard |
| Cards (clickable) | 150x150px | `min-h-[150px]` | Large touch area, não crítico |

### Alt Text Standards

| Element | Alt Text | Rationale |
|---------|----------|-----------|
| Logo | "Igreja Monte Carmelo - Grupos de Crescimento" | Descritivo completo |
| Icons decorativos | `aria-hidden="true"` | Não semânticos, contexto via texto adjacente |

---

## 11. Animation & Transitions

### Hover Transitions

```tsx
// Default smooth transition
transition-all duration-200 ease-in-out

// Specific properties
transition-shadow duration-200  // Cards elevation
transition-colors duration-150  // Buttons color change
transition-transform duration-200  // Icon scale
```

### Animation Examples

| Element | Animation | Tailwind |
|---------|-----------|----------|
| Navigation Card hover | Shadow elevation | `transition-shadow hover:shadow-lg` |
| Icon hover | Scale 1.05 | `transition-transform hover:scale-105` |
| Button hover | Background darken | `transition-colors hover:bg-primary/90` |

### Performance

- ✅ Use `transform` e `opacity` (GPU-accelerated)
- ✅ Evitar `width`, `height` animations (reflow)
- ✅ Preferir `transition` sobre `animation` para micro-interactions

---

## 12. CSS Custom Properties (se necessário)

### Tailwind Config Extension

```typescript
// web/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#17a2b8', foreground: '#ffffff' },
        'text-dark': '#5a5a5a',
        'text-light': '#999999',
      },
      maxWidth: {
        '7xl': '80rem',  // 1280px container
      },
      zIndex: {
        '100': '100',  // Modals
        '200': '200',  // Toasts
      },
    },
  },
}
```

### CSS Variables (globals.css - se precisar override shadcn)

```css
:root {
  --color-primary: 23 162 184;  /* RGB de #17a2b8 */
  --color-text-dark: 90 90 90;
  --color-text-light: 153 153 153;
}
```

---

## 13. Print Styles (Bonus - Low Priority)

```css
@media print {
  header { position: static; }  /* Remove sticky header */
  .shadow-lg { box-shadow: none; }  /* Remove sombras */
  .bg-primary { background-color: #17a2b8 !important; }
}
```

**Nota**: Não prioritário para feature inicial.

---

## Testing Layout

### Visual Regression Tests (Playwright)

```typescript
// tests/e2e/branding.spec.ts
test('Dashboard layout matches design at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/dashboard');

  // Verifica grid 2x2
  const cards = await page.locator('[data-testid="navigation-card"]').all();
  expect(cards).toHaveLength(4);

  // Screenshot comparison (se configurado)
  await expect(page).toHaveScreenshot('dashboard-768px.png');
});
```

### Responsive Test Matrix

| Width | Height | Orientation | Test |
|-------|--------|-------------|------|
| 320px | 568px | Portrait | Mínimo suportado |
| 375px | 667px | Portrait | iPhone padrão |
| 768px | 1024px | Portrait | iPad portrait, grid ativa |
| 1024px | 768px | Landscape | Desktop small |
| 1920px | 1080px | Landscape | Desktop full |

---

## Approval Checklist

- [x] Cores definidas com hex values e Tailwind classes
- [x] Tipografia scale documentada
- [x] Spacing system consistente
- [x] Layouts responsivos especificados
- [x] Accessibility touch targets e contrast verificados
- [x] Animations performance-conscious
- [x] Testing guidelines fornecidas

**Status**: Especificações aprovadas. Prontas para implementação conforme contratos.
