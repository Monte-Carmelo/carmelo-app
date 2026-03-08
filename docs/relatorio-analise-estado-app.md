# Relatório de análise do estado atual do app

Data da análise: 2026-03-07

## Escopo
Foi feita uma validação do estado atual da aplicação web (`web/`) com foco em:
- qualidade estática (lint e type-check);
- testes automatizados (unitários/contrato/e2e smoke);
- build de produção;
- riscos de segurança de dependências.

## Ambiente e comandos executados
1. `npm install` (web)
2. `npm run lint` (web)
3. `npm run type-check` (web)
4. `npm test` (web)
5. `npm run build` (web)
6. `npm audit --omit=dev` (web)
7. `npm run test:e2e:smoke` (web)
8. `npx playwright install chromium` e `npx playwright install-deps chromium` (web)
9. `npm run test:e2e:smoke` (reexecução após instalação do browser)

## Resultado geral
- **Lint:** aprovado.
- **Type-check:** aprovado.
- **Testes unitários:** aprovados.
- **Testes de contrato:** todos marcados como *skipped* por indisponibilidade do Supabase local.
- **Build de produção:** falhou por variáveis de ambiente obrigatórias não definidas.
- **E2E smoke:** 1 teste aprovado e 1 teste falhou.

## Problemas encontrados

### 1) Build de produção quebra sem variáveis de ambiente do Supabase
**Sintoma:** `npm run build` falha no prerender de `/visitors/new` com erro: `Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.`

**Impacto:** alto. Impede geração de build de produção em ambientes sem configuração explícita dessas variáveis (CI/CD e novos ambientes locais).

**Evidência:** erro ocorreu na etapa de `Generating static pages` durante `next build`.

**Recomendação:**
- Garantir configuração obrigatória das variáveis no pipeline e documentação de bootstrap.
- Adicionar validação mais cedo no processo (prebuild script) para falhar rápido com mensagem amigável.

### 2) Smoke test de rota protegida falha (não redireciona para `/login`)
**Sintoma:** o teste `rota protegida redireciona para login quando desautenticado` esperava URL `/login`, mas a URL permaneceu em `/dashboard`.

**Impacto:** alto. Comportamento de proteção de rota não está consistente no cenário atual de execução de e2e.

**Evidência:** falha em `tests/e2e/smoke.spec.ts` na asserção `expect(page).toHaveURL(/\/login/)`.

**Possível causa observada durante execução:** no log do servidor aparece exceção de configuração do Supabase (`Supabase não configurado`), o que pode interromper o fluxo normal de redirecionamento.

**Recomendação:**
- Garantir ambiente mínimo do e2e com variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` válidas.
- Ajustar tratamento de erro da rota protegida para fallback explícito ao login quando não houver sessão.

### 3) Cobertura de testes de contrato indisponível no ambiente atual
**Sintoma:** testes de contrato foram todos *skipped* com aviso para executar `supabase start`.

**Impacto:** médio. Regressões de integração com banco/RLS podem passar despercebidas neste ambiente.

**Evidência:** suíte reportou Supabase inacessível (`http://127.0.0.1:54321`) e não foi possível executar os cenários de contrato.

**Recomendação:**
- Incluir Supabase CLI no ambiente de desenvolvimento/CI e subir stack local antes dos testes de contrato.

### 4) Vulnerabilidades em dependências de produção
**Sintoma:** `npm audit --omit=dev` reportou 2 vulnerabilidades (1 alta e 1 crítica), incluindo advisories para `next` e `minimatch`.

**Impacto:** alto (segurança).

**Recomendação:**
- Atualizar `next` para versão corrigida sugerida pelo audit e validar compatibilidade.
- Aplicar `npm audit fix` (ou atualização manual controlada) e rodar regressão de build + testes.

## Conclusão
O app está com base saudável em lint, tipagem e testes unitários, mas **não está pronto para um fluxo confiável de validação completa** no ambiente atual devido a:
1. dependência rígida de variáveis do Supabase sem pré-validação de build;
2. falha de comportamento na rota protegida no smoke e2e;
3. ausência de Supabase local para validar contratos;
4. pendências críticas de segurança em dependências.
