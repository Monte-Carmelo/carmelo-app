# System Patterns

## Documentation Pattern

- `docs/onboarding.md` e o ponto de entrada canonico do projeto
- `AGENTS.md` complementa o onboarding com regras do repositorio
- `memory-bank/` preserva contexto entre sessoes, mas nao substitui onboarding, codigo ou testes

## Architecture Pattern

- runtime principal atual em `web/` + `supabase/`
- Next.js App Router no frontend web
- Supabase como backend, auth e banco
- fluxos criticos de escrita no web priorizam API routes autenticadas ou server actions apropriadas

## Domain Pattern

- nomes tecnicos em ingles no codigo e banco
- documentacao em pt-BR
- multiplos lideres e supervisores por GC com mesma autoridade
- `co_leader` removido; nao reintroduzir
- `people` como entidade base compartilhada

## Testing Pattern

- lint via ESLint CLI no `web`
- unitarios e contratos via Vitest
- contratos em ambiente Node e sem paralelismo agressivo
- fluxos completos validados via Playwright

## Update Pattern

- se um padrao precisar ser reaplicado em varias tarefas futuras, registre aqui
- se a informacao for apenas temporaria ou local a uma tarefa, nao registre aqui
