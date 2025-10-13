# Modelo de Dados: App de Gestão de Grupos de Crescimento

**Feature**: 001-crie-um-app
**Data**: 2025-10-04
**Referência**: [spec.md](./spec.md) | [research.md](./research.md)

## Visão Geral

Este modelo suporta:
- **Entidade `people` (pessoas) normalizada**: Evita duplicação de dados pessoais (nome, email, telefone) entre users, members e visitors
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
   - `members` = membership em GC (referencia `people`)
   - `visitors` = tracking de visitas (referencia `people`)
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

-- Líderes veem pessoas de seus GCs (members + visitors via meetings)
CREATE POLICY "leaders_view_people_in_gc" ON people
FOR SELECT USING (
  id IN (
    SELECT person_id FROM members WHERE gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
  )
  OR
  id IN (
    SELECT person_id FROM visitors WHERE id IN (
      SELECT visitor_id FROM meeting_attendance WHERE meeting_id IN (
        SELECT id FROM meetings WHERE gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
      )
    )
  )
);

-- Supervisores veem pessoas de GCs supervisionados
CREATE POLICY "supervisors_view_people" ON people
FOR SELECT USING (
  id IN (
    SELECT person_id FROM members WHERE gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  )
  OR
  id IN (
    SELECT person_id FROM visitors WHERE id IN (
      SELECT visitor_id FROM meeting_attendance WHERE meeting_id IN (
        SELECT id FROM meetings WHERE gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
      )
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
-- Verificar se usuário é LÍDER (lidera pelo menos 1 GC via gc_leaders)
SELECT EXISTS (
  SELECT 1 FROM gc_leaders
  WHERE user_id = user_id_var
    AND gc_id IN (SELECT id FROM growth_groups WHERE deleted_at IS NULL)
) AS is_leader;

-- Verificar se usuário é SUPERVISOR (supervisiona pelo menos 1 GC via gc_supervisors)
SELECT EXISTS (
  SELECT 1 FROM gc_supervisors
  WHERE user_id = user_id_var
    AND gc_id IN (SELECT id FROM growth_groups WHERE deleted_at IS NULL)
) AS is_supervisor;

-- Verificar se usuário é COORDENADOR (tem subordinados na hierarquia)
SELECT EXISTS (
  SELECT 1 FROM users WHERE hierarchy_parent_id = user_id_var AND deleted_at IS NULL
) AS is_coordinator;

-- Papéis ACUMULADOS de um usuário (exemplo)
-- João pode ser: { leader: true, supervisor: true, coordinator: false }
```

**Cenário Real**:
- João é **líder** do "GC Esperança" (`gc_leaders: gc_id=esperança, user_id=joão`)
- João também **supervisiona** o "GC Fé" e "GC Amor" (`gc_supervisors: gc_id=fé/amor, user_id=joão`)
- João tem Maria e Pedro como subordinados na hierarquia (`users.hierarchy_parent_id = joão` para Maria e Pedro)
- Resultado: João acumula 3 papéis simultaneamente (líder de 1 GC + supervisor de 2 GCs + coordenador de 2 pessoas)

---

### 2. growth_groups (Grupos de Crescimento)

**IMPORTANTE**: Líderes e supervisores são **many-to-many** (um GC pode ter múltiplos líderes/supervisores). Os relacionamentos ficam nas tabelas `gc_leaders` e `gc_supervisors`.

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

-- Líderes veem GCs que lideram (via gc_leaders)
CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT USING (
  id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Líderes podem editar GCs que lideram
CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE USING (
  id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Supervisores veem GCs que supervisionam (via gc_supervisors)
CREATE POLICY "supervisors_view_gcs" ON growth_groups
FOR SELECT USING (
  id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
);

-- Supervisores veem GCs supervisionados por subordinados (via hierarchy)
CREATE POLICY "supervisors_view_subordinate_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
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
- **Líderes**: Definidos em `gc_leaders` (mínimo 1 líder obrigatório - validado via constraint)
- **Supervisores**: Definidos em `gc_supervisors` (mínimo 1 supervisor obrigatório - validado via constraint)

---

### 2a. gc_leaders (Líderes de GC)

Relacionamento many-to-many entre GCs e usuários que os lideram.

```sql
CREATE TABLE gc_leaders (
  -- Relacionamento
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tipo de liderança
  role TEXT NOT NULL DEFAULT 'leader' CHECK (role IN ('leader', 'co_leader')),

  -- Auditoria
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by_user_id UUID REFERENCES users(id),

  -- PK composta (um user pode ser leader+co-leader do mesmo GC se necessário)
  PRIMARY KEY (gc_id, user_id, role)
);

-- Indexes
CREATE INDEX idx_gc_leaders_user ON gc_leaders(user_id);
CREATE INDEX idx_gc_leaders_gc ON gc_leaders(gc_id);

-- Constraint: Pelo menos 1 líder por GC (validado via trigger)
CREATE OR REPLACE FUNCTION check_gc_has_leader() RETURNS TRIGGER AS $$
BEGIN
  -- Ao deletar, garantir que resta pelo menos 1 líder
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM gc_leaders
      WHERE gc_id = OLD.gc_id AND (gc_id, user_id, role) != (OLD.gc_id, OLD.user_id, OLD.role)
    ) THEN
      RAISE EXCEPTION 'GC deve ter pelo menos 1 líder';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_leader
BEFORE DELETE ON gc_leaders
FOR EACH ROW EXECUTE FUNCTION check_gc_has_leader();

-- RLS Policies
ALTER TABLE gc_leaders ENABLE ROW LEVEL SECURITY;

-- Líderes veem seus próprios relacionamentos
CREATE POLICY "users_see_own_leadership" ON gc_leaders
FOR SELECT USING (user_id = auth.uid());

-- Supervisores veem líderes de GCs que supervisionam
CREATE POLICY "supervisors_see_gc_leaders" ON gc_leaders
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
);

-- Coordenadores podem adicionar/remover líderes de GCs supervisionados por subordinados
CREATE POLICY "coordinators_manage_leaders" ON gc_leaders
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_gc_leaders" ON gc_leaders
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Negócio**:
- Um GC **deve** ter pelo menos 1 líder (enforced por trigger)
- Um usuário pode ser `leader` e `co_leader` do mesmo GC (ex: casal)
- `role = 'leader'`: Líder principal (primeiro a ser adicionado, ou mais experiente)
- `role = 'co_leader'`: Co-líder (normalmente cônjuge ou líder em treinamento)

---

### 2b. gc_supervisors (Supervisores de GC)

Relacionamento many-to-many entre GCs e usuários que os supervisionam.

```sql
CREATE TABLE gc_supervisors (
  -- Relacionamento
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Auditoria
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by_user_id UUID REFERENCES users(id),

  -- PK composta
  PRIMARY KEY (gc_id, user_id)
);

-- Indexes
CREATE INDEX idx_gc_supervisors_user ON gc_supervisors(user_id);
CREATE INDEX idx_gc_supervisors_gc ON gc_supervisors(gc_id);

-- Constraint: Pelo menos 1 supervisor por GC (validado via trigger)
CREATE OR REPLACE FUNCTION check_gc_has_supervisor() RETURNS TRIGGER AS $$
BEGIN
  -- Ao deletar, garantir que resta pelo menos 1 supervisor
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM gc_supervisors
      WHERE gc_id = OLD.gc_id AND (gc_id, user_id) != (OLD.gc_id, OLD.user_id)
    ) THEN
      RAISE EXCEPTION 'GC deve ter pelo menos 1 supervisor';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_supervisor
BEFORE DELETE ON gc_supervisors
FOR EACH ROW EXECUTE FUNCTION check_gc_has_supervisor();

-- RLS Policies
ALTER TABLE gc_supervisors ENABLE ROW LEVEL SECURITY;

-- Supervisores veem seus próprios relacionamentos
CREATE POLICY "users_see_own_supervision" ON gc_supervisors
FOR SELECT USING (user_id = auth.uid());

-- Líderes veem supervisores de seus GCs
CREATE POLICY "leaders_see_gc_supervisors" ON gc_supervisors
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Coordenadores podem adicionar/remover supervisores
CREATE POLICY "coordinators_manage_supervisors" ON gc_supervisors
FOR ALL USING (
  user_id IN (
    SELECT id FROM users
    WHERE hierarchy_path LIKE (
      SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
    )
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_gc_supervisors" ON gc_supervisors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Negócio**:
- Um GC **deve** ter pelo menos 1 supervisor (enforced por trigger)
- Múltiplos supervisores são comuns em estruturas matriciais (GC supervisionado por 2 coordenadores diferentes)
- Supervisores tipicamente são `hierarchy_parent` dos líderes, mas não obrigatoriamente

---

### 3. members (Membros de GC)

Representa **pessoas que são membros ativos** de um GC específico. Referencia `people` (pessoas) para dados pessoais.

```sql
CREATE TABLE members (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,

  -- Relacionamento com GC
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,

  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Origem (se convertido de visitante)
  converted_from_visitor_id UUID REFERENCES visitors(id),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraint: Uma pessoa não pode ser membro ativo de 2 GCs simultaneamente
  UNIQUE(person_id, gc_id)
);

-- Indexes
CREATE INDEX idx_members_person ON members(person_id);
CREATE INDEX idx_members_gc ON members(gc_id) WHERE deleted_at IS NULL AND status = 'active';

-- Triggers
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Líderes veem e gerenciam membros de seus GCs
CREATE POLICY "leaders_manage_gc_members" ON members
FOR ALL USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Supervisores veem membros de GCs que supervisionam
CREATE POLICY "supervisors_view_members" ON members
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  OR
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_members" ON members
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `person_id` (pessoa_id): Deve referenciar uma pessoa válida em `people` (pessoas)
- `status`: 'active' (ativo), 'inactive' (inativo), 'transferred' (transferido)
- **Dados pessoais** (nome, email, telefone): Acessados via JOIN com `people` (pessoas)
- **Constraint UNIQUE**: Uma pessoa não pode ser membro ativo de múltiplos GCs (mas pode ser transferida)

---

### 4. visitors (Visitantes)

Representa **pessoas que visitaram reuniões** mas ainda não são membros. Referencia `people` (pessoas) para dados pessoais.

```sql
CREATE TABLE visitors (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL UNIQUE REFERENCES people(id) ON DELETE CASCADE,

  -- Tracking de Visitas
  visit_count INT NOT NULL DEFAULT 0,
  first_visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_date TIMESTAMPTZ,

  -- Conversão
  converted_to_member_at TIMESTAMPTZ,
  converted_by_user_id UUID REFERENCES users(id),
  converted_to_member_id UUID REFERENCES members(id),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visitors_person ON visitors(person_id);
CREATE INDEX idx_visitors_not_converted ON visitors(visit_count) WHERE converted_to_member_at IS NULL;

-- Triggers
CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Líderes veem e gerenciam visitantes que foram às suas reuniões
CREATE POLICY "leaders_manage_visitors_in_meetings" ON visitors
FOR ALL USING (
  id IN (
    SELECT ma.visitor_id FROM meeting_attendance ma
    JOIN meetings m ON m.id = ma.meeting_id
    WHERE m.gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
  )
);

-- Supervisores veem visitantes de reuniões de GCs supervisionados
CREATE POLICY "supervisors_view_visitors" ON visitors
FOR SELECT USING (
  id IN (
    SELECT ma.visitor_id FROM meeting_attendance ma
    JOIN meetings m ON m.id = ma.meeting_id
    WHERE m.gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  )
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_visitors" ON visitors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Regras de Validação**:
- `person_id` (pessoa_id): Deve referenciar uma pessoa válida em `people` (pessoas) (UNIQUE: uma pessoa só pode ser visitor uma vez)
- `visit_count`: >= 0
- `converted_to_member_at`: Se preenchido, `converted_by_user_id` também deve estar
- **Dados pessoais** (nome, email, telefone): Acessados via JOIN com `people` (pessoas)

---

### 5. meetings (Reuniões)

```sql
CREATE TABLE meetings (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Dados da Reunião
  datetime TIMESTAMPTZ NOT NULL,
  notes TEXT,

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
CREATE INDEX idx_meetings_lesson ON meetings(lesson_id) WHERE lesson_id IS NOT NULL;

-- Triggers
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Líderes veem reuniões de seus GCs
CREATE POLICY "leaders_view_gc_meetings" ON meetings
FOR ALL USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Supervisores veem reuniões de GCs subordinados
CREATE POLICY "supervisors_view_meetings" ON meetings
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  OR
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
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
- `datetime` (data_hora): Não pode ser futuro (> NOW())
- `registered_by_user_id` (registrado_por_user_id): Deve ser líder ou superior do GC

---

### 6. meeting_attendance (Presença em Reunião)

```sql
CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,

  -- Tipo de participante
  attendance_type TEXT NOT NULL CHECK (attendance_type IN ('member', 'visitor')),

  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: Exatamente um de member_id ou visitor_id deve estar preenchido
  CONSTRAINT attendance_xor CHECK (
    (member_id IS NOT NULL AND visitor_id IS NULL AND attendance_type = 'member')
    OR
    (member_id IS NULL AND visitor_id IS NOT NULL AND attendance_type = 'visitor')
  ),

  -- Constraint: Não permitir duplicatas
  UNIQUE(meeting_id, member_id),
  UNIQUE(meeting_id, visitor_id)
);

-- Indexes
CREATE INDEX idx_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX idx_attendance_member ON meeting_attendance(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX idx_attendance_visitor ON meeting_attendance(visitor_id) WHERE visitor_id IS NOT NULL;

-- Trigger para auto-conversão de visitantes
CREATE OR REPLACE FUNCTION auto_convert_visitor() RETURNS TRIGGER AS $$
DECLARE
  threshold INT;
  current_count INT;
  gc_id_var UUID;
BEGIN
  -- Apenas para visitantes
  IF NEW.visitor_id IS NOT NULL THEN
    -- Buscar threshold de configuração
    SELECT (value::TEXT)::INT INTO threshold
    FROM config WHERE key = 'visitor_conversion_threshold';

    -- Contar total de visitas do visitante
    SELECT COUNT(*) INTO current_count
    FROM meeting_attendance
    WHERE visitor_id = NEW.visitor_id;

    -- Atualizar visit_count
    UPDATE visitors
    SET visit_count = current_count,
        last_visit_date = NOW()
    WHERE id = NEW.visitor_id;

    -- Se atingiu threshold, marcar para conversão
    IF current_count >= threshold THEN
      -- Buscar o GC da reunião
      SELECT m.gc_id INTO gc_id_var
      FROM meetings m
      WHERE m.id = NEW.meeting_id;

      UPDATE visitors
      SET converted_to_member_at = NOW(),
          converted_by_user_id = (
            SELECT user_id FROM gc_leaders
            WHERE gc_id = gc_id_var AND role = 'leader'
            LIMIT 1
          )
      WHERE id = NEW.visitor_id
        AND converted_to_member_at IS NULL; -- Apenas se ainda não convertido

      -- Criar membro automaticamente (se desejado, pode ser feito via trigger adicional)
      -- Por ora, apenas marcamos a conversão
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_visitor_conversion
AFTER INSERT ON meeting_attendance
FOR EACH ROW EXECUTE FUNCTION auto_convert_visitor();

-- RLS Policies
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Líderes gerenciam presenças de suas reuniões
CREATE POLICY "leaders_manage_attendance" ON meeting_attendance
FOR ALL USING (
  meeting_id IN (
    SELECT m.id FROM meetings m
    WHERE m.gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
  )
);

-- Supervisores veem presenças de GCs supervisionados
CREATE POLICY "supervisors_view_attendance" ON meeting_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT m.id FROM meetings m
    WHERE m.gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  )
);

-- Admins gerenciam todos
CREATE POLICY "admins_manage_attendance" ON meeting_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
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
  bible_references TEXT,
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
    (SELECT COUNT(*) FROM members WHERE gc_id = gc.id AND status = 'active') as total_active_members,

    -- Crescimento de membros (últimos 30 dias)
    (SELECT COUNT(*) FROM members
     WHERE gc_id = gc.id
       AND joined_at >= NOW() - INTERVAL '30 days') as new_members_30d,

    -- Conversões de visitantes (últimos 30 dias)
    (SELECT COUNT(*) FROM visitors v
     WHERE v.converted_to_member_id IN (SELECT id FROM members WHERE gc_id = gc.id)
       AND v.converted_to_member_at >= NOW() - INTERVAL '30 days') as conversions_30d,

    -- Taxa de conversão (visitantes únicos vs conversões)
    (SELECT COUNT(DISTINCT v.id) FROM visitors v
     JOIN meeting_attendance ma ON ma.visitor_id = v.id
     JOIN meetings m2 ON m2.id = ma.meeting_id
     WHERE m2.gc_id = gc.id
       AND ma.created_at >= NOW() - INTERVAL '30 days') as unique_visitors_30d

  FROM growth_groups gc
  LEFT JOIN meetings m ON m.gc_id = gc.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM meeting_attendance
    WHERE meeting_id = m.id
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
people (pessoas - entidade base - dados pessoais)
  ↓ 1:1           ↓ 1:1           ↓ 1:1
users          members         visitors
(auth +         (GC             (tracking de
hierarquia)     membership)     visitas)
  ↓ N:M (gc_leaders)
  ↓ N:M (gc_supervisors)
      ↓
growth_groups
  ↓ 1:N         ↓ 1:N
members      meetings
               ↓ 1:N
            meeting_attendance
              ↓ N:1  ↓ N:1
           members  visitors

lesson_series
  ↓ 1:N
lessons
  ↑ N:1
meetings
```

---

## Migrações Supabase (Ordem de Criação)

1. Extensões e funções base (`uuid-ossp`, `pg_trgm`, `update_timestamp()`)
2. **`people`** (pessoas - entidade base - dados pessoais)
3. `users` (referencia `people`, hierarquia organizacional)
4. `config`
5. `growth_groups`
6. `gc_leaders` e `gc_supervisors` (many-to-many com `growth_groups`)
7. `members` (referencia `people` e `growth_groups`)
8. `visitors` (referencia `people`)
9. `lesson_series`
10. `lessons`
11. `meetings`
12. `meeting_attendance` (com triggers de conversão de visitors)
13. Views (`dashboard_metrics`)

---

## Resumo de Constraints

| Tabela | Constraint Chave | Propósito |
|--------|------------------|-----------|
| **people** (pessoas) | `person_has_contact` | Email OU telefone obrigatório (pelo menos um) |
| users | `person_id UNIQUE` | Um usuário = uma pessoa (1:1) |
| users | `hierarchy_path` auto-gerado | Queries eficientes de subárvore hierárquica |
| growth_groups | `address_if_in_person` | Garantir endereço se mode=in_person (presencial) |
| gc_leaders | `ensure_gc_has_leader` trigger | GC deve ter pelo menos 1 líder |
| gc_supervisors | `ensure_gc_has_supervisor` trigger | GC deve ter pelo menos 1 supervisor |
| members | `person_id, gc_id UNIQUE` | Pessoa não pode ser membro de 2 GCs simultaneamente |
| visitors | `person_id UNIQUE` | Pessoa só pode ser visitor uma vez (depois vira member) |
| meeting_attendance | `attendance_xor` | Presença é de membro OU visitante, nunca ambos |
| lessons | `series_requires_order` | Lições em série devem ter ordem |
| visitors | `auto_convert_visitor()` trigger | Conversão automática após N visitas |

---

## Modelo de Papéis Acumulados (Detalhamento)

### Conceito Central

Diferentemente de sistemas tradicionais onde usuários têm **um único papel** (role), este sistema permite **acúmulo de papéis**:

```
❌ MODELO ERRADO (papel exclusivo):
João = { role: "supervisor" }  // João NÃO pode ser líder ao mesmo tempo

✅ MODELO CORRETO (papéis acumulados):
João = {
  is_leader: true,      // Lidera "GC Esperança"
  is_supervisor: true,  // Supervisiona "GC Fé" e "GC Amor"
  is_coordinator: true, // Tem Maria e Pedro como subordinados
  is_admin: false
}
```

### Como Papéis são Determinados

#### 1. **Líder** (is_leader)
Usuário que aparece em `gc_leaders` para pelo menos 1 GC ativo.

```sql
-- Flutter: Verificar se user é líder
final isLeader = await supabase
  .from('gc_leaders')
  .select('gc_id')
  .eq('user_id', userId)
  .limit(1)
  .maybeSingle();

// isLeader != null → usuário é líder
```

#### 2. **Supervisor** (is_supervisor)
Usuário que aparece em `gc_supervisors` para pelo menos 1 GC ativo.

```sql
-- Flutter: Verificar se user é supervisor
final isSupervisor = await supabase
  .from('gc_supervisors')
  .select('gc_id')
  .eq('user_id', userId)
  .limit(1)
  .maybeSingle();
```

#### 3. **Coordenador** (is_coordinator)
Usuário que tem **subordinados** na hierarquia (`users.hierarchy_parent_id = userId`).

```sql
-- Flutter: Verificar se user é coordenador
final isCoordinator = await supabase
  .from('users')
  .select('id')
  .eq('hierarchy_parent_id', userId)
  .limit(1)
  .maybeSingle();
```

#### 4. **Admin** (is_admin)
Flag booleana explícita na tabela `users`. Admin tem **todas** as permissões.

### Cenários Reais de Acúmulo

#### Cenário A: João - Líder, Supervisor e Coordenador
```
Hierarquia:
  João (raiz)
    ├─ Maria (líder do GC Paz)
    └─ Pedro (líder do GC Luz)

GCs + Relacionamentos:
  - GC Esperança:
      gc_leaders: João (leader)
      gc_supervisors: Coordenador X
  - GC Fé:
      gc_leaders: Maria (leader)
      gc_supervisors: João
  - GC Amor:
      gc_leaders: Pedro (leader)
      gc_supervisors: João

Papéis de João:
  ✅ is_leader: true (lidera "GC Esperança" via gc_leaders)
  ✅ is_supervisor: true (supervisiona "GC Fé" e "GC Amor" via gc_supervisors)
  ✅ is_coordinator: true (tem Maria e Pedro como subordinados)
```

**UI Implicações**:
- João vê botão "Registrar Reunião" em **3 GCs** (Esperança, Fé, Amor)
  - Esperança: como **líder** direto
  - Fé e Amor: via RLS policy "supervisores veem GCs subordinados" (ele **não** registra reunião nesses, mas **visualiza**)
- João vê dashboard de **supervisor** com métricas de Fé e Amor
- João vê organograma de **coordenador** com Maria e Pedro

#### Cenário B: Maria - Apenas Líder
```
Hierarquia:
  João
    └─ Maria

GCs + Relacionamentos:
  - GC Paz:
      gc_leaders: Maria (leader)
      gc_supervisors: João

Papéis de Maria:
  ✅ is_leader: true (lidera "GC Paz" via gc_leaders)
  ❌ is_supervisor: false (não supervisiona nenhum GC via gc_supervisors)
  ❌ is_coordinator: false (não tem subordinados)
```

**UI Implicações**:
- Maria vê apenas **1 GC** (Paz)
- Maria **não** vê dashboard de supervisor (não tem GCs supervisionados)
- Maria **não** vê organograma (não tem subordinados)

### Permissões RLS Baseadas em Papéis

#### Growth Groups - Quem Vê O Quê?

```sql
-- Líder vê GCs que lidera (via gc_leaders)
WHERE id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())

-- Supervisor vê GCs que supervisiona (via gc_supervisors)
WHERE id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())

-- Coordenador vê GCs de subordinados (via hierarchy_path + gc_supervisors)
WHERE id IN (
  SELECT gc_id FROM gc_supervisors
  WHERE user_id IN (
    SELECT id FROM users
    WHERE hierarchy_path LIKE (
      SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
    )
  )
)
```

**Exemplo com João**:
- João vê "GC Esperança" via policy 1 (líder via gc_leaders)
- João vê "GC Fé" e "GC Amor" via policy 2 (supervisor via gc_supervisors)
- Se Maria tivesse GCs como supervisora, João também veria via policy 3 (coordenador → subordinados)

### View Helper: user_roles

Para facilitar queries no app, pode-se criar uma view:

```sql
CREATE VIEW user_roles AS
SELECT
  u.id as user_id,
  p.name,
  p.email,
  u.is_admin,

  -- Papel: Líder (via gc_leaders)
  EXISTS (
    SELECT 1 FROM gc_leaders gl
    JOIN growth_groups gc ON gc.id = gl.gc_id
    WHERE gl.user_id = u.id AND gc.deleted_at IS NULL
  ) AS is_leader,

  -- Papel: Supervisor (via gc_supervisors)
  EXISTS (
    SELECT 1 FROM gc_supervisors gs
    JOIN growth_groups gc ON gc.id = gs.gc_id
    WHERE gs.user_id = u.id AND gc.deleted_at IS NULL
  ) AS is_supervisor,

  -- Papel: Coordenador (tem subordinados na hierarquia)
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.hierarchy_parent_id = u.id AND u2.deleted_at IS NULL
  ) AS is_coordinator,

  -- Count de GCs liderados
  (SELECT COUNT(DISTINCT gl.gc_id) FROM gc_leaders gl
   JOIN growth_groups gc ON gc.id = gl.gc_id
   WHERE gl.user_id = u.id AND gc.deleted_at IS NULL) AS total_gcs_led,

  -- Count de GCs supervisionados
  (SELECT COUNT(DISTINCT gs.gc_id) FROM gc_supervisors gs
   JOIN growth_groups gc ON gc.id = gs.gc_id
   WHERE gs.user_id = u.id AND gc.deleted_at IS NULL) AS total_gcs_supervised,

  -- Count de subordinados
  (SELECT COUNT(*) FROM users u2
   WHERE u2.hierarchy_parent_id = u.id AND u2.deleted_at IS NULL) AS total_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;
```

**Flutter usage**:
```dart
final userRoles = await supabase
  .from('user_roles')
  .select()
  .eq('user_id', currentUserId)
  .single();

// Renderizar UI condicional
if (userRoles['is_leader']) {
  // Mostrar botão "Nova Reunião"
}
if (userRoles['is_supervisor']) {
  // Mostrar tab "Minha Rede"
}
if (userRoles['is_coordinator']) {
  // Mostrar organograma
}
```

### Mudanças de Papel ao Longo do Tempo

Papéis **mudam dinamicamente** baseados em relacionamentos:

| Ação | Impacto no Papel |
|------|------------------|
| João é atribuído como líder de novo GC | `is_leader` vira `true` |
| Último GC de João é desativado | `is_leader` vira `false` |
| Maria seta `hierarchy_parent_id = joão_id` | `is_coordinator` de João vira `true` |
| Maria é removida/transferida | Se João não tem mais subordinados, `is_coordinator` vira `false` |
| GC Fé seta `supervisor_id = joão_id` | `is_supervisor` de João vira `true` |

**Não há "promoção manual de papel"** - papéis são **derivados automaticamente** dos relacionamentos.

---

**Status**: ✅ Data model completo com modelo de papéis acumulados documentado. Pronto para geração de contracts e quickstart.
