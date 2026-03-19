# Arquitetura Oficial de Frontend (`web/`)

Este documento define o padrao arquitetural oficial para novas telas e para qualquer fluxo relevante que seja alterado no frontend web.

Escopo:
- app Next.js em `web/`
- especialmente CRUD administrativo, formularios autenticados e fluxos com impacto de dominio

Status:
- padrao oficial para desenvolvimento novo
- migracao incremental para fluxos legados

## Resumo executivo

O frontend web adota o seguinte padrao:

- **Server-First App Router** para leitura inicial de dados
- **Thin Client Boundary** para manter o browser focado em interacao e estado de UI
- **BFF / Server Actions** para mutacoes criticas
- **Form Shell Padronizado** para hidratacao, submit, erro e navegacao pos-acao
- **Guardrails Automatizados** via lint, testes e helpers compartilhados

Em termos praticos:
- leitura inicial critica deve acontecer no servidor
- escrita critica nao deve depender de escrita direta no Supabase do browser
- componentes cliente nao devem concentrar regra de negocio
- formularios cliente devem bloquear os campos ate a hidratacao terminar
- browser Supabase deve ficar restrito, na pratica, a auth e sessao, salvo excecao documentada

## Objetivos

- reduzir bugs de loading, hidratacao e estado inconsistente
- tornar telas admin previsiveis e mais faceis de revisar
- diminuir a quantidade de regra de negocio espalhada em componentes React
- facilitar testes e evolucao de UX sem reabrir decisoes basicas a cada feature

## Camadas oficiais

### 1. Leitura server-first

Para paginas autenticadas e fluxos criticos, a primeira leitura de dados deve acontecer em server components, layouts server-side ou funcoes server-side equivalentes.

Use este padrao quando:
- a tela e administrativa
- a tela edita ou remove dados de dominio
- a primeira renderizacao precisa ser consistente para evitar spinner preso ou UI vazia
- o dado precisa respeitar auth, papeis e redirecionamento antes do cliente carregar

Consequencias:
- o browser recebe a tela ja com o estado inicial correto
- o loading inicial nao depende de `useEffect`
- a rota fica mais previsivel em refresh, navegacao direta e deploys lentos

Padrao de organizacao:
- leituras compartilhadas entre area publica e area admin devem viver em modulos server-side por dominio, como `src/lib/<dominio>/queries.ts`
- paginas fora da area admin nao devem importar `app/(app)/admin/**/actions` para carregar dados
- actions do admin devem ficar restritas a mutacoes admin-only ou a orquestracao explicitamente administrativa

### 2. Cliente fino

Componentes cliente existem para:
- interacao
- estado efemero de UI
- composicao visual
- controles locais de formulario
- feedback de submit, erro e navegacao

Componentes cliente nao devem:
- montar o carregamento inicial critico da tela
- concentrar orquestracao complexa de regras de negocio
- escrever diretamente em tabelas criticas pelo cliente quando houver alternativa server-side

Regra pratica:
- se o componente esta decidindo varias etapas de persistencia, deduplicacao, cleanup relacional ou revalidacao, a responsabilidade esta na camada errada

### 3. Mutacoes via backend interno

Toda mutacao critica deve passar por uma destas vias:

- **server actions**
- **API routes internas autenticadas**

Escolha server action quando:
- o fluxo nasce de um formulario ou acao do App Router
- a escrita e diretamente ligada a uma pagina ou recurso do proprio app

Escolha API route interna quando:
- o cliente precisa carregar opcoes dinamicas durante a interacao
- a mutacao precisa de contrato HTTP interno mais explicito
- o mesmo endpoint sera reutilizado por mais de um fluxo cliente

Evite para fluxos criticos:
- escrita direta no Supabase usando browser client

Uso aceitavel do browser client:
- auth e sessao
- interacoes explicitamente locais e de baixo risco
- casos excepcionais documentados em que nao existe impacto de consistencia relevante

### 4. Form Shell padronizado

Formularios cliente devem seguir um contrato unico.

Obrigatorio:
- usar um gate de hidratacao como `useClientReady`
- envolver os campos em `fieldset disabled={!isClientReady || isSubmitting}` com `className="contents"`
- nao liberar apenas o botao de submit
- tratar erro, submit pendente e navegacao pos-sucesso de forma previsivel

Racional:
- inputs habilitados antes da hidratacao permitem digitacao que o React ainda nao assumiu
- isso gera perda de valor, submits inconsistentes e flakiness em E2E

Contrato esperado do formulario:
- estado inicial seguro
- campos indisponiveis ate a hidratacao terminar
- campos indisponiveis durante submit
- feedback claro de erro
- fluxo deterministico de sucesso

### 5. Servicos e funcoes de dominio

Regra de negocio compartilhada deve sair dos componentes e viver em:
- server actions
- `src/lib/api/*`
- `src/lib/<dominio>/queries.ts`
- `src/lib/supabase/mutations/*`
- modulos server-side equivalentes

Exemplos de logica que nao deve ficar na UI:
- deduplicacao de pessoas
- atualizacao em cascata
- reordenacao persistida
- cleanup relacional
- regras de preservacao de entidades filhas

Regra de fronteira:
- se uma leitura atende mais de uma area do produto, ela nao pertence a um modulo de tela
- modulos em `app/(app)/admin/**/actions` nao sao dependencia valida para paginas publicas ou compartilhadas

### 6. Navegacao e invalidacao

Apos mutacoes:
- prefira `redirect`, `router.push`, `router.replace` e `router.refresh` de forma explicita
- invalide ou recarregue o estado de forma coerente com a origem do dado
- nao confie em estado local otimista como unica fonte de verdade para CRUD admin

### 7. Guardrails obrigatorios

Este padrao precisa ser sustentado por automacao.

Guardrails desejados e, quando disponiveis, obrigatorios:
- lint com regras de projeto
- helpers compartilhados de Playwright
- testes unitarios e de contrato para logica de dominio
- e2e para fluxos criticos completos

Regra de teste para formularios hidratados:
- Playwright deve esperar campos `enabled`, nao apenas `visible`

## Matriz de decisao rapida

### Nova pagina admin com CRUD

Use:
- page server-side para leitura inicial
- client component apenas para interacao
- server action ou API interna para persistencia

Nao use:
- fetch inicial critico em `useEffect`
- escrita direta do browser no Supabase

### Formulario autenticado simples

Use:
- shell padronizado de formulario
- hidratacao bloqueando todos os campos
- mutacao via server action ou rota interna quando houver escrita de dominio

### Carregamento dinamico de opcoes dependentes

Use:
- API interna autenticada
- componente cliente apenas para UX

### Leitura realmente local e nao critica

Pode usar:
- estado cliente
- browser client

Condicao:
- o caso deve ser de baixo risco e sem impacto relevante de consistencia

## Checklist para novas telas

Antes de implementar:
- a leitura inicial precisa acontecer no servidor?
- a mutacao mexe em dominio critico?
- o componente cliente esta assumindo regra de negocio demais?

Durante a implementacao:
- a pagina carrega sem depender de `useEffect` para o estado inicial?
- a escrita passa por server action ou API interna?
- o formulario bloqueia todos os campos ate a hidratacao?
- o fluxo de sucesso invalida ou redireciona corretamente?

Antes de concluir:
- existe cobertura unit, contract ou e2e proporcional ao risco?
- o fluxo foi validado com refresh e navegacao direta?
- a documentacao continua coerente com a implementacao?

## Politica de migracao

O repositorio ainda esta em estado hibrido.

Isso significa:
- nem toda tela legada ja segue este padrao
- toda tela nova deve seguir o padrao oficial
- toda manutencao relevante em fluxo legada deve aproveitar para convergir para este modelo

Prioridade de migracao:
1. CRUD admin e formularios criticos
2. fluxos autenticados com escrita direta no browser
3. paginas com leitura inicial client-side em areas sensiveis

## Relacao com outros documentos

- `docs/onboarding.md`: ponto de entrada e invariantes operacionais
- `docs/web.md`: mapa funcional da aplicacao
- `docs/frontend-hardening-plan.md`: plano de execucao em 3 fases para convergir o legado
