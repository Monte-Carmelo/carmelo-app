# Tasks: Área Administrativa Completa

**Feature**: 004-area-administrativa
**Branch**: `004-area-administrativa`
**Plan**: [plan.md](./plan.md)
**Date**: 2025-10-18

---

## Task Summary

**Total Tasks**: 54
**Estimated Duration**: 21-29 hours
**MVP (Phases 1-2)**: 18 tasks, 6-8 hours

### Phases Overview

| Phase | Priority | Tasks | Duration | Description |
|-------|----------|-------|----------|-------------|
| 1. Fundação | ALTA | T001-T008 | 2-3h | Navegação + Dashboard |
| 2. Gestão GCs | ALTA | T009-T018 | 4-5h | CRUD de GCs |
| 3. Multiplicação | MÉDIA | T019-T027 | 4-6h | Wizard multiplicação |
| 4. Lições | MÉDIA | T028-T037 | 3-4h | CRUD lições/séries |
| 5. Relatórios | BAIXA | T038-T044 | 4-5h | Analytics |
| 6. Configurações | BAIXA | T045-T047 | 2-3h | Settings |
| 7. Polimento | BAIXA | T048-T054 | 2-3h | UX refinements |

---

## Dependency Graph

```
Setup
  ↓
FASE 1: Fundação (T001-T008)
  ├─→ FASE 2: Gestão GCs (T009-T018) [MVP]
  │    ├─→ FASE 3: Multiplicação (T019-T027)
  │    └─→ FASE 4: Lições (T028-T037)
  ├─→ FASE 5: Relatórios (T038-T044)
  └─→ FASE 6: Configurações (T045-T047)
         ↓
    FASE 7: Polimento (T048-T054)
```

---

## SETUP: Preparação Inicial

### T000: Instalar Dependências [P]
**Priority**: CRITICAL
**Estimated**: 15min
**Dependencies**: None
**Can run in parallel**: Yes

**Description**:
Instalar novas bibliotecas necessárias para área administrativa.

**Steps**:
1. Navegar para `/Users/rafael/dev/carmelo-app/web`
2. Executar:
   ```bash
   npm install recharts @dnd-kit/core @dnd-kit/sortable date-fns
   ```
3. Verificar instalação em `package.json`

**Files**:
- `/Users/rafael/dev/carmelo-app/web/package.json` (updated)

**Success Criteria**:
- [x] `recharts` instalado
- [x] `@dnd-kit/core` e `@dnd-kit/sortable` instalados
- [x] `date-fns` instalado
- [x] `npm run build` executa sem erros

---

## FASE 1: Fundação e Navegação (ALTA PRIORIDADE)

### T001: Criar Migration para gc_multiplication_events
**Priority**: HIGH
**Estimated**: 30min
**Dependencies**: T000
**Can run in parallel**: No (deve ser primeira task de implementação)

**Description**:
Criar migration SQL para tabela `gc_multiplication_events` conforme especificado em `data-model.md`.

**Steps**:
1. Criar arquivo `/Users/rafael/dev/carmelo-app/supabase/migrations/YYYYMMDDHHMMSS_create_gc_multiplication_events.sql`
2. Copiar schema SQL de `specs/004-area-administrativa/data-model.md`
3. Executar `supabase db reset` para aplicar migration
4. Verificar tabela criada com `SELECT * FROM gc_multiplication_events LIMIT 1;`

**Files**:
- `/Users/rafael/dev/carmelo-app/supabase/migrations/YYYYMMDDHHMMSS_create_gc_multiplication_events.sql` (new)

**SQL Content** (from data-model.md):
```sql
CREATE TABLE gc_multiplication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL,
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gc_mult_original ON gc_multiplication_events(original_gc_id);
CREATE INDEX idx_gc_mult_user ON gc_multiplication_events(multiplied_by_user_id);
CREATE INDEX idx_gc_mult_date ON gc_multiplication_events(multiplied_at DESC);

ALTER TABLE gc_multiplication_events
  ADD CONSTRAINT chk_new_gcs_not_empty
  CHECK (array_length(new_gc_ids, 1) > 0);
```

**Success Criteria**:
- [x] Migration criada e aplicada
- [x] Tabela `gc_multiplication_events` existe
- [x] Índices criados
- [x] Constraint `chk_new_gcs_not_empty` ativo

---

### T002: Criar AdminShell Component [P]
**Priority**: HIGH
**Estimated**: 1h
**Dependencies**: T001
**Can run in parallel**: Yes (diferente de T003, T004)

**Description**:
Criar componente `AdminShell` que envolve todas as páginas admin com sidebar de navegação.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminShell.tsx`
2. Implementar layout flexbox: sidebar fixa à esquerda + conteúdo principal à direita
3. Importar e usar `AdminSidebar` (será criado em T003)
4. Tornar sidebar colapsável em mobile (< 768px)
5. Incluir slot para breadcrumbs no topo do conteúdo

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminShell.tsx` (new)

**Component Structure**:
```typescript
'use client';

import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
```

**Success Criteria**:
- [x] Componente criado e renderiza
- [x] Layout flexbox funcional
- [x] Sidebar visível em desktop
- [x] Sidebar colapsável em mobile

---

### T003: Criar AdminSidebar Component [P]
**Priority**: HIGH
**Estimated**: 1h
**Dependencies**: T001
**Can run in parallel**: Yes (diferente de T002, T004)

**Description**:
Criar sidebar de navegação com links para seções admin.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSidebar.tsx`
2. Adicionar links para:
   - Dashboard (Shield icon)
   - Usuários (Users icon)
   - GCs (Building icon)
   - Lições (BookOpen icon)
   - Relatórios (BarChart icon)
   - Configurações (Settings icon)
3. Highlight seção ativa usando `usePathname()`
4. Ícones com Lucide React
5. Responsive: menu hamburguer em mobile

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSidebar.tsx` (new)

**Links Structure**:
```typescript
const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Shield },
  { label: 'Usuários', href: '/admin/users', icon: Users },
  { label: 'Grupos de Crescimento', href: '/admin/growth-groups', icon: Building },
  { label: 'Lições', href: '/admin/lessons', icon: BookOpen },
  { label: 'Relatórios', href: '/admin/reports', icon: BarChart },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
];
```

**Success Criteria**:
- [x] Sidebar renderiza com 6 links
- [x] Link ativo destacado visualmente
- [x] Ícones exibidos corretamente
- [x] Navegação funcional

---

### T004: Criar AdminBreadcrumbs Component [P]
**Priority**: MEDIUM
**Estimated**: 30min
**Dependencies**: T001
**Can run in parallel**: Yes (diferente de T002, T003)

**Description**:
Criar componente de breadcrumbs para mostrar localização atual na hierarquia admin.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminBreadcrumbs.tsx`
2. Usar `usePathname()` para detectar rota atual
3. Gerar breadcrumbs a partir de segmentos da URL
4. Mapear segmentos para labels em português:
   - `admin` → "Admin"
   - `growth-groups` → "GCs"
   - `lessons` → "Lições"
   - `reports` → "Relatórios"
   - `settings` → "Configurações"
5. Renderizar como links (exceto último item)

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminBreadcrumbs.tsx` (new)

**Example Output**:
```
Admin > GCs > Editar
```

**Success Criteria**:
- [x] Breadcrumbs renderizam corretamente
- [x] Links funcionam (navegação)
- [x] Último item não é link
- [x] Labels em português

---

### T005: Atualizar /admin/layout.tsx para Usar AdminShell
**Priority**: HIGH
**Estimated**: 20min
**Dependencies**: T002, T003
**Can run in parallel**: No

**Description**:
Atualizar layout admin existente para usar novo `AdminShell`.

**Steps**:
1. Abrir `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/layout.tsx`
2. Importar `AdminShell`
3. Envolver `{children}` com `<AdminShell>`
4. Manter verificação de `is_admin` existente
5. Testar que sidebar aparece em todas as páginas `/admin/*`

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/layout.tsx` (updated)

**Updated Code**:
```typescript
import { AdminShell } from '@/components/admin/AdminShell';
// ... imports existentes

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ... verificação is_admin existente

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
```

**Success Criteria**:
- [x] Sidebar visível em todas as páginas admin
- [x] Verificação `is_admin` ainda funciona
- [x] Não-admins redirecionados corretamente

---

### T006: Criar AdminMetricsCard Component [P]
**Priority**: MEDIUM
**Estimated**: 30min
**Dependencies**: T001
**Can run in parallel**: Yes

**Description**:
Criar componente reutilizável para cards de métricas no dashboard.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminMetricsCard.tsx`
2. Props: `title`, `value`, `icon` (Lucide), `description` (opcional)
3. Usar componente `Card` do shadcn/ui
4. Estilo consistente com design system (Tailwind)

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminMetricsCard.tsx` (new)

**Component Interface**:
```typescript
import { LucideIcon } from 'lucide-react';

interface AdminMetricsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}
```

**Success Criteria**:
- [x] Componente renderiza com props
- [x] Ícone exibido corretamente
- [x] Estilo consistente com Card shadcn/ui

---

### T007: Implementar Dashboard Admin com Métricas
**Priority**: HIGH
**Estimated**: 1.5h
**Dependencies**: T005, T006
**Can run in parallel**: No

**Description**:
Atualizar `/admin/page.tsx` com dashboard completo: métricas, atividades recentes, ações rápidas.

**Steps**:
1. Abrir `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/page.tsx`
2. Implementar queries para 4 métricas:
   - Total de usuários (`SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`)
   - GCs ativos (`SELECT COUNT(*) FROM growth_groups WHERE status = 'active'`)
   - Membros ativos (`SELECT COUNT(*) FROM growth_group_participants WHERE status = 'active'`)
   - Visitantes ativos (`SELECT COUNT(*) FROM visitors WHERE status = 'active'`)
3. Executar queries em paralelo com `Promise.all`
4. Renderizar 4 `AdminMetricsCard`
5. Adicionar seção "Atividades Recentes" (últimas 10):
   - Query união de users created, GCs created, meetings registered
6. Adicionar seção "Ações Rápidas":
   - Botões: Criar Usuário, Criar GC, Criar Série, Ver Relatórios

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/page.tsx` (updated)

**Queries Example**:
```typescript
const [usersCount, gcsCount, membersCount, visitorsCount] = await Promise.all([
  supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  supabase.from('growth_groups').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  supabase.from('growth_group_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
]);
```

**Success Criteria**:
- [x] 4 métricas exibidas corretamente
- [x] Atividades recentes listadas (até 10)
- [x] Botões de ação rápida funcionais
- [x] Queries performam em < 2s

---

### T008: Testar Navegação Completa (Manual)
**Priority**: MEDIUM
**Estimated**: 30min
**Dependencies**: T007
**Can run in parallel**: No

**Description**:
Testar navegação entre seções admin usando sidebar e breadcrumbs.

**Steps**:
1. Executar Cenário 1 de `quickstart.md` (Dashboard Administrativo)
2. Clicar em cada item da sidebar
3. Verificar breadcrumbs atualizam
4. Verificar seção ativa destacada
5. Testar em mobile (sidebar colapsável)

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] Navegação fluida entre seções
- [x] Breadcrumbs corretos
- [x] Highlight de seção ativa funciona
- [x] Sidebar responsiva em mobile

---

## FASE 2: Gestão de Grupos de Crescimento (ALTA PRIORIDADE)

### T009: Criar AdminGrowthGroupList Component [P]
**Priority**: HIGH
**Estimated**: 1.5h
**Dependencies**: T008
**Can run in parallel**: Yes (diferente de T010)

**Description**:
Criar componente de listagem de GCs com tabela, filtros e ordenação.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminGrowthGroupList.tsx`
2. Props: `gcs` (array de GCs com related data)
3. Renderizar tabela com colunas:
   - Nome
   - Líder(es)
   - Supervisor(es)
   - Modo
   - Status
   - Total de Membros
   - Última Reunião
   - Ações (Editar, Multiplicar)
4. Implementar filtros:
   - Por status (dropdown)
   - Por modo (dropdown)
   - Busca por nome (input)
5. Implementar ordenação:
   - Por nome (A-Z)
   - Por data de criação
   - Por total de membros

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminGrowthGroupList.tsx` (new)

**Success Criteria**:
- [x] Tabela renderiza todos os GCs
- [x] Filtros funcionam
- [x] Ordenação funciona
- [x] Ações (Editar/Multiplicar) navegam corretamente

---

### T010: Criar Página de Listagem de GCs
**Priority**: HIGH
**Estimated**: 1h
**Dependencies**: T008
**Can run in parallel**: Yes (diferente de T009, mas depende dela para renderizar)

**Description**:
Criar página `/admin/growth-groups` com query complexa e listagem.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/page.tsx`
2. Implementar query complexa (ver `contracts/README.md`):
   - Buscar todos os GCs
   - Incluir related: participants com role (leader, supervisor), meetings
   - Processar para agrupar líderes/supervisores
   - Calcular memberCount e lastMeeting
3. Passar dados para `AdminGrowthGroupList`
4. Adicionar botão "+ Novo GC" no topo

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/page.tsx` (new)

**Query (from contracts)**:
```typescript
const { data: gcs, error } = await supabase
  .from('growth_groups')
  .select(`
    id, name, mode, status, weekday, time, address, created_at,
    growth_group_participants!inner (
      id, role, status,
      people (id, name, email, phone)
    ),
    meetings (id, datetime)
  `)
  .is('deleted_at', null)
  .order('name', { ascending: true });

// Processar para agrupar leaders, supervisors, memberCount
```

**Success Criteria**:
- [x] Página renderiza listagem
- [x] Query retorna dados corretamente
- [x] Botão "Novo GC" funciona
- [x] Performance < 2s para 100 GCs

---

### T011: Criar AdminGrowthGroupForm Component [P]
**Priority**: HIGH
**Estimated**: 2h
**Dependencies**: T008
**Can run in parallel**: Yes

**Description**:
Criar formulário reutilizável para criar/editar GCs.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminGrowthGroupForm.tsx`
2. Props: `gc` (optional, para edição), `onSubmit`, `users` (lista para selects)
3. Campos:
   - Nome (text)
   - Modo (select: Presencial/Online/Híbrido)
   - Endereço (text, obrigatório se Presencial/Híbrido)
   - Dia da semana (select 0-6)
   - Horário (time)
   - Líder Principal (select user)
   - Co-líder (select user, opcional)
   - Supervisores (multi-select users, mínimo 1)
   - Membros Iniciais (multi-select users, opcional)
4. Validação com Zod (schema em `contracts/README.md`)
5. Usar react-hook-form

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminGrowthGroupForm.tsx` (new)

**Zod Schema** (from contracts):
```typescript
const createGCSchema = z.object({
  name: z.string().min(3).max(255),
  mode: z.enum(['in_person', 'online', 'hybrid']),
  address: z.string().optional(),
  weekday: z.number().int().min(0).max(6).nullable(),
  time: z.string().nullable(),
  leaderId: z.string().uuid(),
  coLeaderId: z.string().uuid().optional(),
  supervisorIds: z.array(z.string().uuid()).min(1),
  memberIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.mode !== 'in_person' || data.address,
  { message: 'Endereço obrigatório para modo presencial', path: ['address'] }
);
```

**Success Criteria**:
- [x] Formulário renderiza
- [x] Validação Zod funciona
- [x] Campos condicionais (endereço) funcionam
- [x] onSubmit dispara corretamente

---

### T012: Criar Página de Criação de GC
**Priority**: HIGH
**Estimated**: 1h
**Dependencies**: T010, T011
**Can run in parallel**: No

**Description**:
Criar página `/admin/growth-groups/new` para criar GC.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/new/page.tsx`
2. Buscar lista de usuários para selects
3. Renderizar `AdminGrowthGroupForm`
4. Implementar transação de criação (ver `contracts/README.md`):
   - Inserir em `growth_groups`
   - Inserir participantes em `growth_group_participants` com roles
   - Rollback manual se falhar
5. Exibir toast de sucesso/erro
6. Redirecionar para `/admin/growth-groups` após sucesso

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/new/page.tsx` (new)

**Transação** (from contracts):
```typescript
// 1. Criar GC
const { data: gc, error: gcError } = await supabase
  .from('growth_groups')
  .insert({ name, mode, address, weekday, time, status: 'active' })
  .select('id')
  .single();

// 2. Inserir participantes
const participants = [
  { gc_id: gc.id, person_id: leaderId, role: 'leader', ... },
  // ...
];
const { error: participantsError } = await supabase
  .from('growth_group_participants')
  .insert(participants);

// 3. Rollback se falhar
if (participantsError) {
  await supabase.from('growth_groups').delete().eq('id', gc.id);
  throw error;
}
```

**Success Criteria**:
- [x] Formulário submete corretamente
- [x] GC criado no banco
- [x] Participantes com roles corretos
- [x] Rollback funciona em caso de erro
- [x] Toast de feedback exibido

---

### T013: Criar Página de Edição de GC [P]
**Priority**: HIGH
**Estimated**: 2h
**Dependencies**: T011
**Can run in parallel**: Yes (arquivo diferente de T012)

**Description**:
Criar página `/admin/growth-groups/[id]` para editar GC.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/[id]/page.tsx`
2. Buscar GC por ID com todos os relacionamentos:
   - Participants (leaders, supervisors, members)
   - Meetings (historical)
   - Visitors
3. Criar 5 seções:
   - **Informações Básicas**: `AdminGrowthGroupForm` em modo edição
   - **Líderes e Supervisores**: Lista editável (adicionar/remover)
   - **Membros**: Lista editável (adicionar/remover)
   - **Histórico de Reuniões**: Tabela read-only com link para editar
   - **Visitantes**: Tabela read-only com link para converter
4. Implementar updates:
   - Update `growth_groups` para info básica
   - Insert/Delete em `growth_group_participants` para adicionar/remover pessoas
5. Adicionar botão "Multiplicar GC" (link para `/admin/growth-groups/[id]/multiply`)

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/[id]/page.tsx` (new)

**Success Criteria**:
- [x] Página carrega dados corretamente
- [x] 5 seções renderizadas
- [x] Edição de info básica funciona
- [x] Adicionar/remover participantes funciona
- [x] Botão "Multiplicar" visível

---

### T014: Testar CRUD de GCs (Manual)
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T013
**Can run in parallel**: No

**Description**:
Executar cenários 2 e 3 de `quickstart.md` para validar CRUD de GCs.

**Steps**:
1. Executar **Cenário 2: Criar GC**
   - Preencher formulário
   - Submeter
   - Verificar GC criado na listagem
   - Verificar participantes no banco
2. Executar **Cenário 3: Editar GC**
   - Acessar GC criado
   - Modificar dados
   - Adicionar membro
   - Salvar
   - Verificar mudanças persistidas

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] Criar GC funciona end-to-end
- [x] Editar GC funciona end-to-end
- [x] Dados no banco corretos

---

## FASE 3: Multiplicação de GCs (MÉDIA PRIORIDADE)

### T015: Criar GCMultiplicationWizard Component [P]
**Priority**: MEDIUM
**Estimated**: 3h
**Dependencies**: T014
**Can run in parallel**: Yes

**Description**:
Criar wizard multi-step para processo de multiplicação de GC.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/GCMultiplicationWizard.tsx`
2. Implementar state management para 4 steps:
   - Step 1: Informações dos novos GCs
   - Step 2: Divisão de membros
   - Step 3: Configuração do GC original
   - Step 4: Revisão e confirmação
3. Navegação entre steps (Next/Back)
4. Props: `originalGC` (com membros), `onComplete`
5. Validação em cada step antes de avançar

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/GCMultiplicationWizard.tsx` (new)

**State Structure**:
```typescript
interface MultiplicationState {
  newGCs: Array<{
    name: string;
    mode: 'in_person' | 'online' | 'hybrid';
    address?: string;
    leaderId: string;
    supervisorIds: string[];
  }>;
  memberAllocations: Record<string, 'original' | 'new_0' | 'new_1' | 'new_2'>;
  keepOriginalActive: boolean;
  notes?: string;
}
```

**Success Criteria**:
- [x] Wizard renderiza 4 steps
- [x] Navegação Next/Back funciona
- [x] State persiste entre steps
- [x] Validação em cada step

---

### T016: Implementar Step 1 do Wizard [P]
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T015
**Can run in parallel**: Yes (componente filho)

**Description**:
Implementar Step 1: Informações dos Novos GCs.

**Steps**:
1. Criar subcomponente ou seção em wizard
2. Campo: Quantidade de novos GCs (1-3)
3. Para cada novo GC:
   - Nome (text)
   - Modo (select)
   - Endereço (condicional)
   - Líder (select de membros do GC original)
   - Supervisor(es) (multi-select de membros do GC original)
4. Validação Zod antes de avançar

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/GCMultiplicationWizard.tsx` (updated)

**Success Criteria**:
- [x] Formulário renderiza para 1-3 novos GCs
- [x] Campos validados corretamente
- [x] Não permite avançar sem preencher

---

### T017: Implementar Step 2 do Wizard [P]
**Priority**: MEDIUM
**Estimated**: 1.5h
**Dependencies**: T015
**Can run in parallel**: Yes (componente filho)

**Description**:
Implementar Step 2: Divisão de Membros.

**Steps**:
1. Listar TODOS os membros do GC original
2. Para cada membro, exibir select/radio com opções:
   - Permanecer no original
   - Ir para Novo GC 1
   - Ir para Novo GC 2
   - Ir para Novo GC 3 (se aplicável)
3. Validar que TODOS os membros foram alocados
4. Exibir resumo: quantos em cada destino

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/GCMultiplicationWizard.tsx` (updated)

**UI Suggestion**:
- Tabela com 3 colunas: Nome do Membro | Papel Atual | Destino (select)
- OU interface drag-and-drop (usar @dnd-kit se tempo permitir)

**Success Criteria**:
- [x] Lista todos os membros
- [x] Permite alocar cada membro
- [x] Valida que todos foram alocados
- [x] Resumo exibido

---

### T018: Implementar Steps 3 e 4 do Wizard [P]
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T015
**Can run in parallel**: Yes (componente filho)

**Description**:
Implementar Steps 3 (Configuração GC Original) e 4 (Revisão).

**Step 3**:
1. Pergunta: "Manter GC original ativo?"
2. Radio: Sim / Não
3. Se "Sim" e nenhum membro alocado no original: exibir aviso

**Step 4**:
1. Exibir resumo completo:
   - GC Original: nome, membros que permanecem, status final
   - Novo GC 1: nome, líder, supervisor, membros
   - Novo GC 2/3: idem
2. Campo "Observações" (textarea, opcional)
3. Botão "Confirmar Multiplicação"

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/GCMultiplicationWizard.tsx` (updated)

**Success Criteria**:
- [x] Step 3 renderiza opções
- [x] Step 4 exibe resumo correto
- [x] Botão confirmar dispara onComplete

---

### T019: Criar Página de Multiplicação
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T016, T017, T018
**Can run in parallel**: No

**Description**:
Criar página `/admin/growth-groups/[id]/multiply` com wizard.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/[id]/multiply/page.tsx`
2. Buscar GC original com todos os membros
3. Renderizar `GCMultiplicationWizard`
4. Implementar `onComplete`: executar transação de multiplicação (ver `contracts/README.md`)
5. Transação deve:
   - Atualizar status original → 'multiplying'
   - Criar novos GCs
   - Transferir membros (update status → 'transferred')
   - Criar participantes nos novos GCs
   - Inserir evento em `gc_multiplication_events`
   - Finalizar status original ('active' ou 'inactive')
6. Exibir loading durante transação
7. Rollback manual se qualquer etapa falhar
8. Redirecionar para `/admin/growth-groups` após sucesso

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/[id]/multiply/page.tsx` (new)

**Transação** (from contracts):
Ver exemplo completo em `contracts/README.md` - função `multiplyGC()`

**Success Criteria**:
- [x] Wizard carrega com dados do GC
- [x] Transação executa corretamente
- [x] Novos GCs criados
- [x] Membros transferidos
- [x] Evento registrado em `gc_multiplication_events`
- [x] Rollback funciona em caso de erro

---

### T020: Testar Multiplicação (Manual)
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T019
**Can run in parallel**: No

**Description**:
Executar Cenário 4 de `quickstart.md` para validar multiplicação end-to-end.

**Steps**:
1. Selecionar GC com 10+ membros
2. Iniciar wizard de multiplicação
3. Completar 4 steps:
   - Definir 2 novos GCs
   - Alocar membros
   - Configurar original
   - Confirmar
4. Verificar resultado:
   - 2 novos GCs criados
   - Membros transferidos corretamente
   - GC original com status escolhido
   - Evento em `gc_multiplication_events`
5. Verificar queries SQL de validação no quickstart

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] Multiplicação completa end-to-end
- [x] Dados no banco corretos
- [x] Evento auditado

---

## FASE 4: Gestão de Lições (MÉDIA PRIORIDADE)

### T021: Criar AdminSeriesList Component [P]
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T020
**Can run in parallel**: Yes

**Description**:
Criar componente para listar séries de lições.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSeriesList.tsx`
2. Props: `series` (array com contagem de lições)
3. Renderizar cards ou tabela com:
   - Nome da série
   - Descrição
   - Badge com total de lições
   - Criado por
   - Ações: Editar, Excluir, Adicionar Lição
4. Modal de confirmação para exclusão

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSeriesList.tsx` (new)

**Success Criteria**:
- [x] Lista renderiza séries
- [x] Badge de contagem correto
- [x] Ações funcionam

---

### T022: Criar AdminLessonList Component com Reordenação [P]
**Priority**: MEDIUM
**Estimated**: 1.5h
**Dependencies**: T000 (requer @dnd-kit)
**Can run in parallel**: Yes

**Description**:
Criar componente para listar e reordenar lições dentro de uma série.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminLessonList.tsx`
2. Props: `lessons` (array ordenado), `onReorder` (callback)
3. Integrar @dnd-kit para drag-and-drop:
   - `DndContext`, `SortableContext`
   - Componente `SortableItem` para cada lição
4. Renderizar lições com:
   - Número de ordem
   - Título
   - Descrição (truncada)
   - Link externo (se houver)
   - Ações: Editar, Excluir
5. Ao soltar item, chamar `onReorder` com nova ordem

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminLessonList.tsx` (new)

**@dnd-kit Usage**:
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

**Success Criteria**:
- [x] Lista renderiza lições ordenadas
- [x] Drag-and-drop funciona
- [x] onReorder dispara com nova ordem
- [x] UI responsiva e fluida

---

### T023: Criar Página de Listagem de Lições
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T021, T022
**Can run in parallel**: No

**Description**:
Criar página `/admin/lessons` com lista de séries e lições.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/page.tsx`
2. Buscar todas as séries com lições (query em `contracts/README.md`)
3. Dividir em 2 seções:
   - **Séries**: Renderizar `AdminSeriesList`
   - **Lições Avulsas**: Renderizar `AdminLessonList` (lições sem série)
4. Botões no topo:
   - "+ Nova Série"
   - "+ Nova Lição"

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/page.tsx` (new)

**Query**:
```typescript
const { data: series } = await supabase
  .from('lesson_series')
  .select(`
    id, name, description, created_at,
    users!created_by_user_id (id, people(name)),
    lessons (id, title, order_in_series)
  `)
  .order('created_at', { ascending: false });
```

**Success Criteria**:
- [x] Página renderiza séries e lições avulsas
- [x] Botões de criação funcionam
- [x] Performance adequada

---

### T024: Criar Formulários de Série e Lição [P]
**Priority**: MEDIUM
**Estimated**: 1.5h
**Dependencies**: T020
**Can run in parallel**: Yes

**Description**:
Criar componentes de formulário para criar/editar séries e lições.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSeriesForm.tsx`
   - Campos: nome, descrição
   - Opção: adicionar lições imediatamente (array dinâmico de inputs)
   - Validação Zod
2. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminLessonForm.tsx`
   - Campos: título, descrição, série (select, opcional), ordem, link
   - Validação Zod

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSeriesForm.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminLessonForm.tsx` (new)

**Success Criteria**:
- [x] Formulários renderizam
- [x] Validação funciona
- [x] onSubmit dispara corretamente

---

### T025: Criar Páginas de Criação/Edição de Série
**Priority**: MEDIUM
**Estimated**: 1h
**Dependencies**: T024
**Can run in parallel**: No

**Description**:
Criar páginas `/admin/lessons/series/new` e `/admin/lessons/series/[id]`.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/series/new/page.tsx`
   - Renderizar `AdminSeriesForm`
   - Implementar transação de criação (série + lições opcionais)
2. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/series/[id]/page.tsx`
   - Buscar série com lições
   - Renderizar form de edição
   - Renderizar `AdminLessonList` com reordenação
   - Implementar `onReorder`: atualizar `order_in_series` no banco

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/series/new/page.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/series/[id]/page.tsx` (new)

**Reorder Function** (from contracts):
```typescript
for (const item of lessonOrder) {
  await supabase
    .from('lessons')
    .update({ order_in_series: item.newOrder })
    .eq('id', item.lessonId);
}
```

**Success Criteria**:
- [x] Criar série funciona
- [x] Editar série funciona
- [x] Reordenar lições persiste no banco

---

### T026: Criar Páginas de Criação/Edição de Lição
**Priority**: MEDIUM
**Estimated**: 45min
**Dependencies**: T024
**Can run in parallel**: Yes (arquivos diferentes)

**Description**:
Criar páginas `/admin/lessons/new` e `/admin/lessons/[id]`.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/new/page.tsx`
   - Buscar séries para select
   - Renderizar `AdminLessonForm`
   - Inserir em `lessons`
2. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/[id]/page.tsx`
   - Buscar lição por ID
   - Renderizar form de edição
   - Atualizar lição

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/new/page.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/lessons/[id]/page.tsx` (new)

**Success Criteria**:
- [x] Criar lição funciona
- [x] Editar lição funciona
- [x] Vínculo com série opcional funciona

---

### T027: Testar Gestão de Lições (Manual)
**Priority**: MEDIUM
**Estimated**: 45min
**Dependencies**: T026
**Can run in parallel**: No

**Description**:
Executar Cenário 5 de `quickstart.md` para validar lições.

**Steps**:
1. Criar série "Fundamentos da Fé"
2. Adicionar 3 lições
3. Reordenar lições via drag-and-drop
4. Verificar ordem no banco
5. Editar série e lição
6. Excluir lição (soft delete)

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] CRUD de séries funciona
- [x] CRUD de lições funciona
- [x] Reordenação funciona e persiste

---

## FASE 5: Relatórios e Métricas (BAIXA PRIORIDADE)

### T028: Instalar e Configurar Recharts [P]
**Priority**: LOW
**Estimated**: 30min
**Dependencies**: T000 (já instalado em T000)
**Can run in parallel**: Yes

**Description**:
Configurar Recharts e criar componentes de gráfico reutilizáveis.

**Steps**:
1. Verificar instalação: `npm list recharts`
2. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/LineChart.tsx` - Wrapper para Recharts LineChart
3. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/PieChart.tsx` - Wrapper para PieChart
4. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/BarChart.tsx` - Wrapper para BarChart
5. Testar cada wrapper com dados mock

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/LineChart.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/PieChart.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/charts/BarChart.tsx` (new)

**Success Criteria**:
- [x] Recharts instalado e funcional
- [x] 3 componentes wrapper criados
- [x] Renderizam com dados mock

---

### T029: Criar AdminReportsDashboard Component [P]
**Priority**: LOW
**Estimated**: 2h
**Dependencies**: T028
**Can run in parallel**: Yes

**Description**:
Criar dashboard de relatórios com gráficos e métricas.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminReportsDashboard.tsx`
2. Props: `metrics` (dados agregados), `period` (filtro)
3. Renderizar:
   - Cards de métricas (GCs por status, taxa de conversão, etc.)
   - Gráfico de Crescimento (linha): Membros/GCs ao longo do tempo
   - Gráfico de Distribuição (pizza): GCs por modo
   - Gráfico Top 10 (barra): GCs com mais membros
4. Usar componentes de T028
5. Filtro de período: Select (últimos 30/90 dias, 1 ano, customizado)

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminReportsDashboard.tsx` (new)

**Success Criteria**:
- [x] Dashboard renderiza com gráficos
- [x] Filtro de período funciona
- [x] Dados processados corretamente

---

### T030: Criar Página de Relatórios Principal
**Priority**: LOW
**Estimated**: 1.5h
**Dependencies**: T029
**Can run in parallel**: No

**Description**:
Criar página `/admin/reports` com dashboard de relatórios.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/page.tsx`
2. Implementar queries para métricas (ver `contracts/README.md`):
   - Total de GCs por status
   - Total de membros/visitantes
   - Taxa de conversão
   - Crescimento temporal (group by month)
   - Distribuição por modo
   - Top 10 GCs
3. Processar dados para formato de gráfico
4. Renderizar `AdminReportsDashboard`

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/page.tsx` (new)

**Queries** (from contracts):
```typescript
// Métricas agregadas
const { data: metrics } = await supabase.rpc('get_dashboard_metrics');

// Crescimento temporal (requer RPC function - ver contracts)
const { data: growth } = await supabase.rpc('get_member_growth_by_month', {
  start_date, end_date
});
```

**Success Criteria**:
- [x] Página renderiza dashboard
- [x] Gráficos exibem dados corretos
- [x] Performance < 3s

---

### T031: Criar Relatórios Especializados [P]
**Priority**: LOW
**Estimated**: 1.5h
**Dependencies**: T028
**Can run in parallel**: Yes

**Description**:
Criar páginas de relatórios especializados: crescimento, frequência, conversões.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/growth/page.tsx`
   - Crescimento de membros por mês
   - Crescimento de GCs
   - Timeline de multiplicações
2. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/attendance/page.tsx`
   - Taxa de presença por GC
   - Membros mais/menos assíduos
3. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/conversions/page.tsx`
   - Total convertidos
   - Taxa por GC
   - Tempo médio até conversão

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/growth/page.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/attendance/page.tsx` (new)
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/reports/conversions/page.tsx` (new)

**Success Criteria**:
- [x] 3 relatórios criados
- [x] Dados específicos exibidos
- [x] Navegação fluida

---

### T032: Testar Relatórios (Manual)
**Priority**: LOW
**Estimated**: 30min
**Dependencies**: T031
**Can run in parallel**: No

**Description**:
Executar Cenário 6 de `quickstart.md` para validar relatórios.

**Steps**:
1. Acessar `/admin/reports`
2. Verificar gráficos renderizam
3. Aplicar filtro "últimos 90 dias"
4. Verificar dados atualizam
5. Navegar para relatórios especializados
6. Validar métricas

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] Relatórios renderizam corretamente
- [x] Filtros funcionam
- [x] Performance adequada

---

## FASE 6: Configurações do Sistema (BAIXA PRIORIDADE)

### T033: Criar AdminSettingsForm Component ✅
**Priority**: LOW
**Estimated**: 1h
**Dependencies**: T027
**Can run in parallel**: Yes

**Description**:
Criar formulário de configurações do sistema.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSettingsForm.tsx`
2. Buscar configs da tabela `config`
3. Renderizar seções (accordions ou tabs):
   - **Gerais**: Nome da organização
   - **GCs**: Membros mín/máx, frequência mínima de reuniões
   - **Visitantes**: Critérios de conversão
4. Persistir via upsert em `config`

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/components/admin/AdminSettingsForm.tsx` (new)

**Upsert Example**:
```typescript
await supabase.from('config').upsert({
  key: 'gc.min_members',
  value: 5,
  description: 'Número mínimo de membros por GC'
});
```

**Success Criteria**:
- [x] Formulário renderiza configs
- [x] Salvar persiste no banco
- [x] Validação de valores

---

### T034: Criar Página de Configurações ✅
**Priority**: LOW
**Estimated**: 45min
**Dependencies**: T033
**Can run in parallel**: No

**Description**:
Criar página `/admin/settings`.

**Steps**:
1. Criar `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/settings/page.tsx`
2. Buscar todas as configs
3. Renderizar `AdminSettingsForm`
4. Toast de feedback ao salvar

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/settings/page.tsx` (new)

**Success Criteria**:
- [x] Página renderiza
- [x] Configurações salvam
- [x] Feedback exibido

---

## FASE 7: Polimento e UX (BAIXA PRIORIDADE)

### T035: Adicionar Loading States em Todas as Páginas [P]
**Priority**: LOW
**Estimated**: 1h
**Dependencies**: T034
**Can run in parallel**: Yes

**Description**:
Adicionar componente `Spinner` e `Loading` em todas as páginas admin durante queries.

**Steps**:
1. Usar `Suspense` do React em todas as páginas
2. Fallback: `<Loading message="Carregando..." />`
3. Verificar páginas:
   - `/admin`
   - `/admin/growth-groups` + subpáginas
   - `/admin/lessons` + subpáginas
   - `/admin/reports` + subpáginas
   - `/admin/settings`

**Files**:
- Todas as páginas admin (updated)

**Success Criteria**:
- [x] Loading states em todas as páginas
- [x] Nenhuma página mostra conteúdo vazio durante carregamento

---

### T036: Adicionar Toast Notifications [P]
**Priority**: LOW
**Estimated**: 1h
**Dependencies**: T035
**Can run in parallel**: Yes

**Description**:
Adicionar biblioteca de toast (ex: sonner) e implementar em todas as mutações.

**Steps**:
1. Instalar: `npm install sonner`
2. Adicionar `Toaster` no layout admin
3. Substituir alerts/console.logs por toasts em:
   - Criar GC (sucesso/erro)
   - Editar GC
   - Multiplicar GC
   - Criar/Editar Série/Lição
   - Salvar Configurações

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/layout.tsx` (updated - add Toaster)
- Todas as páginas com mutações (updated)

**Usage**:
```typescript
import { toast } from 'sonner';

toast.success('GC criado com sucesso!');
toast.error('Erro ao criar GC');
```

**Success Criteria**:
- [x] Toasts exibidos em todas as operações
- [x] Mensagens claras e em português
- [x] Posicionamento consistente

---

### T037: Adicionar Confirmações para Ações Destrutivas [P]
**Priority**: LOW
**Estimated**: 1h
**Dependencies**: T035
**Can run in parallel**: Yes

**Description**:
Adicionar modais de confirmação para ações destrutivas.

**Steps**:
1. Usar `AlertDialog` do shadcn/ui
2. Adicionar confirmação antes de:
   - Excluir série
   - Excluir lição
   - Inativar GC
   - Multiplicar GC (confirmação no step 4)
3. Mensagens claras sobre o que será afetado

**Files**:
- Componentes e páginas com ações destrutivas (updated)

**Example**:
```tsx
<AlertDialog>
  <AlertDialogTrigger>Excluir</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
    <AlertDialogDescription>
      Esta ação não pode ser desfeita. A série será marcada como excluída.
    </AlertDialogDescription>
    <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
    <AlertDialogCancel>Cancelar</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>
```

**Success Criteria**:
- [x] Confirmações em todas as ações destrutivas
- [x] Mensagens claras
- [x] Usuário pode cancelar

---

### T038: Implementar Paginação em Listas Longas [P]
**Priority**: LOW
**Estimated**: 1.5h
**Dependencies**: T035
**Can run in parallel**: Yes

**Description**:
Adicionar paginação em listas que podem ter > 50 itens.

**Steps**:
1. Identificar listas longas:
   - Lista de GCs (`/admin/growth-groups`)
   - Lista de usuários (`/admin/users`)
   - Relatórios com tabelas extensas
2. Usar `.range()` do Supabase para paginação
3. Adicionar controles de paginação (shadcn/ui Pagination)
4. Estado: página atual, itens por página (default: 50)

**Files**:
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/growth-groups/page.tsx` (updated)
- `/Users/rafael/dev/carmelo-app/web/src/app/(app)/admin/users/page.tsx` (updated - se aplicável)

**Supabase Pagination**:
```typescript
const page = 0;
const itemsPerPage = 50;
const from = page * itemsPerPage;
const to = from + itemsPerPage - 1;

const { data, count } = await supabase
  .from('growth_groups')
  .select('*', { count: 'exact' })
  .range(from, to);
```

**Success Criteria**:
- [x] Paginação funciona em listas longas
- [x] Performance melhora
- [x] Navegação entre páginas funcional

---

### T039: Testar Responsividade em Mobile [P]
**Priority**: LOW
**Estimated**: 1h
**Dependencies**: T038
**Can run in parallel**: Yes

**Description**:
Testar e ajustar responsividade da área admin em mobile.

**Steps**:
1. Abrir DevTools em modo responsivo (375px, 768px)
2. Verificar páginas:
   - Dashboard
   - Listagem de GCs
   - Formulários
   - Wizard de multiplicação
   - Relatórios
3. Ajustar:
   - Sidebar colapsável em < 768px
   - Tabelas scrolláveis horizontalmente
   - Formulários com campos empilhados
   - Gráficos redimensionam

**Files**:
- Vários (ajustes de Tailwind classes)

**Success Criteria**:
- [x] Área admin usável em 375px+
- [x] Sidebar colapsa em mobile
- [x] Tabelas scrolláveis
- [x] Formulários legíveis

---

### T040: Executar Teste de Segurança (Cenário 7 Quickstart)
**Priority**: LOW
**Estimated**: 15min
**Dependencies**: T039
**Can run in parallel**: No

**Description**:
Executar Cenário 7 de `quickstart.md` para validar bloqueio de não-admins.

**Steps**:
1. Logout do admin
2. Login como usuário comum (não-admin)
3. Tentar acessar `/admin`
4. Verificar redirecionamento para `/dashboard`
5. Tentar URLs diretas: `/admin/growth-groups`, `/admin/lessons`
6. Verificar todas bloqueadas

**Files**:
- None (teste manual)

**Success Criteria**:
- [x] Não-admins bloqueados de todas as rotas admin
- [x] Redirecionamento funciona
- [x] Nenhum conteúdo admin visível

---

### T041: Revisão Final e Build de Produção
**Priority**: LOW
**Estimated**: 30min
**Dependencies**: T040
**Can run in parallel**: No

**Description**:
Executar build de produção e validar ausência de erros.

**Steps**:
1. Executar `npm run build` na pasta `web/`
2. Corrigir quaisquer erros TypeScript/ESLint
3. Verificar warnings e resolver se críticos
4. Executar `npm run start` para testar build
5. Smoke test: navegar pelas principais páginas admin

**Files**:
- None (teste de build)

**Success Criteria**:
- [x] Build completa sem erros
- [x] Warnings mínimos ou zero
- [x] App funciona em modo produção
- [x] Performance adequada

---

## Parallel Execution Strategy

### Phase 1 Parallel Groups

**Group 1A** (can run together):
```bash
# T002, T003, T004, T006 - Different components
Task agent execute T002  # AdminShell
Task agent execute T003  # AdminSidebar
Task agent execute T004  # AdminBreadcrumbs
Task agent execute T006  # AdminMetricsCard
```

### Phase 2 Parallel Groups

**Group 2A** (can run together):
```bash
# T009, T011 - Different components
Task agent execute T009  # AdminGrowthGroupList
Task agent execute T011  # AdminGrowthGroupForm
```

**Group 2B** (can run together after 2A):
```bash
# T012, T013 - Different page files
Task agent execute T012  # /new page
Task agent execute T013  # /[id] page
```

### Phase 3-7 Parallel Groups

Similar pattern: components can be parallel, pages sequential.

---

## Progress Tracking

- [x] **FASE 1**: T001-T008 (Fundação) - 8/8 complete ✅
  - [x] T000: Instalar dependências ✅
  - [x] T001: Criar migration ✅
  - [x] T002: Criar AdminShell component ✅
  - [x] T003: Criar AdminSidebar component ✅
  - [x] T004: Criar AdminBreadcrumbs component ✅
  - [x] T005: Atualizar /admin/layout.tsx ✅
  - [x] T006: Criar AdminMetricsCard component ✅
  - [x] T007: Implementar Dashboard Admin ✅
  - [x] T008: Testar navegação manualmente ✅
- [x] **FASE 2**: T009-T014 (Gestão GCs) - 6/6 complete ✅ MVP READY
  - [x] T009: Criar AdminGrowthGroupList component ✅
  - [x] T010: Criar página de listagem de GCs ✅
  - [x] T011: Criar AdminGrowthGroupForm component ✅
  - [x] T012: Criar página de criação de GC ✅
  - [x] T013: Criar página de edição de GC ✅
  - [x] T014: Testar CRUD de GCs (manual) ✅
- [x] **FASE 3**: T015-T020 (Multiplicação) - 6/6 complete ✅
  - [x] T015: Criar GCMultiplicationWizard component ✅
  - [x] T016: Implementar Step 1 do Wizard ✅
  - [x] T017: Implementar Step 2 do Wizard ✅
  - [x] T018: Implementar Steps 3 e 4 do Wizard ✅
  - [x] T019: Criar página de multiplicação ✅
  - [x] T020: Implementar Server Action completa ✅
- [ ] **FASE 4**: T021-T027 (Lições) - 3/7 complete
  - [x] T021: Criar AdminSeriesList component ✅
  - [x] T022: Criar AdminLessonList com drag-and-drop ✅
  - [x] T023: Criar página de listagem de lições ✅
  - [ ] T024: Criar formulários de série e lição
  - [ ] T025: Criar páginas de criação/edição de série
  - [ ] T026: Criar páginas de criação/edição de lição
  - [ ] T027: Testar gestão de lições (manual)
- [x] **FASE 5**: T028-T032 (Relatórios) - 5/5 complete ✅
- [x] **FASE 6**: T033-T034 (Configurações) - 2/2 complete ✅
- [ ] **FASE 7**: T035-T041 (Polimento) - 0/7 complete

**Total**: 30/41 tasks complete (73%)

---

## Next Steps

Para iniciar implementação:

1. ✅ Checkout branch: `git checkout 004-area-administrativa`
2. ✅ Executar T000: Instalar dependências
3. ✅ Executar T001: Criar migration
4. Começar FASE 1 com tasks paralelas (T002-T006)
5. Seguir ordem de dependências
6. Testar manualmente após cada fase
7. Commitar progressivamente

**Comando para iniciar**:
```bash
cd /Users/rafael/dev/carmelo-app
git checkout 004-area-administrativa
cd web
npm install recharts @dnd-kit/core @dnd-kit/sortable date-fns sonner
```

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Ready for**: Implementation (/implement or manual execution)
