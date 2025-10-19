# Plano de Implementação: Área Administrativa

**Feature ID**: 004-area-administrativa
**Data**: 2025-10-18
**Status**: Planejamento

---

## 1. Visão Geral

### 1.1 Objetivo
Criar uma área administrativa completa e robusta que permita aos administradores gerenciar todos os aspectos do sistema de Grupos de Crescimento, incluindo usuários, GCs, lições, e processos especiais como multiplicação de grupos.

### 1.2 Contexto Atual
- **Existente**:
  - `/admin` com layout que verifica `is_admin`
  - Gerenciamento básico de usuários (listar, criar, editar)
  - Componentes: `AdminUserList`, `AdminUserCreateForm`, `AdminUserProfileForm`, `AdminUserAssignments`

- **Lacunas**:
  - Sem dashboard administrativo centralizado
  - Sem gestão de GCs (criar, editar, inativar, multiplicar)
  - Sem gestão de séries e lições
  - Sem navegação estruturada na área admin
  - Sem relatórios e métricas administrativas
  - Sem processo de multiplicação de GCs
  - Sem gestão de configurações do sistema

### 1.3 Princípios de Design
- **Segurança em primeiro lugar**: Todas as operações validadas com RLS e verificação de `is_admin`
- **Interface consistente**: Seguir padrões visuais do resto da aplicação
- **Navegação intuitiva**: Menu lateral ou top navigation clara
- **Feedback claro**: Mensagens de sucesso/erro em todas as operações
- **Auditoria**: Registrar quem fez o quê (created_by_user_id)

---

## 2. Arquitetura e Navegação

### 2.1 Estrutura de Rotas

```
/admin
├── /admin                          # Dashboard administrativo (visão geral)
├── /admin/users                    # Gestão de usuários
│   ├── /admin/users                # Lista de usuários ✓ (já existe)
│   ├── /admin/users/new            # Criar usuário ✓ (já existe)
│   └── /admin/users/[id]           # Editar usuário ✓ (já existe)
│
├── /admin/growth-groups            # Gestão de GCs
│   ├── /admin/growth-groups        # Lista de todos os GCs
│   ├── /admin/growth-groups/new    # Criar novo GC
│   ├── /admin/growth-groups/[id]   # Editar GC
│   └── /admin/growth-groups/[id]/multiply  # Multiplicar GC
│
├── /admin/lessons                  # Gestão de Lições
│   ├── /admin/lessons              # Lista de séries e lições
│   ├── /admin/lessons/series/new   # Criar nova série
│   ├── /admin/lessons/series/[id]  # Editar série
│   ├── /admin/lessons/new          # Criar nova lição
│   └── /admin/lessons/[id]         # Editar lição
│
├── /admin/reports                  # Relatórios e métricas
│   ├── /admin/reports              # Dashboard de relatórios
│   ├── /admin/reports/growth       # Crescimento e estatísticas
│   ├── /admin/reports/attendance   # Frequência e presença
│   └── /admin/reports/conversions  # Conversões de visitantes
│
└── /admin/settings                 # Configurações do sistema
    └── /admin/settings             # Configurações gerais
```

### 2.2 Componentes de Layout

#### AdminLayout (já existe em `/admin/layout.tsx`)
- Verifica autenticação e permissão `is_admin`
- Envolve todas as páginas admin

#### Novo: AdminShell
- Sidebar com navegação principal
- Breadcrumbs
- Indicador de usuário admin logado
- Estrutura:
```tsx
<AdminShell>
  <AdminSidebar />  {/* Navegação lateral */}
  <main>
    <AdminBreadcrumbs />
    {children}
  </main>
</AdminShell>
```

#### AdminSidebar
- Links para todas as seções
- Indicador visual da seção ativa
- Ícones: Shield (Admin), Users, Building (GCs), BookOpen (Lições), BarChart (Relatórios), Settings

---

## 3. Escopo Funcional Detalhado

### 3.1 Dashboard Administrativo (`/admin`)

**Objetivo**: Visão geral rápida do sistema com métricas chave e ações rápidas.

**Componentes**:
- **MetricsCards**: 4 cards principais
  - Total de Usuários (ativos)
  - Total de GCs (ativos vs inativos)
  - Total de Participantes (membros ativos)
  - Total de Visitantes (ativos)

- **RecentActivity**: Timeline de atividades recentes
  - Novos usuários criados
  - Novos GCs criados
  - Reuniões registradas
  - Conversões de visitantes

- **QuickActions**: Botões de ação rápida
  - Criar Usuário
  - Criar GC
  - Criar Série de Lições
  - Ver Relatórios

**Query de Dados**:
```sql
-- Métricas
SELECT
  (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
  (SELECT COUNT(*) FROM growth_groups WHERE status = 'active') as active_gcs,
  (SELECT COUNT(*) FROM growth_group_participants WHERE status = 'active') as total_participants,
  (SELECT COUNT(*) FROM visitors WHERE status = 'active') as active_visitors;

-- Atividades recentes (últimas 10)
SELECT
  'user' as type, u.id, p.name, u.created_at
FROM users u
JOIN people p ON u.person_id = p.id
WHERE u.deleted_at IS NULL
UNION ALL
SELECT
  'gc' as type, id, name, created_at
FROM growth_groups
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

### 3.2 Gestão de Usuários (`/admin/users`)

**Status**: ✅ Parcialmente implementado

**Existente**:
- Lista de usuários com papéis (AdminUserList)
- Criar usuário (AdminUserCreateForm)
- Editar perfil e atribuições (AdminUserProfileForm, AdminUserAssignments)

**Melhorias Necessárias**:
1. **Filtros na listagem**:
   - Por papel (Admin, Líder, Supervisor, Coordenador, Membro)
   - Por status (Ativo, Inativo)
   - Busca por nome/email

2. **Ações em massa**:
   - Inativar múltiplos usuários
   - Exportar lista

3. **Visualização detalhada**:
   - Histórico de atividades do usuário
   - GCs onde participa (como líder, supervisor, membro)
   - Reuniões registradas

**Não mexer**: A funcionalidade básica já funciona bem, apenas adicionar melhorias incrementais.

---

### 3.3 Gestão de Grupos de Crescimento (`/admin/growth-groups`)

**Objetivo**: Administração completa de GCs com visão global (sem restrições de RLS para admin).

#### 3.3.1 Lista de GCs (`/admin/growth-groups`)

**Funcionalidades**:
- Listar TODOS os GCs do sistema (ignora RLS)
- Colunas:
  - Nome do GC
  - Líder(es) principal(is)
  - Supervisor(es)
  - Modo (Presencial/Online/Híbrido)
  - Status (Ativo/Inativo/Multiplicando)
  - Total de membros
  - Última reunião
  - Ações (Editar, Inativar, Multiplicar)

- **Filtros**:
  - Por status
  - Por modo
  - Por líder
  - Por supervisor
  - Busca por nome

- **Ordenação**:
  - Por nome (A-Z)
  - Por data de criação (mais recentes)
  - Por total de membros (maior/menor)

**Query**:
```sql
SELECT
  gc.id,
  gc.name,
  gc.mode,
  gc.status,
  gc.created_at,
  gc.weekday,
  gc.time,
  COUNT(DISTINCT ggp.id) FILTER (WHERE ggp.status = 'active') as member_count,
  MAX(m.datetime) as last_meeting,
  -- Líderes: aggregar via JSON
  JSON_AGG(DISTINCT jsonb_build_object(
    'id', leader_p.id,
    'name', leader_p.name,
    'role', leader_ggp.role
  )) FILTER (WHERE leader_ggp.role IN ('leader', 'co_leader')) as leaders,
  -- Supervisores: aggregar via JSON
  JSON_AGG(DISTINCT jsonb_build_object(
    'id', supervisor_p.id,
    'name', supervisor_p.name
  )) FILTER (WHERE supervisor_ggp.role = 'supervisor') as supervisors
FROM growth_groups gc
LEFT JOIN growth_group_participants ggp ON gc.id = ggp.gc_id
LEFT JOIN meetings m ON gc.id = m.gc_id
LEFT JOIN growth_group_participants leader_ggp ON gc.id = leader_ggp.gc_id AND leader_ggp.role IN ('leader', 'co_leader')
LEFT JOIN people leader_p ON leader_ggp.person_id = leader_p.id
LEFT JOIN growth_group_participants supervisor_ggp ON gc.id = supervisor_ggp.gc_id AND supervisor_ggp.role = 'supervisor'
LEFT JOIN people supervisor_p ON supervisor_ggp.person_id = supervisor_p.id
WHERE gc.deleted_at IS NULL
GROUP BY gc.id
ORDER BY gc.name;
```

#### 3.3.2 Criar GC (`/admin/growth-groups/new`)

**Formulário**:
- **Informações Básicas**:
  - Nome (obrigatório)
  - Modo: Presencial/Online/Híbrido (obrigatório)
  - Endereço (obrigatório se Presencial ou Híbrido)
  - Dia da semana (0-6)
  - Horário
  - Status inicial: Ativo (padrão)

- **Atribuição de Pessoas**:
  - Líder principal (obrigatório) - buscar de users
  - Co-líder (opcional)
  - Supervisor(es) (obrigatório, pelo menos 1) - buscar de users
  - Membros iniciais (opcional)

**Validações**:
- Pelo menos 1 líder obrigatório
- Pelo menos 1 supervisor obrigatório
- Endereço obrigatório se mode = 'in_person' ou 'hybrid'

**Transação**:
```typescript
// 1. Inserir growth_group
const { data: gc, error: gcError } = await supabase
  .from('growth_groups')
  .insert({ name, mode, address, weekday, time, status: 'active' })
  .select('id')
  .single();

// 2. Inserir participantes com papéis
const participants = [
  { gc_id: gc.id, person_id: leaderId, role: 'leader', status: 'active' },
  { gc_id: gc.id, person_id: coLeaderId, role: 'co_leader', status: 'active' },
  ...supervisorIds.map(id => ({ gc_id: gc.id, person_id: id, role: 'supervisor', status: 'active' })),
  ...memberIds.map(id => ({ gc_id: gc.id, person_id: id, role: 'member', status: 'active' })),
];

await supabase.from('growth_group_participants').insert(participants);
```

#### 3.3.3 Editar GC (`/admin/growth-groups/[id]`)

**Funcionalidades**:
- Editar informações básicas (nome, modo, endereço, dia, horário)
- Alterar status (Ativo/Inativo/Multiplicando)
- Gerenciar líderes (adicionar/remover)
- Gerenciar supervisores (adicionar/remover)
- Gerenciar membros (adicionar/remover)
- Ver histórico de reuniões
- Ver histórico de visitantes

**Seções**:
1. **Informações Básicas** (card editável)
2. **Líderes e Supervisores** (card com lista + botões adicionar/remover)
3. **Membros** (card com lista + botões adicionar/remover)
4. **Histórico de Reuniões** (tabela read-only com link para editar reunião)
5. **Visitantes** (tabela read-only com link para converter)

#### 3.3.4 Multiplicar GC (`/admin/growth-groups/[id]/multiply`)

**Objetivo**: Processo de multiplicação de um GC em dois ou mais grupos filhos.

**Conceito de Multiplicação**:
1. GC original entra em status 'multiplying'
2. Membros são divididos entre GC original e novo(s) GC(s)
3. Novo(s) GC(s) são criados com novos líderes (geralmente membros promovidos)
4. GC original pode continuar ativo ou ser inativado
5. Registro de multiplicação para histórico

**Formulário Multi-Step**:

**Step 1: Informações do(s) Novo(s) GC(s)**
- Quantos GCs criar? (1-3)
- Para cada novo GC:
  - Nome
  - Modo
  - Endereço (se aplicável)
  - Dia e horário
  - Líder (escolher de membros atuais)
  - Supervisor

**Step 2: Divisão de Membros**
- Listar todos os membros do GC original
- Interface drag-and-drop ou select para alocar membros:
  - Permanecem no GC original
  - Vão para Novo GC 1
  - Vão para Novo GC 2
  - etc.
- Validação: cada membro deve ser alocado

**Step 3: Configuração do GC Original**
- O que fazer com o GC original?
  - Manter ativo (com membros restantes)
  - Inativar (todos os membros foram realocados)
- Se manter ativo: manter líder ou definir novo

**Step 4: Revisão e Confirmação**
- Resumo de todas as mudanças
- Confirmação final

**Transação (tudo ou nada)**:
```typescript
// 1. Atualizar status do GC original
await supabase
  .from('growth_groups')
  .update({ status: 'multiplying' })
  .eq('id', originalGcId);

// 2. Criar novo(s) GC(s)
const newGcs = await supabase
  .from('growth_groups')
  .insert(newGcData)
  .select();

// 3. Atualizar membros do GC original (marcar como transferred)
await supabase
  .from('growth_group_participants')
  .update({ status: 'transferred', left_at: now() })
  .in('id', transferredMemberIds);

// 4. Criar participantes nos novos GCs
for (const newGc of newGcs) {
  await supabase
    .from('growth_group_participants')
    .insert(allocatedMembers[newGc.id]);
}

// 5. Registrar evento de multiplicação (nova tabela?)
await supabase
  .from('gc_multiplication_events')
  .insert({
    original_gc_id: originalGcId,
    new_gc_ids: newGcs.map(g => g.id),
    multiplied_by_user_id: session.user.id,
    multiplied_at: now(),
  });

// 6. Finalizar status do GC original
if (shouldInactivate) {
  await supabase
    .from('growth_groups')
    .update({ status: 'inactive' })
    .eq('id', originalGcId);
} else {
  await supabase
    .from('growth_groups')
    .update({ status: 'active' })
    .eq('id', originalGcId);
}
```

**Considerações**:
- Criar tabela `gc_multiplication_events` para auditoria
- Notificações aos envolvidos (futuro)
- Validação de que pelo menos 1 líder e 1 supervisor em cada novo GC

---

### 3.4 Gestão de Lições e Séries (`/admin/lessons`)

**Objetivo**: Gerenciar catálogo completo de lições e séries disponíveis para os GCs.

#### 3.4.1 Lista de Séries e Lições (`/admin/lessons`)

**Layout**:
- Duas seções principais:
  - **Séries**: Lista de séries com ações (Editar, Excluir, Ver Lições)
  - **Lições Avulsas**: Lições sem série

**Para cada Série**:
- Nome
- Descrição
- Total de lições
- Criada por (nome do usuário)
- Data de criação
- Ações: Editar, Excluir (soft delete), Adicionar Lição

**Para cada Lição**:
- Título
- Série (se aplicável)
- Ordem na série
- Link externo
- Usada em quantas reuniões
- Ações: Editar, Excluir

**Funcionalidades**:
- Busca por nome de série/lição
- Filtro por série
- Reordenar lições dentro de uma série (drag-and-drop)

#### 3.4.2 Criar Série (`/admin/lessons/series/new`)

**Formulário**:
- Nome (obrigatório)
- Descrição (opcional, textarea)
- Opção: Adicionar lições imediatamente ou depois

**Se adicionar lições imediatamente**:
- Array de inputs para lições:
  - Título
  - Descrição
  - Link
  - Ordem (auto-numerado)
- Botão "Adicionar mais lição"

**Transação**:
```typescript
// 1. Criar série
const { data: series } = await supabase
  .from('lesson_series')
  .insert({
    name,
    description,
    created_by_user_id: session.user.id
  })
  .select('id')
  .single();

// 2. Criar lições (se houver)
if (lessons.length > 0) {
  await supabase.from('lessons').insert(
    lessons.map((lesson, index) => ({
      ...lesson,
      series_id: series.id,
      order_in_series: index + 1,
      created_by_user_id: session.user.id,
    }))
  );
}
```

#### 3.4.3 Editar Série (`/admin/lessons/series/[id]`)

**Funcionalidades**:
- Editar nome e descrição
- Ver todas as lições da série
- Reordenar lições (drag-and-drop, atualizar order_in_series)
- Adicionar nova lição à série
- Remover lição da série (torna avulsa)
- Excluir série (confirmar - afeta lições?)

**Comportamento ao excluir série**:
- Opção 1: Excluir série e todas as lições (soft delete)
- Opção 2: Excluir série mas manter lições como avulsas (series_id = null)

#### 3.4.4 Criar/Editar Lição (`/admin/lessons/new`, `/admin/lessons/[id]`)

**Formulário**:
- Título (obrigatório)
- Descrição (opcional)
- Série (select, opcional)
- Ordem na série (se série selecionada, auto-sugerido = último + 1)
- Link externo (opcional, URL)

**Validação**:
- Se série selecionada, order_in_series é obrigatório
- Link deve ser URL válida (se preenchido)

---

### 3.5 Relatórios e Métricas (`/admin/reports`)

**Objetivo**: Insights e analytics para tomada de decisão.

#### 3.5.1 Dashboard de Relatórios (`/admin/reports`)

**Cards de Métricas**:
- Total de GCs por status (Ativo, Inativo, Multiplicando)
- Total de participantes (Membros, Líderes, Supervisores)
- Total de visitantes (Ativos, Convertidos, Inativos)
- Taxa de conversão de visitantes (% convertidos)
- Frequência média de reuniões (reuniões/GC/mês)

**Gráficos**:
1. **Crescimento ao longo do tempo** (linha):
   - Eixo X: Meses
   - Eixo Y: Total de membros, total de GCs

2. **Distribuição de GCs por modo** (pizza):
   - Presencial, Online, Híbrido

3. **Top 10 GCs por membros** (barra):
   - Nome do GC vs Total de membros

4. **Frequência de reuniões** (heatmap mensal):
   - Quantas reuniões por GC por mês

#### 3.5.2 Relatório de Crescimento (`/admin/reports/growth`)

**Métricas Temporais**:
- Crescimento de membros por mês (últimos 12 meses)
- Crescimento de GCs por mês
- Multiplicações realizadas (timeline)
- Novos usuários por mês

**Tabela Detalhada**:
- Por GC: crescimento de membros mês a mês
- Taxa de retenção (membros que permanecem ativos)

#### 3.5.3 Relatório de Frequência (`/admin/reports/attendance`)

**Métricas**:
- Taxa de presença média por GC
- GCs com melhor/pior frequência
- Membros mais assíduos
- Membros com baixa frequência (alerta)

**Tabela**:
- Por GC: % de presença nas últimas 4 reuniões
- Por membro: total de presenças / total de reuniões realizadas

#### 3.5.4 Relatório de Conversões (`/admin/reports/conversions`)

**Métricas**:
- Total de visitantes convertidos (por período)
- Taxa de conversão por GC
- Tempo médio até conversão (dias entre first_visit e converted_at)
- Visitantes ativos há mais de X dias (potencial conversão)

**Tabela**:
- Lista de conversões recentes
- GCs com melhor taxa de conversão

---

### 3.6 Configurações do Sistema (`/admin/settings`)

**Objetivo**: Configurações globais armazenadas na tabela `config`.

**Categorias de Configuração**:

1. **Configurações Gerais**:
   - Nome da organização (padrão: "Igreja Monte Carmelo")
   - Descrição
   - Logo (upload futuro)

2. **Configurações de GC**:
   - Número mínimo de membros para um GC ativo
   - Número máximo de membros recomendado (alerta)
   - Frequência mínima de reuniões (alerta se GC não reuniu em X dias)

3. **Configurações de Visitantes**:
   - Após quantas visitas considerar "pronto para conversão"
   - Após quantos dias de inatividade marcar visitante como inativo

4. **Configurações de Notificações** (futuro):
   - Emails de notificação
   - Eventos que geram notificação

**Implementação**:
```typescript
// Ler configs
const { data: configs } = await supabase
  .from('config')
  .select('key, value');

// Mapear para objeto
const settings = configs.reduce((acc, { key, value }) => {
  acc[key] = value;
  return acc;
}, {});

// Atualizar config
await supabase
  .from('config')
  .upsert({
    key: 'gc.min_members',
    value: 5,
    description: 'Número mínimo de membros por GC'
  });
```

---

## 4. Modelo de Dados - Novas Tabelas

### 4.1 gc_multiplication_events

**Propósito**: Auditar e registrar eventos de multiplicação de GCs.

```sql
CREATE TABLE gc_multiplication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL, -- Array de IDs dos novos GCs criados
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gc_mult_original ON gc_multiplication_events(original_gc_id);
CREATE INDEX idx_gc_mult_user ON gc_multiplication_events(multiplied_by_user_id);
```

**Uso**:
- Histórico de multiplicações
- Rastreamento de "linhagem" de GCs (qual GC originou quais)
- Relatórios de crescimento orgânico

---

## 5. Fases de Implementação

### FASE 1: Fundação e Navegação (Prioridade ALTA)
**Duração estimada**: 2-3 horas

**Tarefas**:
1. ✅ Criar estrutura de pastas `/admin/growth-groups`, `/admin/lessons`, `/admin/reports`, `/admin/settings`
2. Criar componente `AdminShell` com sidebar
3. Criar componente `AdminSidebar` com links de navegação
4. Criar componente `AdminBreadcrumbs`
5. Atualizar `/admin/layout.tsx` para usar AdminShell
6. Criar `/admin/page.tsx` (Dashboard) com métricas básicas
7. Testar navegação entre seções

**Entregável**:
- Área admin com navegação funcional
- Dashboard com métricas (cards estáticos, queries básicas)

---

### FASE 2: Gestão de GCs (Prioridade ALTA)
**Duração estimada**: 4-5 horas

**Tarefas**:
1. Criar `/admin/growth-groups/page.tsx` - lista de todos os GCs
2. Implementar query complexa para buscar GCs com líderes/supervisores
3. Criar componente `AdminGrowthGroupList` com tabela e filtros
4. Criar `/admin/growth-groups/new/page.tsx` - formulário de criação
5. Criar componente `AdminGrowthGroupForm` (usado em new e edit)
6. Implementar transação de criação de GC + atribuição de papéis
7. Criar `/admin/growth-groups/[id]/page.tsx` - edição
8. Implementar seções: Info Básica, Líderes/Supervisores, Membros, Histórico
9. Testar criar, editar, inativar GC

**Entregável**:
- CRUD completo de GCs na área admin
- Gestão de líderes, supervisores e membros

---

### FASE 3: Multiplicação de GCs (Prioridade MÉDIA)
**Duração estimada**: 4-6 horas

**Tarefas**:
1. Criar migração para tabela `gc_multiplication_events`
2. Criar `/admin/growth-groups/[id]/multiply/page.tsx`
3. Criar componente `GCMultiplicationWizard` (multi-step)
4. Implementar Step 1: Informações dos novos GCs
5. Implementar Step 2: Divisão de membros (interface drag-drop ou select)
6. Implementar Step 3: Configuração do GC original
7. Implementar Step 4: Revisão e confirmação
8. Implementar transação completa de multiplicação
9. Testar cenários: multiplicar em 2, em 3, manter original ativo/inativo
10. Adicionar registro de evento em `gc_multiplication_events`

**Entregável**:
- Processo completo de multiplicação de GCs
- Auditoria de multiplicações

---

### FASE 4: Gestão de Lições (Prioridade MÉDIA)
**Duração estimada**: 3-4 horas

**Tarefas**:
1. Criar `/admin/lessons/page.tsx` - lista de séries e lições
2. Criar componente `AdminSeriesList`
3. Criar componente `AdminLessonList`
4. Criar `/admin/lessons/series/new/page.tsx` - criar série
5. Criar `/admin/lessons/series/[id]/page.tsx` - editar série
6. Implementar reordenação de lições (drag-drop)
7. Criar `/admin/lessons/new/page.tsx` - criar lição
8. Criar `/admin/lessons/[id]/page.tsx` - editar lição
9. Implementar exclusão (soft delete) de séries e lições
10. Testar CRUD completo

**Entregável**:
- Gestão completa de séries e lições
- Reordenação de lições dentro de séries

---

### FASE 5: Relatórios e Métricas (Prioridade BAIXA)
**Duração estimada**: 4-5 horas

**Tarefas**:
1. Criar `/admin/reports/page.tsx` - dashboard de relatórios
2. Implementar queries para métricas agregadas
3. Criar componentes de visualização (usar biblioteca como Recharts)
4. Criar `/admin/reports/growth/page.tsx` - relatório de crescimento
5. Criar `/admin/reports/attendance/page.tsx` - relatório de frequência
6. Criar `/admin/reports/conversions/page.tsx` - relatório de conversões
7. Implementar filtros de data (últimos 30 dias, 90 dias, 1 ano, customizado)
8. Adicionar exportação de relatórios (CSV/PDF - futuro)

**Entregável**:
- Dashboard de relatórios com métricas visuais
- Relatórios especializados por área

---

### FASE 6: Configurações (Prioridade BAIXA)
**Duração estimada**: 2-3 horas

**Tarefas**:
1. Criar `/admin/settings/page.tsx`
2. Criar componente `AdminSettingsForm`
3. Implementar seções de configuração (abas ou accordions)
4. Implementar leitura e escrita na tabela `config`
5. Validação de valores (números positivos, URLs válidas, etc)
6. Testar alteração e persistência de configs

**Entregável**:
- Interface de configurações do sistema
- Persistência em tabela `config`

---

### FASE 7: Melhorias de UX e Polimento (Prioridade BAIXA)
**Duração estimada**: 2-3 horas

**Tarefas**:
1. Adicionar loading states em todas as páginas admin
2. Mensagens de sucesso/erro consistentes (toast notifications)
3. Confirmações para ações destrutivas (excluir, inativar)
4. Breadcrumbs em todas as páginas
5. Responsividade mobile (sidebar colapsável)
6. Adicionar paginação onde necessário (listas longas)
7. Adicionar skeleton loaders
8. Testes E2E das principais funcionalidades

**Entregável**:
- Interface polida e responsiva
- Feedback claro ao usuário
- Experiência consistente

---

## 6. Tecnologias e Bibliotecas

### Existentes (já em uso):
- Next.js 15.5.5
- React 19.1.0
- TypeScript 5.x
- Tailwind CSS 3.4.18
- Supabase client
- shadcn/ui components
- Lucide React (ícones)

### Novas (sugeridas):
- **Recharts** ou **Chart.js**: Visualização de dados (gráficos)
- **react-beautiful-dnd** ou **@dnd-kit**: Drag-and-drop (reordenar lições, alocar membros)
- **date-fns**: Manipulação de datas (relatórios)
- **zod**: Validação de formulários (já em uso parcialmente)
- **react-hook-form**: Gerenciamento de formulários complexos (já em uso)

---

## 7. Segurança e Permissões

### 7.1 Verificação de Admin

Todas as rotas `/admin/**` devem:
1. Verificar autenticação (session)
2. Verificar `is_admin = true` no layout
3. Redirecionar para `/dashboard` se não for admin

### 7.2 RLS (Row Level Security)

**Estratégia para Admin**:
- Admins têm acesso total via policies `admins_manage_all_*`
- Queries no lado do cliente devem funcionar sem restrições
- Para garantir, usar `service_role` key em Server Components (cuidado!)

**Alternativa Segura**:
- Manter uso de `anon` key
- Confiar nas policies RLS que dão acesso total para `is_admin`
- Verificar no layout se é admin (como já está)

### 7.3 Validação de Inputs

- Todos os formulários com validação Zod
- Sanitização de inputs (prevenir XSS)
- Confirmação para ações destrutivas

### 7.4 Auditoria

- Sempre registrar `created_by_user_id` e `updated_by_user_id`
- Logs de multiplicação em `gc_multiplication_events`
- Soft delete (deleted_at) ao invés de DELETE permanente

---

## 8. Critérios de Aceite

### Dashboard Admin
- [ ] Exibe métricas corretas (total users, GCs, membros, visitantes)
- [ ] Mostra atividades recentes (últimas 10)
- [ ] Botões de ação rápida funcionam

### Gestão de GCs
- [ ] Lista todos os GCs com filtros funcionais
- [ ] Criar GC com líder + supervisor funciona
- [ ] Editar GC atualiza dados corretamente
- [ ] Inativar GC atualiza status
- [ ] Multiplicação cria novos GCs e realoca membros

### Gestão de Lições
- [ ] Criar série com/sem lições funciona
- [ ] Editar série e reordenar lições funciona
- [ ] Criar lição avulsa ou em série funciona
- [ ] Excluir série/lição funciona (soft delete)

### Relatórios
- [ ] Métricas são calculadas corretamente
- [ ] Gráficos exibem dados corretos
- [ ] Filtros de data funcionam

### Navegação
- [ ] Sidebar marca seção ativa corretamente
- [ ] Breadcrumbs refletem localização atual
- [ ] Navegação fluída entre seções

### Segurança
- [ ] Não-admins não conseguem acessar /admin
- [ ] Todas as operações validam is_admin
- [ ] Ações destrutivas pedem confirmação

---

## 9. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Complexidade da multiplicação de GCs | Alto | Médio | Implementar em fase separada, testes extensivos |
| Performance de queries complexas (relatórios) | Médio | Médio | Usar índices no banco, limitar período padrão, paginação |
| RLS não funcionar para admin | Alto | Baixo | Verificar policies, testar com usuário admin real |
| Perda de dados em transações | Alto | Baixo | Usar transações do Supabase, rollback em erro |
| Interface complexa demais | Médio | Médio | Seguir princípios de design, testes com usuários |

---

## 10. Próximos Passos Imediatos

### Para iniciar desenvolvimento:

1. **Revisar e aprovar este plano**
2. **Decidir quais fases implementar primeiro** (sugestão: Fases 1 e 2)
3. **Criar branch de desenvolvimento**: `feature/004-area-administrativa`
4. **Começar pela Fase 1**: Fundação e Navegação
5. **Implementar incrementalmente**: Cada fase deve ser testada antes de prosseguir

### Decisões Pendentes:

- [ ] Biblioteca de gráficos: Recharts ou Chart.js?
- [ ] Biblioteca de drag-and-drop: react-beautiful-dnd ou @dnd-kit?
- [ ] Implementar multiplicação de GCs na primeira versão ou deixar para depois?
- [ ] Criar tabela `gc_multiplication_events` agora ou quando implementar multiplicação?
- [ ] Usar `service_role` key para admins ou confiar em RLS policies?

---

## 11. Estimativas Totais

| Fase | Prioridade | Duração Estimada | Dependências |
|------|-----------|------------------|--------------|
| Fase 1: Fundação | ALTA | 2-3h | Nenhuma |
| Fase 2: Gestão GCs | ALTA | 4-5h | Fase 1 |
| Fase 3: Multiplicação | MÉDIA | 4-6h | Fase 2 |
| Fase 4: Lições | MÉDIA | 3-4h | Fase 1 |
| Fase 5: Relatórios | BAIXA | 4-5h | Fase 1 |
| Fase 6: Configurações | BAIXA | 2-3h | Fase 1 |
| Fase 7: Polimento | BAIXA | 2-3h | Todas |
| **TOTAL** | | **21-29h** | |

**MVP (Mínimo Viável)**: Fases 1 + 2 = 6-8 horas
**Versão Completa**: Todas as fases = 21-29 horas

---

## Apêndice A: Wireframes (Descrição Textual)

### Dashboard Admin (`/admin`)

```
+----------------------------------------------------------+
|  [Sidebar]  |  Dashboard Administrativo                   |
|             |                                             |
|  • Dashboard|  [Card: Usuários]  [Card: GCs Ativos]      |
|  • Usuários |  Total: 42         Total: 8                 |
|  • GCs      |  Ativos: 40        Inativos: 2              |
|  • Lições   |                                             |
|  • Relat.   |  [Card: Membros]   [Card: Visitantes]       |
|  • Config   |  Total: 156        Ativos: 23               |
|             |  Média/GC: 19.5    Convertidos: 45          |
|             |                                             |
|             |  Atividades Recentes                        |
|             |  • João Silva foi criado como usuário       |
|             |  • GC "Jardim Europa" foi criado            |
|             |  • Reunião em "Centro" foi registrada       |
|             |                                             |
|             |  Ações Rápidas                              |
|             |  [+ Criar Usuário] [+ Criar GC]             |
+----------------------------------------------------------+
```

### Lista de GCs (`/admin/growth-groups`)

```
+----------------------------------------------------------+
|  [Sidebar]  |  Gestão de Grupos de Crescimento            |
|             |                                             |
|             |  [+ Criar GC]    [Filtros: Status ▼]       |
|             |                                             |
|             |  Tabela de GCs                              |
|             |  +----------------+--------+-------+------+ |
|             |  | Nome    | Líder | Modo  | Status| Mem | |
|             |  +----------------+--------+-------+------+ |
|             |  | Centro  | João  | Pres. | Ativo | 25  | |
|             |  | Jardim  | Maria | Onl.  | Ativo | 18  | |
|             |  | ...                                   | |
|             |  +---------------------------------------+ |
|             |                                             |
+----------------------------------------------------------+
```

---

**Fim do Plano de Implementação**

**Autor**: Claude (Assistente IA)
**Data**: 2025-10-18
**Versão**: 1.0
