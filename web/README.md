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
   npm run test:e2e -- --list
   ```

## Scripts principais
- `npm run dev`: inicia o servidor Next.js em modo desenvolvimento (porta 3000).
- `npm run build`: gera o build de produção.
- `npm run start`: inicia o servidor em modo produção após o build.
- `npm run lint`: roda ESLint com as regras do Next.js.
- `npm run test`: executa testes unitários com Vitest + Testing Library.
- `npm run test:e2e`: executa Playwright (projetos desktop e mobile). Defina `E2E_SUPABASE_EMAIL` e `E2E_SUPABASE_PASSWORD` com credenciais válidas para login automático.
- `npm run storybook`: sobe o Storybook com builder Vite.
- `npm run build-storybook`: gera Storybook estático em `web/storybook-static/`.
- `npm run test:stories`: roda `@storybook/test-runner` contra o build estático.
- `npm run type-check`: validação de tipos TypeScript.

## Estrutura
- `src/app`: rotas App Router (Next.js 14) com layout global e providers.
- `src/components`: componentes reutilizáveis (ex.: `landing/Hero`).
- `src/lib`: utilitários compartilhados (Supabase, env, hooks, API).
- `tests/e2e`: cenários Playwright (sprints futuras).
- `.storybook`: configuração Storybook (builder Vite, addons essenciais).

## Observações
- Playwright já está configurado com projetos `chromium-desktop` e `chromium-mobile`; use `npx playwright install` após instalar dependências.
- Tipos do Supabase estão em `src/lib/supabase/types.ts` (gerados manualmente a partir das migrations).
- Storybook utiliza builder Vite para compatibilidade com Next 15; o build gera logs sobre módulos Node externados — são avisos esperados.

Consulte `specs/001-crie-um-app/web-stack-decisions.md` para detalhes de stack e racional.
