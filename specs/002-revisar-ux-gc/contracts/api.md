# Contratos de API: Gestão de GCs

Esta documentação descreve os "contratos" de API para a gestão de Grupos de Crescimento (GCs), que são essencialmente as interações com o Supabase através da biblioteca `supabase-js`.

## 1. Dashboard do GC

### Ação do Usuário
Visualizar o painel de controle com a lista de GCs, próximas reuniões e estatísticas.

### Interação com Supabase
- **Buscar GCs do usuário**: `supabase.from('growth_groups').select('*').in('id', user_gc_ids)`
- **Buscar próximas reuniões**: `supabase.from('meetings').select('*').in('gc_id', gc_ids).order('datetime', { ascending: true })`
- **Buscar membros e visitantes**: `supabase.from('growth_group_participants').select('*, people(*)').eq('gc_id', gc_id)` e `supabase.from('visitors').select('*, people(*)').eq('gc_id', gc_id)`

## 2. Agendar Nova Reunião

### Ação do Usuário
Criar uma nova reunião para um GC.

### Interação com Supabase
- **Inserir nova reunião**: `supabase.from('meetings').insert({ gc_id, lesson_title, datetime, ... })`

## 3. Visualizar uma Reunião

### Ação do Usuário
Ver os detalhes de uma reunião específica, incluindo a lista de presença.

### Interação com Supabase
- **Buscar detalhes da reunião**: `supabase.from('meetings').select('*').eq('id', meeting_id).single()`
- **Buscar participantes e seus status de presença**:
  ```javascript
  // Fetch members and their attendance status
  const { data: members } = await supabase
    .from('growth_group_participants')
    .select('id, people(*), meeting_member_attendance(meeting_id)')
    .eq('gc_id', gc_id)
    .eq('meeting_member_attendance.meeting_id', meeting_id);

  // Fetch visitors and their attendance status
  const { data: visitors } = await supabase
    .from('visitors')
    .select('id, people(*), meeting_visitor_attendance(meeting_id)')
    .eq('gc_id', gc_id)
    .eq('meeting_visitor_attendance.meeting_id', meeting_id);
  ```

## 4. Registrar Presença

### Ação do Usuário
Marcar ou desmarcar a presença de membros e visitantes em uma reunião.

### Interação com Supabase
- **Marcar presença de membro**: `supabase.from('meeting_member_attendance').insert({ meeting_id, participant_id })`
- **Remover presença de membro**: `supabase.from('meeting_member_attendance').delete().match({ meeting_id, participant_id })`
- **Marcar presença de visitante**: `supabase.from('meeting_visitor_attendance').insert({ meeting_id, visitor_id })`
- **Remover presença de visitante**: `supabase.from('meeting_visitor_attendance').delete().match({ meeting_id, visitor_id })`

## 5. Adicionar Novo Visitante

### Ação do Usuário
Adicionar uma nova pessoa como visitante a um GC.

### Interação com Supabase
- **Verificar se a pessoa já existe**: `supabase.from('people').select('id').eq('email', email)`
- **Inserir nova pessoa (se não existir)**: `supabase.from('people').insert({ name, email, ... })`
- **Inserir novo visitante**: `supabase.from('visitors').insert({ person_id, gc_id })`
