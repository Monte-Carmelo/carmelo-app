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
