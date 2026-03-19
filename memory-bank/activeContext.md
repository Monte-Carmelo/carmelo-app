# Active Context

## Current State

- o runtime principal do projeto hoje e o web app em `web/`
- a infraestrutura de dados e auth vive em `supabase/`
- o onboarding canonico esta em `docs/onboarding.md`
- o `memory-bank/` atua como memoria persistente complementar

## Current Focus

- manter o fluxo de trabalho centrado em `docs/onboarding.md`
- preservar a estabilidade do setup local com Supabase local
- manter a validacao do web previsivel: lint, type-check, unit, contract, build e e2e

## Recent Structural Changes

- validacao web estabilizada em 2026-03-08
- fluxos criticos de reunioes e visitantes passaram a usar API routes autenticadas
- lint oficial do web migrado para ESLint CLI
- `docs/onboarding.md` foi criado como primeira leitura obrigatoria
- usuarios e GCs agora usam inativacao como fluxo canonico no admin
- funcoes de auth/RLS e a view `user_gc_roles` ignoram usuarios e GCs inativos
- `web/scripts/reset-db.ts` virou o caminho oficial para reset local do Supabase por causa de um bug do storage local no CLI
- a workflow agendada `E2E Full` agora usa o mesmo setup local do CI/PR, sem depender de Supabase externo
- admin de series/licoes no `web` foi endurecido em 2026-03-17 com leitura server-side, submit liberado so apos hidratacao e exclusao de serie preservando licoes como avulsas
- formularios cliente com `useClientReady` no `web` foram padronizados em 2026-03-17 para bloquear todos os campos ate a hidratacao e durante submit
- a arquitetura oficial do frontend web foi formalizada em 2026-03-17 como Server-First App Router + Thin Client + BFF/server actions + form shell padronizado
- o plano de hardening do frontend em 3 fases foi documentado em 2026-03-17 para convergencia incremental do legado
- a execucao do hardening do frontend foi concluida em 2026-03-19 com `ClientFormShell`, guardrails de lint, helpers E2E compartilhados e migracao das mutacoes criticas de participantes, visitantes, reunioes, GC edit, settings e conversao manual de visitante para backend interno autenticado
- `admin/settings`, `admin/reports` e os fluxos administrativos de licoes/series estao no padrao server-first
- o dashboard autenticado de lideranca tambem esta no padrao server-first via `web/src/lib/dashboard/queries.ts`
- leituras de eventos compartilhadas entre area publica e admin foram movidas para `web/src/lib/events/queries.ts`; paginas fora do admin nao dependem mais de `app/(app)/admin/events/actions.ts` para leitura
- logout autenticado no web agora usa rota interna dedicada (`/api/auth/logout`) para encerramento de sessao confiavel
- o backlog arquitetural pos-hardening foi registrado em `docs/frontend-hardening-plan.md` e `docs/technical-debt.md`; antes de atacar esses itens, a prioridade imediata e validar que o comportamento atual segue estavel

## Open Questions

- revisar periodicamente documentacao historica que ainda mistura contexto Flutter e web
- manter `AGENTS.md` alinhado com a arquitetura ativa real do repositorio

## Read Next When Needed

- `memory-bank/decisionLog.md`
- `memory-bank/systemPatterns.md`
