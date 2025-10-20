# Research: Sistema de Eventos

**Feature**: 005-funcionalidade-de-eventos
**Date**: 2025-10-20
**Phase**: 0 (Research & Technical Investigation)

## Executive Summary

Esta feature adiciona um sistema completo de gestão de eventos da igreja, permitindo que administradores criem, editem e gerenciem eventos com imagens, enquanto usuários comuns podem visualizar e consultar eventos futuros e passados.

**Complexidade Estimada**: Média
**Risco Técnico**: Baixo (reutiliza padrões da Feature 004)
**Duração Estimada**: 5-7 dias

## Technical Stack Analysis

### Frontend (Next.js Web App)

**Framework**: Next.js 15.5.5 + React 19.1.0
- App Router com Server Components (padrão já estabelecido)
- TypeScript 5.x para type safety
- Tailwind CSS 3.4.18 para estilização
- shadcn/ui para componentes reutilizáveis

**Dependências Adicionais Necessárias**:
- ✅ `date-fns` (já instalado) - formatação de datas
- ✅ `zod` (já instalado) - validação de forms
- ✅ `sonner` (já instalado) - toast notifications
- ✅ `lucide-react` (já instalado) - ícones
- ✅ `react-hook-form` (assumido instalado) - gestão de formulários
- ⚠️  **NOVO**: Nenhuma nova dependência necessária

### Backend & Storage

**Database**: PostgreSQL via Supabase
- Nova tabela: `events`
- RLS policies para controle de acesso
- Triggers para soft delete (se necessário)

**File Storage**: Supabase Storage
- Novo bucket: `event-banners` (public read, admin write)
- Path structure: `{event_id}/{filename}`
- Validações: formatos (JPG/PNG/WEBP), tamanho (max 2MB)

**API Layer**: Next.js Server Actions
- Pattern já estabelecido em Feature 004
- Server Components para SSR
- Client Components para interatividade

### Authentication & Authorization

**Auth Provider**: Supabase Auth (já configurado)
- Session management via `getUser()` (server-side validation)
- Cookie-based sessions com persistência

**Authorization**:
- Reutilizar flag `is_admin` da tabela `users`
- Admin layout middleware (já existe em `/admin/layout.tsx`)
- RLS policies para proteção de dados

## Architecture Decisions

### 1. Rotas e Páginas

**Admin Area** (`/admin/events/*` - apenas admins):
```
/admin/events              # Lista todos os eventos (admin view)
/admin/events/new          # Criar novo evento
/admin/events/[id]         # Detalhes do evento (admin view)
/admin/events/[id]/edit    # Editar evento
```

**Public Area** (`/events/*` - todos os usuários autenticados):
```
/events                    # Lista de eventos do ano (user view)
/events/[id]               # Detalhes do evento (user view)
```

**Decisão**: Separar rotas admin e public seguindo o padrão da Feature 004.

### 2. Upload de Imagens

**Opções Avaliadas**:

A. **Upload direto via File API + Supabase Storage** ✅ ESCOLHIDA
   - Pros: Simples, sem servidor intermediário, URLs públicas automáticas
   - Cons: Validação client-side pode ser burlada
   - Mitigação: Validar tamanho/tipo no servidor também

B. **Upload via API Route + Sharp para processamento**
   - Pros: Controle total, otimização de imagens, resize automático
   - Cons: Mais complexo, overhead de processamento
   - Decisão: OVERKILL para MVP (imagens já vêm otimizadas do celular/câmera)

C. **Upload via signed URLs**
   - Pros: Segurança máxima, sem passar pelo servidor Node.js
   - Cons: Complexidade adicional, latência extra
   - Decisão: DESNECESSÁRIO (RLS policies suficientes)

**Implementação Escolhida**:
1. Client-side: File input com preview
2. Validações: max 2MB, formatos JPG/PNG/WEBP
3. Upload via Supabase Storage API
4. Path: `event-banners/{event_id}/{filename}`
5. URL retornada armazenada em `events.banner_url`

### 3. Gestão de Estado

**Opções Avaliadas**:

A. **Server Components + URL state** ✅ ESCOLHIDA
   - Pros: Zero JS no cliente, SSR, SEO-friendly
   - Cons: Navegação recarrega página
   - Uso: Lista de eventos, detalhes, filtros (via URL params)

B. **Client Components + React Hook Form**
   - Pros: Validação instantânea, melhor UX em forms
   - Cons: Mais JS no bundle
   - Uso: Formulários de criação/edição de eventos

C. **Zustand/Jotai para estado global**
   - Pros: Estado compartilhado entre componentes
   - Cons: Overhead desnecessário
   - Decisão: NÃO NECESSÁRIO (usar Server Components)

**Decisão Final**:
- Server Components para listagens e detalhes (SSR)
- Client Components apenas para forms com interatividade
- URL search params para filtros (ano, status)

### 4. Formatação de Datas

**Biblioteca**: `date-fns` (já instalado)

**Formatos**:
- Lista: "15 de Novembro de 2025" (formato ptBR long)
- Card: "15/11/2025" (formato curto)
- Hora: "19:00" (24h)

**Timezone**: Assumindo timezone local do servidor (America/Sao_Paulo)
- **Decisão**: Armazenar DATE (sem timezone) para simplicidade
- Event date é "dia do evento", não timestamp absoluto

### 5. Soft Delete Pattern

**Implementação**: `deleted_at TIMESTAMPTZ DEFAULT NULL`
- Seguindo padrão já estabelecido em `lessons` e `lesson_series`
- Queries sempre filtram `WHERE deleted_at IS NULL`
- Índices parciais para performance
- Admin pode "restaurar" evento (opcional para v2)

## Integration Points

### Existing Features

**Feature 004 (Área Administrativa)**:
- ✅ Reutilizar `AdminShell` component
- ✅ Reutilizar `AdminSidebar` (adicionar link "Eventos")
- ✅ Reutilizar `AdminBreadcrumbs` component
- ✅ Reutilizar padrão de Server Actions
- ✅ Reutilizar AlertDialog para confirmações
- ✅ Reutilizar Toast notifications (Sonner)

**Supabase Integration**:
- ✅ Reutilizar `getSupabaseBrowserClient()` (client-side)
- ✅ Reutilizar `getSupabaseServerClient()` (server-side)
- ✅ Reutilizar generated types (`Database` interface)

**Authentication**:
- ✅ Reutilizar `/admin/layout.tsx` middleware
- ✅ Reutilizar `getUser()` pattern para verificação

### New Components Required

**Admin Components** (`web/src/components/admin/`):
1. `AdminEventList.tsx` - Lista de eventos (admin view com filtros)
2. `AdminEventForm.tsx` - Formulário de criação/edição
3. `AdminEventCard.tsx` (opcional) - Card de evento na lista

**Public Components** (`web/src/components/events/`):
1. `EventCard.tsx` - Card de evento (user view)
2. `EventList.tsx` - Lista de eventos com filtros
3. `EventDetail.tsx` - Detalhes do evento
4. `EventYearNavigator.tsx` - Navegação entre anos
5. `EventFilter.tsx` - Filtro futuros/todos

### Database Changes

**Nova Tabela**: `events`
**Nova Storage Bucket**: `event-banners`
**Novas RLS Policies**:
- `admins_manage_events` (CRUD para is_admin=true)
- `users_view_active_events` (SELECT para eventos não deletados)

**Migration File**: `YYYYMMDDHHMMSS_create_events_table.sql`

## Performance Considerations

### Image Optimization

**Upload**:
- Validação client-side antes de upload (evita uploads desnecessários)
- Progress indicator durante upload (UX)
- Max 2MB (razoável para banner/imagem de divulgação)

**Display**:
- Next.js `<Image>` component (otimização automática)
- Lazy loading em listas
- Placeholder blur enquanto carrega
- Responsive images (srcset)

**Storage**:
- Supabase CDN (entrega rápida)
- URLs públicas (cacheable pelos browsers)

### Query Optimization

**Índices Necessários**:
```sql
CREATE INDEX idx_events_date ON events(event_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON events(created_by_user_id);
```

**Query Patterns**:
- Lista de eventos: `ORDER BY event_date ASC` (próximos primeiro)
- Filtro por ano: `WHERE EXTRACT(YEAR FROM event_date) = ?`
- Filtro futuros: `WHERE event_date >= CURRENT_DATE`

**Paginação**: NÃO implementar no MVP
- Assumindo < 100 eventos por ano (razoável para igreja)
- Se necessário, adicionar em v2 com cursor-based pagination

### Caching Strategy

**Server Components**: Cache automático do Next.js
- Revalidação via `revalidatePath()` nos Server Actions
- Cache invalidado após create/update/delete

**Client Components**: Sem cache adicional necessário
- Forms são sempre fresh
- Preview de upload não precisa cache

## Risk Assessment

### High Priority Risks

1. **Upload de imagens maliciosas** (Mitigado)
   - Validação de MIME type no servidor
   - Validação de tamanho (max 2MB)
   - Supabase Storage faz scan de vírus (se configurado)
   - Apenas admins podem fazer upload

2. **Soft delete não funcionando** (Mitigado)
   - Pattern já testado em Feature 004 (lessons)
   - Queries consistentes com `WHERE deleted_at IS NULL`
   - Testes de integração devem cobrir

3. **RLS policies incorretas** (Mitigado)
   - Testar com usuário admin e não-admin
   - Seguir pattern de `admins_manage_all_*` já existente

### Medium Priority Risks

1. **Performance com muitos eventos** (Aceito)
   - Assumindo escala pequena (igreja)
   - Paginação pode ser adicionada em v2 se necessário

2. **Timezone issues** (Aceito)
   - Armazenar apenas DATE (sem hora precisa)
   - Assumir timezone local do Brasil
   - Se expandir internacionalmente, revisar

### Low Priority Risks

1. **Storage limits do Supabase** (Aceito)
   - Free tier: 1GB storage
   - Estimativa: 100 eventos x 500KB = 50MB
   - Suficiente para MVP

## Alternative Approaches Considered

### 1. Categorização de Eventos (REJEITADA)

**Proposta**: Adicionar `event_type` (culto, conferência, retiro, etc.)

**Pros**:
- Filtrar eventos por tipo
- Ícones diferentes por categoria
- Melhor organização visual

**Cons**:
- Aumenta complexidade do MVP
- Não mencionado na spec original
- YAGNI (You Aren't Gonna Need It)

**Decisão**: OUT OF SCOPE para MVP (documentado na spec)

### 2. Sistema de Inscrições (REJEITADA)

**Proposta**: Permitir usuários se inscreverem em eventos

**Pros**:
- Igreja sabe quantos confirmados
- Notificações para inscritos
- Controle de vagas

**Cons**:
- Complexidade MUITO maior
- Requer lógica de inscrições, cancelamentos, notificações
- Fora do escopo da spec original

**Decisão**: OUT OF SCOPE para MVP (explicitamente documentado)

### 3. Integração com Google Calendar (REJEITADA)

**Proposta**: Sincronizar eventos com Google Calendar

**Pros**:
- Usuários podem adicionar ao calendário pessoal
- Sincronização automática

**Cons**:
- Requer Google OAuth
- Complexidade de integração
- Não é core requirement

**Decisão**: OUT OF SCOPE para MVP (pode ser v2)

## Testing Strategy

### Unit Tests

**Components**:
- `EventCard` rendering com diferentes props
- `EventForm` validações (título, data obrigatórios)
- Form upload validations (tamanho, formato)

**Utilities**:
- Date formatting functions
- Image validation helpers

### Integration Tests

**Server Actions**:
- `createEventAction` - criar evento com upload
- `updateEventAction` - editar evento
- `deleteEventAction` - soft delete
- `uploadEventBannerAction` - upload isolado

**RLS Policies**:
- Admin pode CRUD eventos
- User pode apenas SELECT eventos não deletados
- Non-authenticated não vê nada

### E2E Tests (Playwright)

**Critical Paths**:
1. Admin cria evento com imagem
2. Admin edita evento e substitui imagem
3. Admin deleta evento (soft delete)
4. User visualiza lista de eventos futuros
5. User visualiza detalhes do evento
6. User navega entre anos
7. User filtra eventos (futuros vs todos)

**Edge Cases**:
- Upload de imagem > 2MB (deve rejeitar)
- Upload de formato inválido (deve rejeitar)
- Evento sem imagem (deve exibir placeholder)
- Ano sem eventos (empty state)
- Non-admin tenta acessar /admin/events (redirect)

### Manual Testing

**Quickstart Scenarios** (serão documentados em quickstart.md):
1. Fluxo completo admin (criar, editar, deletar)
2. Fluxo completo user (visualizar, navegar, filtrar)
3. Upload de diferentes formatos de imagem
4. Testar responsividade (mobile, tablet, desktop)

## Open Questions & Clarifications

### Resolved in Spec

1. **Acesso público vs autenticado**: RESOLVIDO
   - Eventos requerem login (user autenticado)
   - Se necessário acesso público, adicionar em v2

2. **Paginação**: RESOLVIDO
   - Lista completa sem paginação no MVP
   - Adicionar se necessário em iteração futura

### New Questions (For Implementation)

1. **Placeholder image**: Qual imagem usar quando evento não tem banner?
   - Opção A: Imagem genérica da igreja (logo ou foto do templo)
   - Opção B: Placeholder colorido com ícone de calendário
   - **Decisão**: Usar imagem genérica da igreja (melhor branding)

2. **Ordem dos eventos na lista admin**:
   - Opção A: Mais próximos primeiro (igual user view)
   - Opção B: Mais recentes criados primeiro
   - **Decisão**: Mais próximos primeiro (consistência com user view)

3. **Botão "Voltar" em detalhes**: Para onde voltar?
   - Opção A: Sempre para /events (lista padrão)
   - Opção B: Voltar para filtro anterior (state management)
   - **Decisão**: Voltar para /events (simplicidade, stateless)

## Success Metrics

### Feature Completion Metrics

- [ ] Todas as rotas implementadas (4 admin + 2 public = 6 rotas)
- [ ] CRUD completo funcionando (create, read, update, delete)
- [ ] Upload de imagens funcionando com validações
- [ ] RLS policies aplicadas e testadas
- [ ] 8 cenários de aceitação da spec passando
- [ ] Testes E2E cobrindo critical paths
- [ ] Build de produção sem erros

### Quality Metrics

- [ ] Type-safe (0 `any` types, usar assertions quando necessário)
- [ ] Validações Zod em todos os forms
- [ ] Loading states em todas as páginas
- [ ] Toast notifications em todas as ações
- [ ] Error handling robusto
- [ ] Responsivo (mobile, tablet, desktop)

### Performance Metrics

- [ ] Lighthouse Score > 90 (Performance, Accessibility, Best Practices)
- [ ] Imagens otimizadas (Next.js Image)
- [ ] Bundle size adicional < 50KB (reutilização de componentes)
- [ ] Queries com índices apropriados
- [ ] RLS policies performáticas

## Next Steps (Post-Research)

1. **Phase 1**: Design detalhado
   - Criar `data-model.md` com schema SQL completo
   - Criar `contracts/` com API specs dos Server Actions
   - Criar `quickstart.md` com cenários de teste manual

2. **Phase 2**: Task breakdown
   - Gerar `tasks.md` com lista detalhada de tarefas
   - Estimar complexidade de cada tarefa
   - Definir ordem de implementação

3. **Implementation**: Executar tasks
   - Começar por migrations (database)
   - Implementar Server Actions (backend)
   - Implementar componentes admin (CRUD)
   - Implementar componentes user (visualização)
   - Testes E2E
   - Polimento e documentação

## Conclusion

A Feature 005 (Sistema de Eventos) é **viável e bem definida**, com complexidade média e risco baixo. A arquitetura proposta reutiliza padrões estabelecidos na Feature 004, minimizando desenvolvimento novo e mantendo consistência no código.

**Recomendação**: PROSSEGUIR para Phase 1 (Design Detalhado).

---

**Research Approved By**: Claude Code
**Date**: 2025-10-20
**Next Phase**: Phase 1 (Design - data-model.md, contracts/, quickstart.md)
