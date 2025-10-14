# Pesquisa Técnica: Plataforma Web de Gestão de Grupos de Crescimento

**Feature**: 001-crie-um-app  
**Data**: 2025-10-04  
**Referência cruzada**: [plan.md](./plan.md) | [data-model.md](./data-model.md)

## Resumo Executivo

Consolidamos aqui as decisões técnicas para implementar uma aplicação web responsiva (mobile-first) baseada em **Next.js 14 + Supabase**. Os objetivos centrais permanecem: (1) entrega rápida de valor para líderes e supervisores, (2) segurança de dados via RLS, (3) escalabilidade da hierarquia organizacional, (4) suporte a fluxos críticos mesmo com conectividade instável.

---

## 1. Next.js + Supabase Integration

### Decisão
Utilizar **Supabase JS Client v2** com o pacote `@supabase/ssr` para compartilhar sessão entre rotas server e client. Autenticação email/senha (Supabase Auth) permanece como mecanismo oficial.

### Rationale
- **SSR + Edge friendly**: `createServerClient` lê/grava cookies automaticamente, permitindo proteger rotas sensíveis sem reinventar auth.
- **Menos boilerplate**: Supabase fornece PostgREST, RPC e Realtime já prontos, reduzindo esforço de backend.
- **Consistência com RLS**: Todo acesso passa por policies existentes no banco; não duplicamos regras no frontend.

### Alternativas
| Alternativa | Razão para rejeição |
|-------------|--------------------|
| Backend custom (Node/Nest.js) | Atrasaria o go-to-market e duplicaria regras hoje garantidas via RLS |
| Firebase Auth + Firestore | Não atende consultas hierárquicas complexas e não oferece Postgres pronto |
| Clerk/Auth0 + API própria | Maior custo recorrente e complexidade para sincronizar com Supabase |

### Implementação chave
```ts
// web/src/lib/supabase/server-client.ts
import { createServerClient } from '@supabase/ssr';

declare const process: NodeJS.Process;

export const createSupabaseServerClient = () =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
        setAll: (items) => items.forEach((item) => cookies().set(item.name, item.value, item.options)),
      },
    },
  );
```

---

## 2. Hierarquia Organizacional (Postgres)

### Decisão
Manter modelo existente com adjacency list + `hierarchy_path` (materialized path) nas tabelas `users` e `growth_group_participants`. Triggers já implementados seguem válidos.

### Rationale
- **Escalável**: consultas recursivas (`LIKE hierarchy_path || '%'`) funcionam bem até milhares de nós.
- **Flexível**: suporta múltiplos níveis (líder → supervisor → coordenador N) sem mudar schema.

### Implementação
- `users.hierarchy_parent_id` + trigger `users_hierarchy_path_update`.
- Views auxiliares (`user_gc_roles`) para mapear papéis acumulados.

---

## 3. State Management

### Decisão
Combinar **TanStack Query** para dados assincronizados + **Zustand** para estado local/efêmero.

### Rationale
- Query lida com cache, invalidação, re-fetch e persistência (IndexedDB) sem boilerplate.
- Zustand é leve e previsível para UI state (modais, filtros), evitando Redux ou Context complexos.

### Alternativas rejeitadas
| Alternativa | Motivo |
|-------------|--------|
| Redux Toolkit | Overhead desnecessário para escopo atual, demanda muito código cerimonial |
| Context puro | Dificulta isolação de estado, leva a re-renderizações em cascata |
| Apollo Client | Exigiria GraphQL layer; Supabase já expõe REST/RPC |

---

## 4. Cache & Offline Light

### Decisão
Usar persistência de cache do TanStack Query (`@tanstack/query-sync-storage-persister`) armazenando dados em IndexedDB. Para formulários críticos (ex.: registro de reunião), aplicar salvamento otimista + replays em background.

### Rationale
- Evita dependência de banco local dedicado (ex.: sqlite/hive) e funciona em browsers modernos.
- Permite experiência resiliente: líder registra reunião offline → dados persistidos localmente → sync ao reconectar.

### Observações
- Precisamos adicionar indicador de "sincronizando" nas telas de reuniões.
- Supabase ainda requer conectividade para commit final; manter fila de operações em memória + IndexedDB.

---

## 5. Segurança & RLS

### Decisão
Todas as queries passam pelo Supabase, honrando policies existentes em `data-model.md`. Middleware Next protegerá rotas conforme role (líder/supervisor/admin) lendo o token Supabase.

### Rationale
- Reuso da camada de segurança já validada.
- Minimiza risco de divergência entre front e banco.

### Implementação
- Middleware (`web/src/middleware.ts`) verifica role e redireciona usuários não autorizados.
- Uso de `select` com `supabase.from('growth_group_participants')` respeita RLS.

---

## 6. Estratégia de Testes

### Decisão
Aplicar **TDD** com três camadas:
1. **Contratos**: testes Node (Supertest/undici) contra Supabase local (`tests/contract/*.test.ts`).
2. **Unidade/Componente**: Vitest + Testing Library.
3. **E2E**: Playwright com projetos mobile (viewport 390px) e desktop (1280px).

### Rationale
- Assegura aderência aos contratos atualizados (`contracts/*.yaml`).
- Garante UI responsiva e acessível em breakpoints principais.

### Ferramentas adicionais
- Storybook 8 + Test Runner para componentes críticos (forms, widgets de dashboard).
- `axe-core` integrado nos testes de componente para A11y.

---

## 7. Catálogo de Lições

### Decisão
Manter `lesson_series` + `lessons` conforme data-model, com endpoints acessados via Supabase RPC. Lideranças podem selecionar lições padrão ou inserir título customizado por reunião (`meetings.lesson_title`).

### Rationale
- Reaproveita seed existente.
- Permite comparativos entre GCs mesmo com customizações pontuais.

### Próximos passos
- Página administrativa (Sprint 3) trará CRUD com validação via Zod.
- Necessário paginar listagem para não carregar series grandes de uma vez.

---

## 8. Conversão de Visitantes

### Decisão
Continuar utilizando trigger `auto_convert_visitor` para conversão automática após threshold (default 3 visitas). Fluxo manual registra eventos em `visitor_conversion_events` para auditoria.

### Rationale
- Mantém verdade única no banco.
- Simplifica UI: basta acionar RPC que insere na tabela e triggers cuidam do resto.

### Implementação no frontend
```ts
await supabase.rpc('convert_visitor', { visitor_id: id, gc_id });
```

---

## 9. Dashboards & Métricas

### Decisão
Consumir views `gc_dashboard_summary` e `supervision_metrics` já definidas nas migrations (`011_dashboard_views.sql`). Aplicar caching via React Query (intervalo 5 min) e SSR para primeira renderização rápida.

### Rationale
- Supervisores precisam de visão consolidada sem sobrecarregar o frontend.
- SSR reduz TTFB em dispositivos modestos e melhora SEO.

### Considerações
- Adicionar fallback skeletons para evitar layout shift.
- Verificar limites de rate da Supabase (50 req/min por IP no plano gratuito).

---

## 10. Deploy & Observabilidade

### Decisão
Hospedar no **Vercel** (preview por PR, produção em `main`). Observabilidade via **Sentry** (erros), **PostHog** (analytics) e logs nativos do Supabase.

### Pipeline
- GitHub Actions roda `npm run lint`, `npm run type-check`, `npm run test`, `npm run test:e2e -- --project=desktop --project=mobile --config tests/playwright.ci.config.ts`.
- Deploy automático para Vercel Preview; promoção manual após smoke.

### Alternativas
| Alternativa | Motivo para rejeição |
|-------------|----------------------|
| Netlify | Bom fallback, porém equipe já familiarizada com Vercel + Next |
| AWS Amplify | Alto overhead de configuração, menor integração com Next 14 |

---

## Segurança e Compliance
- **RLS**: Políticas existentes cobrindo líderes, supervisores, coordenadores. Qualquer bug front-end ainda respeita RLS.
- **Secrets**: Gerenciados via variáveis de ambiente (`.env.local` local, Vercel env vars em staging/prod`).
- **RGPD/ LGPD**: Continuar seguindo princípios de minimização de dados (apenas contato essencial) e permitir remoção/anonimização via Supabase.
- **Logs**: Evitar armazenar dados sensíveis em analytics; mascarar emails/telefones.

---

## Próximos Experimentos
1. **TanStack Query Persist**: Avaliar uso de `createIndexedDBStoragePersister` + sincronização incremental.
2. **Supabase Realtime**: Possibilidade de atualizar dashboards ao vivo (não prioritário para MVP).
3. **PWA / App Shell**: Estudar viabilidade de adicionar manifest + Service Worker para uso offline mais robusto.

---

## Referências
- [Supabase JavaScript Client v2](https://supabase.com/docs/reference/javascript)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TanStack Query Persisted Client](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- [Playwright Test Runner](https://playwright.dev/docs/test-intro)

---

**Status**: ✅ Documento alinhado à nova arquitetura web. Atualizações futuras devem manter coerência com `plan.md`, `tasks.md` e `web-stack-decisions.md`.
