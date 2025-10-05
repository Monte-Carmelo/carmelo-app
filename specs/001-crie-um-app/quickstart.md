# Quickstart: Validação Manual do App de GCs

**Feature**: 001-crie-um-app
**Data**: 2025-10-04
**Objetivo**: Validar end-to-end os 5 cenários de aceitação principais da especificação.

## Pré-requisitos

- [ ] App Flutter rodando em emulador/device (iOS ou Android)
- [ ] Supabase project configurado com migrations aplicadas
- [ ] Seed data carregado (usuários de teste, GCs, lições)
- [ ] Conexão com internet ativa (para Supabase sync)

## Seed Data Necessário

Executar antes dos cenários:

```sql
-- Criar usuários de teste
INSERT INTO users (id, email, nome, hierarchy_depth, is_admin) VALUES
  ('lider-001', 'lider1@test.com', 'João Líder', 1, FALSE),
  ('lider-002', 'lider2@test.com', 'Ana Co-Líder', 1, FALSE),
  ('supervisor-001', 'supervisor1@test.com', 'Maria Supervisora', 2, FALSE),
  ('supervisor-002', 'supervisor2@test.com', 'Carlos Supervisor', 2, FALSE),
  ('coordenador-001', 'coordenador1@test.com', 'Pedro Coordenador', 3, FALSE),
  ('admin-001', 'admin@test.com', 'Admin Sistema', 0, TRUE);

-- Definir hierarquia (hierarchy_path será auto-gerado pelo trigger)
UPDATE users SET hierarchy_parent_id = 'supervisor-001' WHERE id = 'lider-001';
UPDATE users SET hierarchy_parent_id = 'supervisor-001' WHERE id = 'lider-002';
UPDATE users SET hierarchy_parent_id = 'coordenador-001' WHERE id = 'supervisor-001';
UPDATE users SET hierarchy_parent_id = 'coordenador-001' WHERE id = 'supervisor-002';

-- Criar GCs de teste (SEM lider_id/supervisor_id - relacionamentos vêm de gc_leaders/gc_supervisors)
INSERT INTO growth_groups (id, nome, modalidade, status) VALUES
  ('gc-001', 'GC Esperança', 'presencial', 'ativo'),
  ('gc-002', 'GC Fé', 'online', 'ativo'),
  ('gc-003', 'GC Amor', 'presencial', 'ativo');

UPDATE growth_groups SET endereco = 'Rua Teste 123', dia_semana = 3, horario = '19:30'
WHERE id = 'gc-001';

-- Atribuir líderes aos GCs (múltiplos líderes permitidos)
INSERT INTO gc_leaders (gc_id, user_id, role) VALUES
  ('gc-001', 'lider-001', 'leader'),      -- João é líder principal do GC Esperança
  ('gc-001', 'lider-002', 'co-leader'),   -- Ana é co-líder do GC Esperança (ex: casal)
  ('gc-002', 'lider-001', 'leader'),      -- João também lidera GC Fé
  ('gc-003', 'lider-002', 'leader');      -- Ana lidera GC Amor

-- Atribuir supervisores aos GCs (múltiplos supervisores permitidos)
INSERT INTO gc_supervisors (gc_id, user_id) VALUES
  ('gc-001', 'supervisor-001'),  -- Maria supervisiona GC Esperança
  ('gc-001', 'supervisor-002'),  -- Carlos também supervisiona GC Esperança (estrutura matricial)
  ('gc-002', 'supervisor-001'),  -- Maria supervisiona GC Fé
  ('gc-003', 'supervisor-002');  -- Carlos supervisiona GC Amor

-- Criar membros de teste
INSERT INTO members (id, nome, email, gc_id, status) VALUES
  ('membro-001', 'Ana Silva', 'ana@test.com', 'gc-001', 'ativo'),
  ('membro-002', 'Carlos Santos', 'carlos@test.com', 'gc-001', 'ativo'),
  ('membro-003', 'Beatriz Lima', 'beatriz@test.com', 'gc-001', 'ativo'),
  ('membro-004', 'Daniel Costa', 'daniel@test.com', 'gc-001', 'ativo'),
  ('membro-005', 'Elaine Rocha', 'elaine@test.com', 'gc-001', 'ativo');

-- Criar série de lições de teste
INSERT INTO lesson_series (id, nome, descricao, criado_por_user_id) VALUES
  ('serie-001', 'Fundamentos da Fé', 'Série introdutória para novos membros', 'admin-001');

INSERT INTO lessons (id, titulo, descricao, serie_id, ordem_na_serie, criado_por_user_id) VALUES
  ('licao-001', 'O que é um Grupo de Crescimento?', 'Introdução ao conceito de GCs', 'serie-001', 1, 'admin-001'),
  ('licao-002', 'A importância da Comunhão', 'Koinonia e relacionamentos', 'serie-001', 2, 'admin-001'),
  ('licao-003', 'Servindo uns aos Outros', 'Dons espirituais e serviço', 'serie-001', 3, 'admin-001'),
  ('licao-004', 'Multiplicação de GCs', 'Como e quando multiplicar', 'serie-001', 4, 'admin-001');

-- Configurar threshold de conversão
INSERT INTO config (key, value) VALUES ('visitor_conversion_threshold', '3')
ON CONFLICT (key) DO UPDATE SET value = '3';
```

---

## Cenário 1: Líder Registra Reunião com Membros e Visitantes

**User Story**: Um líder de GC precisa registrar uma reunião semanal com 5 membros presentes e 2 visitantes.

### Passos

1. **Login como Líder**
   - [ ] Abrir app
   - [ ] Fazer login com `lider1@test.com` / `senha123`
   - [ ] Verificar que aparece tela inicial do líder

2. **Navegar para Registro de Reunião**
   - [ ] Na home, tocar em "GC Esperança" (gc-001)
   - [ ] Tocar em botão "Nova Reunião" (+ ou FAB)
   - [ ] Verificar que abre formulário de registro

3. **Preencher Dados da Reunião**
   - [ ] Selecionar data: Hoje
   - [ ] Selecionar hora: 19:30
   - [ ] Selecionar lição: "O que é um Grupo de Crescimento?" (dropdown ou search)
   - [ ] Adicionar observações (opcional): "Primeira reunião do mês"

4. **Marcar Presença de Membros**
   - [ ] Lista aparece com os 5 membros do GC
   - [ ] Marcar checkboxes: Ana, Carlos, Beatriz, Daniel, Elaine (todos presentes)
   - [ ] Verificar contagem: "5 membros presentes"

5. **Adicionar Visitantes**
   - [ ] Tocar em "Adicionar Visitante"
   - [ ] Preencher formulário:
     - Nome: "Fernanda Oliveira"
     - Telefone: "(11) 98765-4321"
     - Email: (deixar vazio)
   - [ ] Salvar visitante
   - [ ] Repetir para segundo visitante:
     - Nome: "Gabriel Mendes"
     - Email: "gabriel@gmail.com"
     - Telefone: (deixar vazio)
   - [ ] Verificar contagem: "2 visitantes"

6. **Salvar Reunião**
   - [ ] Tocar em "Salvar Reunião"
   - [ ] Verificar loading indicator
   - [ ] Verificar mensagem de sucesso: "Reunião registrada!"
   - [ ] Verificar redirecionamento para tela de detalhes da reunião

### Validações Esperadas

- [ ] **UI**: Reunião aparece na lista de reuniões do GC com data, lição e contagem (5M + 2V)
- [ ] **Offline**: Se registrar offline, reunião deve ficar em "Aguardando sincronização" com ícone
- [ ] **Sync**: Quando voltar online, ícone some e reunião sincroniza automaticamente

### Validação Backend (SQL)

```sql
-- Verificar que reunião foi criada
SELECT * FROM meetings
WHERE gc_id = 'gc-001'
  AND DATE(data_hora) = CURRENT_DATE
  AND licao_id = 'licao-001';

-- Verificar presenças (deve ter 7 registros: 5 membros + 2 visitantes)
SELECT ma.*, v.nome as visitor_nome, m.nome as member_nome
FROM meeting_attendance ma
LEFT JOIN visitors v ON v.id = ma.visitor_id
LEFT JOIN members m ON m.id = ma.member_id
WHERE ma.meeting_id = [id_da_reuniao_criada];

-- Verificar visit_count dos visitantes (deve ser 1 para ambos)
SELECT nome, visit_count FROM visitors
WHERE nome IN ('Fernanda Oliveira', 'Gabriel Mendes');
```

**Critério de Aceite**: ✅ Reunião salva, 7 presenças registradas, visitantes com visit_count=1.

---

## Cenário 2: Conversão Automática de Visitante Após 3 Visitas

**User Story**: Visitante atinge threshold de 3 visitas e é automaticamente convertido em membro.

### Setup

Assumir que "Fernanda Oliveira" visitou novamente em 2 reuniões anteriores (total 3 visitas).

```sql
-- Simular 2 visitas anteriores
INSERT INTO meetings (id, gc_id, data_hora, registrado_por_user_id) VALUES
  ('meeting-prev-1', 'gc-001', NOW() - INTERVAL '7 days', 'lider-001'),
  ('meeting-prev-2', 'gc-001', NOW() - INTERVAL '14 days', 'lider-001');

-- Marcar presença de Fernanda nas 2 reuniões anteriores
INSERT INTO meeting_attendance (meeting_id, visitor_id, attendance_type)
SELECT 'meeting-prev-1', id, 'visitor' FROM visitors WHERE nome = 'Fernanda Oliveira';

INSERT INTO meeting_attendance (meeting_id, visitor_id, attendance_type)
SELECT 'meeting-prev-2', id, 'visitor' FROM visitors WHERE nome = 'Fernanda Oliveira';

-- Verificar visit_count (deve ser 3 após setup)
SELECT visit_count FROM visitors WHERE nome = 'Fernanda Oliveira';
-- Esperado: 3
```

### Passos

1. **Registrar Nova Reunião (4ª visita de Fernanda)**
   - [ ] Login como líder
   - [ ] Criar nova reunião (data: hoje + 7 dias)
   - [ ] Adicionar visitante "Fernanda Oliveira" (sistema deve reconhecer pelo nome/telefone)
   - [ ] Salvar reunião

2. **Verificar Conversão Automática**
   - [ ] Na lista de membros do GC, verificar se "Fernanda Oliveira" agora aparece
   - [ ] Verificar badge "Novo" ao lado do nome (se UI implementar)
   - [ ] Verificar que na próxima reunião, Fernanda aparece na lista de membros (não mais visitantes)

### Validações Backend

```sql
-- Verificar que visitante foi marcado como convertido
SELECT visit_count, converted_to_member_at, converted_by_user_id
FROM visitors
WHERE nome = 'Fernanda Oliveira';
-- Esperado: visit_count=3, converted_to_member_at NOT NULL

-- Verificar se membro foi criado (pode ser manual ou automático dependendo da implementação)
-- Se trigger criar membro automaticamente:
SELECT * FROM members
WHERE nome = 'Fernanda Oliveira' AND gc_id = 'gc-001';
```

**Critério de Aceite**: ✅ Fernanda marcada como convertida após 3ª visita, aparece como membro no GC.

---

## Cenário 3: Supervisor Visualiza Métricas da Rede

**User Story**: Supervisor acessa dashboard e vê métricas consolidadas de 3 GCs sob sua supervisão.

### Passos

1. **Login como Supervisor**
   - [ ] Logout do líder
   - [ ] Login com `supervisor1@test.com` / `senha123`

2. **Acessar Dashboard**
   - [ ] Na home, tocar em "Minha Rede" ou "Dashboard"
   - [ ] Verificar que aparece lista de GCs (gc-001, gc-002, gc-003)

3. **Visualizar Métricas de Cada GC**
   - [ ] Para "GC Esperança" (gc-001), verificar cards/widgets:
     - **Frequência Média**: ~5-7 (baseado nas reuniões registradas)
     - **Crescimento (30d)**: +1 (Fernanda convertida)
     - **Taxa de Conversão**: 50% (1 de 2 visitantes convertidos)
     - **Última Reunião**: Data da última reunião registrada
   - [ ] Para "GC Fé" e "GC Amor" (sem reuniões), verificar:
     - **Frequência**: 0 ou N/A
     - **Última Reunião**: "Nenhuma reunião registrada"

4. **Filtrar e Ordenar**
   - [ ] Tocar em filtro/ordenação
   - [ ] Ordenar por "Frequência" (crescente): GC Esperança deve aparecer primeiro
   - [ ] Ordenar por "Crescimento": GC Esperança primeiro
   - [ ] Filtrar por "Status: Ativo": Todos 3 GCs aparecem

5. **Detalhar um GC**
   - [ ] Tocar em "GC Esperança"
   - [ ] Verificar lista de membros (6 membros: 5 iniciais + Fernanda)
   - [ ] Verificar lista de reuniões (3 ou 4 reuniões registradas)
   - [ ] Verificar gráfico de presença (se implementado)

### Validações Backend

```sql
-- Consultar GCs que Maria supervisiona (diretamente via gc_supervisors)
SELECT gc.* FROM growth_groups gc
JOIN gc_supervisors gs ON gs.gc_id = gc.id
WHERE gs.user_id = 'supervisor-001';
-- Esperado: gc-001, gc-002

-- Consultar GCs supervisionados também por subordinados de Maria (via hierarchy)
SELECT gc.* FROM growth_groups gc
JOIN gc_supervisors gs ON gs.gc_id = gc.id
WHERE gs.user_id IN (
  SELECT id FROM users
  WHERE hierarchy_path LIKE (
    SELECT hierarchy_path || '%' FROM users WHERE id = 'supervisor-001'
  )
);
-- Esperado: gc-001, gc-002 (Maria supervisiona) + qualquer GC supervisionado por líderes sob Maria

-- Verificar métricas do dashboard (se view foi adaptada)
-- gc-001 deve ter:
--   frequencia_media > 0
--   total_membros_ativos = 6
--   conversoes_30d = 1
--   taxa_conversao_pct ~ 50%
```

**Critério de Aceite**: ✅ Dashboard mostra 3 GCs, métricas corretas para gc-001, filtros funcionando.

---

## Cenário 4: Admin Cria Série de Lições

**User Story**: Admin cria uma nova série de 4 lições para ser usada pelos líderes.

### Passos

1. **Login como Admin**
   - [ ] Logout do supervisor
   - [ ] Login com `admin@test.com` / `senha123`

2. **Acessar Gestão de Lições**
   - [ ] Na home, tocar em menu hambúrguer / gaveta
   - [ ] Tocar em "Lições" ou "Biblioteca de Lições"
   - [ ] Verificar que aparece lista de séries existentes

3. **Criar Nova Série**
   - [ ] Tocar em "Nova Série" (+ FAB)
   - [ ] Preencher formulário:
     - Nome: "Discipulado Essencial"
     - Descrição: "Série para novos convertidos"
   - [ ] Salvar série
   - [ ] Verificar que série aparece na lista

4. **Adicionar Lições à Série**
   - [ ] Tocar na série "Discipulado Essencial"
   - [ ] Tocar em "Adicionar Lição"
   - [ ] Preencher lição 1:
     - Título: "Salvação e Nova Vida"
     - Descrição: "Compreendendo a salvação em Cristo"
     - Referências Bíblicas: "João 3:16, Romanos 10:9-10"
     - Link: "https://example.com/licao1.pdf"
     - Ordem: 1 (auto-incrementado)
   - [ ] Salvar lição
   - [ ] Repetir para lições 2, 3, 4 com títulos diferentes

5. **Reordenar Lições (Drag & Drop ou botões)**
   - [ ] Se UI permitir, testar reordenação
   - [ ] Verificar que ordem persiste após salvar

### Validações Backend

```sql
-- Verificar série criada
SELECT * FROM lesson_series
WHERE nome = 'Discipulado Essencial';

-- Verificar 4 lições criadas em ordem
SELECT titulo, ordem_na_serie
FROM lessons
WHERE serie_id = [id_da_serie]
ORDER BY ordem_na_serie;
-- Esperado: 4 linhas com ordem 1, 2, 3, 4
```

### Validação de RLS (Não-Admin)

- [ ] Logout do admin
- [ ] Login como líder
- [ ] Acessar "Lições"
- [ ] Verificar que líderes PODEM VER séries/lições
- [ ] Tentar criar nova lição (botão deve estar oculto ou desabilitado)
- [ ] Se tentar via API direta (hack), deve retornar 403 Forbidden

**Critério de Aceite**: ✅ Admin cria série + 4 lições. Líderes veem mas não podem editar.

---

## Cenário 5: Coordenador Atribui João como Supervisor de um Novo GC

**User Story**: Coordenador adiciona João como supervisor de um novo GC, permitindo que ele acumule os papéis de líder E supervisor.

### Passos

1. **Login como Coordenador**
   - [ ] Login com `coordenador1@test.com` / `senha123`

2. **Acessar Gestão de GCs**
   - [ ] Na home, tocar em "Minha Rede" ou "GCs Supervisionados"
   - [ ] Verificar que aparece lista de GCs sob coordenação

3. **Criar Novo GC e Atribuir João como Supervisor**
   - [ ] Tocar em "Criar GC"
   - [ ] Preencher formulário:
     - Nome: "GC Paz"
     - Modalidade: "online"
     - Líder: Selecionar outro usuário (não João)
     - Supervisor: **Adicionar "João Líder"** (além de manter supervisor existente se necessário)
   - [ ] Salvar GC

4. **Verificar Múltiplos Papéis de João**
   - [ ] Logout do coordenador
   - [ ] Login como `lider1@test.com` (João)
   - [ ] Verificar que João agora vê:
     - **Como Líder**: GC Esperança, GC Fé (via gc_leaders)
     - **Como Supervisor**: GC Paz (via gc_supervisors)
   - [ ] Verificar que João pode:
     - Registrar reunião em GC Esperança/Fé (papel de líder)
     - Visualizar métricas do GC Paz (papel de supervisor)
     - NÃO pode registrar reunião em GC Paz (apenas visualizar)

### Validações Backend

```sql
-- Verificar que João é líder de 2 GCs
SELECT gc.nome FROM growth_groups gc
JOIN gc_leaders gl ON gl.gc_id = gc.id
WHERE gl.user_id = 'lider-001';
-- Esperado: GC Esperança, GC Fé

-- Verificar que João agora TAMBÉM é supervisor de 1 GC
SELECT gc.nome FROM growth_groups gc
JOIN gc_supervisors gs ON gs.gc_id = gc.id
WHERE gs.user_id = 'lider-001';
-- Esperado: GC Paz

-- Verificar papéis acumulados via view user_roles (se implementada)
SELECT is_leader, is_supervisor, is_coordinator,
       total_gcs_liderados, total_gcs_supervisionados
FROM user_roles
WHERE user_id = 'lider-001';
-- Esperado: is_leader=true, is_supervisor=true, is_coordinator=false
--           total_gcs_liderados=2, total_gcs_supervisionados=1
```

### Validação de Permissões (RLS)

- [ ] Como João (lider-001), tentar:
  - [ ] Inserir reunião em GC Esperança → **PERMITIDO** (é líder)
  - [ ] Inserir reunião em GC Paz → **BLOQUEADO** (apenas supervisor, não líder)
  - [ ] Visualizar membros de GC Paz → **PERMITIDO** (supervisor pode ver)
  - [ ] Visualizar dashboard com métricas dos 3 GCs → **PERMITIDO** (líder de 2, supervisor de 1)

**Critério de Aceite**: ✅ João acumula papéis de líder (2 GCs) + supervisor (1 GC), permissões RLS funcionando corretamente.

---

## Checklist Final de Validação

Após executar todos os 5 cenários:

- [ ] **Offline Sync**: Colocar device em airplane mode, registrar reunião, voltar online → sync automático
- [ ] **Performance**: Carregamento de dashboard com 10 GCs < 500ms
- [ ] **RLS**: Tentar acessar GC de outro supervisor via API direta → retorna vazio ou 403
- [ ] **Triggers**: Visitante com 3 visitas é convertido automaticamente (verificado no cenário 2)
- [ ] **UI/UX**: Todas telas têm loading states, error handling, e mensagens de sucesso/erro claras

## Problemas Conhecidos / Edge Cases

| Problema | Comportamento Esperado | Status |
|----------|------------------------|--------|
| Visitante com mesmo nome mas telefones diferentes | Sistema cria 2 visitantes separados | ⚠️ Documentar em limitations |
| Reunião com data futura | App deve bloquear ou avisar | [ ] Validar |
| Líder tenta registrar reunião de GC de outro líder | RLS bloqueia insert (403) | [ ] Testar |
| Admin deleta série com lições em uso | Lições ficam órfãs (licao.serie_id=NULL) ou CASCADE delete? | [ ] Definir comportamento |
| Remover último líder de um GC | Trigger `ensure_gc_has_leader` bloqueia delete (EXCEPTION) | ✅ Implementado no data-model |
| Remover último supervisor de um GC | Trigger `ensure_gc_has_supervisor` bloqueia delete (EXCEPTION) | ✅ Implementado no data-model |
| GC com 2 líderes (casal) - ambos registram mesma reunião | App deve detectar duplicata ou permitir co-registro | [ ] Definir UX |
| GC com múltiplos supervisores - qual recebe notificação? | Todos supervisores recebem notificações (FR-016 diferido) | ⚠️ Implementar quando FR-016 |

---

## Relatório de Execução

**Executado por**: __________________
**Data**: __________________
**Versão do App**: __________________

### Cenários Aprovados
- [ ] Cenário 1: Líder registra reunião
- [ ] Cenário 2: Conversão automática de visitante
- [ ] Cenário 3: Supervisor visualiza métricas
- [ ] Cenário 4: Admin cria série de lições
- [ ] Cenário 5: Coordenador promove líder

### Issues Encontrados
[Listar bugs/problemas encontrados durante execução]

### Conclusão
- [ ] ✅ PASS - Todos cenários executados com sucesso, sistema pronto para produção
- [ ] ⚠️ PARTIAL - Alguns cenários falharam, necessário correção
- [ ] ❌ FAIL - Bloqueadores críticos impedem validação

---

**Status**: ✅ Quickstart pronto para execução após implementação. Cenários cobrem os 5 principais fluxos da especificação.
