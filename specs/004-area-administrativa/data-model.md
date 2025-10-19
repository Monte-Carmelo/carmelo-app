# Data Model: Área Administrativa

**Feature**: 004-area-administrativa
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR) with English schema names (per Constitution VI)

---

## Overview

Este documento detalha a nova tabela `gc_multiplication_events` criada para auditar e rastrear eventos de multiplicação de Grupos de Crescimento. As demais tabelas do sistema permanecem inalteradas estruturalmente - apenas receberão novos registros e updates de status.

---

## Nova Tabela: gc_multiplication_events

### Propósito
Registrar permanentemente todos os eventos de multiplicação de GCs, permitindo:
- Auditoria completa de quem multiplicou qual GC e quando
- Rastreamento de "linhagem" de GCs (qual GC originou quais grupos filhos)
- Relatórios de crescimento orgânico
- Histórico de decisões administrativas

### Schema (SQL)

```sql
CREATE TABLE gc_multiplication_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referências
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL,  -- Array de IDs dos novos GCs criados
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Metadados
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,  -- Observações sobre o processo (opcional)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_gc_mult_original ON gc_multiplication_events(original_gc_id);
CREATE INDEX idx_gc_mult_user ON gc_multiplication_events(multiplied_by_user_id);
CREATE INDEX idx_gc_mult_date ON gc_multiplication_events(multiplied_at DESC);

-- Constraints
ALTER TABLE gc_multiplication_events
  ADD CONSTRAINT chk_new_gcs_not_empty
  CHECK (array_length(new_gc_ids, 1) > 0);

-- Comments
COMMENT ON TABLE gc_multiplication_events IS
  'Log de eventos de multiplicação de GCs. Registra qual GC originou quais novos GCs e por qual admin.';

COMMENT ON COLUMN gc_multiplication_events.original_gc_id IS
  'ID do GC original que foi multiplicado';

COMMENT ON COLUMN gc_multiplication_events.new_gc_ids IS
  'Array de IDs dos novos GCs criados a partir do original';

COMMENT ON COLUMN gc_multiplication_events.multiplied_by_user_id IS
  'ID do usuário admin que executou a multiplicação';

COMMENT ON COLUMN gc_multiplication_events.notes IS
  'Observações opcionais sobre o processo de multiplicação';
```

### Campos

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | Identificador único do evento |
| `original_gc_id` | UUID | NOT NULL | - | FK para `growth_groups.id` - GC que foi multiplicado |
| `new_gc_ids` | UUID[] | NOT NULL | - | Array de UUIDs dos novos GCs criados |
| `multiplied_by_user_id` | UUID | NOT NULL | - | FK para `users.id` - Admin que executou |
| `multiplied_at` | TIMESTAMPTZ | NOT NULL | NOW() | Data/hora da multiplicação |
| `notes` | TEXT | NULL | - | Observações sobre o processo |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Timestamp de criação do registro |

### Relacionamentos

```
gc_multiplication_events
  ├─ original_gc_id  ──→  growth_groups.id  (many-to-one)
  ├─ new_gc_ids[]    ──→  growth_groups.id  (many-to-many via array)
  └─ multiplied_by_user_id ──→ users.id     (many-to-one)
```

**Cardinalidade**:
- Um `growth_group` pode ter ZERO ou MAIS eventos de multiplicação como original (foi multiplicado 0-N vezes)
- Um `growth_group` pode ter ZERO ou UM evento de multiplicação como filho (foi criado a partir de 0-1 multiplicação)
- Um `user` (admin) pode ter executado ZERO ou MAIS multiplicações

### Constraints e Validações

1. **NOT NULL constraints**:
   - `original_gc_id`: Sempre deve referenciar um GC existente
   - `new_gc_ids`: Array não pode ser NULL
   - `multiplied_by_user_id`: Sempre deve referenciar um usuário existente
   - `multiplied_at`: Data/hora obrigatória

2. **CHECK constraints**:
   - `chk_new_gcs_not_empty`: Array `new_gc_ids` deve ter pelo menos 1 elemento

3. **Foreign Key constraints**:
   - `original_gc_id` REFERENCES `growth_groups(id)` - GC original deve existir
   - `multiplied_by_user_id` REFERENCES `users(id)` - Admin deve existir
   - NOTA: `new_gc_ids` não tem FK direto (é array), validação feita em application layer

### Índices

1. **`idx_gc_mult_original`** (original_gc_id):
   - Buscar todas as multiplicações de um GC específico
   - Query: "Este GC já foi multiplicado? Quantas vezes?"

2. **`idx_gc_mult_user`** (multiplied_by_user_id):
   - Buscar multiplicações feitas por um admin específico
   - Query: "Quais GCs este admin multiplicou?"

3. **`idx_gc_mult_date`** (multiplied_at DESC):
   - Listar multiplicações recentes
   - Relatórios de crescimento temporal

### Queries Típicas

#### 1. Buscar multiplicações de um GC específico

```sql
SELECT
  gme.*,
  gg_original.name as original_name,
  u.person_id,
  p.name as admin_name
FROM gc_multiplication_events gme
JOIN growth_groups gg_original ON gme.original_gc_id = gg_original.id
JOIN users u ON gme.multiplied_by_user_id = u.id
JOIN people p ON u.person_id = p.id
WHERE gme.original_gc_id = $1
ORDER BY gme.multiplied_at DESC;
```

#### 2. Listar multiplicações recentes (últimas 10)

```sql
SELECT
  gme.*,
  gg.name as original_gc_name,
  p.name as admin_name,
  array_length(gme.new_gc_ids, 1) as num_new_gcs
FROM gc_multiplication_events gme
JOIN growth_groups gg ON gme.original_gc_id = gg.id
JOIN users u ON gme.multiplied_by_user_id = u.id
JOIN people p ON u.person_id = p.id
ORDER BY gme.multiplied_at DESC
LIMIT 10;
```

#### 3. Rastrear linhagem de um GC (GC foi criado a partir de qual?)

```sql
SELECT
  gme.id as event_id,
  gme.original_gc_id,
  gg_original.name as parent_gc_name,
  gme.multiplied_at,
  p.name as multiplied_by
FROM gc_multiplication_events gme
JOIN growth_groups gg_original ON gme.original_gc_id = gg_original.id
JOIN users u ON gme.multiplied_by_user_id = u.id
JOIN people p ON u.person_id = p.id
WHERE $1 = ANY(gme.new_gc_ids);  -- $1 é o ID do GC filho
```

#### 4. Total de GCs criados por multiplicação (métrica de crescimento)

```sql
SELECT
  COUNT(*) as total_multiplication_events,
  SUM(array_length(new_gc_ids, 1)) as total_new_gcs_created,
  AVG(array_length(new_gc_ids, 1)) as avg_gcs_per_multiplication
FROM gc_multiplication_events
WHERE multiplied_at >= NOW() - INTERVAL '1 year';
```

---

## Tabelas Existentes - Mudanças de Estado

### growth_groups

**Mudanças**: Apenas updates de status durante processo de multiplicação.

**Estados durante multiplicação**:
1. **Antes**: `status = 'active'`
2. **Durante**: `status = 'multiplying'` (temporário)
3. **Depois**:
   - Se admin escolheu manter ativo: `status = 'active'`
   - Se admin escolheu inativar: `status = 'inactive'`

**SQL durante multiplicação**:
```sql
-- Passo 1: Marcar como multiplicando
UPDATE growth_groups
SET status = 'multiplying', updated_at = NOW()
WHERE id = $original_gc_id;

-- Passo 2 (transação): Criar novos GCs
INSERT INTO growth_groups (name, mode, address, weekday, time, status, ...)
VALUES (...), (...);  -- Um ou mais novos GCs

-- Passo final: Finalizar status do original
UPDATE growth_groups
SET status = $final_status, updated_at = NOW()  -- 'active' ou 'inactive'
WHERE id = $original_gc_id;
```

### growth_group_participants

**Mudanças**: Membros transferidos para novos GCs têm status atualizado.

**Estados**:
- **Antes**: `status = 'active'` no GC original
- **Depois** (membros transferidos):
  - No GC original: `status = 'transferred'`, `left_at = NOW()`
  - Nos novos GCs: novo registro com `status = 'active'`, `joined_at = NOW()`

**SQL durante multiplicação**:
```sql
-- Marcar membros como transferidos
UPDATE growth_group_participants
SET
  status = 'transferred',
  left_at = NOW(),
  updated_at = NOW()
WHERE id = ANY($transferred_member_ids);

-- Criar participantes nos novos GCs
INSERT INTO growth_group_participants
  (gc_id, person_id, role, status, joined_at, added_by_user_id)
VALUES
  ($new_gc_1_id, $person_id_1, 'member', 'active', NOW(), $admin_id),
  ($new_gc_1_id, $person_id_2, 'leader', 'active', NOW(), $admin_id),
  ($new_gc_2_id, $person_id_3, 'member', 'active', NOW(), $admin_id),
  (...);
```

---

## Migration File

**Arquivo**: `supabase/migrations/YYYYMMDDHHMMSS_create_gc_multiplication_events.sql`

```sql
-- Migration: Create gc_multiplication_events table
-- Feature: 004-area-administrativa
-- Date: 2025-10-18

-- Create table
CREATE TABLE IF NOT EXISTS gc_multiplication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL,
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gc_mult_original
  ON gc_multiplication_events(original_gc_id);

CREATE INDEX IF NOT EXISTS idx_gc_mult_user
  ON gc_multiplication_events(multiplied_by_user_id);

CREATE INDEX IF NOT EXISTS idx_gc_mult_date
  ON gc_multiplication_events(multiplied_at DESC);

-- Add constraint
ALTER TABLE gc_multiplication_events
  ADD CONSTRAINT chk_new_gcs_not_empty
  CHECK (array_length(new_gc_ids, 1) > 0);

-- Add comments
COMMENT ON TABLE gc_multiplication_events IS
  'Log de eventos de multiplicação de GCs. Registra qual GC originou quais novos GCs e por qual admin.';

COMMENT ON COLUMN gc_multiplication_events.original_gc_id IS
  'ID do GC original que foi multiplicado';

COMMENT ON COLUMN gc_multiplication_events.new_gc_ids IS
  'Array de IDs dos novos GCs criados a partir do original';

COMMENT ON COLUMN gc_multiplication_events.multiplied_by_user_id IS
  'ID do usuário admin que executou a multiplicação';

COMMENT ON COLUMN gc_multiplication_events.notes IS
  'Observações opcionais sobre o processo de multiplicação';
```

---

## TypeScript Types (from Supabase)

Após executar `supabase gen types typescript`, a nova tabela gerará:

```typescript
export interface Database {
  public: {
    Tables: {
      gc_multiplication_events: {
        Row: {
          id: string
          original_gc_id: string
          new_gc_ids: string[]
          multiplied_by_user_id: string
          multiplied_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          original_gc_id: string
          new_gc_ids: string[]
          multiplied_by_user_id: string
          multiplied_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          original_gc_id?: string
          new_gc_ids?: string[]
          multiplied_by_user_id?: string
          multiplied_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      // ... outras tabelas
    }
  }
}
```

---

## Diagrama ER (Texto)

```
┌──────────────────────┐
│   growth_groups      │
│──────────────────────│
│ id (PK)              │◄────┐
│ name                 │     │
│ status               │     │ many-to-one
│ mode                 │     │
│ ...                  │     │
└──────────────────────┘     │
                             │
┌──────────────────────────────────┐
│ gc_multiplication_events         │
│──────────────────────────────────│
│ id (PK)                          │
│ original_gc_id (FK) ─────────────┘
│ new_gc_ids (UUID[]) ─────┐
│ multiplied_by_user_id(FK)│      ┌──────────────────────┐
│ multiplied_at            │      │   users              │
│ notes                    │      │──────────────────────│
│ created_at               │      │ id (PK)              │
└──────────────┬───────────┘      │ person_id (FK)       │
               │                  │ is_admin             │
               │                  │ ...                  │
               │                  └──────────────────────┘
               │                             ▲
               │ many-to-one                 │
               └─────────────────────────────┘
```

---

## Exemplos de Uso

### Registrar evento de multiplicação

```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const supabase = getSupabaseBrowserClient();

// Após completar transação de multiplicação com sucesso
const { data, error } = await supabase
  .from('gc_multiplication_events')
  .insert({
    original_gc_id: originalGcId,
    new_gc_ids: [newGc1Id, newGc2Id],
    multiplied_by_user_id: session.user.id,
    multiplied_at: new Date().toISOString(),
    notes: 'Multiplicação planejada devido ao crescimento acelerado do grupo',
  })
  .select()
  .single();

if (error) {
  console.error('Erro ao registrar evento de multiplicação:', error);
} else {
  console.log('Evento registrado:', data.id);
}
```

### Buscar histórico de multiplicações

```typescript
// Buscar todas as multiplicações dos últimos 6 meses
const { data: events, error } = await supabase
  .from('gc_multiplication_events')
  .select(`
    id,
    original_gc_id,
    new_gc_ids,
    multiplied_at,
    notes,
    growth_groups!original_gc_id (
      id,
      name
    ),
    users!multiplied_by_user_id (
      id,
      people (
        name
      )
    )
  `)
  .gte('multiplied_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
  .order('multiplied_at', { ascending: false });

// Processar eventos
events?.forEach(event => {
  console.log(`${event.growth_groups.name} foi multiplicado em ${event.new_gc_ids.length} novos GCs`);
  console.log(`Por: ${event.users.people.name}`);
  console.log(`Quando: ${new Date(event.multiplied_at).toLocaleDateString('pt-BR')}`);
});
```

---

## Considerações de Performance

### Índices
- **original_gc_id**: Queries frequentes de "histórico deste GC" → índice essencial
- **multiplied_by_user_id**: Queries de "ações deste admin" → índice útil para auditoria
- **multiplied_at**: Ordenação temporal em relatórios → índice descendente para "mais recentes primeiro"

### Tamanho Estimado
- Assumindo 100 GCs no sistema e taxa de multiplicação de 10% ao ano:
  - ~10 eventos/ano
  - Cada registro: ~100-200 bytes
  - Total: ~1-2 KB/ano (desprezível)

### Limpeza de Dados
- **Retenção**: Manter eventos permanentemente (auditoria)
- **Arquivamento**: Não necessário (volume baixo)

---

## Versioning

**Versão**: 1.0
**Data**: 2025-10-18
**Autor**: Planning Phase (004-area-administrativa)
