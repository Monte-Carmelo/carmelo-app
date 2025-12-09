# Estratégia de testes e cobertura

- **Comandos principais**
  - `cd web && npm test` — roda contratos + unitários com mocks locais (usa Supabase local em http://127.0.0.1:54321).
  - `cd web && npm test -- --coverage` — gera cobertura focada em `src/app`, `src/components` e `src/lib`.
- **Pré-requisitos**
  - Supabase local ativo: `supabase start` (já configurado) e seeds via `web/scripts/seed-auth-users.ts` se precisar repovoar logins.
- **Prioridades de cobertura**
  1. Fluxos críticos autenticados (`/gc`, `/gc/[id]`, `/meetings/new`, `/visitors`, `/participants`).
  2. Componentes client com efeitos (listas, formulários, conversões) simulando Supabase via mocks.
  3. Páginas públicas e landing (já cobertas) apenas para regressão visual simples.
- **Técnicas de mock**
  - Para server components, mockar `getAuthenticatedUser` e `createSupabaseServerClient` retornando dados mínimos e `redirect` espiado.
  - Para client components, mockar `getSupabaseBrowserClient`, `useSession` e rotas (`useRouter`, `useSearchParams`) para isolar navegação/refresh.
- **Próximos alvos**
  - Cobrir `events` dashboard, `lessons` e cards de métricas no `/dashboard`.
  - Validar regras de negócios dos formulários de visitantes/participantes (edição, filtros, estados de erro).
  - Adicionar testes de integração leve para API routes críticas com Supabase local sem rede externa.
