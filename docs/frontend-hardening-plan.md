# Plano de Hardening do Frontend (`web/`)

Este documento transforma a arquitetura oficial do frontend em um plano de execucao incremental.

Objetivo:
- reduzir a propensao a bugs de hidratacao, loading, escrita client-side e regra de negocio espalhada na UI

Escopo:
- app web em `web/`
- foco inicial em formularios autenticados, CRUD admin e paginas com leitura sensivel

## Resultado esperado

Ao final das 3 fases, o frontend deve operar com estas garantias:

- fluxos criticos leem dados inicialmente no servidor
- mutacoes criticas passam por server actions ou API routes autenticadas
- formularios cliente obedecem um contrato unico de hidratacao e submit
- o browser nao concentra regra de negocio de dominio
- lint, testes e helpers compartilhados evitam regressao do padrao

## Fase 1 - Infraestrutura de formulario e guardrails

Objetivo:
- parar de reimplementar o mesmo contrato de formulario em cada tela

Status em 2026-03-17:
- concluida no escopo critico do `web`
- `ClientFormShell` virou o contrato padrao de hidratacao e submit para formularios cliente autenticados
- helpers compartilhados de Playwright e regras de lint ja cobrem os formularios mais sensiveis

Entregas:
- criar um shell padrao de formulario cliente
- centralizar helpers de Playwright para login, navegacao e espera de campos habilitados
- adicionar guardrails de lint para regressos obvios

Escopo sugerido:
- `web/src/lib/hooks/use-client-ready.ts`
- formularios cliente de auth, admin, reunioes, visitantes, participantes e GC
- `web/eslint.config.mjs`
- `web/tests/e2e/*`

Trabalho esperado:
- consolidar `useClientReady`, `fieldset disabled`, estado de submit, erro e acoes de rodape em um bloco reutilizavel
- remover duplicacao de login/navegacao/espera nas suites Playwright
- preparar regra de lint para:
  - sinalizar `useClientReady` sem bloqueio completo dos campos
  - desencorajar `getSupabaseBrowserClient()` em mutacoes criticas

Critério de saida:
- formularios criticos nao dependem so de botao desabilitado
- suites E2E relevantes usam helpers compartilhados
- o padrao de hidratacao fica visivel e reaplicavel

## Fase 2 - Migracao de mutacoes criticas para backend interno

Objetivo:
- retirar escrita critica e orquestracao de dominio de dentro dos componentes cliente

Status em 2026-03-17:
- concluida para os fluxos prioritarios definidos neste plano
- participantes, visitantes, edicao/criacao de reunioes, edicao de GC, configuracoes admin, series/licoes e conversao manual de visitante usam backend interno autenticado
- toggles de status de participante tambem sairam do Supabase browser direto

Entregas:
- migrar fluxos prioritarios para server actions ou API routes autenticadas
- extrair logica de dominio para modulos dedicados
- padronizar retorno de mutacao com sucesso, erro e destino pos-acao

Alvos prioritarios:
- participantes
- visitantes
- edicao de reunioes
- edicao de GC
- configuracoes administrativas

Sinais de que uma tela deve entrar nesta fase:
- usa browser Supabase para escrever dados de dominio
- o componente executa varias etapas de persistencia
- a UI faz cleanup relacional ou deduplicacao diretamente

Critério de saida:
- mutacoes criticas nao dependem de escrita direta no Supabase do browser
- regra de negocio deixa de ficar espalhada em componentes React
- testes cobrem os contratos de mutacao mais arriscados

## Fase 3 - Leitura server-first e camada intermediaria de qualidade

Objetivo:
- remover carregamento inicial sensivel do cliente e fechar o ciclo de qualidade do frontend

Status em 2026-03-19:
- concluida no escopo atual do `web`
- `admin/settings`, `admin/reports` e o admin de licoes/series operam em leitura server-first
- logout web autenticado passou a usar rota interna dedicada para evitar dependencia de redirect puramente client-side

Entregas:
- migrar paginas admin sensiveis para leitura server-first
- introduzir cobertura intermediaria para estados de UI e formularios
- padronizar navegacao e invalidacao apos mutacoes

Alvos iniciais:
- configuracoes admin
- relatorios admin
- outras telas autenticadas que ainda dependem de fetch critico em `useEffect`

Trabalho esperado:
- aplicar o padrao `page server-side + client wrapper`
- revisar `router.refresh`, `redirect` e invalidacao de cache por fluxo
- aumentar cobertura de estados de loading, erro, disabled e sucesso fora do E2E full

Critério de saida:
- paginas criticas nao dependem de fetch client-side para primeira renderizacao
- existe uma camada de validacao entre unit tests e Playwright full
- comportamento pos-submit fica consistente entre telas

Resultado obtido em 2026-03-19:
- leitura inicial sensivel do admin foi consolidada no servidor para settings, licoes/series e relatorios
- dashboard autenticado de lideranca tambem foi migrado para leitura server-first
- leituras de eventos compartilhadas entre area publica e admin foram extraidas para `src/lib/events/queries.ts`, removendo dependencia de paginas publicas em actions do admin
- logout deixou de depender apenas de `router.replace` no cliente e passou a usar `/api/auth/logout`
- a regressao desktop executada no fechamento desta fase ficou em `53 passed` e `3 skipped` no conjunto amplo de specs

## Backlog pos-hardening

O hardening principal foi concluido, mas ainda restam alvos arquiteturais para elevar a consistencia interna do `web`.

Esses itens devem entrar apenas depois de validar que o comportamento funcional atual continua estavel.

### 1. Consolidar leituras server-side restantes em modulos de dominio

Objetivo:
- reduzir heterogeneidade entre pages server-side que ainda consultam o Supabase diretamente

Escopo inicial sugerido:
- `web/src/app/(app)/admin/page.tsx`
- `web/src/app/(app)/gc/page.tsx`
- `web/src/app/(app)/gc/[id]/page.tsx`
- `web/src/app/(app)/meetings/page.tsx`
- `web/src/app/(app)/meetings/[id]/page.tsx`

Direcao:
- extrair consultas para `web/src/lib/<dominio>/queries.ts`
- deixar pages focadas em auth, redirect e composicao

### 2. Quebrar actions administrativas grandes em modulos menores de dominio

Objetivo:
- reduzir concentracao de regra de negocio e facilitar manutencao segura

Escopo inicial sugerido:
- `web/src/app/(app)/admin/actions.ts`
- `web/src/app/(app)/admin/growth-groups/actions.ts`

Direcao:
- separar operacoes por agregado ou caso de uso
- mover persistencia e orquestracao complexa para `web/src/lib/*`
- deixar actions como camada de entrada, autorizacao e invalidacao

### 3. Padronizar navegacao e invalidacao pos-mutacao

Objetivo:
- remover misturas arbitrarias entre `window.location.assign`, `router.replace`, `router.push` e `router.refresh`

Escopo inicial sugerido:
- formularios de reuniao
- formularios de participantes e visitantes
- fluxos de GC edit

Direcao:
- definir contrato por tipo de mutacao:
  - redirect server-side quando fizer sentido
  - `router.replace`/`router.push` para navegacao cliente
  - `router.refresh` apenas quando houver motivo claro de revalidacao
- evitar `window.location.assign` como padrao

### 4. Criar camada intermediaria real de teste de UI

Objetivo:
- reduzir dependencia exclusiva de Playwright full para validar estados de formulario e interacao

Escopo inicial sugerido:
- formularios criticos hoje cobertos apenas por E2E
- Storybook quase inexistente

Direcao:
- introduzir mais testes de componentes/interacao para estados `loading`, `disabled`, `error` e `success`
- expandir Storybook alem de `Hero.stories.tsx`

## Ordem recomendada

1. concluir a base de formularios e guardrails
2. migrar os fluxos de escrita com maior risco operacional
3. atacar paginas admin que ainda carregam estado inicial no cliente

## Politica de execucao

- toda feature nova ja nasce no padrao da arquitetura oficial
- manutencao em fluxo legada deve aproveitar a oportunidade para convergir para o padrao
- nao esperar a fase seguinte para corrigir um risco evidente da fase atual

## Definicao de pronto

Uma area pode ser considerada alinhada ao hardening quando:
- a leitura inicial relevante esta no servidor
- a escrita critica esta no backend interno
- o formulario cliente usa o contrato padronizado de hidratacao
- a regra de negocio principal nao vive mais no componente React
- a cobertura automatizada do fluxo e proporcional ao risco

## Relacao com outros documentos

- `docs/frontend-architecture.md`: define o padrao oficial
- `docs/onboarding.md`: explica quando e como aplicar o padrao no dia a dia
- `docs/web.md`: mostra onde os fluxos vivem no produto
