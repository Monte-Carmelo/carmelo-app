# Estratégia de testes e cobertura

- **Comandos principais**
  - `cd web && npm test` — roda unitários e contratos em sequência.
  - `cd web && npm run lint` — roda ESLint CLI com falha em qualquer warning.
  - `cd web && npm run test:unit -- --coverage` — gera cobertura focada em `src/app`, `src/components` e `src/lib`.
  - `cd web && npm run test:contract` — roda contratos em ambiente Node, serializados, contra o Supabase local.
  - `cd web && npm run test:e2e:full` — roda a bateria e2e desktop consolidada.
- **Pré-requisitos**
  - Supabase local ativo: `supabase start` (já configurado) e seeds via `web/scripts/seed-auth-users.ts` se precisar repovoar logins.
- **Prioridades de cobertura**
  1. Fluxos críticos autenticados (`/gc`, `/gc/[id]`, `/meetings/new`, `/visitors`, `/participants`).
  2. Componentes client com efeitos (listas, formulários, conversões) simulando Supabase via mocks.
  3. Páginas públicas e landing (já cobertas) apenas para regressão visual simples.
- **Técnicas de mock**
  - Para server components, mockar `getAuthenticatedUser` e `createSupabaseServerClient` retornando dados mínimos e `redirect` espiado.
  - Para client components, mockar `useSession`, `fetch` para rotas internas (`/api/meetings`, `/api/visitors`, `/api/growth-groups/...`) e rotas (`useRouter`, `useSearchParams`) para isolar navegação/refresh.
- **Notas operacionais**
  - Formularios críticos da web gravam via API routes autenticadas; os testes devem validar esse contrato, não escrita direta do Supabase no browser.
  - O `webServer` do Playwright suprime apenas `ExperimentalWarning` do Node 23 para manter a saída limpa.
- **Próximos alvos**
  - Cobrir `events` dashboard, `lessons` e cards de métricas no `/dashboard`.
  - Validar regras de negócios dos formulários de visitantes/participantes (edição, filtros, estados de erro).
  - Adicionar testes de integração leve para API routes críticas com Supabase local sem rede externa.
