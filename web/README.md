# Carmelo Web (Next.js)

Aplicação web responsiva (mobile-first) para gestão de Grupos de Crescimento, baseada nos requisitos da iniciativa `001-crie-um-app`.

## Pré-requisitos
- Node.js 20+
- npm 10+
- Variáveis ambiente definidas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Configuração
1. Copie o arquivo `.env.example` para `.env.local` e preencha as chaves do Supabase.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Execute os checks locais:
   ```bash
   npm run lint
   npm run test
   ```

## Scripts principais
- `npm run dev`: inicia o servidor Next.js em modo desenvolvimento (porta 3000).
- `npm run build`: gera o build de produção.
- `npm run start`: inicia o servidor em modo produção após o build.
- `npm run lint`: roda ESLint com as regras do Next.js.
- `npm run test`: executa testes unitários com Vitest + Testing Library.
- `npm run test:e2e`: executa a suíte E2E com Playwright (placeholder, requer cenários).
- `npm run type-check`: validação de tipos TypeScript.

## Estrutura
- `src/app`: rotas App Router (Next.js 14) com layout global e providers.
- `src/lib`: utilitários compartilhados (Supabase, env, etc.).
- `src/app/docs/roadmap`: visão inicial dos incrementos planejados (Sprints 1-3).

## Próximos passos
- Integrar autenticação com Supabase (email/senha) usando `@supabase/ssr`.
- Implementar layout autenticado e fluxos do dashboard do líder.
- Adicionar Storybook e testes E2E conforme roadmap.

Consulte `specs/001-crie-um-app/web-stack-decisions.md` para detalhes de stack e racional.
