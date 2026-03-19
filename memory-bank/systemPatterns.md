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
- arquitetura oficial do frontend web: Server-First App Router + Thin Client + BFF/server actions + form shell padronizado
- leitura inicial critica deve acontecer no servidor sempre que viavel
- leituras compartilhadas entre contextos do produto devem viver em modulos server-side por dominio, como `src/lib/<dominio>/queries.ts`
- paginas publicas ou compartilhadas nao devem importar `app/(app)/admin/**/actions` para leitura de dados
- logout autenticado no web deve preferir backend interno dedicado, nao depender apenas de navegacao client-side apos limpar sessao
- componentes cliente devem focar em interacao e nao concentrar regra de negocio de dominio
- formularios cliente endurecidos devem usar `ClientFormShell` como wrapper padrao para gate de hidratacao e submit
- formularios cliente com gate de hidratacao devem bloquear todos os campos ate o React assumir a tela
- deduplicacao de `people` em mutacoes de participantes e visitantes deve ser centralizada em helper compartilhado, nao reimplementada por fluxo
- filtros de soft delete so devem ser aplicados em tabelas que realmente possuem `deleted_at`
- browser Supabase deve ficar restrito, na pratica, a auth e sessao, salvo excecao documentada

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
