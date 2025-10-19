# Feature Specification: Área Administrativa Completa

**Feature Branch**: `004-area-administrativa`
**Created**: 2025-10-18
**Status**: Planning
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

---

## Clarifications

### Session 2025-10-18
- Q: A área administrativa já possui alguma funcionalidade implementada? → A: Sim - gestão básica de usuários (listar, criar, editar) já existe em `/admin`
- Q: Quais são as prioridades de implementação? → A: Alta prioridade: Dashboard + Gestão de GCs. Média: Multiplicação e Lições. Baixa: Relatórios e Configurações
- Q: O sistema de multiplicação de GCs deve criar uma nova tabela de auditoria? → A: Sim - criar tabela `gc_multiplication_events` para registrar eventos de multiplicação
- Q: Admins devem ter acesso total ignorando RLS ou usar policies especiais? → A: Usar policies RLS existentes com `is_admin = true` (admins_manage_all_*)
- Q: A navegação admin deve ser via sidebar ou top navigation? → A: Sidebar com ícones e labels, colapsável em mobile

---

## User Scenarios & Testing

### Primary User Story
Como administrador do sistema de GCs, quando acesso a área administrativa, quero ter uma visão centralizada de todas as funcionalidades de gestão (usuários, grupos de crescimento, lições, relatórios) com navegação intuitiva e ferramentas poderosas para administrar todo o sistema, incluindo processos especiais como multiplicação de grupos.

### Acceptance Scenarios

1. **Dashboard Administrativo**
   - **Given** um admin está autenticado, **When** acessa `/admin`, **Then** deve ver métricas resumidas (total de usuários, GCs ativos, membros, visitantes) e atividades recentes
   - **Given** um admin visualiza o dashboard, **When** clica em uma ação rápida (ex: "Criar GC"), **Then** deve ser redirecionado para o formulário correspondente

2. **Gestão de Grupos de Crescimento**
   - **Given** um admin acessa `/admin/growth-groups`, **When** a página carrega, **Then** deve ver TODOS os GCs do sistema (sem filtros RLS) com informações de líderes, supervisores, membros e última reunião
   - **Given** um admin cria um novo GC, **When** preenche o formulário com nome, modo, líder e supervisor, **Then** o GC deve ser criado com os participantes corretamente atribuídos nos papéis especificados
   - **Given** um admin edita um GC, **When** modifica informações básicas ou adiciona/remove membros, **Then** as alterações devem ser salvas e refletidas imediatamente
   - **Given** um admin inativa um GC, **When** confirma a ação, **Then** o status do GC deve mudar para 'inactive' e o grupo não deve aparecer mais nas listagens ativas

3. **Multiplicação de GCs**
   - **Given** um admin seleciona um GC para multiplicar, **When** acessa `/admin/growth-groups/[id]/multiply`, **Then** deve ver um wizard multi-step guiando o processo
   - **Given** um admin está no passo de divisão de membros, **When** aloca cada membro entre GC original e novos GCs, **Then** todos os membros devem estar alocados antes de prosseguir
   - **Given** um admin completa o processo de multiplicação, **When** confirma a operação, **Then** novos GCs devem ser criados, membros transferidos, status atualizado e evento registrado em `gc_multiplication_events`

4. **Gestão de Lições**
   - **Given** um admin acessa `/admin/lessons`, **When** a página carrega, **Then** deve ver lista de séries com suas lições e lições avulsas
   - **Given** um admin cria uma série, **When** preenche nome e descrição, **Then** deve poder adicionar lições imediatamente ou depois
   - **Given** um admin edita uma série, **When** reordena lições via drag-and-drop, **Then** o campo `order_in_series` deve ser atualizado corretamente

5. **Relatórios e Métricas**
   - **Given** um admin acessa `/admin/reports`, **When** a página carrega, **Then** deve ver gráficos de crescimento, distribuição de GCs e métricas agregadas
   - **Given** um admin aplica filtro de período, **When** seleciona "últimos 90 dias", **Then** todos os gráficos devem refletir apenas dados desse período

6. **Segurança e Permissões**
   - **Given** um usuário não-admin tenta acessar `/admin`, **When** o layout carrega, **Then** deve ser redirecionado para `/dashboard`
   - **Given** um admin realiza uma operação de criação, **When** o registro é salvo, **Then** o campo `created_by_user_id` deve conter o ID do admin

### Edge Cases
- Quando um GC não tem reuniões registradas, a coluna "última reunião" DEVE exibir "Nenhuma reunião"
- Quando um admin tenta excluir uma série com lições vinculadas a reuniões, o sistema DEVE avisar e oferecer opções: (1) manter lições como avulsas ou (2) cancelar exclusão
- Quando um admin tenta multiplicar um GC com menos de 2 membros, o sistema DEVE bloquear a operação com mensagem explicativa
- Em transações de multiplicação, SE qualquer etapa falhar, TODO o processo DEVE ser revertido (rollback)
- Queries de relatórios com grandes volumes de dados DEVEM ter paginação ou limite de período para evitar timeouts

---

## Requirements

### Functional Requirements

#### Dashboard Administrativo
- **FR-001**: Sistema DEVE exibir em `/admin` cards com métricas: total de usuários ativos, total de GCs ativos, total de membros ativos, total de visitantes ativos
- **FR-002**: Sistema DEVE exibir timeline das 10 atividades mais recentes (criação de usuários, GCs, reuniões)
- **FR-003**: Sistema DEVE fornecer botões de ação rápida: Criar Usuário, Criar GC, Criar Série de Lições, Ver Relatórios

#### Navegação e Layout
- **FR-004**: Sistema DEVE exibir sidebar de navegação em todas as páginas `/admin/**` com links para: Dashboard, Usuários, GCs, Lições, Relatórios, Configurações
- **FR-005**: Sistema DEVE indicar visualmente a seção ativa na sidebar
- **FR-006**: Sistema DEVE exibir breadcrumbs refletindo a hierarquia atual (ex: Admin > GCs > Editar)
- **FR-007**: Sidebar DEVE ser colapsável em dispositivos mobile (< 768px)

#### Gestão de Grupos de Crescimento
- **FR-008**: Sistema DEVE listar em `/admin/growth-groups` TODOS os GCs sem restrições de RLS, exibindo: nome, líder(es), supervisor(es), modo, status, total de membros, última reunião
- **FR-009**: Sistema DEVE permitir filtrar GCs por: status (ativo/inativo/multiplicando), modo (presencial/online/híbrido), líder, supervisor
- **FR-010**: Sistema DEVE permitir buscar GCs por nome (case-insensitive)
- **FR-011**: Sistema DEVE permitir ordenar lista de GCs por: nome (A-Z), data de criação, total de membros
- **FR-012**: Sistema DEVE permitir criar novo GC em `/admin/growth-groups/new` com campos obrigatórios: nome, modo, líder principal, pelo menos 1 supervisor
- **FR-012.1**: Sistema DEVE exigir endereço quando modo = 'in_person' ou 'hybrid'
- **FR-013**: Sistema DEVE permitir editar GC em `/admin/growth-groups/[id]` incluindo: informações básicas, status, líderes, supervisores, membros
- **FR-014**: Sistema DEVE exibir na página de edição de GC: histórico de reuniões e lista de visitantes
- **FR-015**: Sistema DEVE permitir inativar GC (atualizar status para 'inactive')

#### Multiplicação de GCs
- **FR-016**: Sistema DEVE fornecer fluxo de multiplicação em `/admin/growth-groups/[id]/multiply` com 4 passos:
  1. Informações dos novos GCs (nome, modo, endereço, líder, supervisor)
  2. Divisão de membros entre GC original e novos GCs
  3. Configuração do GC original (manter ativo ou inativar)
  4. Revisão e confirmação
- **FR-017**: Sistema DEVE validar que cada membro do GC original seja alocado em algum grupo (original ou novo)
- **FR-018**: Sistema DEVE validar que cada novo GC tenha pelo menos 1 líder e 1 supervisor
- **FR-019**: Sistema DEVE executar multiplicação como transação atômica: criar novos GCs, transferir membros, atualizar status original, registrar evento
- **FR-020**: Sistema DEVE registrar em `gc_multiplication_events`: original_gc_id, new_gc_ids (array), multiplied_by_user_id, multiplied_at, notes
- **FR-021**: Sistema DEVE atualizar status de membros transferidos para 'transferred' e preencher `left_at`

#### Gestão de Lições e Séries
- **FR-022**: Sistema DEVE listar em `/admin/lessons` séries de lições e lições avulsas
- **FR-023**: Para cada série, Sistema DEVE exibir: nome, descrição, total de lições, criador, data de criação, ações (Editar, Excluir, Adicionar Lição)
- **FR-024**: Sistema DEVE permitir criar série em `/admin/lessons/series/new` com opção de adicionar lições imediatamente
- **FR-025**: Sistema DEVE permitir editar série em `/admin/lessons/series/[id]` incluindo: nome, descrição, reordenação de lições
- **FR-026**: Sistema DEVE permitir reordenar lições dentro de série via drag-and-drop, atualizando campo `order_in_series`
- **FR-027**: Sistema DEVE permitir criar lição em `/admin/lessons/new` com campos: título, descrição, série (opcional), link externo (opcional)
- **FR-028**: Sistema DEVE permitir editar lição em `/admin/lessons/[id]`
- **FR-029**: Sistema DEVE implementar soft delete (preencher `deleted_at`) ao excluir séries e lições
- **FR-030**: Ao excluir série com lições, Sistema DEVE oferecer opções: (1) excluir série e tornar lições avulsas ou (2) cancelar

#### Relatórios e Métricas
- **FR-031**: Sistema DEVE exibir em `/admin/reports` dashboard com: cards de métricas, gráfico de crescimento (linha), distribuição de GCs por modo (pizza), top 10 GCs por membros (barra)
- **FR-032**: Sistema DEVE permitir filtrar relatórios por período: últimos 30 dias, 90 dias, 1 ano, customizado
- **FR-033**: Sistema DEVE fornecer relatório de crescimento em `/admin/reports/growth` com: crescimento de membros por mês, crescimento de GCs, multiplicações realizadas
- **FR-034**: Sistema DEVE fornecer relatório de frequência em `/admin/reports/attendance` com: taxa de presença por GC, membros mais/menos assíduos
- **FR-035**: Sistema DEVE fornecer relatório de conversões em `/admin/reports/conversions` com: total convertidos, taxa por GC, tempo médio até conversão

#### Configurações
- **FR-036**: Sistema DEVE permitir editar configurações em `/admin/settings` armazenadas na tabela `config`
- **FR-037**: Sistema DEVE suportar configurações: nome da organização, número mínimo/máximo de membros por GC, frequência mínima de reuniões, critérios de conversão de visitantes

### Non-Functional Requirements

#### Segurança
- **NFR-001**: Sistema DEVE verificar `is_admin = true` em layout `/admin` e redirecionar não-admins para `/dashboard`
- **NFR-002**: Sistema DEVE registrar `created_by_user_id` e `updated_by_user_id` em todas as operações de criação/edição
- **NFR-003**: Sistema DEVE validar inputs de formulários usando Zod schemas
- **NFR-004**: Sistema DEVE solicitar confirmação para ações destrutivas (excluir, inativar, multiplicar)
- **NFR-005**: Sistema DEVE implementar soft delete (deleted_at) ao invés de DELETE permanente

#### Performance
- **NFR-006**: Queries de listagem de GCs DEVEM usar índices no banco para performance (índices em gc_id, user_id, status)
- **NFR-007**: Relatórios DEVEM ter período padrão limitado (ex: últimos 90 dias) para evitar queries lentas
- **NFR-008**: Listas longas (> 50 itens) DEVEM implementar paginação

#### Usabilidade
- **NFR-009**: Todas as operações DEVEM fornecer feedback visual (mensagens de sucesso/erro via toast notifications)
- **NFR-010**: Formulários complexos (multiplicação) DEVEM ter indicadores de progresso (wizard steps)
- **NFR-011**: Loading states DEVEM usar componente Spinner consistente
- **NFR-012**: Interface admin DEVE ser responsiva (sidebar colapsável em mobile)

#### Auditoria
- **NFR-013**: Eventos de multiplicação DEVEM ser registrados permanentemente em `gc_multiplication_events`
- **NFR-014**: Soft deletes DEVEM manter histórico de dados excluídos para auditoria

---

## Key Entities

### Novas Entidades

#### gc_multiplication_events
**Propósito**: Registrar e auditar eventos de multiplicação de GCs

**Atributos**:
- `id` (UUID, PK)
- `original_gc_id` (UUID, FK → growth_groups.id) - GC que foi multiplicado
- `new_gc_ids` (UUID[]) - Array de IDs dos novos GCs criados
- `multiplied_by_user_id` (UUID, FK → users.id) - Admin que executou
- `multiplied_at` (TIMESTAMPTZ) - Data/hora da multiplicação
- `notes` (TEXT, nullable) - Observações sobre o processo
- `created_at` (TIMESTAMPTZ)

**Relacionamentos**:
- Muitos-para-um com growth_groups (original_gc_id)
- Muitos-para-um com users (multiplied_by_user_id)

**Constraints**:
- `original_gc_id` NOT NULL
- `new_gc_ids` NOT NULL, array não vazio
- `multiplied_by_user_id` NOT NULL

### Entidades Existentes (Modificadas)

Nenhuma modificação estrutural nas tabelas existentes. Apenas novos registros e atualizações de status.

---

## Dependencies and Assumptions

### Dependencies
- Estrutura admin existente em `/admin` com layout de verificação de permissão
- Componentes shadcn/ui já configurados (Card, Button, Badge, etc.)
- Sistema de autenticação Supabase funcional
- RLS policies com suporte a `is_admin` já implementadas

### Assumptions
- Admins já têm flag `is_admin = true` devidamente configurada
- Banco de dados Supabase está acessível e operacional
- Sistema de tipos TypeScript gerado a partir do schema Supabase está atualizado
- Usuários admins têm conhecimento básico do domínio de GCs (não requer treinamento extensivo)

### Out of Scope
- Notificações por email/SMS sobre ações administrativas
- Exportação de relatórios em PDF/Excel (deixar para versão futura)
- Upload de logo personalizado via interface (usar arquivos estáticos)
- Sistema de permissões granulares (ex: admin de GCs vs admin de usuários) - apenas um nível "admin" total
- Histórico de alterações (audit log) detalhado por campo - apenas registro de criação/modificação

---

## Success Criteria

### Métricas de Sucesso
1. **Completude Funcional**: Todas as 7 fases do plano implementadas com sucesso (ou ao menos Fases 1-2 para MVP)
2. **Cobertura de Testes**: Principais fluxos (criar GC, multiplicar GC) testados manualmente com sucesso
3. **Performance**: Listagem de GCs com até 100 registros carrega em < 2 segundos
4. **Segurança**: 100% das rotas `/admin` bloqueadas para não-admins
5. **Usabilidade**: Admin consegue completar tarefa de multiplicação em < 5 minutos sem consultar documentação

### Acceptance Criteria
- [ ] Dashboard admin exibe métricas corretas e atualizadas
- [ ] Criação de GC com líder + supervisor funciona corretamente
- [ ] Edição de GC permite adicionar/remover membros
- [ ] Multiplicação de GC cria novos GCs e transfere membros corretamente
- [ ] Tabela `gc_multiplication_events` registra eventos com todos os dados
- [ ] Gestão de séries/lições permite CRUD completo
- [ ] Reordenação de lições atualiza `order_in_series`
- [ ] Relatórios exibem dados corretos com filtros funcionais
- [ ] Sidebar de navegação funciona em desktop e mobile
- [ ] Não-admins são bloqueados de acessar área admin

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (todas as clarificações foram feitas na sessão 2025-10-18)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (área administrativa web apenas)
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed (área administrativa com gestão completa)
- [x] Key concepts extracted (dashboard, GCs, multiplicação, lições, relatórios, configurações)
- [x] Ambiguities marked and resolved (5 clarificações na sessão 2025-10-18)
- [x] User scenarios defined (6 cenários principais + edge cases)
- [x] Requirements generated (37 FR + 14 NFR)
- [x] Entities identified (nova tabela gc_multiplication_events)
- [x] Review checklist passed
- [x] Ready for planning phase

---
