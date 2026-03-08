# Memory Bank

O `memory-bank/` existe para preservar contexto entre sessoes.

Ele nao substitui o codigo, os testes ou o `docs/onboarding.md`. Ele funciona como memoria persistente complementar para devs e agentes de IA.

## Ordem de leitura

Quando houver pouco ou nenhum contexto:
1. `docs/onboarding.md`
2. `AGENTS.md`
3. `memory-bank/activeContext.md`
4. `memory-bank/decisionLog.md`
5. Outros arquivos do `memory-bank/` apenas se forem necessarios

## Quando usar

Leia o `memory-bank/`:
- no inicio de uma sessao sem contexto
- quando a tarefa depender de decisoes arquiteturais passadas
- quando houver suspeita de regressao de padroes ja acordados
- quando a documentacao atual parecer incompleta, contraditoria ou historica demais

Atualize o `memory-bank/`:
- ao tomar uma decisao duravel que afeta futuras sessoes
- ao consolidar uma mudanca estrutural importante
- ao fechar um marco relevante do projeto
- ao identificar uma mudanca de foco ou prioridade que outras sessoes precisam saber

## O que vai em cada arquivo

- `activeContext.md`
  - estado atual do projeto
  - foco do momento
  - riscos, pendencias e questoes em aberto

- `decisionLog.md`
  - decisoes duraveis
  - racional tecnico
  - impacto esperado

- `productContext.md`
  - objetivo do produto
  - capacidades centrais
  - contexto de dominio relativamente estavel

- `systemPatterns.md`
  - padroes recorrentes de arquitetura, codigo e testes
  - convencoes que devem ser reaplicadas

- `progress.md`
  - marcos concluidos
  - trabalho em andamento
  - proximos passos de alto nivel

## O que nao registrar aqui

Nao use o `memory-bank/` para:
- changelog detalhado
- dump de diff ou lista de arquivos alterados
- log de investigacao temporaria
- instrucoes que pertencem ao onboarding
- informacoes que ja estao melhores no codigo, migrations ou testes

## Politica de qualidade

Cada entrada deve ser:
- curta
- verificavel
- orientada a decisoes futuras
- livre de ruido operacional desnecessario

Se uma informacao envelhecer, atualize ou remova. Memoria persistente ruim e pior que ausencia de memoria.
