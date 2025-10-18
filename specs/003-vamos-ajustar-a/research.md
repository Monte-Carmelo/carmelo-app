# Research: Atualização de Navegação e Identidade Visual

**Feature**: 003-vamos-ajustar-a
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR)

## Objetivo

Pesquisar e decidir abordagens técnicas para implementar atualização de identidade visual (logo, cores, navegação) na aplicação web Next.js existente, mantendo consistência com stack tecnológica e design system já estabelecidos.

## Contexto Técnico Existente

- **Framework**: Next.js 15.5.5 (App Router)
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 3.4.18 + shadcn/ui components
- **Icons**: Lucide React (já instalado)
- **Testing**: Vitest (unit), Playwright (E2E), Storybook (component showcase)

## Decisões de Pesquisa

### 1. Design System Integration

**Decisão**: Utilizar Tailwind CSS + shadcn/ui existentes sem adicionar nova biblioteca de componentes.

**Rationale**:
- Projeto já possui setup completo de Tailwind CSS com configuração customizada
- shadcn/ui fornece componentes base bem estruturados e acessíveis
- Evita conflito de estilos e overhead de nova biblioteca
- Mantém consistência com componentes já implementados (forms, cards, buttons)
- Time já familiarizado com Tailwind utilities

**Alternativas Consideradas**:
1. **Material UI** (MUI)
   - Rejeitada: Overhead significativo (~500KB), conflito com Tailwind, requer migração de componentes existentes

2. **Styled Components**
   - Rejeitada: Requer migração de todo CSS existente, adiciona runtime CSS-in-JS overhead, incompatível com Tailwind utility-first

3. **Chakra UI**
   - Rejeitada: Similarmente a MUI, adiciona camada desnecessária sobre Tailwind já funcional

**Implementação**:
- Estender `tailwind.config.ts` com cores customizadas da marca
- Utilizar componentes shadcn/ui existentes (Card, Button) com classes Tailwind
- Criar novos componentes React quando necessário (Logo, NavigationCard, Header)

---

### 2. Icon Library

**Decisão**: Lucide React (já presente no projeto).

**Rationale**:
- Biblioteca já instalada em `package.json` (`lucide-react: ^0.545.0`)
- Leve e tree-shakeable (apenas ícones usados são incluídos no bundle)
- Excelente cobertura de ícones (>1000 ícones)
- Estilo consistente e moderno, alinha com protótipo
- API simples React-first (`<IconName />`)

**Ícones Mapeados para Feature**:
| Seção | Ícone Lucide | Rationale |
|-------|--------------|-----------|
| GC (Grupos de Crescimento) | `Users` | Representa comunidade/pessoas |
| Eventos | `Calendar` | Universalmente reconhecido para agendamento |
| Lições | `BookOpen` | Representa conteúdo educacional/bíblico |
| Membros | `UserCheck` | Indica gestão de pessoas/aprovação |

**Alternativas Consideradas**:
1. **Heroicons**
   - Rejeitada: Não instalado, ícones desejados já disponíveis em Lucide

2. **React Icons** (pacote agregador)
   - Rejeitada: Bundle maior, inconsistência de estilos entre diferentes sets

3. **Ícones customizados SVG**
   - Rejeitada: Overhead de criação/manutenção, Lucide suficiente

**Uso**:
```typescript
import { Users, Calendar, BookOpen, UserCheck } from 'lucide-react';

<NavigationCard icon={Users} title="GC" href="/gc" />
```

---

### 3. Logo Asset Management

**Decisão**: PNG estática em `public/logo/` com Next.js Image component para otimização.

**Rationale**:
- IMG_4121.PNG já fornecida em `refs/assets/` (logo teal + texto cinza)
- Next.js Image component otimiza automaticamente:
  - Lazy loading (carrega apenas quando visível)
  - Responsive srcset (serve tamanhos apropriados por device)
  - Modern formats (WebP) com fallback PNG
  - Blur placeholder durante carregamento
- Fallback para texto via `onError` event handler nativo
- Simplicidade: sem necessidade de CDN ou serviço externo

**Estrutura de Arquivos**:
```
web/public/logo/
└── igreja-monte-carmelo.png  # Cópia de refs/assets/IMG_4121.PNG
```

**Alternativas Consideradas**:
1. **SVG inline** (via React component)
   - Rejeitada: PNG fornecida, não há necessidade de edição programática, SVG não disponível

2. **CDN externa** (Cloudinary, imgix)
   - Rejeitada: Adiciona dependência externa, overhead configuração, logo estático não requer transformações dinâmicas

3. **Base64 inline**
   - Rejeitada: Aumenta bundle size, sem benefício de caching HTTP

**Implementação Fallback**:
```typescript
<Image
  src="/logo/igreja-monte-carmelo.png"
  alt="Igreja Monte Carmelo - Grupos de Crescimento"
  onError={(e) => {
    e.currentTarget.style.display = 'none';
    // Mostrar <h1>Igreja Monte Carmelo</h1> via state
  }}
/>
```

---

### 4. Color Palette Implementation

**Decisão**: Tailwind custom colors via `tailwind.config.ts` extension.

**Rationale**:
- Centraliza design tokens em configuração única
- Autocomplete IDE para classes (`bg-primary`, `text-text-dark`)
- Reutilização consistente em toda aplicação
- Suporta dark mode futuro (se necessário via variants)
- Mantém compatibilidade com classes Tailwind padrão

**Configuração Proposta**:
```typescript
// web/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#17a2b8',  // Teal do protótipo
          foreground: '#ffffff'
        },
        'text-dark': '#5a5a5a',    // Headings
        'text-light': '#999999',   // Body text
      }
    }
  }
}
```

**Uso**:
```tsx
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Entrar
</button>
<h1 className="text-text-dark">Bem-vindo</h1>
<p className="text-text-light">Descrição...</p>
```

**Alternativas Consideradas**:
1. **CSS Variables** (`:root { --color-primary: ... }`)
   - Rejeitada: Menor integração com Tailwind, sem autocomplete, verbose

2. **Hardcoded hex values** nas classes
   - Rejeitada: Dificulta manutenção, sem consistência garantida

3. **Tema shadcn/ui override**
   - Parcialmente adotado: shadcn usa CSS vars, mas Tailwind config superior para novos tokens

---

### 5. Responsive Strategy

**Decisão**: Mobile-first approach usando Tailwind breakpoints padrão.

**Rationale**:
- Requisito de largura mínima 320px exige mobile-first
- Tailwind breakpoints padrão cobrem casos de uso:
  - Default (< 640px): Mobile small (320px+)
  - `sm` (640px+): Mobile large / phablet
  - `md` (768px+): Tablet / Grid 2x2 cards
  - `lg` (1024px+): Desktop
- Protótipo mostra layouts distintos mobile vs desktop
- Next.js SSR permite renderização apropriada por device

**Breakpoint Strategy**:
| Breakpoint | Comportamento |
|------------|---------------|
| < 640px (default) | Cards empilhados verticalmente, padding reduzido, logo menor |
| 640px - 768px (`sm`) | Espaçamentos intermediários, preparação para grid |
| >= 768px (`md`) | Grid 2x2 cards, logo tamanho completo, header expandido |
| >= 1024px (`lg`) | Layout desktop completo, max-width container |

**Implementação Exemplo**:
```tsx
<div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
  {/* Cards stack mobile, grid 2x2 desktop */}
</div>
```

**Alternativas Consideradas**:
1. **Desktop-first** (max-width media queries)
   - Rejeitada: Inverte lógica Tailwind, menos eficiente para mobile mínimo 320px

2. **Container queries** (Tailwind 4.0)
   - Rejeitada: Ainda experimental, Tailwind 3.4.18 não suporta nativamente

---

### 6. Typography (Deferred Clarification FR-011)

**Decisão**: Manter sistema default Next.js (Inter via `next/font/google` optimization).

**Rationale**:
- Inter já configurada em projeto (verificar `app/layout.tsx`)
- Excelente legibilidade em tamanhos variados (320px - desktop)
- Suporte completo Unicode/Português
- Otimização automática Next.js (subset, preload, fallback)
- Especificação não define font família, decisão segura

**Fallback Fonts**:
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Alternativas Consideradas**:
1. **Font customizada do branding** (se fornecida)
   - Não disponível em refs/assets, pode ser adicionada futuramente

2. **System fonts apenas**
   - Rejeitada: Inter superior visualmente, já otimizada

---

### 7. Navigation Routing Strategy

**Decisão**: Reorganizar rotas Next.js App Router mantendo estrutura `(app)` group.

**Rationale**:
- App Router (Next.js 13+) permite nested layouts e route groups
- Dashboard atual (`/app/dashboard/page.tsx`) será movido para `/app/(app)/gc/page.tsx`
- Nova home `/app/(app)/dashboard/page.tsx` com cards de navegação
- Mantém autenticação via layout group `(app)`
- Sem breaking changes em links externos (redirects se necessário)

**Estrutura Proposta**:
```
app/
├── (auth)/
│   └── login/page.tsx              # Unchanged
├── (app)/
│   ├── layout.tsx                  # [MODIFIED] Add Header
│   ├── dashboard/page.tsx          # [NEW] Card-based navigation home
│   ├── gc/page.tsx                 # [MOVED FROM /dashboard] GC listing
│   ├── eventos/page.tsx            # [MODIFIED] Update branding
│   ├── licoes/page.tsx             # [MODIFIED] Update branding
│   └── membros/page.tsx            # [MODIFIED] Update branding
```

**Migração**:
1. Criar `/dashboard/page.tsx` (nova home)
2. Mover conteúdo atual de `/dashboard` para `/gc/page.tsx`
3. Atualizar links internos (navbar, breadcrumbs se existentes)
4. Adicionar redirect `/dashboard` → `/gc` se necessário (backward compatibility)

**Alternativas Consideradas**:
1. **Manter `/dashboard` como listing, criar `/home` para cards**
   - Rejeitada: `/dashboard` semanticamente correto para home principal

2. **Usar query params** (`/dashboard?view=home|gc`)
   - Rejeitada: Menos clean URLs, complica routing, contra padrões Next.js

---

## Riscos Identificados & Mitigações

### Risco 1: Logo Fallback não funcionar em todos navegadores
**Probabilidade**: Baixa
**Impacto**: Médio (usuários veem espaço vazio)
**Mitigação**:
- Testar `onError` em Chrome, Firefox, Safari
- Adicionar timeout fallback (se imagem não carrega em 3s, mostrar texto)
- E2E test específico para esse cenário

### Risco 2: Cores teal (#17a2b8) não atenderem contraste mínimo
**Probabilidade**: Média (FR não exige WCAG formal, mas legibilidade importante)
**Impacto**: Baixo (ajuste fácil de cor)
**Mitigação**:
- Testar contraste com ferramentas (WebAIM Contrast Checker)
- Se necessário, escurecer teal para botões/text em backgrounds claros
- Documentar decisão em `contracts/layout-specs.md`

### Risco 3: Layout 320px ficar inutilizável
**Probabilidade**: Baixa (Tailwind mobile-first testado)
**Impacto**: Alto (requisito de suporte mínimo)
**Mitigação**:
- Testar em devices reais/emuladores 320px (iPhone SE antigo)
- Ajustar padding/font-size específicos para `< 375px` se necessário
- E2E test com viewport 320px

### Risco 4: Migração de rotas quebrar links/bookmarks existentes
**Probabilidade**: Média
**Impacto**: Médio (usuários perdem acesso direto)
**Mitigação**:
- Adicionar redirects em `next.config.js`:
  ```js
  async redirects() {
    return [
      { source: '/dashboard', destination: '/gc', permanent: false }
    ]
  }
  ```
- Comunicar mudança se houver usuários em produção

---

## Decisões Diferidas (Low Priority)

1. **NFR-003: Performance exata** (tempo de carregamento)
   - **Decisão Temporária**: Usar padrões Next.js (código splitting automático, Image optimization)
   - **Rationale**: Sem requisito específico, otimizações default suficientes para UI estática
   - **Quando revisar**: Se métricas Core Web Vitals mostrarem problemas

2. **FR-002: Valor exato cor teal**
   - **Decisão Temporária**: `#17a2b8` extraído do protótipo
   - **Rationale**: Protótipo visual fonte de verdade, valor aproximado suficiente
   - **Quando revisar**: Se designer fornecer paleta exata via brand guidelines

---

## Referências

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Custom Colors](https://tailwindcss.com/docs/customizing-colors)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Status**: Pesquisa completa. Todas decisões técnicas aprovadas. Pronto para Phase 1 (Design & Contracts).
