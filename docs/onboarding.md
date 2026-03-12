# Onboarding do Projeto

Este documento e o ponto de entrada do projeto para devs seniores e agentes de IA.

Objetivo: dar contexto suficiente para trabalhar com seguranca em poucos minutos, sem reexplicar stack basica. O leitor ja sabe programar, Next.js, TypeScript, Supabase e testes. O que falta aqui e contexto especifico do Carmelo App.

## Quando ler

Leitura obrigatoria:

- no inicio de toda sessao nova
- quando o agente perdeu contexto, recebeu contexto compactado ou entrou no projeto pela primeira vez
- antes de propor arquitetura, mudar fluxos criticos, mexer em RLS, seeds, auth ou testes

Leitura recomendada:

- antes de revisar PRs grandes
- antes de atualizar documentacao estrutural

## Contrato de uso

Se voce e um agente ou dev entrando sem contexto:

1. Leia este arquivo inteiro.
2. Leia `AGENTS.md`.
3. Leia apenas a documentacao especializada necessaria para a tarefa.
4. Ao terminar uma mudanca relevante, atualize este arquivo se alguma parte dele ficou desatualizada.

Este arquivo nao substitui a documentacao detalhada. Ele define o mapa, os invariantes e a ordem correta de leitura.

## TL;DR

- O runtime principal hoje e o web app em `web/`, nao o app Flutter descrito em partes antigas da documentacao.
- O backend real e Supabase local/remoto, com migrations em `supabase/migrations/`.
- Fluxos criticos de escrita no web usam rotas internas autenticadas, nao escrita direta do Supabase no browser.
- O setup local valido e: `supabase start`, `cd web && npm run db:reset`, `cd web && npm run db:seed-users`, `cd web && npm run dev`.
- A regressao minima antes de concluir trabalho no web e: `npm run lint`, `npm run type-check`, `npm test`. Para fluxos maiores, inclua `npm run build` e `npm run test:e2e:full`.
- Push em `main` executa CI no GitHub Actions e faz deploy automatico na Vercel quando `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` estiverem configurados como secrets.
- Inativacao e o fluxo canonico para retirada de usuarios e GCs na area admin. Nao faca exclusao fisica como caminho normal.
- A documentacao antiga sobre Flutter e historica/referencial. Para trabalho do dia a dia, trate `web/` + `supabase/` como o sistema ativo.

## O que e este projeto

Carmelo App e uma plataforma de gestao de igreja com foco em:

- grupos de crescimento (GCs)
- pessoas, membros, lideres e supervisores
- reunioes e presenca
- visitantes e conversao
- lições e series
- eventos
- area administrativa

Arquitetura ativa:

- frontend web em Next.js App Router
- banco e auth em Supabase
- testes unitarios e de contrato com Vitest
- testes de fluxo com Playwright

## Estado atual em 2026-03-08

O que esta consolidado:

- ambiente local com Supabase local
- validacao web estabilizada
- formularios criticos de reunioes e visitantes via API routes autenticadas
- suite unit, contract e e2e desktop passando
- lint via ESLint CLI, sem depender de `next lint`
- deploy automatico de producao na Vercel acoplado ao workflow `CI` em push para `main`
- usuarios inativos perdem acesso logico ao app mesmo que ainda exista conta no Supabase Auth
- GCs inativos deixam de contar para papeis derivados e RLS

O que ainda exige cuidado:

- parte da documentacao mais antiga ainda mistura contexto Flutter e web
- existe conhecimento historico no `memory-bank/`, mas ele nao deve competir com este onboarding como ponto de entrada
- RLS e seeds de teste precisam ser tratados com atencao ao mexer em migrations

## Mapa do repositorio

Pastas que importam no trabalho atual:

- `web/`: app Next.js, testes, scripts e configuracao de frontend
- `supabase/`: migrations, seeds e definicoes do banco
- `docs/`: documentacao operacional e arquitetural
- `specs/`: historico de escopo, decisoes e contratos por iniciativa
- `memory-bank/`: memoria persistente resumida do projeto

Pastas de contexto historico:

- `app/`: estrutura Flutter descrita no `AGENTS.md`; util como contexto de origem, nao como runtime principal atual

## Ordem de leitura recomendada

Leitura minima:

1. `docs/onboarding.md`
2. `AGENTS.md`

Leitura por tipo de tarefa:

- tarefa web: `docs/web.md` e `web/README.md`
- tarefa de teste: `docs/testing.md`
- tarefa de banco ou auth: `docs/supabase.md`
- tarefa de débitos técnicos: `docs/technical-debt.md`
- tarefa orientada a requisito: `specs/...` relevante
- tarefa sem contexto previo: `memory-bank/README.md`, `memory-bank/activeContext.md` e `memory-bank/decisionLog.md`

Evite ler tudo por padrao. Leia o minimo necessario para agir com precisao.

## Invariantes de dominio

Estes pontos quebram funcionalidades quando ignorados:

- Nomes tecnicos estao em ingles no banco e no codigo.
- Documentacao e comentarios podem ficar em pt-BR.
- `growth_group_participants` modela o relacionamento de pessoas com GCs.
- Um GC pode ter multiplos lideres e multiplos supervisores com a mesma autoridade.
- A distincao `co_leader` foi removida. Nao reintroduza esse papel.
- Papeis sao derivados de relacionamentos, nao de um campo estatico unico.
- Visitantes e pessoas compartilham a entidade base `people`.
- Em deduplicacao de visitante, e-mail tem prioridade; telefone so entra como fallback quando e-mail nao existe.
- Inativar usuario encerra seus vinculos ativos com GCs e remove seu acesso no app sem apagar historico.
- Inativar GC preserva historico, mas ele sai dos fluxos ativos e nao conta mais para papeis derivados.

## Invariantes de arquitetura

- Cliente Supabase no browser nao e a via preferencial para fluxos criticos de escrita.
- Formularios criticos da web devem usar API routes autenticadas ou server actions apropriadas.
- Validacao de ambiente deve falhar cedo no build.
- `middleware.ts` protege rotas autenticadas mesmo quando o ambiente esta mal configurado.
- Testes de contrato devem rodar isolados do ambiente `jsdom` e sem paralelismo agressivo.

## Bootstrap local correto

Na raiz:

```bash
supabase start
```

No `web/`:

```bash
npm install
npm run db:reset
npm run db:seed-users
npm run dev
```

Variaveis minimas em `web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` para scripts e alguns testes locais

Observacao operacional:

- prefira `cd web && npm run db:reset` ao comando cru `supabase db reset --local`; o wrapper do projeto aplica automaticamente o patch de compatibilidade do storage local quando o Supabase CLI falha ao listar buckets.

## Sequencia de validacao

Baseline para qualquer mudanca relevante no web:

```bash
cd web
npm run lint
npm run type-check
npm test
```

Quando mexer em build, auth, middleware, formularios criticos, rotas internas, seeds ou setup:

```bash
cd web
npm run build
npm run test:e2e:full
```

Deploy de producao:

- push/merge para `main` executa a workflow `CI`
- a job `Deploy Production` so roda depois da job `web` passar
- os secrets necessarios no GitHub sao `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`

## Onde ficam as verdades principais

Use esta prioridade quando houver conflito:

1. Codigo atual
2. Migrations e testes
3. Este onboarding
4. `docs/*.md`
5. `specs/*`
6. `memory-bank/*`

Se um documento contradiz o codigo, o documento esta desatualizado e deve ser corrigido.

## Way of work esperado

Antes de mudar codigo:

- descubra qual e a fonte de verdade da area
- confirme o fluxo real do usuario afetado
- identifique se o impacto e web, banco, auth, seed, teste ou documentacao

Durante a mudanca:

- mantenha a correcao local ao escopo
- preserve invariantes de dominio
- prefira ajustes verificaveis em vez de explicacoes abstratas
- se mudar comportamento de setup, fluxo ou arquitetura, atualize este onboarding

Antes de encerrar:

- rode validacao proporcional ao risco
- atualize docs tocadas pelo novo comportamento
- registre decisao relevante no `memory-bank/decisionLog.md` se ela afetar futuras sessoes
- se a mudanca alterar foco atual, padrao recorrente ou marco relevante, atualize tambem os arquivos correspondentes do `memory-bank/`
- se identificar ou assumir um debito tecnico duravel, registre-o em `docs/technical-debt.md`

## Politica de manutencao desta doc

Atualize este arquivo quando mudar qualquer um destes pontos:

- fluxo oficial de setup local
- comandos oficiais de validacao
- arquitetura principal ativa
- invariantes de dominio ou auth
- forma correta de testar a aplicacao
- ordem de leitura recomendada para novos agentes

Nao transforme este arquivo em dump de changelog. Ele deve continuar curto, prescritivo e confiavel.

## Checklist para agente sem contexto

- li `docs/onboarding.md`
- li `AGENTS.md`
- identifiquei a area afetada
- abri apenas os docs especializados relevantes
- confirmei o fluxo local correto antes de mexer
- sei quais testes preciso rodar

## Referencias diretas

- `AGENTS.md`
- `README.md`
- `docs/web.md`
- `docs/testing.md`
- `docs/supabase.md`
- `docs/technical-debt.md`
- `web/README.md`
- `memory-bank/activeContext.md`
- `memory-bank/decisionLog.md`
- `memory-bank/README.md`
