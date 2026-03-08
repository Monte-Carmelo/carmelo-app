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
   supabase start
   npm run lint
   npm run type-check
   npm run test
   npm run test:e2e -- --list
   ```

O comando `npm run build` agora faz uma pré-validação e falha cedo caso `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estejam definidos.

## Scripts principais
- `npm run dev`: inicia o servidor Next.js em modo desenvolvimento (porta 3000).
- `npm run build`: gera o build de produção.
- `npm run start`: inicia o servidor em modo produção após o build.
- `npm run lint`: roda ESLint CLI (`eslint . --max-warnings=0`).
- `npm run test`: executa a sequência local completa de testes unitários e de contrato.
- `npm run test:unit`: executa a suíte unitária em `jsdom`.
- `npm run test:contract`: executa testes de contrato contra o Supabase local em ambiente Node e de forma serial.
- `npm run test:e2e`: executa Playwright (projetos desktop e mobile). Defina `E2E_SUPABASE_EMAIL` e `E2E_SUPABASE_PASSWORD` com credenciais válidas para login automático.
- `npm run test:e2e:full`: executa a bateria e2e desktop usada para validação completa local.
- `npm run storybook`: sobe o Storybook com builder Vite.
- `npm run build-storybook`: gera Storybook estático em `web/storybook-static/`.
- `npm run test:stories`: roda `@storybook/test-runner` contra o build estático.
- `npm run type-check`: validação de tipos TypeScript.

## Estrutura
- `src/app`: rotas App Router (Next.js 14) com layout global e providers.
- `src/components`: componentes reutilizáveis (ex.: `landing/Hero`).
- `src/lib`: utilitários compartilhados (Supabase, env, hooks, API).
- `tests/e2e`: cenários Playwright validados contra o fluxo local com Supabase.
- `.storybook`: configuração Storybook (builder Vite, addons essenciais).

## Observações
- Playwright já está configurado com projetos `chromium-desktop` e `chromium-mobile`; use `npx playwright install` após instalar dependências.
- Scripts e2e removem `NO_COLOR` e o `webServer` do Playwright suprime o `ExperimentalWarning` do Node 23 para reduzir ruído.
- Tipos do Supabase estão em `src/lib/supabase/types.ts` (gerados manualmente a partir das migrations).
- Formulários críticos (`MeetingForm`, `VisitorForm`) usam API routes autenticadas para escrita e leitura dinâmica, em vez de acesso direto ao Supabase no browser.
- Storybook utiliza builder Vite para compatibilidade com Next 15; o build gera logs sobre módulos Node externados — são avisos esperados.

Consulte `specs/001-crie-um-app/web-stack-decisions.md` para detalhes de stack e racional.
