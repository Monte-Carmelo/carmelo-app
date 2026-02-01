# Decisões de Stack para Web App (React)

**Data**: 2025-10-04  
**Contexto**: Migração do plano mobile para web responsiva mobile-first, mantendo requisitos funcionais definidos em `spec.md`.

## Objetivos
- Entregar valor rapidamente com uma superfície web acessível em navegadores mobile e desktop.
- Reutilizar contratos e modelo de dados já consolidados (Supabase + `growth_group_participants`, `meeting_member_attendance`, `visitor_conversion_events`).
- Manter documentação em pt-BR conforme diretrizes do projeto.

## Stack Escolhida
- **Framework**: Next.js 14 (App Router) com TypeScript.
  - SSR/SSG híbrido para dashboards e hidratação eficiente das visões de GC.
  - Roteamento baseado em arquivos facilita dividir áreas por papéis (líder, supervisor, admin).
- **Styling**: Tailwind CSS + Radix UI primitives.
  - Agilidade para prototipação mobile-first, com design tokens customizáveis.
  - Radix garante componentes acessíveis (diálogos, listas, combobox).
- **State/Data**: TanStack Query + Zustand.
  - Query para cache/invalidations das requisições Supabase.
  - Zustand para estados locais (formularios, UI ephemeral state) sem boilerplate.
- **Auth & Data Access**: Supabase JS Client v2 (Edge-friendly) + Row Level Security existente.
  - Uso de middlewares do Next para proteger rotas por role.
  - Utilização de PostgREST + RPC conforme contratos atualizados.
- **Formulários**: React Hook Form + Zod.
  - Permite validação consistente com schemas compartilháveis.
- **Internacionalização**: `next-intl` com fallback pt-BR (per spec).

## Qualidade e Ferramentas
- **Lint/Format**: ESLint (config next/core + plugin tailwind), Prettier.
- **Testes Unitários**: Vitest + React Testing Library.
- **Testes de Componentes/Visual**: Storybook 8 com testes via Storybook Test Runner.
- **Testes End-to-End**: Playwright (CI + smoke suites mobile/desktop).
- **Acessibilidade**: axe-core integrado aos testes Storybook + auditorias manuais via Lighthouse.

## Dev Experience
- **Commit Hooks**: Husky + lint-staged (lint e testes rápidos em arquivos tocados).
- **Paths**: `src/` para código de aplicação, `app/` do Next para rotas, `components/` compartilhados.
- **CI/CD**: GitHub Actions (lint, build, testes). Deploy automático para Vercel preview/main.
- **Observabilidade**: Sentry para erros, Logflare para logs Supabase, PostHog para analytics.

## Hospedagem e Ambientes
- **Deploy**: Vercel (preview por PR, production em `main`).
- **Variáveis**: `env.example` documenta chaves Supabase (anon, service role para scripts) e ferramentas.
- **Ambientes**: `development` (local), `staging` (preview main), `production` (manual promote após smoke).

## Justificativas
- Next.js oferece SSR necessário para dashboards que dependem de dados dinâmicos e melhora primeira pintura em dispositivos modestos.
- Tailwind reduz tempo de entrega do layout mobile-first sem sacrificar consistência (com tokens declarados em breve).
- TanStack Query já possui integrações maduras com Supabase (suporte a assinaturas em tempo real se necessário).
- Vitest + Playwright proporcionam suíte rápida e moderna alinhada a apps React.
- Vercel otimiza deploy do Next, simplificando preview a cada PR e conectando-se bem ao Supabase.

## Próximos Artefatos
1. Bootstrap do projeto (`web/` ou `frontend/`), iniciando com Next + Tailwind + Supabase.
2. Guia de configuração (`quickstart-web.md`) descrevendo setup local.
3. Atualização de `plan.md` para refletir a nova arquitetura web.
