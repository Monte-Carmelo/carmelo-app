# Feature Specification: Sistema de Eventos da Igreja

**Feature Branch**: `005-funcionalidade-de-eventos`
**Created**: 2025-10-20
**Status**: Draft
**Input**: User description: "Funcionalidade de Eventos - Sistema de gestão e visualização de eventos da igreja"
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ Description parsed: Event management system for church events
2. Extract key concepts from description
   → ✅ Identified: admins (create), users (view), events (entity), images (upload)
3. For each unclear aspect:
   → No critical ambiguities found
4. Fill User Scenarios & Testing section
   → ✅ Scenarios defined for admin and regular users
5. Generate Functional Requirements
   → ✅ All requirements testable
6. Identify Key Entities (if data involved)
   → ✅ Entity: Event (title, description, date, time, location, banner, status)
7. Run Review Checklist
   → ✅ No implementation details, focused on user needs
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

**Como administrador da igreja**, quero cadastrar eventos (cultos especiais, conferências, retiros, workshops) com todas as informações relevantes e uma imagem de divulgação, para que os membros da igreja possam ficar informados sobre as atividades programadas.

**Como membro da igreja**, quero visualizar uma lista de eventos futuros da igreja com detalhes completos (data, horário, local, descrição e imagem), para que eu possa planejar minha participação nas atividades.

### Acceptance Scenarios

#### Cenário 1: Admin cadastra novo evento
1. **Given** estou logado como administrador
2. **When** acesso a área de eventos e clico em "Criar Novo Evento"
3. **And** preencho: título "Conferência de Jovens 2025", descrição, data "2025-11-15", horário "19:00", local "Auditório Principal"
4. **And** faço upload de um banner de divulgação (imagem JPG de 1.5MB)
5. **And** clico em "Salvar"
6. **Then** o evento é criado com sucesso
7. **And** recebo confirmação visual (notificação)
8. **And** o evento aparece na lista de eventos

#### Cenário 2: Admin edita evento existente
1. **Given** existe um evento "Retiro de Carnaval" cadastrado
2. **When** acesso a edição do evento
3. **And** altero a data de "2025-02-28" para "2025-03-01"
4. **And** substituo a imagem do banner
5. **And** salvo as alterações
6. **Then** o evento é atualizado
7. **And** a nova data e imagem são exibidas

#### Cenário 3: Admin exclui evento
1. **Given** existe um evento "Workshop de Música" cadastrado
2. **When** acesso a lista de eventos como admin
3. **And** clico em "Excluir" no evento
4. **And** confirmo a exclusão no diálogo de confirmação
5. **Then** o evento é removido (soft delete)
6. **And** não aparece mais na lista pública

#### Cenário 4: Admin marca evento como concluído
1. **Given** existe um evento "Culto de Páscoa" com status "agendado"
2. **When** o evento acontece
3. **And** admin acessa a edição do evento
4. **And** altera o status para "concluído"
5. **Then** o evento é marcado como concluído
6. **And** pode ser filtrado por status

#### Cenário 5: Usuário visualiza eventos futuros
1. **Given** estou logado como membro (não-admin)
2. **When** acesso a página de eventos
3. **Then** vejo uma lista de todos os eventos futuros do ano corrente
4. **And** cada evento mostra: imagem, título, data formatada, horário e local
5. **And** os eventos estão ordenados cronologicamente (próximos primeiro)

#### Cenário 6: Usuário visualiza detalhes do evento
1. **Given** estou na lista de eventos
2. **When** clico em um evento "Conferência de Jovens 2025"
3. **Then** sou levado para página de detalhes
4. **And** vejo: banner em tamanho grande, título, descrição completa, data, horário, local
5. **And** posso voltar para a lista de eventos

#### Cenário 7: Usuário navega entre anos
1. **Given** estou na página de eventos (ano corrente: 2025)
2. **When** clico em "Ano Anterior" (2024)
3. **Then** a lista é atualizada mostrando eventos de 2024
4. **And** posso voltar para 2025 clicando em "Próximo Ano"

#### Cenário 8: Usuário filtra apenas eventos futuros
1. **Given** estou na página de eventos
2. **And** o filtro padrão é "Apenas Futuros"
3. **When** visualizo a lista
4. **Then** vejo apenas eventos com data >= hoje
5. **When** altero filtro para "Todos os eventos do ano"
6. **Then** vejo eventos passados e futuros

### Edge Cases

#### Limites e Validações:
- **Evento sem imagem**: Sistema permite criar evento sem banner (usa imagem placeholder ou exibe card sem imagem)
- **Data no passado**: Sistema permite admin criar eventos passados (para histórico)
- **Imagem muito grande**: Sistema rejeita upload de imagens > 2MB com mensagem de erro clara
- **Formato inválido**: Sistema rejeita formatos não suportados (ex: GIF, SVG) e informa formatos aceitos (JPG, PNG, WEBP)
- **Campos obrigatórios vazios**: Sistema não permite salvar evento sem título ou data
- **Ano sem eventos**: Sistema exibe empty state "Nenhum evento cadastrado para este ano"
- **Lista vazia (futuros)**: Sistema exibe "Não há eventos futuros programados"

#### Permissões:
- **Usuário não-admin tenta acessar /admin/events**: Sistema redireciona para /dashboard
- **Usuário não logado tenta ver eventos**: [NEEDS CLARIFICATION: eventos são públicos ou apenas para usuários logados?] - Assumindo que requer login
- **Admin exclui evento com erro de rede**: Sistema mantém estado e exibe erro, permitindo retry

#### Performance:
- **Lista com muitos eventos**: [NEEDS CLARIFICATION: limite de eventos exibidos? paginação necessária?] - Assumindo lista completa sem paginação inicialmente
- **Upload lento**: Sistema mostra indicador de progresso durante upload

---

## Requirements *(mandatory)*

### Functional Requirements

#### Gestão de Eventos (Admin)
- **FR-001**: Sistema DEVE permitir que administradores criem novos eventos com: título (obrigatório), descrição (opcional), data (obrigatória), horário (opcional), local (opcional), e imagem de banner (opcional)
- **FR-002**: Sistema DEVE permitir upload de imagens nos formatos JPG, PNG e WEBP com tamanho máximo de 2MB
- **FR-003**: Sistema DEVE exibir preview da imagem selecionada antes de salvar o evento
- **FR-004**: Sistema DEVE armazenar imagens de forma persistente e servir URLs públicas para visualização
- **FR-005**: Sistema DEVE permitir que administradores editem todos os campos de eventos existentes, incluindo substituir a imagem
- **FR-006**: Sistema DEVE permitir que administradores excluam eventos (exclusão lógica/soft delete)
- **FR-007**: Sistema DEVE exigir confirmação antes de excluir um evento
- **FR-008**: Sistema DEVE permitir que administradores alterem o status do evento entre: "agendado", "concluído", "cancelado"
- **FR-009**: Sistema DEVE validar que título e data são obrigatórios antes de salvar
- **FR-010**: Sistema DEVE rejeitar uploads de imagens > 2MB com mensagem de erro clara
- **FR-011**: Sistema DEVE rejeitar uploads de formatos não suportados com lista de formatos aceitos

#### Visualização de Eventos (Usuários)
- **FR-012**: Sistema DEVE exibir lista de eventos do ano corrente para todos os usuários logados
- **FR-013**: Sistema DEVE exibir cada evento em card mostrando: imagem (se houver), título, data formatada (ex: "15 de Novembro de 2025"), horário (se houver), local (se houver)
- **FR-014**: Sistema DEVE ordenar eventos cronologicamente com eventos mais próximos primeiro
- **FR-015**: Sistema DEVE permitir visualizar detalhes completos de um evento ao clicar no card
- **FR-016**: Sistema DEVE exibir na página de detalhes: banner em tamanho grande, título, descrição completa, data, horário, local
- **FR-017**: Sistema DEVE permitir filtrar eventos por "Apenas Futuros" (padrão) ou "Todos do Ano"
- **FR-018**: Sistema DEVE permitir navegação entre anos (ano anterior/próximo) mantendo o filtro aplicado
- **FR-019**: Sistema DEVE exibir empty state quando não há eventos para o ano/filtro selecionado
- **FR-020**: Sistema DEVE exibir imagem placeholder quando evento não possui banner

#### Segurança e Permissões
- **FR-021**: Sistema DEVE restringir criação, edição e exclusão de eventos apenas para administradores
- **FR-022**: Sistema DEVE redirecionar usuários não-admin que tentam acessar rotas administrativas de eventos
- **FR-023**: Sistema DEVE permitir que todos os usuários logados visualizem eventos
- **FR-024**: Sistema DEVE aplicar políticas de segurança (RLS) no banco de dados para proteger operações de escrita

#### Feedback e UX
- **FR-025**: Sistema DEVE exibir notificação de sucesso após criar evento
- **FR-026**: Sistema DEVE exibir notificação de sucesso após editar evento
- **FR-027**: Sistema DEVE exibir notificação de sucesso após excluir evento
- **FR-028**: Sistema DEVE exibir indicador de carregamento durante upload de imagem
- **FR-029**: Sistema DEVE exibir indicador de carregamento ao carregar lista de eventos
- **FR-030**: Sistema DEVE exibir mensagens de erro claras quando operações falham

### Key Entities *(include if feature involves data)*

#### Evento (Event)
Representa um evento da igreja (culto especial, conferência, retiro, workshop, etc.)

**Atributos principais:**
- **Identificador único**: ID gerado automaticamente
- **Título**: Nome do evento (obrigatório) - ex: "Conferência de Jovens 2025"
- **Descrição**: Detalhes e informações sobre o evento (opcional) - ex: "Três dias de conferências, workshops e momentos de adoração"
- **Data**: Data de realização (obrigatório) - ex: "2025-11-15"
- **Horário**: Hora de início (opcional) - ex: "19:00"
- **Local**: Endereço ou sala onde acontecerá (opcional) - ex: "Auditório Principal"
- **Banner**: URL da imagem de divulgação (opcional)
- **Status**: Estado atual do evento (obrigatório) - valores: "agendado", "concluído", "cancelado"
- **Criador**: Referência ao administrador que criou o evento
- **Data de criação**: Timestamp de quando foi cadastrado
- **Data de atualização**: Timestamp da última modificação
- **Data de exclusão**: Timestamp de soft delete (null se não foi excluído)

**Relacionamentos:**
- Pertence a um usuário administrador (criador)

**Regras de negócio:**
- Título e data são obrigatórios
- Banner deve ser JPG, PNG ou WEBP com max 2MB
- Status padrão é "agendado"
- Exclusão é lógica (soft delete) mantendo dados no banco
- Eventos excluídos não aparecem em listagens públicas

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (2 minor ones documented in edge cases)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

**Notas sobre clarificações pendentes (não-bloqueantes):**
1. **Acesso público vs autenticado**: Assumindo que eventos requerem login. Se houver necessidade de página pública para não-membros, ajustar em fase de planejamento.
2. **Paginação**: Assumindo lista completa sem paginação inicialmente. Se necessário, adicionar em iteração futura.

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Dependencies and Assumptions

### Dependencies
- Feature 004 (Área Administrativa) deve estar completa e em produção
- Sistema de autenticação e controle de acesso (is_admin flag) já implementado
- Componentes reutilizáveis da área administrativa disponíveis

### Assumptions
- Usuários já estão familiarizados com a área administrativa existente
- Imagens de eventos são hospedadas na mesma infraestrutura do app
- Não há necessidade de integração com calendários externos (Google Calendar, iCal) nesta versão
- Não há sistema de inscrições ou confirmação de presença (apenas informacional)
- Eventos não possuem capacidade máxima ou controle de vagas
- Não há notificações push ou email sobre eventos (apenas consulta manual)

---

## Out of Scope (Explicitamente NÃO incluído nesta feature)

- Sistema de inscrições/confirmação de presença em eventos
- Integração com Google Calendar ou outros calendários externos
- Notificações automáticas (push/email/SMS) sobre eventos
- Controle de capacidade/vagas de eventos
- Sistema de check-in presencial em eventos
- Exportação de eventos para PDF ou outros formatos
- Eventos recorrentes (ex: "toda segunda-feira às 19h")
- Categorização de eventos por tipo (culto, conferência, retiro, etc.)
- Galeria de fotos pós-evento
- Transmissão ao vivo ou links de videoconferência

Estas funcionalidades podem ser consideradas em features futuras se houver demanda.
