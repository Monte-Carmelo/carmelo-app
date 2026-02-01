# Modelo de Dados: App de Gestão de Grupos de Crescimento

**Feature**: 001-crie-um-app
**Data**: 2025-10-04
**Referência**: [spec.md](./spec.md) | [research.md](./research.md)

## Visão Geral

Este modelo suporta:
- **Entidade `people` (pessoas) normalizada**: Evita duplicação de dados pessoais (nome, email, telefone) entre users, papéis de GC e visitors
- Hierarquia organizacional expansível (N níveis via adjacency list + materialized path)
- Gestão de GCs com membros e visitantes
- Registro de reuniões com presença
- Catálogo de lições organizadas em séries
- Conversão automática de visitantes para membros
- Métricas agregadas para dashboards

**Princípios de Design**:
1. **Normalização até 3NF** (reduz redundância):
   - `people` (pessoas) = entidade base com dados pessoais
   - `users` = autenticação + hierarquia (referencia `people`)
   - `growth_group_participants` = relacionamento `growth_groups` ↔ `people` com papel (`member`, `leader`, `co_leader`, `supervisor`)
   - `visitors` = tracking de visitas (referencia `people` + GC)
2. Indexes em FKs e campos de busca frequente
3. Row Level Security (RLS) em todas as tabelas
4. Timestamps (created_at, updated_at) para auditoria
5. Soft deletes onde aplicável (status/deleted_at)

---

## Entidades Principais

### 1. people (Pessoas) - ENTIDADE BASE

Representa qualquer pessoa no sistema (visitante, membro, usuário do app). **Normaliza dados pessoais** para evitar duplicação.

```sql
CREATE TABLE people (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  email TEXT,
  phone TEXT,
  birth_date DATE,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraint: Pelo menos email OU telefone
  CONSTRAINT person_has_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_people_email ON people(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_people_phone ON people(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_people_name ON people USING GIN(to_tsvector('portuguese', name)) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Líderes veem pessoas vinculadas aos GCs que lideram (membros, co-líderes, supervisores e visitantes ativos)
CREATE POLICY "leaders_view_people_in_gc" ON people
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants leader_role
        WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND leader_role.role IN ('leader', 'co_leader')
          AND leader_role.status = 'active'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM visitors v
    WHERE v.person_id = people.id
      AND v.status = 'active'
      AND v.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants leader_role
        WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND leader_role.role IN ('leader', 'co_leader')
          AND leader_role.status = 'active'
      )
  )
);

-- Supervisores veem pessoas vinculadas aos GCs que supervisionam diretamente ou via subordinados
CREATE POLICY "supervisors_view_people" ON people
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
        WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND supervisor_role.role = 'supervisor'
          AND supervisor_role.status = 'active'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
        WHERE supervisor_role.role = 'supervisor'
          AND supervisor_role.person_id IN (
            SELECT person_id
            FROM users
            WHERE hierarchy_path LIKE (
              SELECT hierarchy_path || '%'
              FROM users
              WHERE id = auth.uid()
            )
          )
      )
  )
  OR EXISTS (
    SELECT 1
    FROM visitors v
    WHERE v.person_id = people.id
      AND v.status = 'active'
      AND v.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
        WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND supervisor_role.role = 'supervisor'
          AND supervisor_role.status = 'active'
      )
  )
);

-- Admins veem todos
CREATE POLICY "admins_see_all_people" ON people
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `name` (nome): Não vazio, máximo 255 caracteres
- `email` OU `phone` (telefone): Pelo menos um deve estar preenchido
- `email`: Formato válido (validado por app)

---

### 2. users (Usuários do App)

Representa pessoas que **acessam o sistema** (autenticação). Referencia `people` (pessoas) para dados pessoais. Inclui hierarquia organizacional.

**IMPORTANTE**: Papéis (líder, supervisor, coordenador) **NÃO são exclusivos**. Um usuário pode ser simultaneamente:
- Líder de um GC
- Supervisor de outros GCs (através de hierarchy_parent_id)
- Coordenador de supervisores

Os papéis são **derivados de relacionamentos**, não armazenados como campo estático.

```sql
CREATE TABLE users (
  -- Identificação (sincronizado com Supabase Auth)
  id UUID PRIMARY KEY, -- Mesmo ID do Supabase Auth
  person_id UUID NOT NULL UNIQUE REFERENCES people(id) ON DELETE CASCADE,

  -- Hierarquia Organizacional (parent/child tree)
  hierarchy_parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hierarchy_path TEXT NOT NULL, -- Ex: '/uuid1/uuid2/uuid3'
  hierarchy_depth INT NOT NULL DEFAULT 0, -- Profundidade na árvore (0=raiz, 1=filho direto, etc.)

  -- Permissões
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_person ON users(person_id);
CREATE INDEX idx_users_parent ON users(hierarchy_parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_path ON users USING GIN(hierarchy_path gin_trgm_ops);
CREATE INDEX idx_users_depth ON users(hierarchy_depth) WHERE deleted_at IS NULL;

-- Trigger para auto-atualizar hierarchy_path e hierarchy_depth
CREATE OR REPLACE FUNCTION update_hierarchy_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hierarchy_parent_id IS NULL THEN
    NEW.hierarchy_path := '/' || NEW.id::TEXT;
    NEW.hierarchy_depth := 0;
  ELSE
    SELECT hierarchy_path || '/' || NEW.id::TEXT, hierarchy_depth + 1
    INTO NEW.hierarchy_path, NEW.hierarchy_depth
    FROM users
    WHERE id = NEW.hierarchy_parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hierarchy_path
BEFORE INSERT OR UPDATE OF hierarchy_parent_id ON users
FOR EACH ROW EXECUTE FUNCTION update_hierarchy_path();

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Usuários veem a si mesmos
CREATE POLICY "users_see_self" ON users
FOR SELECT USING (id = auth.uid());

-- Usuários veem pessoas na sua hierarquia (subordinados diretos e indiretos)
CREATE POLICY "users_see_subordinates" ON users
FOR SELECT USING (
  hierarchy_path LIKE (
    SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
  )
);

-- Usuários veem seu supervisor direto (parent)
CREATE POLICY "users_see_supervisor" ON users
FOR SELECT USING (
  id = (SELECT hierarchy_parent_id FROM users WHERE id = auth.uid())
);

-- Admins veem todos
CREATE POLICY "admins_see_all_users" ON users
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `person_id` (pessoa_id): Deve referenciar uma pessoa válida em `people` (pessoas)
- `hierarchy_depth`: >= 0 (calculado automaticamente)
- `is_admin`: Apenas admins podem setar is_admin=true em outros usuários (via RLS policy)
- **Dados pessoais** (nome, email, telefone): Acessados via JOIN com `people` (pessoas)

**Como Papéis são Determinados** (queries derivadas):

```sql
-- Verificar se usuário é LÍDER (possui papel 'leader'/'co_leader' em pelo menos 1 GC)
SELECT EXISTS (
  SELECT 1
  FROM growth_group_participants gpr
  WHERE gpr.person_id = (SELECT person_id FROM users WHERE id = user_id_var)
    AND gpr.role IN ('leader', 'co_leader')
    AND gpr.status = 'active'
    AND gpr.deleted_at IS NULL
) AS is_leader;

-- Verificar se usuário é SUPERVISOR (possui papel 'supervisor' em pelo menos 1 GC)
SELECT EXISTS (
  SELECT 1
  FROM growth_group_participants gpr
  WHERE gpr.person_id = (SELECT person_id FROM users WHERE id = user_id_var)
    AND gpr.role = 'supervisor'
    AND gpr.status = 'active'
    AND gpr.deleted_at IS NULL
) AS is_supervisor;

-- Verificar se usuário é COORDENADOR (tem subordinados na hierarquia)
SELECT EXISTS (
  SELECT 1 FROM users WHERE hierarchy_parent_id = user_id_var AND deleted_at IS NULL
) AS is_coordinator;

-- Papéis ACUMULADOS de um usuário (exemplo)
-- João pode ser: { leader: true, supervisor: true, coordinator: false }
```

**Cenário Real**:
- João é **líder** do "GC Esperança" (`growth_group_participants: gc_id=esperança, person_id=joão, role='leader'`)
- João também **supervisiona** o "GC Fé" e "GC Amor" (`growth_group_participants: gc_id=fé/amor, person_id=joão, role='supervisor'`)
- João tem Maria e Pedro como subordinados na hierarquia (`users.hierarchy_parent_id = joão` para Maria e Pedro)
- Resultado: João acumula 3 papéis simultaneamente (líder de 1 GC + supervisor de 2 GCs + coordenador de 2 pessoas)

---

### 2. growth_groups (Grupos de Crescimento)

**IMPORTANTE**: Papéis (líder, co-líder, supervisor, membro) são **many-to-many** e ficam centralizados em `growth_group_participants`.

```sql
CREATE TABLE growth_groups (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,

  -- Modalidade e Localização
  mode TEXT NOT NULL CHECK (mode IN ('in_person', 'online')),
  address TEXT, -- Obrigatório se presencial
  weekday INT CHECK (weekday BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  time TIME,

  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'multiplying')),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT address_if_in_person CHECK (
    mode = 'online' OR (mode = 'in_person' AND address IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_gc_name ON growth_groups(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_gc_status ON growth_groups(status) WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER update_growth_groups_updated_at
BEFORE UPDATE ON growth_groups
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE growth_groups ENABLE ROW LEVEL SECURITY;

-- Líderes/co-líderes veem GCs que lideram
CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- Líderes/co-líderes podem editar GCs que lideram
CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- Supervisores veem GCs que supervisionam
CREATE POLICY "supervisors_view_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- Supervisores veem GCs supervisionados por subordinados (via hierarchy)
CREATE POLICY "supervisors_view_subordinate_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
      AND person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

-- Coordenadores podem criar GCs (atribuindo líderes/supervisores subordinados)
CREATE POLICY "coordinators_create_gcs" ON growth_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u2 WHERE u2.hierarchy_parent_id = users.id
      )
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Admins veem e editam todos
CREATE POLICY "admins_manage_all_gcs" ON growth_groups
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `name` (nome): Não vazio, máximo 255 caracteres
- `mode` (modalidade): 'in_person' (presencial) ou 'online'
- `address` (endereco): Obrigatório se mode='in_person' (presencial)
- **Papéis**: Atribuídos via `growth_group_participants` (mínimo 1 líder e 1 supervisor ativos por GC)

---

### 2a. growth_group_participants (Papéis em GC)

Relacionamento many-to-many entre `growth_groups` e `people`, com papéis explícitos. Substitui as tabelas `gc_leaders`, `gc_supervisors` e `members` anteriores.

```sql
CREATE TABLE growth_group_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'leader', 'co_leader', 'supervisor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  added_by_user_id UUID REFERENCES users(id),
  converted_from_visitor_id UUID REFERENCES visitors(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (gc_id, person_id, role)
);

-- Indexes
CREATE INDEX idx_growth_group_participants_gc_active ON growth_group_participants(gc_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_growth_group_participants_person ON growth_group_participants(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_growth_group_participants_role ON growth_group_participants(role) WHERE deleted_at IS NULL;

-- Constraint: uma pessoa só pode ter uma membresia ativa por vez
CREATE UNIQUE INDEX uq_growth_group_participants_active_membership ON growth_group_participants(person_id)
WHERE role = 'member' AND status = 'active' AND deleted_at IS NULL;

-- Constraint: GC precisa de pelo menos 1 líder e 1 supervisor ativos
CREATE OR REPLACE FUNCTION ensure_gc_role_minimum() RETURNS TRIGGER AS $$
DECLARE
  required_role TEXT := TG_ARGV[0];
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = required_role AND OLD.status = 'active'
      AND (NEW.role <> required_role OR NEW.status <> 'active')) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM growth_group_participants gpr
      WHERE gpr.gc_id = OLD.gc_id
        AND gpr.role = required_role
        AND gpr.status = 'active'
        AND gpr.deleted_at IS NULL
        AND gpr.id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'GC deve ter pelo menos 1 % ativo', required_role;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_leader
BEFORE UPDATE OR DELETE ON growth_group_participants
FOR EACH ROW
WHEN (OLD.role = 'leader' AND OLD.status = 'active')
EXECUTE FUNCTION ensure_gc_role_minimum('leader');

CREATE TRIGGER ensure_gc_has_supervisor
BEFORE UPDATE OR DELETE ON growth_group_participants
FOR EACH ROW
WHEN (OLD.role = 'supervisor' AND OLD.status = 'active')
EXECUTE FUNCTION ensure_gc_role_minimum('supervisor');

CREATE TRIGGER update_growth_group_participants_updated_at
BEFORE UPDATE ON growth_group_participants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE growth_group_participants ENABLE ROW LEVEL SECURITY;

-- Usuário vê suas próprias atribuições
CREATE POLICY "users_view_own_gc_roles" ON growth_group_participants
FOR SELECT USING (
  person_id = (SELECT person_id FROM users WHERE id = auth.uid())
);

-- Líderes/co-líderes veem e gerenciam papéis do seu GC (inclui membros)
CREATE POLICY "leaders_manage_growth_group_participants" ON growth_group_participants
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
  )
)
WITH CHECK (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
  )
  AND role IN ('member', 'co_leader')
);

-- Supervisores veem papéis de GCs que supervisionam (diretos e via subordinados)
CREATE POLICY "supervisors_view_growth_group_participants" ON growth_group_participants
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
  )
  OR gc_id IN (
    SELECT gc_id FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id IN (
        SELECT person_id FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

-- Coordenadores podem gerenciar supervisores de subordinados
CREATE POLICY "coordinators_manage_supervisors" ON growth_group_participants
FOR ALL USING (
  role = 'supervisor'
  AND gc_id IN (
    SELECT gc_id FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id IN (
        SELECT person_id FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
)
WITH CHECK (role = 'supervisor');

-- Admins gerenciam todos
CREATE POLICY "admins_manage_growth_group_participants" ON growth_group_participants
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Negócio**:
- Um GC **deve** ter pelo menos 1 `leader` e 1 `supervisor` ativos (triggers)
- Pessoas podem atuar em **múltiplos papéis simultaneamente** (ex: líder + supervisor + membro do próprio GC)
- Para `role = 'member'`, apenas um vínculo ativo por pessoa é permitido. Transferências são feitas mudando `status` e inserindo nova linha em outro GC
- `converted_from_visitor_id` registra a origem quando há conversão automática/manual

**Validações adicionais**:
- `left_at` deve ser preenchido quando `status` != 'active' (validado via app/trigger futura)
- `added_by_user_id` usado para auditoria de quem realizou a ação
- `notes` campo livre para justificar alterações de papel

---

### 4. visitors (Visitantes)

Representa **pessoas que visitaram reuniões** mas ainda não são membros de um GC específico. Referencia `people` para dados pessoais e `growth_groups` para o contexto do GC.

```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'inactive')),
  visit_count INT NOT NULL DEFAULT 0,
  first_visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_date TIMESTAMPTZ,

  converted_at TIMESTAMPTZ,
  converted_by_user_id UUID REFERENCES users(id),
  converted_to_participant_id UUID REFERENCES growth_group_participants(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (person_id, gc_id)
);

CREATE INDEX idx_visitors_gc ON visitors(gc_id) WHERE status = 'active';
CREATE INDEX idx_visitors_person ON visitors(person_id);
CREATE INDEX idx_visitors_status ON visitors(status);

CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_visitors" ON visitors
FOR ALL USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
  )
);

CREATE POLICY "supervisors_view_visitors" ON visitors
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
  )
  OR gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "admins_manage_visitors" ON visitors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `person_id`: Referencia pessoa válida em `people`
- `gc_id`: Referencia GC válido (mesmo visitante pode estar ligado a múltiplos GCs)
- `status`: `converted` somente quando `converted_at` preenchido
- `visit_count`: >= 0
- Dados pessoais são obtidos via JOIN com `people`

---

### 4a. visitor_conversion_events (Histórico de Conversão)

Registra cada conversão de visitante em membro ativo. Permite auditoria de quem realizou a conversão, quando aconteceu e qual registro em `growth_group_participants` foi criado.

```sql
CREATE TABLE visitor_conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES growth_group_participants(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_by_user_id UUID REFERENCES users(id),
  conversion_source TEXT NOT NULL CHECK (conversion_source IN ('auto', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitor_conversion_events_gc ON visitor_conversion_events(gc_id);
CREATE INDEX idx_visitor_conversion_events_visitor ON visitor_conversion_events(visitor_id);

ALTER TABLE visitor_conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_view_conversion_events" ON visitor_conversion_events
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
  )
);

CREATE POLICY "supervisors_view_conversion_events" ON visitor_conversion_events
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
  )
  OR gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "admins_manage_conversion_events" ON visitor_conversion_events
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `visitor_id` deve apontar para visitante com `status = 'converted'`
- `participant_id` deve apontar para vínculo criado durante a conversão
- `conversion_source`: `auto` (gatilho automático) ou `manual`
- `notes`: opcional para justificativa ou contexto

---

### 5. meetings (Reuniões)

```sql
CREATE TABLE meetings (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  lesson_template_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Dados da Reunião
  lesson_title TEXT NOT NULL CHECK (char_length(lesson_title) > 0 AND char_length(lesson_title) <= 255),
  datetime TIMESTAMPTZ NOT NULL,
  comments TEXT,

  -- Registro
  registered_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_meetings_gc ON meetings(gc_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_datetime ON meetings(datetime DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_lesson_template ON meetings(lesson_template_id) WHERE lesson_template_id IS NOT NULL;

-- Triggers
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Líderes/co-líderes gerenciam reuniões de seus GCs
CREATE POLICY "leaders_manage_gc_meetings" ON meetings
FOR ALL USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- Supervisores veem reuniões de GCs subordinados
CREATE POLICY "supervisors_view_meetings" ON meetings
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
  )
  OR gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
      AND person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_meetings" ON meetings
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `lesson_title`: obrigatório (permite override mesmo com `lesson_template_id` nulo)
- `datetime` (data_hora): Não pode ser futuro (> NOW())
- `registered_by_user_id` (registrado_por_user_id): Deve ser líder ou supervisor do GC
- `comments`: opcional, usado para anotações pós-reunião

---

### 6. meeting_member_attendance (Presença de participantes do GC)

```sql
CREATE TABLE meeting_member_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES growth_group_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, participant_id)
);

CREATE INDEX idx_member_attendance_meeting ON meeting_member_attendance(meeting_id);
CREATE INDEX idx_member_attendance_participant ON meeting_member_attendance(participant_id);

ALTER TABLE meeting_member_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_member_attendance" ON meeting_member_attendance
FOR ALL USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role IN ('leader', 'co_leader')
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "supervisors_view_member_attendance" ON meeting_member_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role = 'supervisor'
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "admins_manage_member_attendance" ON meeting_member_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- Registro único por participante/reunião (`UNIQUE (meeting_id, participant_id)`)
- `participant_id` deve pertencer ao mesmo GC da reunião (validar via trigger/app)

---

### 6a. meeting_visitor_attendance (Presença de visitantes)

```sql
CREATE TABLE meeting_visitor_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, visitor_id)
);

CREATE INDEX idx_visitor_attendance_meeting ON meeting_visitor_attendance(meeting_id);
CREATE INDEX idx_visitor_attendance_visitor ON meeting_visitor_attendance(visitor_id);

ALTER TABLE meeting_visitor_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role IN ('leader', 'co_leader')
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "supervisors_view_visitor_attendance" ON meeting_visitor_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role = 'supervisor'
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "admins_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Trigger de auto-conversão de visitantes**

```sql
CREATE OR REPLACE FUNCTION auto_convert_visitor() RETURNS TRIGGER AS $$
DECLARE
  threshold INT;
  current_count INT;
  meeting_row meetings%ROWTYPE;
  visitor_row visitors%ROWTYPE;
  participant_id UUID;
BEGIN
  SELECT (value::TEXT)::INT INTO threshold
  FROM config WHERE key = 'visitor_conversion_threshold';

  SELECT COUNT(*) INTO current_count
  FROM meeting_visitor_attendance
  WHERE visitor_id = NEW.visitor_id;

  UPDATE visitors
  SET visit_count = current_count,
      last_visit_date = NOW()
  WHERE id = NEW.visitor_id;

  IF current_count >= threshold THEN
    SELECT * INTO visitor_row
    FROM visitors
    WHERE id = NEW.visitor_id
    FOR UPDATE;

    IF visitor_row.status = 'active' THEN
      SELECT * INTO meeting_row
      FROM meetings
      WHERE id = NEW.meeting_id;

      INSERT INTO growth_group_participants (
        gc_id,
        person_id,
        role,
        status,
        joined_at,
        converted_from_visitor_id,
        added_by_user_id
      )
      VALUES (
        meeting_row.gc_id,
        visitor_row.person_id,
        'member',
        'active',
        NOW(),
        visitor_row.id,
        meeting_row.registered_by_user_id
      )
      ON CONFLICT (gc_id, person_id, role) DO UPDATE
      SET status = 'active',
          joined_at = NOW(),
          deleted_at = NULL,
          updated_at = NOW(),
          converted_from_visitor_id = visitor_row.id
      RETURNING id INTO participant_id;

      UPDATE visitors
      SET status = 'converted',
          converted_at = NOW(),
          converted_by_user_id = meeting_row.registered_by_user_id,
          converted_to_participant_id = participant_id
      WHERE id = visitor_row.id;

      INSERT INTO visitor_conversion_events (
        visitor_id,
        participant_id,
        person_id,
        gc_id,
        converted_at,
        converted_by_user_id,
        conversion_source
      )
      VALUES (
        visitor_row.id,
        participant_id,
        visitor_row.person_id,
        meeting_row.gc_id,
        NOW(),
        meeting_row.registered_by_user_id,
        'auto'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_visitor_conversion
AFTER INSERT ON meeting_visitor_attendance
FOR EACH ROW EXECUTE FUNCTION auto_convert_visitor();
```

---

### 7. lesson_series (Séries de Lições)

```sql
CREATE TABLE lesson_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Quem criou (deve ser admin)
  created_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_series_name ON lesson_series(name) WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER update_lesson_series_updated_at
BEFORE UPDATE ON lesson_series
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;

-- Todos podem ler séries
CREATE POLICY "all_read_series" ON lesson_series
FOR SELECT USING (deleted_at IS NULL);

-- Apenas admins criam/editam
CREATE POLICY "admins_manage_series" ON lesson_series
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

---

### 8. lessons (Lições)

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dados da Lição
  title TEXT NOT NULL,
  description TEXT,
  link TEXT, -- Link para material externo (PDF, vídeo, etc.)

  -- Relacionamento com Série
  series_id UUID REFERENCES lesson_series(id) ON DELETE CASCADE,
  order_in_series INT, -- Ordem dentro da série (nullable se lição avulsa)

  -- Quem criou
  created_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraint: Se tem série, deve ter ordem
  CONSTRAINT series_requires_order CHECK (
    (series_id IS NULL AND order_in_series IS NULL)
    OR
    (series_id IS NOT NULL AND order_in_series IS NOT NULL)
  ),

  -- Constraint: Ordem única dentro da série
  UNIQUE(series_id, order_in_series)
);

-- Indexes
CREATE INDEX idx_lessons_series ON lessons(series_id, order_in_series) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_title ON lessons(title) WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Todos podem ler lições
CREATE POLICY "all_read_lessons" ON lessons
FOR SELECT USING (deleted_at IS NULL);

-- Apenas admins criam/editam
CREATE POLICY "admins_manage_lessons" ON lessons
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

---

### 9. config (Configurações do Sistema)

```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed inicial
INSERT INTO config (key, value, description) VALUES
  ('visitor_conversion_threshold', '3', 'Número de visitas para conversão automática de visitante para membro'),
  ('dashboard_cache_ttl_minutes', '5', 'TTL do cache de métricas de dashboard (em minutos)');

-- RLS Policies
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Todos podem ler config
CREATE POLICY "all_read_config" ON config
FOR SELECT USING (true);

-- Apenas admins editam
CREATE POLICY "admins_edit_config" ON config
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

---

## Views para Dashboards

### dashboard_metrics (dashboard_metricas)

```sql
CREATE OR REPLACE VIEW dashboard_metrics AS
WITH gc_stats AS (
  SELECT
    gc.id as gc_id,
    gc.name as gc_name,

    -- Total de reuniões no mês atual
    COUNT(DISTINCT m.id) FILTER (WHERE m.datetime >= DATE_TRUNC('month', NOW())) as meetings_current_month,

    -- Média de presença
    AVG(attendance_count.count) FILTER (WHERE m.datetime >= NOW() - INTERVAL '30 days') as avg_attendance_30d,

    -- Total de membros ativos
    (SELECT COUNT(*) FROM growth_group_participants gpr
     WHERE gpr.gc_id = gc.id
       AND gpr.role = 'member'
       AND gpr.status = 'active'
       AND gpr.deleted_at IS NULL) as total_active_members,

    -- Crescimento de membros (últimos 30 dias)
    (SELECT COUNT(*) FROM growth_group_participants gpr
     WHERE gpr.gc_id = gc.id
       AND gpr.role = 'member'
       AND gpr.joined_at >= NOW() - INTERVAL '30 days') as new_members_30d,

    -- Conversões de visitantes (últimos 30 dias)
    (SELECT COUNT(*) FROM visitor_conversion_events vce
     WHERE vce.gc_id = gc.id
       AND vce.converted_at >= NOW() - INTERVAL '30 days') as conversions_30d,

    -- Taxa de conversão (visitantes únicos vs conversões)
    (SELECT COUNT(DISTINCT v.id) FROM visitors v
     JOIN meeting_visitor_attendance mva ON mva.visitor_id = v.id
     JOIN meetings m2 ON m2.id = mva.meeting_id
     WHERE m2.gc_id = gc.id
       AND mva.created_at >= NOW() - INTERVAL '30 days') as unique_visitors_30d

  FROM growth_groups gc
  LEFT JOIN meetings m ON m.gc_id = gc.id
  LEFT JOIN LATERAL (
    SELECT (
      (SELECT COUNT(*) FROM meeting_member_attendance mma WHERE mma.meeting_id = m.id)
      +
      (SELECT COUNT(*) FROM meeting_visitor_attendance mva WHERE mva.meeting_id = m.id)
    ) as count
  ) attendance_count ON true
  WHERE gc.deleted_at IS NULL
  GROUP BY gc.id
)
SELECT
  gc_id,
  gc_name,
  meetings_current_month,
  ROUND(avg_attendance_30d, 1) as average_attendance,
  total_active_members,
  new_members_30d as growth_30d,
  conversions_30d,
  unique_visitors_30d,
  CASE
    WHEN unique_visitors_30d > 0 THEN ROUND((conversions_30d::DECIMAL / unique_visitors_30d) * 100, 1)
    ELSE 0
  END as conversion_rate_pct
FROM gc_stats;

-- RLS na view herda das tabelas base
-- Usuários só verão métricas dos GCs que têm permissão via RLS em growth_groups
```

---

## Função Auxiliar: update_timestamp

```sql
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Diagrama Relacional (Simplified)

```
people (dados pessoais - base)
  ↓ 1:1
users (auth + hierarquia)
   ↘
    growth_group_participants (papéis por GC)
      ↘             ↙
   growth_groups   visitors (people + gc)
        ↓             ↓
      meetings   visitor_conversion_events
        ↓ 1:N       ↓ 1:N
 meeting_member_attendance   meeting_visitor_attendance
        ↓ N:1               ↓ N:1
growth_group_participants   visitors

lesson_series → lessons → meetings
```

---

## Migrações Supabase (Ordem de Criação)

1. Extensões e funções base (`uuid-ossp`, `pg_trgm`, `update_timestamp()`)
2. **`people`** (pessoas - entidade base - dados pessoais)
3. `users` (referencia `people`, hierarquia organizacional)
4. `config`
5. `growth_groups`
6. `growth_group_participants` (papéis por GC)
7. `visitors` (people + gc)
8. `visitor_conversion_events`
9. `lesson_series`
10. `lessons`
11. `meetings`
12. `meeting_member_attendance`
13. `meeting_visitor_attendance` (trigger `auto_convert_visitor`)
14. Views (`dashboard_metrics`, `user_gc_roles` auxiliares)

---

## Resumo de Constraints

| Tabela | Constraint Chave | Propósito |
|--------|------------------|-----------|
| **people** (pessoas) | `person_has_contact` | Email OU telefone obrigatório (pelo menos um) |
| users | `person_id UNIQUE` | Um usuário = uma pessoa (1:1) |
| users | `hierarchy_path` auto-gerado | Queries eficientes de subárvore hierárquica |
| growth_groups | `address_if_in_person` | Garantir endereço se mode=in_person (presencial) |
| growth_group_participants | `UNIQUE (gc_id, person_id, role)` + `uq_growth_group_participants_active_membership` | Evita duplicidade de papel e garante apenas uma membresia ativa por pessoa |
| growth_group_participants | `ensure_gc_has_leader/supervisor` triggers | GC precisa de líder e supervisor ativos |
| visitors | `UNIQUE (person_id, gc_id)` | Visitante único por GC (pode visitar múltiplos GCs) |
| visitors | `status` CHECK | Controla estados `active/converted/inactive` |
| visitor_conversion_events | `conversion_source` CHECK | Origem da conversão (`auto`/`manual`) |
| meeting_member_attendance | `UNIQUE (meeting_id, participant_id)` | Evita duplicidade de presença de membros numa reunião |
| meeting_visitor_attendance | `UNIQUE (meeting_id, visitor_id)` | Evita duplicidade de presença de visitantes; dispara `auto_convert_visitor` |
| lessons | `series_requires_order` | Lições em série devem ter ordem |
| visitors | `auto_convert_visitor()` trigger | Converte e registra evento após N visitas |

---

## Modelo de Papéis Acumulados (Detalhamento)

### Conceito Central

Todos os papéis relacionados a GC derivam de `growth_group_participants`. A mesma pessoa pode ter múltiplos papéis simultâneos, e o app apenas **deriva** flags como `is_leader` ou `is_supervisor` a partir dessa tabela + hierarquia de usuários.

```
❌ MODELO ERRADO (papel exclusivo):
João = { role: "supervisor" }

✅ MODELO CORRETO (papéis acumulados via growth_group_participants):
João = {
  is_leader: true,      // role in ('leader','co_leader')
  is_supervisor: true,  // role = 'supervisor'
  is_coordinator: true, // tem subordinados em users
  is_admin: false
}
```

### Como Papéis são Determinados

#### 1. **Líder** (is_leader)
Usuário cujo `person_id` aparece em `growth_group_participants` com `role IN ('leader','co_leader')` e `status = 'active'`.

```sql
SELECT EXISTS (
  SELECT 1
  FROM growth_group_participants gpr
  WHERE gpr.person_id = (SELECT person_id FROM users WHERE id = :user_id)
    AND gpr.role IN ('leader', 'co_leader')
    AND gpr.status = 'active'
    AND gpr.deleted_at IS NULL
) AS is_leader;

-- Supabase (web/TypeScript)
const { data: isLeader } = await supabase
  .from('growth_group_participants')
  .select('gc_id')
  .eq('role', 'leader')
  .eq('person_id', currentUser.personId)
  .eq('status', 'active')
  .limit(1)
  .maybeSingle();
```

#### 2. **Supervisor** (is_supervisor)
Mesma lógica, porém `role = 'supervisor'`.

```sql
SELECT EXISTS (
  SELECT 1 FROM growth_group_participants gpr
  WHERE gpr.person_id = (SELECT person_id FROM users WHERE id = :user_id)
    AND gpr.role = 'supervisor'
    AND gpr.status = 'active'
    AND gpr.deleted_at IS NULL
) AS is_supervisor;
```

#### 3. **Coordenador** (is_coordinator)
Derivado da árvore hierárquica (`users.hierarchy_parent_id`). Não depende de `growth_group_participants`.

```sql
SELECT EXISTS (
  SELECT 1 FROM users u2
  WHERE u2.hierarchy_parent_id = :user_id
    AND u2.deleted_at IS NULL
) AS is_coordinator;
```

#### 4. **Admin** (is_admin)
Flag booleana explícita em `users.is_admin`.

### Cenários Reais de Acúmulo

#### Cenário A: João - Líder, Supervisor e Coordenador
```
Hierarquia:
  João (raiz)
    ├─ Maria (líder do GC Paz)
    └─ Pedro (líder do GC Luz)

growth_group_participants:
  - (gc=Esperança, person=João, role='leader')
  - (gc=Fé, person=João, role='supervisor')
  - (gc=Amor, person=João, role='supervisor')
  - (gc=Paz, person=Maria, role='leader')
  - (gc=Luz, person=Pedro, role='leader')

Papéis derivados:
  ✅ is_leader (lidera Esperança)
  ✅ is_supervisor (supervisiona Fé/Amor)
  ✅ is_coordinator (tem Maria e Pedro como subordinados em users)
```

#### Cenário B: Maria - Apenas Líder
```
Hierarquia:
  João → Maria

growth_group_participants:
  - (gc=Paz, person=Maria, role='leader')
  - (gc=Paz, person=João, role='supervisor')

Papéis derivados:
  ✅ is_leader (lidera Paz)
  ❌ is_supervisor (nenhum role 'supervisor')
  ❌ is_coordinator (nenhum subordinado)
```

### Permissões RLS Baseadas em Papéis

Todas as políticas usam subqueries sobre `growth_group_participants` para descobrir os GCs relevantes.

```sql
-- Líder vê GCs que lidera
WHERE id IN (
  SELECT gc_id FROM growth_group_participants
  WHERE person_id = current_user_person_id()
    AND role IN ('leader','co_leader')
    AND status = 'active'
)

-- Supervisor vê GCs que supervisiona
WHERE id IN (
  SELECT gc_id FROM growth_group_participants
  WHERE person_id = current_user_person_id()
    AND role = 'supervisor'
    AND status = 'active'
)

-- Coordenador vê GCs supervisionados por subordinados
WHERE id IN (
  SELECT gc_id FROM growth_group_participants
  WHERE role = 'supervisor'
    AND status = 'active'
    AND person_id IN (
      SELECT person_id FROM users
      WHERE hierarchy_path LIKE current_user_path_prefix()
    )
)
```

### View Helper: user_gc_roles

```sql
CREATE VIEW user_gc_roles AS
SELECT
  u.id AS user_id,
  p.name,
  p.email,
  u.is_admin,

  EXISTS (
    SELECT 1 FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role IN ('leader', 'co_leader')
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_leader,

  EXISTS (
    SELECT 1 FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'supervisor'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_supervisor,

  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.hierarchy_parent_id = u.id
      AND u2.deleted_at IS NULL
  ) AS is_coordinator,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role IN ('leader','co_leader')
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS total_gcs_led,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role = 'supervisor'
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS total_gcs_supervised,

  (SELECT COUNT(*)
   FROM users u2
   WHERE u2.hierarchy_parent_id = u.id
     AND u2.deleted_at IS NULL) AS total_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;
```

Uso no app (exemplo web):

```ts
const { data: userRoles } = await supabase
  .from('user_gc_roles')
  .select('*')
  .eq('user_id', currentUserId)
  .single();

if (userRoles?.is_leader) {
  // Mostrar botão "Registrar Reunião"
}
if (userRoles?.is_supervisor) {
  // Mostrar dashboard "Minha Rede"
}
if (userRoles?.is_coordinator) {
  // Mostrar organograma
}
```

### Mudanças de Papel ao Longo do Tempo

| Ação | Impacto |
|------|---------|
| Novo registro em `growth_group_participants` com `role='leader'` | `is_leader` passa a `true` |
| Linha `growth_group_participants` atualizada para `status='inactive'` | `is_leader`/`is_supervisor` podem virar `false` |
| `growth_group_participants` adiciona `role='supervisor'` para João | `is_supervisor` = `true` |
| `users.hierarchy_parent_id` atualizado | Recalcula `is_coordinator` |
| Trigger `auto_convert_visitor` cria linha `role='member'` | Pessoa agora é membro ativo do GC |

Papéis continuam **derivados automaticamente**. Não há campos redundantes de role espalhados pelo schema.

---

**Status**: ✅ Data model atualizado com unificação de papéis em `growth_group_participants`, reuniões com título de lição flexível e presença separada para membros/visitantes (incluindo histórico de conversões).
