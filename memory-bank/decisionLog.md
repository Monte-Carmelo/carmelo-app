# Decision Log

## 2025-10-20 - Inicializar o Memory Bank

### Decision

Criar uma camada de memoria persistente no repositorio para registrar contexto de produto, padroes, progresso e decisoes.

### Rationale

O projeto precisava reduzir perda de contexto entre sessoes e facilitar onboarding de novas pessoas.

### Lasting Impact

Passamos a ter um lugar dedicado para contexto transversal, separado de specs e documentacao operacional.

## 2025-10-20 - Implementar o sistema de eventos

### Decision

Implementar um sistema completo de eventos com administracao e visualizacao no produto.

### Rationale

Eventos sao parte relevante da operacao da igreja e exigiam CRUD, visualizacao e suporte a banners.

### Lasting Impact

O dominio do projeto passou a incluir `events`, storage associado e rotas/telas administrativas e de listagem.

## 2026-03-08 - Tornar `docs/onboarding.md` o ponto de entrada canonico

### Decision

Definir `docs/onboarding.md` como primeira leitura obrigatoria para devs e agentes sem contexto.

### Rationale

O repositorio acumulou contexto em muitos lugares. Era necessario um ponto de entrada curto, confiavel e sempre atualizavel.

### Lasting Impact

`AGENTS.md` e a documentacao passaram a apontar primeiro para o onboarding. O `memory-bank/` deixou de competir como entrada principal.

## 2026-03-08 - Tratar o `memory-bank/` como memoria complementar governada

### Decision

Padronizar o `memory-bank/` com protocolo de uso, escopo por arquivo e gatilhos claros de leitura e atualizacao.

### Rationale

Sem governanca, memoria persistente vira arquivo morto ou dump historico pouco confiavel.

### Lasting Impact

O `memory-bank/` passa a servir sessoes futuras com menos ambiguidade e menor custo de manutencao.

## 2026-03-08 - Manter temporariamente `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Decision

Manter o nome legado `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `web/` por enquanto, mesmo com o projeto usando uma chave `sb_publishable_...` do Supabase moderno.

### Rationale

O deploy atual precisa de continuidade e o rename agora aumentaria o escopo sem destravar mais valor imediato. O valor tecnico da chave publica continua correto; o problema esta no nome da variavel.

### Lasting Impact

Existe um debito tecnico documentado no inventario central do projeto: `TD-001` em `docs/technical-debt.md`. O nome da env publica de Supabase esta desatualizado e deve ser migrado no futuro para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, idealmente com periodo de compatibilidade entre os dois nomes.

## 2026-03-12 - Padronizar deploy automatico de producao via GitHub Actions + Vercel

### Decision

Acoplar o deploy de producao ao workflow `CI`, com publicacao automatica na Vercel apenas em push para `main` e somente apos lint, type-check, testes e build passarem.

### Rationale

Com o repositorio publico, o caminho de release precisava ficar reproduzivel, auditavel e dependente de secrets gerenciados fora do codigo versionado.

### Lasting Impact

O fluxo oficial de publicacao passa a depender dos secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` no GitHub. Releases de producao deixam de depender de deploy manual como caminho principal.

## 2026-03-12 - Tratar retirada de usuarios e GCs como inativacao

### Decision

Padronizar a area administrativa para inativar usuarios e GCs, em vez de exclui-los fisicamente como fluxo normal.

### Rationale

Os registros precisam preservar historico, e a exclusao fisica de usuario conflita com integridade de relacoes e auditoria. Alem disso, GCs inativos nao podem continuar contando para papeis derivados ou RLS.

### Lasting Impact

Usuarios inativos passam a perder acesso logico ao app mesmo que a conta ainda exista no Supabase Auth. GCs inativos deixam de participar da derivacao de papeis e das funcoes auxiliares de auth/RLS. Acoes admin e UX devem usar o termo e o comportamento de inativacao como padrao.

## 2026-03-12 - Padronizar reset local do Supabase via wrapper do projeto

### Decision

Tratar `cd web && npm run db:reset` como comando oficial de reset local, em vez de depender diretamente de `supabase db reset --local`.

### Rationale

O Supabase CLI 2.75.0 falha localmente ao listar buckets de storage por incompatibilidade de tipos entre `storage.buckets.id` e `storage.buckets_analytics.id`. O wrapper do projeto detecta esse caso, aplica um patch local de compatibilidade e valida o endpoint de storage antes de concluir.

### Lasting Impact

Setup local e scripts de reset passam a depender do wrapper versionado no repositório. A documentação operacional deve apontar para esse comando como caminho padrão enquanto o bug do stack local existir.

## 2026-03-13 - Alinhar a workflow `E2E Full` ao Supabase local do projeto

### Decision

Remover a dependencia de secrets `E2E_*` e de um ambiente Supabase externo na workflow agendada `E2E Full`, fazendo-a subir Supabase local, resetar o banco e semear usuarios de auth como as validacoes de CI e PR.

### Rationale

O repositório já tem seeds, credenciais locais estáveis e um fluxo oficial de validação baseado em Supabase local. Manter a workflow agendada apontando para um ambiente externo inexistente só produzia falhas de configuração e escondia regressões reais da suíte Playwright.

### Lasting Impact

O caminho oficial de E2E no GitHub Actions passa a ser autossuficiente e reproduzível sem infraestrutura adicional. Secrets de Actions ficam restritos ao deploy da Vercel, e a diferença entre PR, CI e E2E agendado deixa de ser uma fonte de inconsistência.

## 2026-03-13 - Atualizar workflows para actions compativeis com Node 24

### Decision

Atualizar os workflows para `actions/checkout@v6`, `actions/setup-node@v6` e `actions/upload-artifact@v6`, e substituir `supabase/setup-cli@v1` pela execucao suportada do Supabase CLI via `npx --yes supabase`.

### Rationale

Os warnings de deprecacao do GitHub Actions vinham de actions ainda executadas em Node 20. Para eliminar o ruido e evitar quebra futura no runner hospedado, o caminho mais seguro era migrar para as majors atuais compativeis com Node 24 e remover a dependencia de um action de terceiro que ainda emitia o warning. A tentativa de instalar o Supabase CLI globalmente via npm falhou porque o proprio CLI nao suporta esse modo; o fluxo oficial suportado e via `npx` ou dependencia local.

### Lasting Impact

Os workflows deixam de depender de runtimes JavaScript deprecated e passam a invocar o Supabase CLI pelo caminho suportado pelo fornecedor. O CI continua com o mesmo comportamento funcional, mas sem os warnings de Node 20 que estavam poluindo os runs.

## 2026-03-17 - Endurecer o admin de series e licoes no web

### Decision

Padronizar criacao e edicao de series/licoes com carregamento server-side, server actions para escrita critica e hidratacao completa antes de liberar interacao de formulario. Na exclusao de serie, as licoes vinculadas devem ser preservadas como licoes avulsas.

### Rationale

O fluxo antigo misturava leitura/escrita client-side, ficava sujeito a travamentos de loading e aceitava digitacao antes da hidratacao do React, o que fazia campos perderem valor no submit. Alem disso, excluir uma serie escondia suas licoes em vez de preserva-las como o produto prometia.

### Lasting Impact

As telas administrativas de licoes e series passam a seguir o padrao seguro ja adotado em outros fluxos criticos do web. Exclusao de serie deixa de gerar licoes "orfãs invisiveis", e a suite E2E cobre criacao, edicao, reordenacao, exclusao e preservacao das licoes apos remover uma serie.
