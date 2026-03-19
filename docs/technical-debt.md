# Débitos Técnicos

Inventário central de débitos técnicos ativos do projeto.

## Como usar

- Registre aqui débitos técnicos duráveis e ainda abertos.
- Use `memory-bank/decisionLog.md` para explicar a decisão e o racional.
- Use docs específicas (`docs/supabase.md`, `docs/web.md`, etc.) apenas para contextualizar localmente e apontar para este inventário.
- Quando um débito for resolvido, remova ou marque claramente como encerrado.

## Formato recomendado

- `ID`
- `Título`
- `Área`
- `Status`
- `Impacto`
- `Contexto`
- `Próximo passo`

## Abertos

### TD-001 - Nome legado para a chave pública do Supabase

- Área: `web`, `deploy`, `supabase`
- Status: aberto
- Impacto: médio
- Contexto:
  - O projeto ainda usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` como nome de variável de ambiente pública.
  - O Supabase atual usa conceitualmente `publishable key`, e a chave recebida no deploy é `sb_publishable_...`.
  - Hoje isso funciona tecnicamente, mas o nome induz confusão operacional e aumenta risco de configuração incorreta.
- Próximo passo:
  - aceitar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no código
  - manter compatibilidade temporária com `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - migrar documentação e exemplos
  - remover o nome antigo após janela de transição

### TD-002 - Heterogeneidade residual na camada server-side do frontend

- Área: `web`, `frontend`
- Status: aberto
- Impacto: médio
- Contexto:
  - O hardening principal do frontend foi concluído, e os fluxos mais críticos já estão em `Server-First App Router + Thin Client + BFF/server actions`.
  - Ainda existem pages server-side que consultam o Supabase diretamente em vez de convergir para módulos reutilizáveis em `web/src/lib/<dominio>/queries.ts`.
  - Isso não está quebrado, mas mantém a arquitetura internamente desigual e dificulta revisão, reuso e testes.
- Próximo passo:
  - extrair leituras server-side remanescentes de `admin`, `gc` e `meetings` para módulos de domínio
  - deixar pages focadas em auth, redirect e composição
  - usar `docs/frontend-hardening-plan.md` como backlog operacional dessa convergência

### TD-003 - Actions administrativas ainda monolíticas

- Área: `web`, `frontend`, `admin`
- Status: aberto
- Impacto: médio
- Contexto:
  - Parte importante da arquitetura já saiu do browser, mas ainda existem actions grandes demais, especialmente em `web/src/app/(app)/admin/actions.ts` e `web/src/app/(app)/admin/growth-groups/actions.ts`.
  - Essas actions concentram persistência, orquestração de domínio, cleanup relacional e regras administrativas num volume alto de código.
  - Isso aumenta custo de manutenção e deixa futuras mudanças mais arriscadas do que o necessário.
- Próximo passo:
  - quebrar actions grandes por agregado ou caso de uso
  - mover lógica de domínio e persistência complexa para módulos menores em `web/src/lib/*`
  - manter as actions como camada de entrada, autorização e invalidação

### TD-004 - Navegação pós-mutação ainda inconsistente no frontend

- Área: `web`, `frontend`, `ux`
- Status: aberto
- Impacto: médio
- Contexto:
  - O projeto ainda mistura `window.location.assign`, `router.replace`, `router.push` e `router.refresh` em formulários e fluxos semelhantes.
  - Isso não impede o funcionamento atual, mas dificulta previsibilidade, padronização de UX e revisão arquitetural.
- Próximo passo:
  - definir contrato por tipo de mutação para navegação e invalidação
  - reduzir o uso de `window.location.assign` como fallback genérico
  - revisar primeiro os fluxos de reuniões, participantes, visitantes e GC edit

### TD-005 - Falta de camada intermediária de teste de UI

- Área: `web`, `frontend`, `testes`
- Status: aberto
- Impacto: médio
- Contexto:
  - O projeto já tem boa cobertura unitária, de contrato e E2E, mas ainda quase não usa Storybook nem testes de interação de componentes.
  - Hoje existe um salto grande entre validar lógica isolada e validar o fluxo inteiro com Playwright.
  - Isso torna mais caro testar estados de `loading`, `disabled`, `error` e `success` de formulários e componentes críticos.
- Próximo passo:
  - expandir Storybook além de `web/src/components/landing/Hero.stories.tsx`
  - adicionar testes de componentes/interação para formulários e estados críticos
  - usar essa camada intermediária para reduzir dependência exclusiva de E2E full
